#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');  // proshop_mern/
const DEFAULT_DOCS = path.join(REPO_ROOT, 'docs');

// Load .env from repo root (works regardless of the cwd from which this script is invoked).
const { default: dotenv } = await import('dotenv');
dotenv.config({ path: path.join(REPO_ROOT, '.env') });

import * as wv from './lib/weaviate.js';
import { createCohereClient } from './lib/cohere.js';
import { chunkMarkdown, chunkFeaturesJson } from './lib/chunker.js';

const EMBED_BATCH_SIZE = 96;
const SLEEP_BETWEEN_BATCHES_MS = 50;
const MAX_RETRIES = 3;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const parseArgs = (argv) => {
  const args = { path: null, dryRun: false, reset: false, filter: null };
  for (const a of argv.slice(2)) {
    if (a.startsWith('--path=')) args.path = a.slice(7);
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--reset') args.reset = true;
    else if (a.startsWith('--filter=')) {
      // First `=` separates key and value; values themselves may contain `=`.
      const raw = a.slice(9);
      const eqIdx = raw.indexOf('=');
      if (eqIdx === -1) { console.error('--filter requires key=value, e.g. --filter=doc_type=runbook'); process.exit(2); }
      args.filter = { key: raw.slice(0, eqIdx), value: raw.slice(eqIdx + 1) };
    }
    else if (a === '--help' || a === '-h') { printHelp(); process.exit(0); }
    else { console.error(`unknown arg: ${a}`); process.exit(2); }
  }
  return args;
};

const printHelp = () => {
  console.log(`Usage: node ingest.js [--path=<file|dir>] [--dry-run] [--reset] [--filter=doc_type=runbook]
Walks docs/ (or --path), chunks markdown, dedups by sha1-set per file, embeds via Cohere,
upserts to Weaviate. Without --path, walks proshop_mern/docs/ from the rag/ working dir.`);
};

const discoverFiles = async (root) => {
  // Returns array of absolute file paths matching .md or features.json
  const stat = await fs.stat(root).catch(() => null);
  if (!stat) throw new Error(`path not found: ${root}`);
  if (stat.isFile()) return [root];
  const md = await glob('**/*.md', { cwd: root, absolute: true, nodir: true });
  const json = await glob('**/features.json', { cwd: root, absolute: true, nodir: true });
  return [...md, ...json].sort();
};

const relPath = (absPath) => {
  // Compute path relative to proshop_mern/ for stable source_file in metadata,
  // independent of the cwd from which ingest.js was invoked.
  return path.relative(REPO_ROOT, absPath).replaceAll('\\', '/');
};

const fileToChunks = async (absPath) => {
  const rel = relPath(absPath);
  const content = await fs.readFile(absPath, 'utf8');
  if (absPath.endsWith('.json')) {
    return chunkFeaturesJson(JSON.parse(content), rel);
  }
  return chunkMarkdown(content, rel);
};

const withRetry = async (fn, label) => {
  let lastErr;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = e?.status || e?.statusCode;
      if (status === 429 || (status >= 500 && status < 600)) {
        const delay = 500 * Math.pow(2, i);
        console.warn(`${label}: retry ${i + 1}/${MAX_RETRIES} after ${delay}ms (status ${status})`);
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
};

const setsEqual = (a, b) => {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
};

async function main() {
  const args = parseArgs(process.argv);

  const cohere = createCohereClient({
    apiKey: process.env.COHERE_API_KEY,
    embedModel: process.env.COHERE_EMBED_MODEL,
    rerankModel: process.env.COHERE_RERANK_MODEL
  });
  const client = await wv.connect({
    host: process.env.WEAVIATE_HOST || 'localhost',
    httpPort: +(process.env.WEAVIATE_HTTP_PORT || 8080),
    grpcPort: +(process.env.WEAVIATE_GRPC_PORT || 50051)
  });

  if (args.reset) {
    console.log('--reset: dropping ProshopDoc class');
    try { await wv.dropClass(client); } catch (_) { /* might not exist */ }
  }
  await wv.ensureSchema(client);

  // --path may be relative to cwd; absolutize for downstream stability.
  const root = args.path
    ? path.resolve(process.cwd(), args.path)
    : DEFAULT_DOCS;
  const files = await discoverFiles(root);
  console.log(`Discovered ${files.length} candidate files under ${root}`);

  const stats = { added: 0, skipped: 0, deleted: 0, files_changed: 0, tokens: 0 };
  const allNew = []; // chunks pending insert across all changed files
  const filesToReinsert = [];

  for (const f of files) {
    const chunks = await fileToChunks(f);
    if (args.filter) {
      const { key, value } = args.filter;
      // All chunks of a file share doc_type/source_file etc. — chunk[0] is representative.
      if (chunks.length === 0 || chunks[0][key] !== value) continue;
    }
    const fileSourcePath = chunks[0]?.source_file;
    if (!fileSourcePath) continue;
    const newShas = new Set(chunks.map(c => c.sha1));
    const existingShas = await wv.listShasBySource(client, fileSourcePath);
    if (setsEqual(newShas, existingShas) && existingShas.size > 0) {
      stats.skipped++;
      console.log(`-  ${fileSourcePath}  (unchanged, ${chunks.length} chunks)`);
      continue;
    }
    filesToReinsert.push(fileSourcePath);
    allNew.push(...chunks);
    stats.files_changed++;
    console.log(`✓  ${fileSourcePath}  (${chunks.length} chunks)`);
  }

  if (allNew.length === 0) {
    console.log(`Nothing to ingest. Skipped: ${stats.skipped}.`);
    return;
  }

  if (args.dryRun) {
    const totalTokens = allNew.reduce((s, c) => s + c.token_count, 0);
    console.log(`\n[dry-run] Would embed ${allNew.length} chunks, ~${totalTokens} tokens (~$${(totalTokens / 1e6 * 0.10).toFixed(4)}).`);
    return;
  }

  // Embed in batches
  for (let i = 0; i < allNew.length; i += EMBED_BATCH_SIZE) {
    const batch = allNew.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map(c => c.content);
    const res = await withRetry(() => cohere.embed(texts, 'search_document'), 'cohere.embed');
    res.embeddings.forEach((vec, j) => { batch[j].vector = vec; });
    stats.tokens += res.usage.tokens;
    if (i + EMBED_BATCH_SIZE < allNew.length) await sleep(SLEEP_BETWEEN_BATCHES_MS);
  }

  // Delete-then-insert per changed file
  const ingestedAt = new Date().toISOString();
  for (const sourcePath of filesToReinsert) {
    await wv.deleteBySource(client, sourcePath);
  }
  // Tag all with ingested_at
  for (const c of allNew) c.ingested_at = ingestedAt;
  await wv.batchInsert(client, allNew);
  stats.added = allNew.length;

  // Estimate cost
  const cost = (stats.tokens / 1e6 * 0.10).toFixed(4);
  console.log(`\nTotal: ${stats.added} chunks added, ${stats.skipped} skipped, ${stats.files_changed} files changed.`);
  console.log(`~${stats.tokens} tokens. ~$${cost}`);
}

main().catch(e => {
  console.error('ingest failed:', e?.message || e);
  if (e?.stack) console.error(e.stack);
  process.exit(1);
});
