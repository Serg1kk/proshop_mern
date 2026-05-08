# proshop-mcp-search-docs

MCP server exposing hybrid semantic search over `proshop_mern` documentation to AI coding assistants (Claude Code, Cursor, Codex).

## What it does

Exposes one tool — `search_project_docs(query, top_k=5)` — that performs hybrid BM25+vector retrieval over the `ProshopDoc` Weaviate collection, then reranks results with Cohere. Returns a ranked list of documentation chunks with source paths, breadcrumb headings, relevance scores, and ~200-char snippets.

## Prerequisites

1. `proshop_mern/.env` must contain:
   - `COHERE_API_KEY=<your-key>`
   - `COHERE_EMBED_MODEL=embed-multilingual-v3.0` (or another Cohere v3 embed model)
   - `COHERE_RERANK_MODEL=rerank-multilingual-v3.0` (or another Cohere rerank model)

2. Weaviate is running locally:
   ```bash
   npm run weaviate:up          # from proshop_mern root
   ```

3. The corpus is ingested into the `ProshopDoc` collection:
   ```bash
   npm run rag:ingest           # from proshop_mern root
   ```

## Install

```bash
cd mcp-search-docs
npm install
```

## Test from CLI

```bash
node server.js
```

You should see on stderr:
```
proshop-search-docs ready, ProshopDoc has N chunks
```

The server then waits for JSON-RPC messages on stdin (normal MCP behavior — it does not exit).

## Smoke test

```bash
cd mcp-search-docs && (
  echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}'
  echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'
  echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"search_project_docs","arguments":{"query":"how to seed the database","top_k":3}}}'
  sleep 5
) | node server.js 2>/dev/null
```

Expected: 3 JSON-RPC responses; the `tools/call` response should include `db-seed-and-reset.md` in at least one chunk's `source_file`.

## Register in Claude Code

Add to your project `.mcp.json` (or `~/.claude/mcp.json` for global registration):

```json
{
  "mcpServers": {
    "proshop-search-docs": {
      "command": "node",
      "args": ["/Users/serg1kk/Local Documents /ProdfeatAI Brand/AI Courses/Hard&Soft Skills - aidev l1/proshop_mern/mcp-search-docs/server.js"]
    }
  }
}
```

Replace the path with the absolute path on your machine.

## Tool reference

### `search_project_docs`

| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| `query` | string | yes | — | Natural-language query, e.g. `"how to seed the database"` |
| `top_k` | integer | no | 5 | 1–20. Use 3-5 for specific questions, 10-20 for exploratory. |

**Returns:** JSON array of chunks, each with:

```jsonc
{
  "source_file": "docs/runbooks/db-seed-and-reset.md",
  "file_path": "docs/runbooks/db-seed-and-reset.md",   // alias
  "title": "Seed the database",                          // last heading breadcrumb
  "parent_headings": ["Runbooks"],                       // ancestor headings
  "score": 0.94,                                         // 0–1, higher = more relevant
  "snippet": "Run npm run data:import from the repo root..."  // ~200 chars of body text
}
```

Use `snippet` to decide relevance; use `source_file` with `Read` to load the full document when needed.

## Architecture

```
Claude Code / Cursor
       │  JSON-RPC over stdio
       ▼
mcp-search-docs/server.js
       │
       ├── ../rag/lib/cohere.js   → embed query + rerank
       └── ../rag/lib/weaviate.js → hybrid BM25+vector retrieval
               │
               └── Weaviate :8080/:50051  (ProshopDoc collection)
```
