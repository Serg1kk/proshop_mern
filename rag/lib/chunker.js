import { unified } from 'unified';
import remarkParse from 'remark-parse';
import { toString } from 'mdast-util-to-string';
import { encoding_for_model } from 'tiktoken';
import { detectDocType, sha1 } from './metadata.js';

const TARGET_TOKENS = 400;
const MAX_TOKENS = 512;
const MIN_TOKENS = 200;
const OVERLAP_TOKENS = 80;

const enc = encoding_for_model('gpt-4');

const countTokens = (text) => enc.encode(text).length;

const buildPrefix = (headingPath) =>
  headingPath.map((h, i) => '#'.repeat(i + 1) + ' ' + h).join('\n');

const buildSection = (headingPath) => headingPath.join(' > ');

const finalize = (rawContent, headingPath, sourceFile) => {
  const prefix = buildPrefix(headingPath);
  const content = prefix ? `${prefix}\n\n${rawContent.trim()}` : rawContent.trim();
  return {
    content,
    source_file: sourceFile,
    doc_type: detectDocType(sourceFile),
    heading_path: headingPath,
    section: buildSection(headingPath),
    sha1: sha1(content),
    char_count: content.length,
    token_count: countTokens(content)
  };
};

// Take the last N tokens of `text` as a clean prose suffix (no broken UTF-8).
// Decoding token-id slices via tiktoken can produce broken bytes at multi-byte
// boundaries (esp. for Cyrillic), so we anchor on whitespace instead.
const tailWindow = (text, tokenBudget) => {
  // Walk back paragraph-by-paragraph until we have ≥ tokenBudget tokens.
  const paras = text.split(/\n\n+/);
  let acc = '';
  let accTokens = 0;
  for (let i = paras.length - 1; i >= 0; i--) {
    const p = paras[i];
    const pTokens = countTokens(p);
    if (accTokens >= tokenBudget) break;
    acc = p + (acc ? '\n\n' + acc : '');
    accTokens += pTokens;
  }
  // If still over budget by a lot, trim by sentences (split on .!? then accumulate from end).
  if (accTokens > tokenBudget * 2) {
    const sentences = acc.split(/(?<=[.!?])\s+/);
    let trimmed = '';
    let trimmedTokens = 0;
    for (let i = sentences.length - 1; i >= 0; i--) {
      const s = sentences[i];
      if (trimmedTokens >= tokenBudget) break;
      trimmed = s + (trimmed ? ' ' + trimmed : '');
      trimmedTokens += countTokens(s);
    }
    return trimmed;
  }
  return acc;
};

