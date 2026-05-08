#!/usr/bin/env node
/**
 * proshop-search-docs — MCP server
 * Exposes one tool: search_project_docs(query, top_k=5)
 * Uses the existing rag/lib/{cohere,weaviate,search}.js in-process.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// ── dotenv (load proshop_mern/.env) ──────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');

// dotenv is ESM-unfriendly for config() with path; use createRequire approach
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');
dotenv.config({ path: envPath });

// ── MCP SDK ───────────────────────────────────────────────────────────────────
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

// ── RAG lib (relative ESM imports from parent package) ───────────────────────
import { createCohereClient } from '../rag/lib/cohere.js';
import { connect, countAll } from '../rag/lib/weaviate.js';
import { search } from '../rag/lib/search.js';

// ── Tool definition ───────────────────────────────────────────────────────────
const TOOL_DEFINITION = {
  name: 'search_project_docs',
  description: `Поиск по документации продукта proshop_mern (hybrid BM25+vector retrieval + Cohere reranker).

You MUST use this FIRST when the user asks about:
- Architecture and components of proshop_mern
- Features: catalog, cart, checkout, payments, auth, admin
- ADRs (architecture decision records — why a tech was chosen)
- Runbooks: deploy, db-seed-and-reset, incident-response, ab-test-setup, feature-flag-toggle, local-setup
- Incidents and postmortems (paypal, mongo, jwt)
- Glossary, dev history, best practices

Do NOT use this for:
- Current feature-flag state (rollout %, enabled/disabled) — use feature-flags MCP get_feature_info / list_features instead.
- Finding files by name or code symbols — use grep/Glob/Read.
- Reading a specific file when you already know its path — use Read.

Returns a ranked list of chunks. Each chunk has: source_file (path), title (section heading), parent_headings (breadcrumbs), score (0..1 relevance), snippet (~200 chars). Use the snippet to decide whether to read source_file in full.`,
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Natural-language search query, e.g. "how to seed the database" or "почему выбран PayPal а не Stripe".'
      },
      top_k: {
        type: 'integer',
        description: 'Number of results to return. Default 5. Use 3-5 for specific questions, 10-20 for exploratory queries.',
        default: 5,
        minimum: 1,
        maximum: 20
      }
    },
    required: ['query']
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
    title: 'Search proshop_mern documentation'
  }
};

// ── Snippet extractor ─────────────────────────────────────────────────────────
/**
 * Given a chunk's content (which may start with markdown headings),
 * strip the heading prefix and return the first ~200 chars of body text.
 */
function extractSnippet(content, maxLen = 200) {
  if (!content) return '';
  // Split into lines; find first blank line after leading heading lines
  const lines = content.split('\n');
  let bodyStart = 0;
  let seenHeading = false;
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimEnd();
    if (trimmed.startsWith('#')) {
      seenHeading = true;
    } else if (seenHeading && trimmed === '') {
      // First blank line after headings — body starts on the next line
      bodyStart = i + 1;
      break;
    } else if (!seenHeading && trimmed !== '') {
      // Content begins immediately with no headings
      bodyStart = i;
      break;
    }
  }
  const body = lines.slice(bodyStart).join(' ').replace(/\s+/g, ' ').trim();
  return body.length <= maxLen ? body : body.slice(0, maxLen);
}

// ── Result transformer ────────────────────────────────────────────────────────
function transformResult(r) {
  const hp = Array.isArray(r.heading_path) ? r.heading_path : [];
  const title = hp.length > 0 ? hp[hp.length - 1] : path.basename(r.source_file || '');
  const parentHeadings = hp.length > 1 ? hp.slice(0, -1) : [];
  const score = r.score_rerank != null ? r.score_rerank : (r.score_hybrid ?? null);

  return {
    source_file: r.source_file,
    file_path: r.source_file,
    title,
    parent_headings: parentHeadings,
    score,
    snippet: extractSnippet(r.content)
  };
}

// ── Init RAG clients (done once at startup) ───────────────────────────────────
let cohereClient;
let weaviateClient;

async function initClients() {
  const apiKey = process.env.COHERE_API_KEY;
  const embedModel = process.env.COHERE_EMBED_MODEL || 'embed-multilingual-v3.0';
  const rerankModel = process.env.COHERE_RERANK_MODEL || 'rerank-multilingual-v3.0';

  if (!apiKey) {
    throw new Error('COHERE_API_KEY not set — check proshop_mern/.env');
  }

  cohereClient = createCohereClient({ apiKey, embedModel, rerankModel });

  weaviateClient = await connect({
    host: process.env.WEAVIATE_HOST || 'localhost',
    httpPort: parseInt(process.env.WEAVIATE_HTTP_PORT || '8080', 10),
    grpcPort: parseInt(process.env.WEAVIATE_GRPC_PORT || '50051', 10)
  });

  const count = await countAll(weaviateClient);
  console.error(`proshop-search-docs ready, ProshopDoc has ${count} chunks`);
}

// ── MCP server setup ──────────────────────────────────────────────────────────
const server = new Server(
  { name: 'proshop-search-docs', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: [TOOL_DEFINITION] };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name !== 'search_project_docs') {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true
    };
  }

  // Validate query
  const query = args?.query;
  if (!query || typeof query !== 'string' || !query.trim()) {
    return {
      content: [{ type: 'text', text: 'Error: "query" is required and must be a non-empty string.' }],
      isError: true
    };
  }

  // Clamp top_k
  let topK = typeof args?.top_k === 'number' ? args.top_k : 5;
  topK = Math.max(1, Math.min(20, Math.round(topK)));

  try {
    const result = await search({
      cohere: cohereClient,
      weaviateClient,
      query,
      topK,
      rerank: true
    });

    const chunks = result.results.map(transformResult);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(chunks, null, 2)
        }
      ]
    };
  } catch (err) {
    const message = err?.code === 'QUERY_REQUIRED'
      ? 'Error: query is required.'
      : `Search failed: ${err?.message ?? String(err)}`;
    return {
      content: [{ type: 'text', text: message }],
      isError: true
    };
  }
});

// ── Main ──────────────────────────────────────────────────────────────────────
try {
  await initClients();
} catch (err) {
  console.error(`proshop-search-docs startup error: ${err.message}`);
  process.exit(1);
}

const transport = new StdioServerTransport();
await server.connect(transport);
