import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from repo root (proshop_mern/.env), two levels up from rag/tests/
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { default: dotenv } = await import('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import * as wv from '../lib/weaviate.js';
import { createCohereClient } from '../lib/cohere.js';
import { search } from '../lib/search.js';

let client;
let cohere;

before(async () => {
  client = await wv.connect({
    host: process.env.WEAVIATE_HOST || 'localhost',
    httpPort: +(process.env.WEAVIATE_HTTP_PORT || 8080),
    grpcPort: +(process.env.WEAVIATE_GRPC_PORT || 50051)
  });
  cohere = createCohereClient({
    apiKey: process.env.COHERE_API_KEY,
    embedModel: process.env.COHERE_EMBED_MODEL,
    rerankModel: process.env.COHERE_RERANK_MODEL
  });
});

after(async () => { await client?.close?.(); });

test('search: returns at least 1 result for known query', async () => {
  const r = await search({ cohere, weaviateClient: client, query: 'how do I rotate the JWT secret', topK: 3 });
  assert.ok(r.results.length >= 1, 'expected at least 1 result');
  assert.ok(r.stats.candidates_retrieved >= 1);
});

test('search: filter by doc_type=incident excludes adr', async () => {
  const r = await search({
    cohere, weaviateClient: client,
    query: 'paypal double charge',
    filters: { doc_type: ['incident'] },
    topK: 5
  });
  for (const hit of r.results) {
    assert.ok(hit.source_file.includes('/incidents/'),
      `expected incident, got ${hit.source_file}`);
  }
});

test('search: rerank=false skips rerank phase', async () => {
  const r = await search({ cohere, weaviateClient: client, query: 'jwt', rerank: false, topK: 3 });
  for (const hit of r.results) {
    assert.equal(hit.score_rerank, null);
  }
  assert.equal(r.stats.rerank_ms, 0);
});

test('search: empty query throws QUERY_REQUIRED', async () => {
  await assert.rejects(
    () => search({ cohere, weaviateClient: client, query: '' }),
    (e) => e.code === 'QUERY_REQUIRED'
  );
});

test('search: top_k > 20 is clamped', async () => {
  const r = await search({ cohere, weaviateClient: client, query: 'jwt', topK: 50 });
  assert.equal(r.stats.top_k_clamped, true);
  assert.ok(r.results.length <= 20);
});
