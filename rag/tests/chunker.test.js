import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkMarkdown, chunkFeaturesJson } from '../lib/chunker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fix = (name) => path.join(__dirname, 'fixtures', name);
const readFix = async (name) => (await fs.readFile(fix(name), 'utf8'));
const readExpected = async (name) => JSON.parse(await fs.readFile(fix(name), 'utf8'));

test('simple-h2: 2 chunks, one per H2 section', async () => {
  const md = await readFix('simple-h2.md');
  const exp = await readExpected('simple-h2.expected.json');
  const chunks = chunkMarkdown(md, 'docs/test/simple-h2.md');
  assert.equal(chunks.length, exp.chunk_count);
  for (let i = 0; i < exp.chunks.length; i++) {
    const c = chunks[i];
    const e = exp.chunks[i];
    assert.equal(c.chunk_index, e.chunk_index);
    assert.equal(c.total_chunks, e.total_chunks);
    assert.equal(c.heading_path[c.heading_path.length - 1], e.heading_path_endsWith);
    assert.ok(c.content.startsWith(e.content_starts_with),
      `chunk ${i}: content should start with "${e.content_starts_with}", got "${c.content.slice(0,80)}"`);
    assert.ok(c.content.trimEnd().endsWith(e.content_ends_with),
      `chunk ${i}: content should end with "${e.content_ends_with}"`);
  }
});

test('large-section: split into 3 chunks with overlap', async () => {
  const md = await readFix('large-section.md');
  const exp = await readExpected('large-section.expected.json');
  const chunks = chunkMarkdown(md, 'docs/test/large-section.md');
  assert.equal(chunks.length, exp.chunk_count);
  for (const c of chunks) {
    assert.deepEqual(c.heading_path, exp.chunks_have_same_heading_path);
    assert.ok(c.token_count <= exp.all_chunks_under_token_limit,
      `chunk ${c.chunk_index} has ${c.token_count} tokens, exceeds limit`);
  }
  // Verify overlap by sentence: at least one full sentence from chunk[i] tail
  // must appear in chunk[i+1] head. Robust against UTF-8 token-decode noise.
  const sentences = (text) => text.split(/(?<=[.!?])\s+/).filter(s => s.length > 20);
  for (let i = 0; i < chunks.length - 1; i++) {
    const tailSentences = sentences(chunks[i].content).slice(-3);
    const headHalf = chunks[i + 1].content.slice(0, Math.floor(chunks[i + 1].content.length / 2));
    const overlap = tailSentences.some(s => headHalf.includes(s.slice(0, 40)));
    assert.ok(overlap, `chunk ${i}/${i+1}: no detectable overlap (tail sentences not in next head)`);
  }
});

test('tiny-section: chain-merges into 1 chunk', async () => {
  const md = await readFix('tiny-section.md');
  const exp = await readExpected('tiny-section.expected.json');
  const chunks = chunkMarkdown(md, 'docs/test/tiny-section.md');
  assert.equal(chunks.length, exp.chunk_count);
  assert.ok(exp.heading_path_endsWith_one_of.includes(
    chunks[0].heading_path[chunks[0].heading_path.length - 1]
  ));
  assert.ok(chunks[0].token_count >= exp.min_token_count);
});

test('no-headings: 1 chunk with empty heading_path', async () => {
  const md = await readFix('no-headings.md');
  const exp = await readExpected('no-headings.expected.json');
  const chunks = chunkMarkdown(md, 'docs/test/no-headings.md');
  assert.equal(chunks.length, exp.chunk_count);
  assert.deepEqual(chunks[0].heading_path, exp.chunks[0].heading_path);
  assert.ok(chunks[0].content.startsWith(exp.chunks[0].content_starts_with));
});

test('nested: H1 > H2 > H3 captured in heading_path', async () => {
  const md = await readFix('nested.md');
  const exp = await readExpected('nested.expected.json');
  const chunks = chunkMarkdown(md, 'docs/test/nested.md');
  assert.equal(chunks.length, exp.chunk_count);
  for (let i = 0; i < exp.chunks.length; i++) {
    assert.deepEqual(chunks[i].heading_path, exp.chunks[i].heading_path);
    assert.ok(chunks[i].content.startsWith(exp.chunks[i].content_starts_with));
  }
});

test('features.mini: JSON → 3 synthetic chunks', async () => {
  const json = JSON.parse(await readFix('features.mini.json'));
  const exp = await readExpected('features.mini.expected.json');
  const chunks = chunkFeaturesJson(json, 'docs/features.json');
  assert.equal(chunks.length, exp.chunk_count);
  for (const c of chunks) {
    assert.equal(c.doc_type, exp.doc_type_for_all);
  }
  for (let i = 0; i < exp.chunks.length; i++) {
    assert.deepEqual(chunks[i].heading_path, exp.chunks[i].heading_path);
    assert.ok(chunks[i].content.includes(exp.chunks[i].content_includes));
  }
});

test('chunker output: every chunk has all required metadata', async () => {
  const md = await readFix('simple-h2.md');
  const chunks = chunkMarkdown(md, 'docs/test/simple-h2.md');
  for (const c of chunks) {
    assert.equal(typeof c.content, 'string');
    assert.equal(typeof c.source_file, 'string');
    assert.equal(typeof c.doc_type, 'string');
    assert.ok(Array.isArray(c.heading_path));
    assert.equal(typeof c.section, 'string');
    assert.equal(typeof c.chunk_index, 'number');
    assert.equal(typeof c.total_chunks, 'number');
    assert.match(c.sha1, /^[0-9a-f]{40}$/);
    assert.equal(typeof c.char_count, 'number');
    assert.equal(typeof c.token_count, 'number');
  }
});
