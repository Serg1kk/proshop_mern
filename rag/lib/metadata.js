import crypto from 'node:crypto';

const TYPE_BY_DIR = {
  adr: 'adr',
  api: 'api',
  features: 'feature',
  incidents: 'incident',
  pages: 'page',
  runbooks: 'runbook'
};

/**
 * Detect the doc_type from a file path by walking the path segments.
 * Looks for the first segment that matches a known type-dir name
 * (adr, api, features, incidents, pages, runbooks). The matched
 * segment must NOT be the last segment — the file lives inside it.
 *
 * Special cases:
 *   - features.json (anywhere) → feature_spec
 *   - top-level .md with no known type-dir on the path → reference
 */
export function detectDocType(filePath) {
  const norm = filePath.replaceAll('\\', '/');
  if (norm.endsWith('/features.json') || norm === 'features.json') {
    return 'feature_spec';
  }
  const parts = norm.split('/');
  // Walk parts and find a known type-dir on the way down.
  // The matched segment must be a directory (i.e. not the last segment).
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i];
    if (TYPE_BY_DIR[segment]) {
      return TYPE_BY_DIR[segment];
    }
  }
  // Top-level .md in docs/ or any corpus root → reference
  if (norm.endsWith('.md')) return 'reference';
  throw new Error(`unknown path: ${filePath}`);
}

export function sha1(text) {
  return crypto.createHash('sha1').update(text, 'utf8').digest('hex');
}

/**
 * @param {Array<{depth: number, text: string}>} headingStack
 *   The active heading stack at the chunk's position.
 * @returns {string[]} Array of heading texts from H1 down to deepest active heading.
 */
export function buildHeadingPath(headingStack) {
  return headingStack.map(h => h.text);
}
