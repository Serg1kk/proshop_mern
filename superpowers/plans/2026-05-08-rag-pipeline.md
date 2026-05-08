# RAG Pipeline Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local RAG pipeline (ingest CLI + HTTP search server) over `proshop_mern/docs/` using Weaviate (Docker) for hybrid search and Cohere for embeddings + reranking.

**Architecture:** Markdown-aware chunking → Cohere embed-multilingual-v3.0 → Weaviate hybrid (BM25 + dense + RRF) → Cohere rerank-multilingual-v3.0. New code lives in `proshop_mern/rag/`, separate from `backend/`/`frontend/`. Search server on port 5002, Weaviate on 8080/50051.

**Tech Stack:** Node.js ESM, Express 4, `weaviate-client@3`, `cohere-ai@7`, `remark-parse` + `unified` (markdown AST), `tiktoken`, `glob`, `node --test` (built-in test runner).

**Spec:** [`superpowers/specs/2026-05-08-rag-pipeline-design.md`](../specs/2026-05-08-rag-pipeline-design.md)

---

## File Structure

### Files to create

```
proshop_mern/
├── rag/
│   ├── package.json                       # Local deps + test script
│   ├── .gitignore                         # node_modules
│   ├── lib/
│   │   ├── metadata.js                    # detectDocType, sha1, buildHeadingPath
│   │   ├── chunker.js                     # markdown AST → chunks with metadata
│   │   ├── cohere.js                      # createCohereClient factory (embed + rerank)
│   │   ├── weaviate.js                    # client + ensureSchema, deleteBySource, batchInsert
│   │   └── search.js                      # core hybrid+rerank function (used by server + integration tests)
│   ├── ingest.js                          # CLI entry: walk corpus, chunk, dedup, embed, upsert
│   ├── server.js                          # Express :5002 — POST /search, POST /reindex, GET /health
│   └── tests/
│       ├── fixtures/
│       │   ├── simple-h2.md               # 2 H2 ~300 tokens each → 2 chunks
│       │   ├── simple-h2.expected.json
│       │   ├── large-section.md           # 1 H2 ~1500 tokens → 3 chunks with overlap
│       │   ├── large-section.expected.json
│       │   ├── tiny-section.md            # 3 H2: 80, 250, 70 tokens → 2 merged chunks
│       │   ├── tiny-section.expected.json
│       │   ├── no-headings.md             # ~200 tokens, no H1/H2/H3 → 1 chunk
│       │   ├── no-headings.expected.json
│       │   ├── nested.md                  # H1 → H2 → H3 → 1 chunk per H2 block
│       │   ├── nested.expected.json
│       │   ├── features.mini.json         # 3 feature objects → 3 synthetic-md chunks
│       │   ├── features.mini.expected.json
│       │   └── sample-corpus/             # subset of real docs/ for integration test
│       │       ├── runbooks/db-seed-and-reset.md  # copy from real docs
│       │       ├── incidents/i-001-paypal-double-charge.md
│       │       └── adr/adr-004-paypal-vs-stripe.md
│       ├── _stubs/
│       │   └── cohere-stub.js             # Deterministic stub matching cohere.js contract
│       ├── metadata.test.js               # Unit, no network
│       ├── chunker.test.js                # Unit, no network
│       ├── search.test.js                 # Integration, requires Weaviate + sample-corpus
│       └── server.test.js                 # HTTP smoke
```

### Files to modify

- `proshop_mern/docker-compose.yml` — add `weaviate` service alongside existing `mongo`
- `proshop_mern/package.json` — add `weaviate:up`, `weaviate:down`, `rag:install`, `rag:ingest`, `rag:server` scripts
- `proshop_mern/.env.example` — add `COHERE_API_KEY=`, model names, `RAG_PORT`, `RAG_ALLOW_REINDEX`, Weaviate hosts
- `proshop_mern/.gitignore` — ensure `rag/node_modules` is covered (root `.gitignore` already covers `node_modules` likely; verify in Task 1)

### Module responsibilities

| File | Responsibility | Depends on |
|---|---|---|
| `lib/metadata.js` | Pure helpers: `detectDocType(path)`, `sha1(text)`, `buildHeadingPath(astNodes)` | none |
| `lib/chunker.js` | Markdown → chunks. Parse AST, split by H2, merge tiny, split large, attach metadata | `lib/metadata.js`, `remark-parse`, `tiktoken` |
| `lib/cohere.js` | Factory `createCohereClient({apiKey, embedModel, rerankModel})` returning `{embed, rerank}` | `cohere-ai` |
| `lib/weaviate.js` | Wrap weaviate-client: `connect()`, `ensureSchema()`, `deleteBySource()`, `batchInsert()`, `hybridSearch()` | `weaviate-client` |
| `lib/search.js` | Core search: embed query → hybrid → rerank → return | `lib/cohere.js`, `lib/weaviate.js` |
| `ingest.js` | CLI: parse args, walk corpus, dedup by sha1-set equality, batch embed, upsert | all of `lib/*` |
| `server.js` | Express endpoints, error mapping, health check | `lib/search.js`, `lib/weaviate.js` |

---

## Chunk 1: Project bootstrap