const splitLargeChunk = (rawContent, headingPath, sourceFile) => {
  const prefixTokens = countTokens(buildPrefix(headingPath));
  const budget = TARGET_TOKENS - prefixTokens;
  const paragraphs = rawContent.split(/\n\n+/);
  const out = [];
  let buf = '';
  let bufTokens = 0;
  for (const p of paragraphs) {
    const pTokens = countTokens(p);
    if (bufTokens + pTokens > budget && buf) {
      out.push(buf.trim());
      const tail = tailWindow(buf, OVERLAP_TOKENS);
      buf = tail + '\n\n' + p;
      bufTokens = countTokens(buf);
    } else {
      buf = buf ? buf + '\n\n' + p : p;
      bufTokens += pTokens;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out.map((rawC) => finalize(rawC, headingPath, sourceFile));
};

/**
 * Walks markdown AST and yields raw section blocks bounded by H2 nodes.
 * Each block carries the full active heading stack at its position.
 */
function* walkSections(ast) {
  const stack = []; // active heading stack [{depth, text}, …]
  let buffer = []; // mdast nodes belonging to current section
  let currentStack = [];

  const flush = () => {
    if (buffer.length === 0) return null;
    const raw = buffer.map(n => stringifyNode(n)).join('\n\n');
    const out = { headingStack: [...currentStack], rawContent: raw };
    buffer = [];
    return out;
  };

  for (const node of ast.children) {
    if (node.type === 'heading') {
      // Close previous section before starting new one (unless H3 inside H2 — keep with parent)
      if (node.depth <= 2) {
        const flushed = flush();
        if (flushed) yield flushed;
        // Update stack: pop until we're at parent of this depth
        while (stack.length && stack[stack.length - 1].depth >= node.depth) stack.pop();
        stack.push({ depth: node.depth, text: toString(node) });
        currentStack = [...stack];
      } else {
        // H3+ — append to buffer with updated stack but don't flush
        while (stack.length && stack[stack.length - 1].depth >= node.depth) stack.pop();
        stack.push({ depth: node.depth, text: toString(node) });
        // Update currentStack only if buffer is empty (H3 starts a new sub-section logically)
        if (buffer.length === 0) currentStack = [...stack];
        else {
          // If buffer has content, treat the H3 as a boundary too — flush, then start fresh
          const flushed = flush();
          if (flushed) yield flushed;
          currentStack = [...stack];
        }
      }
    } else {
      buffer.push(node);
    }
  }
  const last = flush();
  if (last) yield last;
}

function stringifyNode(node) {
  // For paragraphs, use mdast-util-to-string (preserves text)
  // For code blocks, return ``` … ``` with original value
  // For lists, render as plain bullets
  if (node.type === 'code') {
    return '```' + (node.lang || '') + '\n' + node.value + '\n```';
  }
  if (node.type === 'list') {
    return node.children.map(item =>
      (node.ordered ? '1. ' : '- ') + toString(item)
    ).join('\n');
  }
  // Paragraph, blockquote, etc.
  return toString(node);
}

/**
 * Main entry: parse markdown → emit chunks.
 * @param {string} markdown
 * @param {string} sourceFile — path used for doc_type detection and metadata
 * @returns {Array<Chunk>}
 */
export function chunkMarkdown(markdown, sourceFile) {
  const tree = unified().use(remarkParse).parse(markdown);
  const sections = [...walkSections(tree)];

  // Edge: no headings at all → entire content as one section with empty stack
  let candidates = sections;
  if (candidates.length === 0 && markdown.trim()) {
    candidates = [{ headingStack: [], rawContent: markdown.trim() }];
  }

  // Pass 1: split large sections
  let chunks = [];
  for (const sec of candidates) {
    const headingPath = sec.headingStack.map(h => h.text);
    const tentative = finalize(sec.rawContent, headingPath, sourceFile);
    if (tentative.token_count > MAX_TOKENS) {
      const split = splitLargeChunk(sec.rawContent, headingPath, sourceFile);
      chunks.push(...split);
    } else {
      chunks.push(tentative);
    }
  }

  // Pass 2: merge tiny chunks (< MIN_TOKENS)
  // Rule: prev-then-next of same H1; chain-merge max 3 iterations.
  for (let iter = 0; iter < 3; iter++) {
    let merged = false;
    const result = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (c.token_count >= MIN_TOKENS) {
        result.push(c);
        continue;
      }
      // Try merge with previous (if exists, in result, same H1)
      const prev = result[result.length - 1];
      const sameH1 = (a, b) =>
        (a.heading_path[0] || null) === (b.heading_path[0] || null);
      if (prev && sameH1(prev, c)) {
        const merged_chunk = mergeChunks(prev, c, sourceFile);
        result[result.length - 1] = merged_chunk;
        merged = true;
        continue;
      }
      // Try merge with next
      const next = chunks[i + 1];
      if (next && sameH1(c, next)) {
        const merged_chunk = mergeChunks(c, next, sourceFile);
        result.push(merged_chunk);
        i++; // skip next
        merged = true;
        continue;
      }
      // No neighbor of same H1 — keep as-is (allowed below floor for solo chunks)
      result.push(c);
    }
    chunks = result;
    if (!merged) break;
  }

  // Renumber chunk_index / total_chunks
  return chunks.map((c, i) => ({ ...c, chunk_index: i, total_chunks: chunks.length }));
}

function mergeChunks(a, b, sourceFile) {
  // The merged chunk inherits the larger of the two heading_paths
  const headingPath = a.token_count >= b.token_count ? a.heading_path : b.heading_path;
  // Strip prefix from each, concat raw, re-finalize
  const stripPrefix = (chunk) => {
    const prefix = buildPrefix(chunk.heading_path);
    return prefix ? chunk.content.slice(prefix.length).trimStart() : chunk.content;
  };
  const rawCombined = stripPrefix(a) + '\n\n' + stripPrefix(b);
  return finalize(rawCombined, headingPath, sourceFile);
}

/**
 * Convert features.json structure to chunks.
 * Each feature → one chunk with synthetic markdown.
 */
export function chunkFeaturesJson(json, sourceFile) {
  if (!Array.isArray(json.features)) {
    throw new Error('features.json: expected top-level "features" array');
  }
  const chunks = json.features.map((f, i) => {
    const lines = [
      `## ${f.id}`,
      f.description || '',
      '',
      `**Status:** ${f.status || 'unknown'}`,
      f.owner ? `**Owner:** ${f.owner}` : null,
      f.name ? `**Name:** ${f.name}` : null
    ].filter(Boolean);
    const rawContent = lines.join('\n');
    const headingPath = ['features', f.id];
    const c = finalize(rawContent, headingPath, sourceFile);
    return { ...c, chunk_index: i, total_chunks: json.features.length };
  });
  return chunks;
}
