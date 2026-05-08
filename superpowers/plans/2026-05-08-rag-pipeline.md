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

- [ ] **Step 4: Install dependencies**

```bash
cd proshop_mern && npm run rag:install
```
Expected: lockfile created at `rag/package-lock.json`, `rag/node_modules/` populated. No errors. Warnings about peer deps are acceptable.

- [ ] **Step 5: Smoke check imports work**

```bash
cd proshop_mern/rag && node -e "
import('weaviate-client').then(m => console.log('weaviate:', typeof m.default));
import('cohere-ai').then(m => console.log('cohere:', typeof m.CohereClient));
import('unified').then(m => console.log('unified:', typeof m.unified));
"
```
Expected: 3 lines, none `undefined`. If any `undefined` — version mismatch; pin a known-working minor.

- [ ] **Step 6: Commit**

```bash
git add proshop_mern/rag/package.json proshop_mern/rag/package-lock.json proshop_mern/rag/.gitignore
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

- [ ] **Step 3: Confirm `rag/` scripts run (no-op)**

```bash
cd proshop_mern && node rag/ingest.js --help 2>&1 | head -5 || true
```
Expected: error like `Cannot find module 'rag/ingest.js'` or "is not a directory" — that's fine, this confirms the script entry point doesn't exist yet (will be created in Chunk 4). Move on.

- [ ] **Step 4: Confirm test runner is available**

```bash
cd proshop_mern/rag && npm test
```
Expected: `node --test` outputs "tests 0" or similar (no test files yet) — exit code 0 or "no tests found". This confirms the runner is discoverable.

---

## Chunk 1 review checkpoint

After completing Tasks 1.1–1.5, dispatch `plan-document-reviewer` for Chunk 1 sign-off before moving to Chunk 2.

---

(Chunks 2–5 to be added in subsequent iterations.)