Goal: get a runnable, empty `rag/` package, Weaviate container starting, all env vars wired. No business logic yet — but verifiable via `npm run weaviate:up && curl localhost:8080/v1/.well-known/ready`.

### Task 1.1: Update root `.env.example` and `.env`

**Files:**
- Modify: `proshop_mern/.env.example`
- (User will manually update `proshop_mern/.env` — already has `COHERE_API_KEY`, `COHERE_EMBED_MODEL`, `COHERE_RERANK_MODEL` per session context)

- [ ] **Step 1: Read current `.env.example`**

```bash
cat proshop_mern/.env.example
```

- [ ] **Step 2: Append new variables to `.env.example`**

Append these lines to `proshop_mern/.env.example` (after `PAYPAL_CLIENT_ID=sb`):

```
# ─── RAG pipeline ────────────────────────────────────────────────────────────
# Cohere — single key used for both embeddings and reranker
COHERE_API_KEY=
COHERE_EMBED_MODEL=embed-multilingual-v3.0
COHERE_RERANK_MODEL=rerank-multilingual-v3.0

# RAG search HTTP server
RAG_PORT=5002
# Set true only when explicitly allowing programmatic re-ingest via POST /reindex
RAG_ALLOW_REINDEX=false

# Weaviate (started via `npm run weaviate:up`)
WEAVIATE_HOST=localhost
WEAVIATE_HTTP_PORT=8080
WEAVIATE_GRPC_PORT=50051
```

- [ ] **Step 3: Verify `.env` (user-side check)**

Run:
```bash
grep -E '^(COHERE_API_KEY|COHERE_EMBED_MODEL|COHERE_RERANK_MODEL)=' proshop_mern/.env
```
Expected: 3 lines, all with non-empty values for `COHERE_API_KEY`. If `RAG_PORT`, `RAG_ALLOW_REINDEX`, or Weaviate vars missing, append them with the same values from `.env.example` (the user has confirmed they manage `.env` themselves; this step is informational).

- [ ] **Step 4: Commit `.env.example`**

```bash
git add proshop_mern/.env.example
git commit -m "chore(rag): add Cohere + Weaviate env vars to .env.example"
```

---

### Task 1.2: Add Weaviate to docker-compose

**Files:**
- Modify: `proshop_mern/docker-compose.yml`

- [ ] **Step 1: Replace `docker-compose.yml` with the version that includes Weaviate**

The full new content (overwrites the existing 9-line file):

```yaml
services:
  mongo:
    image: mongo:7
    container_name: proshop-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  weaviate:
    image: cr.weaviate.io/semitechnologies/weaviate:1.27.0
    container_name: proshop-weaviate
    ports:
      - "8080:8080"
      - "50051:50051"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: "true"
      PERSISTENCE_DATA_PATH: /var/lib/weaviate
      DEFAULT_VECTORIZER_MODULE: none
      ENABLE_MODULES: ""
      CLUSTER_HOSTNAME: node1
    volumes:
      - weaviate_data:/var/lib/weaviate

volumes:
  mongo_data:
  weaviate_data:
```

- [ ] **Step 2: Validate compose syntax**

```bash
cd proshop_mern && docker compose config --quiet
```
Expected: exit code 0, no output (silent success). If errors — fix YAML indentation.

- [ ] **Step 3: Pull image + start Weaviate**

```bash
cd proshop_mern && docker compose up -d weaviate
```
Expected: image download (first run, ~50 MB), then `Container proshop-weaviate Started`.

- [ ] **Step 4: Wait for ready and verify**

```bash
# Weaviate exposes a ready endpoint
for i in {1..10}; do
  if curl -sf http://localhost:8080/v1/.well-known/ready; then break; fi
  sleep 1
done
curl -s http://localhost:8080/v1/meta | head -c 200
```
Expected: ready check returns empty body with 200; meta endpoint returns JSON with `"version":"1.27.0"`.

- [ ] **Step 5: Commit**

```bash
git add proshop_mern/docker-compose.yml
git commit -m "feat(rag): add Weaviate 1.27 service to docker-compose"
```

---

### Task 1.3: Add npm scripts to root `package.json`

**Files:**
- Modify: `proshop_mern/package.json:7-17` (the `scripts` block)

- [ ] **Step 1: Read current scripts block**

```bash
grep -n -A 12 '"scripts"' proshop_mern/package.json
```

- [ ] **Step 2: Add 5 new scripts**

