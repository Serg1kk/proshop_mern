import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SERVER_PATH = path.resolve(__dirname, '..', 'server.js');
const PORT = 5099; // unique port for test to avoid clashing with running dev server

let server;
const RAG_ENV = { ...process.env, RAG_PORT: String(PORT), RAG_ALLOW_REINDEX: 'false' };

before(async () => {
  server = spawn(process.execPath, [SERVER_PATH], { env: RAG_ENV, stdio: ['ignore', 'pipe', 'pipe'] });
  // Wait until "listening" log
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server start timeout')), 10000);
    server.stdout.on('data', (d) => {
      if (d.toString().includes('listening')) { clearTimeout(t); resolve(); }
    });
    server.stderr.on('data', (d) => process.stderr.write(d));
  });
});

after(() => { server?.kill('SIGTERM'); });

const url = (p) => `http://localhost:${PORT}${p}`;

test('GET /health returns 200', async () => {
  const r = await fetch(url('/health'));
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.equal(body.status, 'ok');
  assert.equal(body.weaviate, 'connected');
  assert.equal(typeof body.chunks_total, 'number');
});

test('POST /search without body → 400', async () => {
  const r = await fetch(url('/search'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 400);
  const body = await r.json();
  assert.match(body.error, /query/);
});

test('POST /reindex with ALLOW=false → 403', async () => {
  const r = await fetch(url('/reindex'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
});

test('POST /search with valid body → 200, results array', async () => {
  const r = await fetch(url('/search'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'jwt', top_k: 3 })
  });
  assert.equal(r.status, 200);
  const body = await r.json();
  assert.ok(Array.isArray(body.results));
  assert.equal(typeof body.stats.total_ms, 'number');
});
