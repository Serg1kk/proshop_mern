# RAG Pipeline for proshop_mern Documentation — Design

**Status:** approved (brainstorm), pending implementation plan
**Date:** 2026-05-08
**Author:** Сергей Голубев (with Claude)
**Scope:** ingest service + search service for `proshop_mern/docs/`
**Implementation skill:** `superpowers:writing-plans` (next step)

---

## 1. Goal

Поднять локальный RAG-пайплайн над документацией `proshop_mern/docs/` (49 файлов, ~470 KB markdown + 1 JSON), чтобы:

- Кодинговый агент в IDE мог искать фрагменты документации через MCP-сервер (MCP — отдельный follow-up; этот спек только до HTTP API).
- Пайплайн соответствовал production-практикам RAG 2026: markdown-aware chunking, hybrid search (BM25 + dense + RRF), Cohere reranker, идемпотентный re-ingest, метаданные для фильтрации.

## 2. Non-goals

- Multi-tenancy / auth — local-only.
- Streaming response, multi-query rewriting, HyDE.
- CI / coverage badge — учебный проект, без CI-инфры.
- Anthropic Contextual Retrieval — оценили, отложили (компромисс через heading-prefix в content).
- Watcher / file-system events — корпус меняется руками.
- MCP-сервер — отдельный спек после стабилизации HTTP API.

## 3. Architecture

### 3.1 Repository layout

Новая папка `proshop_mern/rag/` рядом с `backend/`/`frontend/`, со своим `package.json`:

```
proshop_mern/
├── rag/
│   ├── package.json              # weaviate-client@3, cohere-ai@7, gray-matter, remark-parse, express, dotenv, glob, tiktoken
│   ├── lib/
│   │   ├── chunker.js            # markdown → chunks (markdown-aware)
│   │   ├── metadata.js           # doc_type detection, heading_path, sha1
│   │   ├── weaviate.js           # client + ensureSchema()
│   │   ├── cohere.js             # embed + rerank wrappers, factory для тестов
│   │   └── search.js             # core hybrid+rerank function (used by HTTP and tests)
│   ├── ingest.js                 # CLI: walk docs/, chunk, dedup, embed, upsert
│   ├── server.js                 # Express :5002, POST /search, POST /reindex, GET /health
│   └── tests/
│       ├── fixtures/             # минимальные .md примеры + sample-corpus/
│       ├── chunker.test.js       # unit, no network
│       ├── metadata.test.js      # unit
│       ├── search.test.js        # integration, требует Weaviate
│       └── server.test.js        # HTTP smoke
└── docker-compose.yml            # ⊕ service `weaviate` рядом с существующим `mongo`
```

### 3.2 Data flow

```
docs/**/*.md + docs/features.json
        │
        ▼
   ingest.js ── chunker ── cohere.embed (input_type=search_document)
                                │
                                ▼
                          weaviate (upsert по source_file)

   POST /search ── server.js ── search.js
                                  │
                                  ├── cohere.embed (input_type=search_query)
                                  ├── weaviate.hybrid (BM25 + dense + RRF, top-25)
                                  └── cohere.rerank → top-K (default 5)
```

### 3.3 Ports

- `27017` — mongo (существующий)
- `5001` — backend (существующий)
- `5002` — RAG search server (новый, `RAG_PORT` env-override)
- `8080` — Weaviate REST/GraphQL (новый)
- `50051` — Weaviate gRPC (новый, v3 client использует для batch)

Без коллизий с CRA dev server (3000) и backend.

## 4. Configuration

### 4.1 Environment variables

В `proshop_mern/.env` (gitignored) и `proshop_mern/.env.example` (template):

```
# Cohere — для embeddings и reranker (один ключ на оба endpoint'а)
COHERE_API_KEY=<cohere_api_key>
COHERE_EMBED_MODEL=embed-multilingual-v3.0
COHERE_RERANK_MODEL=rerank-multilingual-v3.0

# RAG search server
RAG_PORT=5002
RAG_ALLOW_REINDEX=false                # safety flag для POST /reindex

# Weaviate
WEAVIATE_HOST=localhost
WEAVIATE_HTTP_PORT=8080
WEAVIATE_GRPC_PORT=50051
```

### 4.2 npm-скрипты (в корневой `package.json`)

Добавляются рядом с существующими `mongo:up`/`mongo:down`/`data:import`:

```json
"weaviate:up": "docker compose up -d weaviate",
"weaviate:down": "docker compose stop weaviate",
"rag:install": "npm install --prefix rag",
"rag:ingest": "node rag/ingest.js",
"rag:server": "node rag/server.js"
```