Add these lines to the `scripts` block in `package.json` (preserve trailing comma on the previous line, no trailing comma on the last new line if it's the final entry; safest is to insert after `"heroku-postbuild"`):

```json
"weaviate:up": "docker compose up -d weaviate",
"weaviate:down": "docker compose stop weaviate",
"rag:install": "npm install --prefix rag",
"rag:ingest": "node rag/ingest.js",
"rag:server": "node rag/server.js"
```

The result should look like (final scripts block):

```json
"scripts": {
  "start": "node backend/server",
  "server": "nodemon --legacy-watch backend/server.js",
  "client": "NODE_OPTIONS=--openssl-legacy-provider npm start --prefix frontend",
  "dev": "concurrently \"npm run server\" \"npm run client\"",
  "mongo:up": "docker compose up -d mongo",
  "mongo:down": "docker compose down",
  "data:import": "node backend/seeder",
  "data:destroy": "node backend/seeder -d",
  "data:import-extra": "node backend/seedExtra",
  "heroku-postbuild": "NPM_CONFIG_PRODUCTION=false npm install --prefix frontend && NODE_OPTIONS=--openssl-legacy-provider npm run build --prefix frontend",
  "weaviate:up": "docker compose up -d weaviate",
  "weaviate:down": "docker compose stop weaviate",
  "rag:install": "npm install --prefix rag",
  "rag:ingest": "node rag/ingest.js",
  "rag:server": "node rag/server.js"
},
```

- [ ] **Step 3: Validate JSON**

```bash
cd proshop_mern && node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))" && echo "JSON OK"
```
Expected: `JSON OK`. If parse error — fix trailing commas.

- [ ] **Step 4: Verify `mongo:down` is unchanged (regression guard)**

```bash
grep '"mongo:down"' proshop_mern/package.json
```
Expected: `"mongo:down": "docker compose down",` (note: `mongo:down` brings down ALL services since it doesn't name `mongo` — this is pre-existing behavior, do not "fix" in this PR).

- [ ] **Step 5: Commit**

```bash
git add proshop_mern/package.json
git commit -m "feat(rag): add weaviate + rag npm scripts"
```

---

### Task 1.4: Create `rag/package.json` and `rag/.gitignore`

**Files:**
- Create: `proshop_mern/rag/package.json`
- Create: `proshop_mern/rag/.gitignore`
- Create: `proshop_mern/rag/tests/.gitkeep` (so `npm test` doesn't fail on missing dir)

**Prerequisite check:** `node --version` must be ≥ 18 (ESM + `node --test` require it). Run before starting:
```bash
node --version
```
Expected: `v18.x` or higher. If older — install nvm and `nvm install 20`.

- [ ] **Step 1: Verify root `.gitignore` covers `node_modules`**

```bash
grep -E '^node_modules' proshop_mern/.gitignore
```
Expected: at least one line matching. If empty — add `node_modules` to root `.gitignore`. (`rag/node_modules` is matched by a global `node_modules` pattern, but we add a local `.gitignore` for safety in case the root pattern is path-anchored.)

- [ ] **Step 2: Create `rag/.gitignore`**

Content:
```
node_modules/
*.log
.tiktoken-cache/
```

- [ ] **Step 3: Create `rag/package.json`**

Content:
```json
{
  "name": "proshop-rag",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "RAG pipeline (ingest + search) for proshop_mern docs/",
  "scripts": {
    "test": "node --test tests/",
    "test:unit": "node --test tests/metadata.test.js tests/chunker.test.js",
    "test:integration": "node --test tests/search.test.js tests/server.test.js"
  },
  "dependencies": {
    "weaviate-client": "^3.2.0",
    "cohere-ai": "^7.14.0",
    "express": "^4.19.2",
    "dotenv": "^16.4.5",
    "glob": "^10.4.5",
    "unified": "^11.0.5",
    "remark-parse": "^11.0.0",
    "mdast-util-to-string": "^4.0.0",
    "tiktoken": "^1.0.17"
  }
}
```

- [ ] **Step 4: Create empty `rag/tests/` dir with `.gitkeep`**

```bash
mkdir -p proshop_mern/rag/tests && touch proshop_mern/rag/tests/.gitkeep
```
Expected: file `proshop_mern/rag/tests/.gitkeep` exists.

- [ ] **Step 5: Install dependencies**

```bash
cd proshop_mern && npm run rag:install
```
Expected: lockfile created at `rag/package-lock.json`, `rag/node_modules/` populated. No errors. Warnings about peer deps are acceptable.

- [ ] **Step 6: Smoke check imports work (real exports, not just typeof)**

```bash
cd proshop_mern/rag && node -e "
const checks = await Promise.all([
  import('weaviate-client').then(m => typeof m.default?.connectToLocal === 'function'),
  import('cohere-ai').then(m => typeof m.CohereClient === 'function'),
  import('unified').then(m => typeof m.unified === 'function'),
  import('remark-parse').then(m => typeof m.default === 'function'),
  import('tiktoken').then(m => typeof m.encoding_for_model === 'function')
]);
const names = ['weaviate-client.connectToLocal','cohere-ai.CohereClient','unified.unified','remark-parse.default','tiktoken.encoding_for_model'];
checks.forEach((ok,i) => console.log(ok ? '✓' : '✗', names[i]));
process.exit(checks.every(Boolean) ? 0 : 1);
"
```
Expected: 5 ✓ lines, exit code 0. If any ✗ — version mismatch; check that version on npm and pin a working one.

- [ ] **Step 7: Commit**

```bash
git add proshop_mern/rag/package.json proshop_mern/rag/package-lock.json proshop_mern/rag/.gitignore proshop_mern/rag/tests/.gitkeep
git commit -m "feat(rag): bootstrap rag/ package with deps"
```

---

### Task 1.5: Verify Chunk 1 acceptance

- [ ] **Step 1: Restart Weaviate cleanly**

```bash
cd proshop_mern
docker compose stop weaviate
npm run weaviate:up
sleep 3
curl -sf http://localhost:8080/v1/.well-known/ready && echo " READY"
```
Expected: `READY`.

- [ ] **Step 2: Verify Cohere key works (manual probe, optional but recommended)**

```bash
cd proshop_mern
KEY=$(grep '^COHERE_API_KEY=' .env | cut -d= -f2)
curl -s -X POST https://api.cohere.com/v2/embed \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"texts":["hello"],"model":"embed-multilingual-v3.0","input_type":"search_document","embedding_types":["float"]}' \
  | head -c 300
```
Expected: JSON containing `"embeddings"` array. If 401/403 — key wrong; ask user to verify. If timeout — check connectivity.

- [ ] **Step 3: Confirm test runner is available**

```bash
cd proshop_mern/rag && npm test
```
Expected: `node --test` outputs "tests 0" or similar (no test files yet) — exit code 0 or "no tests found". This confirms the runner is discoverable.

---

## Chunk 1 review checkpoint

After completing Tasks 1.1–1.5: Chunk 1 acceptance is met when Weaviate is up, Cohere key probe works, and `npm test --prefix rag` reports "tests 0" exit 0.

---

## Chunk 2: Pure libs (metadata + chunker)

Goal: implement and test `lib/metadata.js` and `lib/chunker.js`. No network, no Cohere, no Weaviate. Pure functions + AST manipulation. Spec sections covered: §7.1–§7.4, §7.6.

### Task 2.1: `lib/metadata.js` — pure helpers (TDD)

**Files:**
- Create: `proshop_mern/rag/lib/metadata.js`
- Create: `proshop_mern/rag/tests/metadata.test.js`

- [ ] **Step 1: Write failing tests for `metadata.js`**

Create `rag/tests/metadata.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectDocType, sha1, buildHeadingPath } from '../lib/metadata.js';

test('detectDocType: adr', () => {
  assert.equal(detectDocType('docs/adr/0001-jwt.md'), 'adr');
  assert.equal(detectDocType('docs/adr/adr-001-mongo.md'), 'adr');
});
test('detectDocType: api', () => assert.equal(detectDocType('docs/api/auth.md'), 'api'));
test('detectDocType: feature', () => assert.equal(detectDocType('docs/features/cart.md'), 'feature'));
test('detectDocType: incident', () => assert.equal(detectDocType('docs/incidents/i-001.md'), 'incident'));
test('detectDocType: page', () => assert.equal(detectDocType('docs/pages/cart.md'), 'page'));
test('detectDocType: runbook', () => assert.equal(detectDocType('docs/runbooks/deploy.md'), 'runbook'));
test('detectDocType: reference (root .md)', () => {
  assert.equal(detectDocType('docs/architecture.md'), 'reference');
  assert.equal(detectDocType('docs/glossary.md'), 'reference');
});
test('detectDocType: feature_spec for features.json', () => {
  assert.equal(detectDocType('docs/features.json'), 'feature_spec');
});
test('detectDocType: throws on unknown path', () => {
  assert.throws(() => detectDocType('random/path.md'), /unknown/i);
});

test('sha1: deterministic for same input', () => {
  assert.equal(sha1('hello'), sha1('hello'));
});
test('sha1: returns 40-char hex', () => {
  assert.match(sha1('hello'), /^[0-9a-f]{40}$/);
});
test('sha1: different input → different hash', () => {
  assert.notEqual(sha1('hello'), sha1('world'));
});

test('buildHeadingPath: empty stack → []', () => {
  assert.deepEqual(buildHeadingPath([]), []);
});
test('buildHeadingPath: H1 only', () => {
  assert.deepEqual(buildHeadingPath([{ depth: 1, text: 'Deploy' }]), ['Deploy']);
});
test('buildHeadingPath: H1 → H2 → H3', () => {
  assert.deepEqual(
    buildHeadingPath([
      { depth: 1, text: 'Deploy' },
      { depth: 2, text: 'Heroku' },
      { depth: 3, text: 'Buildpacks' }
    ]),
    ['Deploy', 'Heroku', 'Buildpacks']
  );
});
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd proshop_mern/rag && npm run test:unit -- --test-name-pattern=metadata
```
Expected: failure — "Cannot find module '../lib/metadata.js'".

- [ ] **Step 3: Implement `lib/metadata.js`**

Create `rag/lib/metadata.js`:

```js
import crypto from 'node:crypto';
import path from 'node:path';

const TYPE_BY_DIR = {
  adr: 'adr',
  api: 'api',
  features: 'feature',
  incidents: 'incident',
  pages: 'page',
  runbooks: 'runbook'
};

export function detectDocType(filePath) {
  const norm = filePath.replaceAll('\\', '/');
  if (norm === 'docs/features.json' || norm.endsWith('/docs/features.json')) {
    return 'feature_spec';
  }
  const parts = norm.split('/');
  const docsIdx = parts.lastIndexOf('docs');
  if (docsIdx === -1) {
    throw new Error(`unknown path (not under docs/): ${filePath}`);
  }
  const after = parts.slice(docsIdx + 1);
  if (after.length === 1 && after[0].endsWith('.md')) {
    return 'reference';
  }
  const dir = after[0];
  const type = TYPE_BY_DIR[dir];
  if (!type) {
    throw new Error(`unknown path (no type for dir "${dir}"): ${filePath}`);
  }
  return type;
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
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
cd proshop_mern/rag && npm run test:unit -- --test-name-pattern=metadata
```
Expected: 13 pass, 0 fail.

- [ ] **Step 5: Commit**

```bash
git add proshop_mern/rag/lib/metadata.js proshop_mern/rag/tests/metadata.test.js
git commit -m "feat(rag): metadata helpers (detectDocType, sha1, buildHeadingPath)"
```

---

### Task 2.2: Build chunker fixtures

Create the 6 fixtures and their `.expected.json` snapshots (see spec §10.2 table).

**Files:**
- Create: `proshop_mern/rag/tests/fixtures/simple-h2.md`
- Create: `proshop_mern/rag/tests/fixtures/simple-h2.expected.json`
- Create: `proshop_mern/rag/tests/fixtures/large-section.md`
- Create: `proshop_mern/rag/tests/fixtures/large-section.expected.json`
- Create: `proshop_mern/rag/tests/fixtures/tiny-section.md`
- Create: `proshop_mern/rag/tests/fixtures/tiny-section.expected.json`
- Create: `proshop_mern/rag/tests/fixtures/no-headings.md`
- Create: `proshop_mern/rag/tests/fixtures/no-headings.expected.json`
- Create: `proshop_mern/rag/tests/fixtures/nested.md`
- Create: `proshop_mern/rag/tests/fixtures/nested.expected.json`
- Create: `proshop_mern/rag/tests/fixtures/features.mini.json`
- Create: `proshop_mern/rag/tests/fixtures/features.mini.expected.json`

- [ ] **Step 1: `simple-h2.md`** — 2 H2 sections, ~300 tokens each

```md
# Simple H2 fixture

## Authentication

Authentication is handled via JSON Web Tokens (JWTs). The user logs in with email and password, the backend verifies credentials with bcryptjs, and returns a signed token. The frontend stores this token in localStorage and attaches it to every subsequent API request via the `Authorization: Bearer <token>` header.

The backend middleware `authMiddleware.js` validates the token on every protected route. If the token is missing, expired, or signed with a different secret, the request is rejected with 401. The token payload contains the user id only; the full user object is loaded fresh from MongoDB on each request to ensure the role and permissions are current.

JWT secrets are stored in the `.env` file as `JWT_SECRET`. Rotating the secret invalidates all existing tokens — users will be forced to log in again. This is the recommended response to a suspected secret leak.

## Authorization

Authorization is role-based. Users have a single role: either `admin` or `customer`. The role is stored as a boolean field `isAdmin` on the user document. Routes that require admin access are protected by the `admin` middleware, which checks `req.user.isAdmin === true` and rejects with 403 otherwise.

Resource-level authorization (e.g., a user can only edit their own profile) is enforced inside controllers by comparing `req.user._id` to the resource owner. There is no separate ACL or permission system — keeping this simple is intentional for the size of the application.

For administrative operations like deleting users or modifying products, the admin middleware runs after the auth middleware. Admin operations are audited by virtue of being logged in the morgan request log; there is no separate audit trail.
```

`simple-h2.expected.json`:

```json
{
  "chunk_count": 2,
  "chunks": [
    {
      "chunk_index": 0,
      "total_chunks": 2,
      "heading_path_endsWith": "Authentication",
      "content_starts_with": "# Simple H2 fixture\n## Authentication\n\nAuthentication is handled via JSON Web Tokens",
      "content_ends_with": "recommended response to a suspected secret leak."
    },
    {
      "chunk_index": 1,
      "total_chunks": 2,
      "heading_path_endsWith": "Authorization",
      "content_starts_with": "# Simple H2 fixture\n## Authorization\n\nAuthorization is role-based.",
      "content_ends_with": "no separate audit trail."
    }
  ]
}
```

- [ ] **Step 2: `large-section.md`** — 1 H2 ~1500 tokens

Generate ~1500 tokens of plausible English prose under one H2 (e.g., "## Performance Tuning"). Use 6 paragraphs of ~250 tokens each. Content can be filler about generic web-perf topics (caching, indexes, query plans) — what matters is structure and length.

`large-section.expected.json`:

```json
{
  "chunk_count": 3,
  "chunks_have_same_heading_path": ["Large section fixture", "Performance Tuning"],
  "min_overlap_tokens_between_neighbors": 50,
  "all_chunks_under_token_limit": 512
}
```

- [ ] **Step 3: `tiny-section.md`** — 3 H2: 80, 250, 70 tokens

```md
# Tiny section fixture

## Glossary one-liner
This is a 80-token glossary stub that defines a single term briefly.
[…pad to ~80 tokens of definition…]

## Real content
[…~250 tokens of substantive content describing the main topic of this fixture, with enough words to exceed the floor and stand on its own…]

## Tiny tail
[…~70 tokens of tail content like "see also" links and references…]
```

`tiny-section.expected.json`:

```json
{
  "chunk_count": 1,
  "comment": "All three sections merge: tail merges into 'Real content' (no next), then 'Glossary one-liner' merges into the resulting chunk (no previous of same H1). Final chunk_count is 1.",
  "heading_path_endsWith_one_of": ["Real content"],
  "min_token_count": 350
}
```

(Note: this exercises the chain-merge path from spec §7.1 step 4.)

- [ ] **Step 4: `no-headings.md`** — ~200 tokens, no H1/H2/H3

```md
This fixture has no headings at all. It is a flat block of text used to verify that the chunker does not crash when no markdown structure is present, and that it produces exactly one chunk with an empty heading_path.

[…pad with ~150 more tokens of plain prose…]
```

`no-headings.expected.json`:

```json
{
  "chunk_count": 1,
  "chunks": [
    {
      "chunk_index": 0,
      "total_chunks": 1,
      "heading_path": [],
      "content_starts_with": "This fixture has no headings"
    }
  ]
}
```

- [ ] **Step 5: `nested.md`** — H1 → H2 → H3 (3 levels)

```md
# Deploy

## Heroku

### Buildpacks

Buildpacks transform deployed code into runtime artifacts. Heroku autodetects buildpacks based on files in your repo (e.g., `package.json` → Node.js buildpack). For this project the Node.js buildpack handles both backend and frontend (via `heroku-postbuild` script).

[…~200 tokens about buildpack config…]

### Config Vars

Environment variables on Heroku are managed via `heroku config:set KEY=VALUE`. The same vars from `.env` must be set in Heroku's config — `MONGO_URI`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, `NODE_ENV=production`.

[…~200 tokens about config vars…]
```

`nested.expected.json`:

```json
{
  "chunk_count": 2,
  "chunks": [
    {
      "chunk_index": 0,
      "heading_path": ["Deploy", "Heroku", "Buildpacks"],
      "content_starts_with": "# Deploy\n## Heroku\n### Buildpacks\n\nBuildpacks transform"
    },
    {
      "chunk_index": 1,
      "heading_path": ["Deploy", "Heroku", "Config Vars"],
      "content_starts_with": "# Deploy\n## Heroku\n### Config Vars\n\nEnvironment variables"
    }
  ]
}
```

- [ ] **Step 6: `features.mini.json`** — 3 feature objects

```json
{
  "features": [
    {
      "id": "FF-001",
      "name": "Cart persistence",
      "status": "enabled",
      "description": "Cart state persists in localStorage across browser sessions. Items survive page refresh and browser close. Implemented via Redux persist middleware.",
      "owner": "frontend"
    },
    {
      "id": "FF-002",
      "name": "Guest checkout",
      "status": "rollout",
      "description": "Allow users to complete checkout without creating an account. Email is collected during the shipping step and used for order confirmation. The user is offered an optional account creation at the end.",
      "owner": "checkout"
    },
    {
      "id": "FF-003",
      "name": "PayPal Smart Buttons",
      "status": "disabled",
      "description": "New PayPal Smart Buttons SDK with one-touch checkout. Currently disabled pending compliance review of refund flow.",
      "owner": "payments"
    }
  ]
}
```

`features.mini.expected.json`:

```json
{
  "chunk_count": 3,
  "doc_type_for_all": "feature_spec",
  "chunks": [
    { "heading_path": ["features", "FF-001"], "content_includes": "Cart persistence" },
    { "heading_path": ["features", "FF-002"], "content_includes": "Guest checkout" },
    { "heading_path": ["features", "FF-003"], "content_includes": "PayPal Smart Buttons" }
  ]
}
```

- [ ] **Step 7: Commit fixtures**

```bash
git add proshop_mern/rag/tests/fixtures/
git commit -m "test(rag): add chunker fixtures + expected snapshots"
```

---

### Task 2.3: `lib/chunker.js` — TDD

**Files:**
- Create: `proshop_mern/rag/lib/chunker.js`
- Create: `proshop_mern/rag/tests/chunker.test.js`

- [ ] **Step 1: Write failing tests**

Create `rag/tests/chunker.test.js`:

```js
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
  // Verify overlap: chunk[i+1].content must contain at least 50 tokens worth
  // (~200 chars heuristic) of chunk[i].content's tail.
  for (let i = 0; i < chunks.length - 1; i++) {
    const tail200 = chunks[i].content.slice(-200);
    const head400 = chunks[i + 1].content.slice(0, 400);
    // Find at least one 50-char run from tail in head (loose overlap signal).
    let found = false;
    for (let k = 0; k <= tail200.length - 50; k++) {
      if (head400.includes(tail200.slice(k, k + 50))) { found = true; break; }
    }
    assert.ok(found, `chunk ${i}/${i+1}: no detectable overlap`);
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
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd proshop_mern/rag && npm run test:unit -- --test-name-pattern=chunker
```
Expected: failure — `Cannot find module '../lib/chunker.js'`.

- [ ] **Step 3: Implement `lib/chunker.js`**

Create `rag/lib/chunker.js`:

```js
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

const splitLargeChunk = (rawContent, headingPath, sourceFile) => {
  const prefixTokens = countTokens(buildPrefix(headingPath));
  const budget = TARGET_TOKENS - prefixTokens;
  const paragraphs = rawContent.split(/\n\n+/);
  const out = [];
  let buf = '';
  let bufTokens = 0;
  let prevTail = '';
  for (const p of paragraphs) {
    const pTokens = countTokens(p);
    if (bufTokens + pTokens > budget && buf) {
      out.push(buf.trim());
      const tailTokens = OVERLAP_TOKENS;
      const bufTokensArr = enc.encode(buf);
      const tailIdsCount = Math.min(tailTokens, bufTokensArr.length);
      const tailIds = bufTokensArr.slice(-tailIdsCount);
      prevTail = new TextDecoder().decode(enc.decode(tailIds));
      buf = prevTail + '\n\n' + p;
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
```

- [ ] **Step 4: Run tests, verify pass**

```bash
cd proshop_mern/rag && npm run test:unit -- --test-name-pattern=chunker
```
Expected: 7 pass, 0 fail. If `large-section` overlap test fails — adjust `splitLargeChunk` overlap logic.

- [ ] **Step 5: Commit**

```bash
git add proshop_mern/rag/lib/chunker.js proshop_mern/rag/tests/chunker.test.js
git commit -m "feat(rag): markdown-aware chunker (split large, merge tiny)"
```

---

## Chunk 3: External clients (Cohere + Weaviate)

Goal: implement `lib/cohere.js` (factory + stub) and `lib/weaviate.js` (client + schema + CRUD primitives). No business logic yet.

### Task 3.1: `lib/cohere.js` factory

**Files:**
- Create: `proshop_mern/rag/lib/cohere.js`
- Create: `proshop_mern/rag/tests/_stubs/cohere-stub.js`

- [ ] **Step 1: Implement `lib/cohere.js`**

```js
import { CohereClient } from 'cohere-ai';

/**
 * @param {{apiKey: string, embedModel: string, rerankModel: string}} cfg
 */
export function createCohereClient({ apiKey, embedModel, rerankModel }) {
  if (!apiKey) throw new Error('cohere: apiKey is required');
  if (!embedModel) throw new Error('cohere: embedModel is required');
  if (!rerankModel) throw new Error('cohere: rerankModel is required');
  const client = new CohereClient({ token: apiKey });

  return {
    /**
     * @param {string[]} texts
     * @param {"search_document"|"search_query"} inputType
     * @returns {Promise<{embeddings: number[][], usage: {tokens: number}}>}
     */
    async embed(texts, inputType) {
      if (!Array.isArray(texts) || texts.length === 0) {
        throw new Error('cohere.embed: texts must be a non-empty array');
      }
      const res = await client.v2.embed({
        texts,
        model: embedModel,
        inputType,
        embeddingTypes: ['float']
      });
      return {
        embeddings: res.embeddings.float,
        usage: { tokens: res.meta?.billedUnits?.inputTokens ?? 0 }
      };
    },

    /**
     * @param {string} query
     * @param {string[]} documents
     * @param {number} topN
     * @returns {Promise<{results: Array<{index: number, relevance_score: number}>}>}
     */
    async rerank(query, documents, topN) {
      const res = await client.v2.rerank({
        model: rerankModel,
        query,
        documents,
        topN
      });
      return {
        results: res.results.map(r => ({
          index: r.index,
          relevance_score: r.relevanceScore
        }))
      };
    }
  };
}
```

- [ ] **Step 2: Create stub for tests**

`rag/tests/_stubs/cohere-stub.js`:

```js
// Deterministic Cohere client stub — same contract as createCohereClient.
// Used by integration tests where we want to bypass real API.

const DIM = 1024; // matches embed-multilingual-v3.0

const hashToFloats = (text, dim = DIM) => {
  // Simple deterministic mapping: char codes → repeating float pattern.
  const out = new Array(dim);
  for (let i = 0; i < dim; i++) {
    out[i] = ((text.charCodeAt(i % text.length) || 0) / 255 - 0.5);
  }
  return out;
};

export function createCohereStub() {
  return {
    async embed(texts, _inputType) {
      return {
        embeddings: texts.map(t => hashToFloats(t)),
        usage: { tokens: texts.reduce((s, t) => s + t.length, 0) / 4 | 0 }
      };
    },
    async rerank(query, documents, topN) {
      // Score = lexical overlap with query; deterministic.
      const qWords = new Set(query.toLowerCase().split(/\s+/));
      const scored = documents.map((doc, index) => {
        const dWords = new Set(doc.toLowerCase().split(/\s+/));
        let overlap = 0;
        for (const w of qWords) if (dWords.has(w)) overlap++;
        return { index, relevance_score: overlap / Math.max(qWords.size, 1) };
      });
      scored.sort((a, b) => b.relevance_score - a.relevance_score);
      return { results: scored.slice(0, topN) };
    }
  };
}
```

- [ ] **Step 3: Smoke check `cohere.js` against real API (optional, network)**

```bash
cd proshop_mern/rag && node -e "
import('dotenv/config');
const { createCohereClient } = await import('./lib/cohere.js');
const c = createCohereClient({
  apiKey: process.env.COHERE_API_KEY,
  embedModel: process.env.COHERE_EMBED_MODEL,
  rerankModel: process.env.COHERE_RERANK_MODEL
});
const e = await c.embed(['hello world'], 'search_query');
console.log('embed dim:', e.embeddings[0].length, 'tokens:', e.usage.tokens);
const r = await c.rerank('paypal', ['stripe charges', 'paypal refund flow', 'apple pay'], 2);
console.log('rerank:', r.results);
" 2>&1 | head -10
```
Expected: `embed dim: 1024 tokens: ~5`, `rerank` returns 2 sorted entries with `paypal refund flow` first. If 401 — key wrong; if dim ≠ 1024 — wrong embed model.

- [ ] **Step 4: Commit**

```bash
git add proshop_mern/rag/lib/cohere.js proshop_mern/rag/tests/_stubs/cohere-stub.js
git commit -m "feat(rag): Cohere client factory + deterministic stub"
```

---

### Task 3.2: `lib/weaviate.js` — client + schema + CRUD primitives

**Files:**
- Create: `proshop_mern/rag/lib/weaviate.js`

- [ ] **Step 1: Implement `lib/weaviate.js`**

```js
import weaviate from 'weaviate-client';

const CLASS_NAME = 'ProshopDoc';

const SCHEMA = {
  class: CLASS_NAME,
  description: 'Chunks of proshop_mern documentation',
  vectorizer: 'none',
  vectorIndexType: 'hnsw',
  vectorIndexConfig: { distance: 'cosine' },
  invertedIndexConfig: { bm25: { b: 0.75, k1: 1.2 } },
  properties: [
    { name: 'content',      dataType: ['text'],   tokenization: 'word' },
    { name: 'source_file',  dataType: ['text'],   tokenization: 'field' },
    { name: 'doc_type',     dataType: ['text'],   tokenization: 'field' },
    { name: 'heading_path', dataType: ['text[]'] },
    { name: 'section',      dataType: ['text'] },
    { name: 'chunk_index',  dataType: ['int'] },
    { name: 'total_chunks', dataType: ['int'] },
    { name: 'sha1',         dataType: ['text'],   tokenization: 'field' },
    { name: 'char_count',   dataType: ['int'] },
    { name: 'token_count',  dataType: ['int'] },
    { name: 'ingested_at',  dataType: ['date'] }
  ]
};

export async function connect({ host, httpPort, grpcPort }) {
  return weaviate.connectToLocal({
    host,
    port: httpPort,
    grpcPort
  });
}

export async function ensureSchema(client) {
  const exists = await client.collections.exists(CLASS_NAME);
  if (exists) return { created: false };
  await client.collections.createFromSchema(SCHEMA);
  return { created: true };
}

export async function deleteBySource(client, sourceFile) {
  const col = client.collections.get(CLASS_NAME);
  await col.data.deleteMany(col.filter.byProperty('source_file').equal(sourceFile));
}

export async function listShasBySource(client, sourceFile) {
  const col = client.collections.get(CLASS_NAME);
  const res = await col.query.fetchObjects({
    filters: col.filter.byProperty('source_file').equal(sourceFile),
    returnProperties: ['sha1'],
    limit: 1000
  });
  return new Set(res.objects.map(o => o.properties.sha1));
}

export async function batchInsert(client, items) {
  const col = client.collections.get(CLASS_NAME);
  const result = await col.data.insertMany(items.map(it => ({
    properties: {
      content:      it.content,
      source_file:  it.source_file,
      doc_type:     it.doc_type,
      heading_path: it.heading_path,
      section:      it.section,
      chunk_index:  it.chunk_index,
      total_chunks: it.total_chunks,
      sha1:         it.sha1,
      char_count:   it.char_count,
      token_count:  it.token_count,
      ingested_at:  it.ingested_at
    },
    vectors: it.vector
  })));
  return result;
}

export async function countAll(client) {
  const col = client.collections.get(CLASS_NAME);
  const agg = await col.aggregate.overAll();
  return agg.totalCount;
}

export async function dropClass(client) {
  await client.collections.delete(CLASS_NAME);
}

export const CLASS = CLASS_NAME;
```

- [ ] **Step 2: Smoke test against running Weaviate**

```bash
cd proshop_mern/rag && node -e "
import 'dotenv/config';
import * as wv from './lib/weaviate.js';
const c = await wv.connect({
  host: process.env.WEAVIATE_HOST || 'localhost',
  httpPort: +process.env.WEAVIATE_HTTP_PORT || 8080,
  grpcPort: +process.env.WEAVIATE_GRPC_PORT || 50051
});
const r1 = await wv.ensureSchema(c);
console.log('ensureSchema:', r1);
const r2 = await wv.ensureSchema(c);
console.log('ensureSchema (2nd):', r2, '(should be {created:false})');
const count = await wv.countAll(c);
console.log('count:', count);
"
```
Expected: first call `{created:true}`, second `{created:false}`, count `0`. If connection refused → `npm run weaviate:up` first.

- [ ] **Step 3: Commit**

```bash
git add proshop_mern/rag/lib/weaviate.js
git commit -m "feat(rag): Weaviate client wrapper (schema + CRUD primitives)"
```

---

## Chunks 2–3 review checkpoint

After completing Tasks 2.1–2.3 and 3.1–3.2, run all unit tests:
```bash
cd proshop_mern/rag && npm run test:unit
```
Expected: 20+ passes, 0 fails. Then dispatch reviewer for Chunks 2–3.

---

(Chunks 4–5 to be added next.)
