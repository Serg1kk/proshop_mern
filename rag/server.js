import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from repo root (works regardless of cwd from which this script is invoked).
const { default: dotenv } = await import('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import express from 'express';
import * as wv from './lib/weaviate.js';
import { createCohereClient } from './lib/cohere.js';
import { search } from './lib/search.js';

const PORT = +(process.env.RAG_PORT || 5002);
const ALLOW_REINDEX = process.env.RAG_ALLOW_REINDEX === 'true';

let weaviateClient;
let cohere;

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/health', async (req, res) => {
  try {
    const count = await wv.countAll(weaviateClient);
    res.json({ status: 'ok', weaviate: 'connected', chunks_total: count });
  } catch (e) {
    res.status(503).json({ status: 'degraded', weaviate: 'disconnected', error: e?.message });
  }
});

app.post('/search', async (req, res) => {
  const { query, top_k, filters, rerank } = req.body || {};
  try {
    const result = await search({
      cohere,
      weaviateClient,
      query,
      topK: typeof top_k === 'number' ? top_k : undefined,
      filters,
      rerank: rerank !== false
    });
    res.json(result);
  } catch (e) {
    if (e.code === 'QUERY_REQUIRED') return res.status(400).json({ error: 'query required' });
    const status = e?.status || e?.statusCode;
    if (status === 429) return res.status(429).json({ error: 'embedding rate limit', retry_after: e?.retryAfter || 1 });
    if (status >= 500 && status < 600) return res.status(502).json({ error: 'embedding upstream error' });
    if (e?.code === 'ECONNREFUSED' || e?.message?.includes('connect')) return res.status(503).json({ error: 'vector store unavailable' });
    console.error('/search error:', e);
    res.status(500).json({ error: 'internal' });
  }
});

app.post('/reindex', async (req, res) => {
  if (!ALLOW_REINDEX) return res.status(403).json({ error: 'reindex disabled' });
  const { path: filterPath, reset } = req.body || {};
  const args = [];
  if (reset) args.push('--reset');
  if (filterPath) args.push(`--path=${filterPath}`);
  const cwd = path.resolve(__dirname);
  const child = spawn(process.execPath, [path.join(cwd, 'ingest.js'), ...args], { cwd });
  let out = '', err = '';
  child.stdout.on('data', d => { out += d.toString(); });
  child.stderr.on('data', d => { err += d.toString(); });
  child.on('close', (code) => {
    if (code === 0) res.json({ status: 'ok', stdout: out });
    else res.status(500).json({ status: 'failed', code, stdout: out, stderr: err });
  });
});

async function start() {
  weaviateClient = await wv.connect({
    host: process.env.WEAVIATE_HOST || 'localhost',
    httpPort: +(process.env.WEAVIATE_HTTP_PORT || 8080),
    grpcPort: +(process.env.WEAVIATE_GRPC_PORT || 50051)
  });
  cohere = createCohereClient({
    apiKey: process.env.COHERE_API_KEY,
    embedModel: process.env.COHERE_EMBED_MODEL,
    rerankModel: process.env.COHERE_RERANK_MODEL
  });
  await wv.ensureSchema(weaviateClient);
  app.listen(PORT, () => {
    console.log(`RAG search server listening on http://localhost:${PORT}`);
    console.log(`reindex endpoint: ${ALLOW_REINDEX ? 'enabled' : 'disabled (set RAG_ALLOW_REINDEX=true to enable)'}`);
  });
}

start().catch(e => { console.error('startup failed:', e); process.exit(1); });