## 5. Docker — Weaviate service

Дописываем в существующий `docker-compose.yml`:

```yaml
services:
  mongo:
    # … существующий блок, не трогаем

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

**Решение: `DEFAULT_VECTORIZER_MODULE=none`** (вместо `text2vec-cohere`):
- Полный контроль над текстом, отправляемым в embedding (heading-prefix).
- Один Cohere SDK — проще тестировать и мокать.
- Independence от Weaviate-модуля и его конфига.

## 6. Weaviate schema

Один class `ProshopDoc`. Маленький корпус (~200 чанков), фильтрация по `doc_type` через `where` решает все юзкейсы.

```js
{
  class: "ProshopDoc",
  description: "Chunks of proshop_mern documentation",
  vectorizer: "none",
  vectorIndexType: "hnsw",
  vectorIndexConfig: { distance: "cosine" },
  invertedIndexConfig: {
    bm25: { b: 0.75, k1: 1.2 }
  },
  properties: [
    { name: "content",       dataType: ["text"], tokenization: "word" },
    { name: "source_file",   dataType: ["text"], tokenization: "field" },
    { name: "doc_type",      dataType: ["text"], tokenization: "field" },
    { name: "heading_path",  dataType: ["text[]"] },
    { name: "section",       dataType: ["text"] },
    { name: "chunk_index",   dataType: ["int"] },
    { name: "total_chunks",  dataType: ["int"] },
    { name: "sha1",          dataType: ["text"], tokenization: "field" },
    { name: "char_count",    dataType: ["int"] },
    { name: "token_count",   dataType: ["int"] },
    { name: "ingested_at",   dataType: ["date"] }
  ]
}
```

Bootstrap через `ensureSchema()` в `rag/lib/weaviate.js` — идемпотентен, зовётся и из ingest, и из server.

## 7. Chunking

### 7.1 Стратегия (markdown-aware, двухуровневая)

1. **Парсинг markdown в AST** через `remark-parse`.
2. **Резка по H2** — каждая `## Section` (вместе с её H3-подсекциями) — кандидат-чанк.
3. **Если кандидат > 512 токенов** — recursive split внутри по абзацам → предложениям; target **400 токенов с overlap 80** (≈20%).
4. **Если кандидат < 200 токенов** (`min_chunk_size` per FloTorch lesson) — мерджим с соседней секцией того же H1.
5. **Файлы без H2** (короткие `pages/*.md`) — весь файл = один чанк.
6. **Подсчёт токенов** через `tiktoken` (`cl100k_base`); разница с Cohere-токенизацией ≤10%, приемлемо.

### 7.2 Heading-prefix в content

В `content` чанка кладём префикс из заголовков:

```
# Deploy
## Heroku
### Buildpacks

<тело секции>
```

Это даёт embedding-модели контекст без отдельного Contextual Retrieval — почти бесплатный компромисс.

### 7.3 Метаданные на чанк

```js
{
  source_file: "docs/runbooks/deploy.md",
  doc_type: "runbook",
  heading_path: ["Deploy", "Heroku", "Buildpacks"],
  section: "Heroku > Buildpacks",
  chunk_index: 3,
  total_chunks: 12,
  sha1: "a3f5c8d2…",
  char_count: 1843,
  token_count: 412,
  ingested_at: "2026-05-08T17:00:00Z"
}
```

### 7.4 doc_type mapping

По пути относительно `proshop_mern/`:
- `docs/adr/*` → `adr`
- `docs/api/*` → `api`
- `docs/features/*` → `feature`
- `docs/incidents/*` → `incident`
- `docs/pages/*` → `page`
- `docs/runbooks/*` → `runbook`
- `docs/*.md` (root: architecture, best-practices, glossary, etc.) → `reference`
- `docs/features.json` → `feature_spec`

### 7.5 Ingest exclusions

**Исключаем из ingest:**
- `docs/superpowers/**` — этот спек и будущие spec/plan документы (метадокументация, не рантайм-знания).

### 7.6 features.json — synthetic markdown

JSON раскладываем в синтетический markdown по элементам:

```md
## <feature.id>
<feature.description>

**Status:** <status>
**Owner:** <owner>
…
```

`heading_path: ["features", "<id>"]`.

## 8. Ingest pipeline

### 8.1 CLI

```
node rag/ingest.js [--file=path] [--dry-run] [--reset] [--filter=doc_type=runbook]
```

### 8.2 Поток

```
1. ensureSchema()                              # создаст ProshopDoc если нет
2. Читаем все docs/**/*.md + docs/features.json (с учётом 7.5 exclusions)
3. Для каждого файла:
   a. Парсим markdown в AST
   b. Чанкер → массив чанков
   c. Heading-prefix к content
   d. sha1(content) → если все sha1 файла уже в Weaviate — skip файл
4. Собираем новые чанки в batch
5. Cohere embed batch (≤96 за запрос — лимит API)
   - input_type: "search_document"
   - retry exponential backoff на 429/5xx (3 попытки)
6. Для каждого изменённого файла:
   a. DELETE FROM ProshopDoc WHERE source_file = X
   b. Batch insert новых чанков (vector + properties)
7. Отчёт в stdout: added/skipped/deleted, токены, $-оценка
```

### 8.3 Идемпотентность

- `sha1(content)` per chunk — ключ дедупа.
- На каждый изменённый файл: `delete WHERE source_file = X` → insert новых. Покрывает rename/delete/edit.
- Record Manager паттерн избыточен для 49 файлов.

### 8.4 Rate limits

- Cohere trial 100 RPM, prod 10K RPM. Между батчами `sleep(50)` — безопасно.
- Retry exponential backoff на 429/5xx, max 3 попытки.

### 8.5 Cost estimate

- ~470 KB текста + heading prefix ≈ 130K токенов.
- `embed-multilingual-v3.0`: $0.10/1M input → **~$0.013 за полный rebuild**.
- Re-ingest изменённого файла — копейки.

### 8.6 Логирование

Stdout с цветами (`colors` уже в зависимостях проекта):

```
✓ docs/runbooks/deploy.md            12 chunks, 4.2K tokens
✓ docs/architecture.md               18 chunks, 7.8K tokens
- docs/glossary.md                   skipped (unchanged)
…
Total: 187 chunks added, 24 skipped, 0 deleted. ~28K tokens. ~$0.003
```

## 9. Search service

### 9.1 HTTP API

**`POST /search`**

Request:
```json
{
  "query": "how do I rotate the JWT secret",
  "top_k": 5,
  "filters": {
    "doc_type": ["runbook", "incident"],
    "source_file": "docs/runbooks/deploy.md"
  },
  "rerank": true
}
```

Defaults: `top_k=5` (clamp max 20), `rerank=true`, `filters` optional.

Response:
```json
{
  "query": "...",
  "results": [
    {
      "content": "...",
      "source_file": "docs/incidents/i-003-jwt-secret-leak.md",
      "section": "Postmortem > Mitigation",
      "heading_path": ["JWT Secret Leak", "Postmortem", "Mitigation"],
      "chunk_index": 4,
      "total_chunks": 9,
      "score_hybrid": 0.81,
      "score_rerank": 0.94
    }
  ],
  "stats": {
    "retrieval_ms": 42,
    "rerank_ms": 138,
    "total_ms": 180,
    "candidates_retrieved": 25,
    "candidates_returned": 5
  }
}
```

**`POST /reindex`** — программный триггер `ingest.js`. Опциональный body `{ "file": "...", "reset": false }`. Защита: `RAG_ALLOW_REINDEX=true` обязателен, иначе 403.

**`GET /health`** — `{ status: "ok", weaviate: "connected", chunks_total: 187 }`.

### 9.2 Search core (rag/lib/search.js)

```
1. cohere.embed(query, input_type="search_query") → query_vector
2. weaviate.collections.get("ProshopDoc").query.hybrid({
     query,
     vector: query_vector,
     alpha: 0.5,                     // 0.5 = равный вес BM25/dense
     fusionType: "rankedFusion",     // RRF
     limit: 25,                      // 5× top_k — запас для rerank
     filters: <weaviate filter>,
     returnMetadata: ["score", "explainScore"]
   })
3. Если rerank=true:
   cohere.rerank({
     model: process.env.COHERE_RERANK_MODEL,
     query,
     documents: candidates.map(c => c.content),
     top_n: top_k
   })
   → reorder, attach score_rerank
4. Slice top_k → format response
```

### 9.3 Параметры по умолчанию

- `alpha=0.5` — equal weight BM25/dense (guide-recommendation для смешанных запросов).
- `limit=25` — 5× top_k, даёт reranker'у запас.
- `fusionType=rankedFusion` — Weaviate's native RRF.

## 10. Testing

### 10.1 Test runner

`node --test` (Node 18+ built-in) + `assert/strict`. Без Jest/Mocha.

### 10.2 Что покрываем

**`chunker.test.js` (unit, no network):**
Фикстуры в `rag/tests/fixtures/`:
- `simple-h2.md` — 2 H2 в пределах лимита → 2 чанка.
- `large-section.md` — H2 на 1500 токенов → 3 чанка с overlap.
- `tiny-section.md` — H2 на 80 токенов → мерджится с соседом.
- `no-headings.md` — короткий файл → 1 чанк.
- `nested.md` — H1>H2>H3 — `heading_path` и префикс.
- `features.json` (мини) — JSON→synthetic markdown.

Проверяем `{heading_path, token_count, chunk_index}` snapshot, content по first/last 50 chars.

**`metadata.test.js` (unit):**
- `detectDocType()` — все 8 веток.
- `sha1()` — детерминированность.
- `buildHeadingPath()` — корректность для вложенных AST-нод.

**`search.test.js` (integration, требует Weaviate):**
Pre-condition: `npm run weaviate:up && node rag/ingest.js --file=rag/tests/fixtures/sample-corpus/`.
- Hybrid retrieval ≥1 результат на known-good query.
- `filters.doc_type` фильтрует.
- `rerank=true` vs `rerank=false` — оба валидны.
- Edge cases: пустой query → 400, top_k>20 → clamp 20.

**`server.test.js` (HTTP smoke):**
- `GET /health` → 200.
- `POST /search` без body → 400.
- `POST /reindex` без флага → 403.

### 10.3 Mocking

- **Cohere SDK** — мокается на уровне `rag/lib/cohere.js` (factory `createCohereClient()`); в тестах подменяется stub'ом, возвращающим детерминированные векторы и фиксированный rerank-порядок.
- **Weaviate** — НЕ мокаем; integration-тесты идут против реального контейнера.

### 10.4 Manual verification (перед коммитом)

```bash
npm run weaviate:up
npm run rag:install
npm run rag:ingest                     # отчёт показывает ~150-250 чанков
npm run rag:server &
curl -s localhost:5002/health | jq .
curl -s localhost:5002/search \
  -H 'Content-Type: application/json' \
  -d '{"query":"how to seed the database","top_k":3}' | jq '.results[].source_file'
# expect: docs/runbooks/db-seed-and-reset.md в топе
```

## 11. Open questions / Follow-ups

- MCP-сервер поверх HTTP API — отдельный спек после стабилизации.
- Если retrieval окажется слабым на реальных запросах — рассмотреть Anthropic Contextual Retrieval (LLM-сгенерированный контекст к каждому чанку перед embedding) или multi-query rewriting.
- Бенчмарки качества (precision@k, MRR на ручных eval-наборах) — follow-up после первого live-использования.
- Миграция на новые модели Cohere — изоляция через env-переменные позволит сделать `--reset` rebuild без правки кода.

## 12. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cohere rate limit (trial = 100 RPM) | low | medium | Sleep 50ms между батчами + retry с backoff |
| Weaviate v3 client API ломает обратку | low | high | Pin version `^3.x.x`, lock через package-lock |
| Heading-prefix снижает retrieval на запросах без терминов из заголовков | medium | low | A/B сравнение в follow-up; легко отключить флагом в чанкере |
| Chunks с code blocks ломают tokenizer | low | low | Tiktoken работает с любым unicode; code-блоки остаются intact в content |
| Корпус превысит лимит embed batch (96) | low | low | Уже batched в ingest; для 200 чанков = 3 батча |

## 13. Acceptance criteria

- [ ] `docker-compose.yml` запускает Weaviate (`npm run weaviate:up` → healthy).
- [ ] `npm run rag:install && npm run rag:ingest` без ошибок индексирует все 49 файлов.
- [ ] `npm run rag:ingest` повторно — `skipped` для unchanged файлов.
- [ ] `GET /health` отвечает 200, показывает `chunks_total > 0`.
- [ ] `POST /search` на 3 known-good queries возвращает в топ-3 правильные `source_file`:
  - `"how do I rotate the JWT secret"` → `docs/incidents/i-003-jwt-secret-leak.md`
  - `"how to seed the database"` → `docs/runbooks/db-seed-and-reset.md`
  - `"why we picked PayPal over Stripe"` → `docs/adr/adr-004-paypal-vs-stripe.md`
- [ ] `node --test rag/tests/` все green.
- [ ] `.env.example` обновлён всеми новыми переменными.
- [ ] Cost полного rebuild подтверждён ≤ $0.05 (печатается в отчёте ingest).
