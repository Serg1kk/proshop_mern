# M2 — Report

## IDE

- **Primary:** Claude Code → `AGENTS.md` (132 lines). `CLAUDE.md` is a
  symlink to `AGENTS.md` so the same file is the source of truth for any
  AGENTS-aware IDE (Codex CLI, Cursor, Copilot, Windsurf, Warp, …) and for
  Claude Code simultaneously.
- **Secondary:** none. No `.cursor/rules/`, no `.github/copilot-instructions.md`,
  no `.junie/`, no `GEMINI.md`, no `.windsurf/rules/` in the repo — no stale
  drafts to count against me.

## Launch confirmation

Запустил локально через `docker compose up -d mongo` → `npm install` (root +
`frontend/`) → `npm run data:import` → `npm run dev`. Бэкенд отвечает 200 на
`http://localhost:5001/api/products`, фронт на `http://127.0.0.1:3000/` — снял
подтверждение `curl` после каждого коммита, всё живо. Порт бэка намеренно 5001
(на macOS 5000 часто отъедает Control Center — это уже закодировано в
`.env.example` и прокси `frontend/package.json`).

## Rules diff — что я добавил руками поверх auto-generated

AI-автоген собрал три четверти файла (стек, команды, пути) нормально. Дальше
руками:

- **Unwritten rule block** — Conventional Commits как норма; после новой
  Mongoose-модели обновить `backend/seeder.js`; `bootstrap.min.css` не
  трогаем; `Procfile` legacy, не чистим — AI не мог это инферить из кода.
- **Секция «What NOT to Do»** — запрет на casual-bump Mongoose/React/CRA,
  запрет на дубль `dotenv.config()` в библиотеках, запрет на замену
  `express-async-handler` raw-try/catch'ем. Это типичные ошибки, которые
  AI делает сам, если его не остановить.
- **Local env gotchas** — PORT=5001 (не 5000), `--legacy-watch` nodemon из-за
  пробела в пути репо, `NODE_OPTIONS=--openssl-legacy-provider` для webpack 4
  на Node 22, `PAYPAL_CLIENT_ID=sb` как публичный sandbox. Пока руками
  не запустишь — этих правил не увидишь.

## FINDINGS.md — кратко

Шесть находок (5 реальных + 1 косметика). Исправил **#1 🔴 critical**:
`POST /api/upload` был публично открыт, без лимитов, без allow-list расширений.
Прикрыл `protect + admin`, `multer({ limits: { fileSize: 2 MiB } })`,
allow-list `.jpg/.jpeg/.png`, прокинул Bearer-токен из фронта — коммит
`58e39e1`. `curl` без авторизации теперь возвращает 401; админский upload в
`ProductEditScreen` по-прежнему работает.

Остальные пять (ReDoS в `$regex` поиске, undefined-слипается через guard
`orderController`, утечка bcrypt-хэшей в `getUsers`, Mongoose 4 мажора позади,
localStorage без try/catch) — задокументированы с рецептом фикса, но намеренно
не трогал: ADR-0002 объясняет, почему bulk-апгрейд Mongoose без тестов вреднее,
чем выжидание.

## NICE-TO-HAVE

- **NH-1 Mermaid** — `docs/architecture.md`: C4-container, sequence (happy-path
  checkout), ERD. На GitHub блоки рендерятся как картинки.
- **NH-2 ADR × 3** — `docs/adr/0001…0003.md`: JWT в localStorage (HIGH
  confidence), пин Mongoose 5 (MEDIUM), Procfile без деплоя (LOW).

## Три вопроса

- **Сколько бы заняло вручную?** Rules-файл ~1 ч, README + `.env.example` ~1.5 ч,
  code-review на 5 находок с объяснениями — ещё ~2 ч, фикс upload-endpoint
  (включая вытаскивание токена на фронте) — ~45 мин, ADR × 3 + Mermaid — час.
  Итого **6–7 часов**. С AI-IDE ушло ~90 минут, из них половина — вдумчивое
  чтение автогена и ловля галлюцинаций.
- **Самая магическая штука IDE.** Batch-поиск по кодовой базе: один промпт
  «найди hotspots / edge cases / outdated deps / hardcoded values» — и я сразу
  получил черновик FINDINGS.md, в который нужно было только вчитаться и
  выкинуть дубли. Ручной поиск тех же проблем по папке `backend/controllers`
  и `frontend/src/actions` дал бы тот же список за сильно большее время.
- **Где AI сломал и как пофиксил.** В первом заходе он добавил `protect, admin`
  на `/api/upload`, но забыл обновить фронт — `ProductEditScreen.uploadFileHandler`
  не отправлял `Authorization`. Поймал curl'ом (401 на фронт-вызове после
  прогона), подтянул `userInfo.token` из Redux-store прямо в axios config
  админ-формы. Тот же механизм уже использовался в `productActions.updateProduct`,
  так что паттерн был под рукой.

## M3

### Feature flags MCP

Задача: проверить состояние `search_v2`, при необходимости перевести в
`Testing`, выставить трафик 25%, подтвердить финал. Прогон через локальный
MCP-сервер `feature-flags` (project-scoped `.mcp.json`, stdio,
`mcp/.venv/bin/python mcp/feature_flags_server.py`).

**Шаг 1 — read current state.**

Tool call:

```
get_feature_info(feature_name="search_v2")
```

MCP response:

```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 15,
  "last_modified": "2026-03-10",
  "depends_on": [],
  "dependencies_state": []
}
```

**Шаг 2 — set_feature_state пропущен.**

Условие задачи: «Если она в статусе `Disabled` — переведи в `Testing`».
Фактический статус — `Testing`, поэтому `set_feature_state` не вызывался.
Лишний вызов сломал бы канонический rollout: `set_feature_state(_, "Testing")`
по контракту сервера сбрасывает `traffic_percentage` до дефолта 10, если
текущее значение вне диапазона 1..99 (а у нас валидные 15 — но мы всё равно
теряем точность намерения «не трогай статус»). Поэтому шаг сознательно
пропущен.

**Шаг 3 — adjust traffic to 25%.**

Tool call:

```
adjust_traffic_rollout(feature_name="search_v2", percentage=25)
```

MCP response:

```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-08",
  "depends_on": [],
  "dependencies_state": []
}
```

`last_modified` обновился с `2026-03-10` на `2026-05-08`, status не тронут,
traffic переписан с 15% на 25%. Запись в `backend/features.json` атомарная
(temp + rename) — сервер так оформлен, чтобы concurrent-чтение через
`GET /api/feature-flags` не увидело torn write.

**Шаг 4 — confirm final state.**

Повторный read для подтверждения:

```
get_feature_info(feature_name="search_v2")
```

MCP response:

```json
{
  "feature_id": "search_v2",
  "name": "New Search Algorithm",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-08",
  "depends_on": [],
  "dependencies_state": []
}
```

**Итог:** `search_v2` → `status=Testing`, `traffic_percentage=25`,
`last_modified=2026-05-08`, без зависимостей. Изменение видно немедленно
через `GET /api/feature-flags` без рестарта бэка — backend читает
`features.json` на каждый запрос.

### End-to-end

Задача: через два MCP (`search-docs` + `feature-flags`) найти фичу
`semantic_search` в документации, проверить её состояние и зависимости,
условно перевести в `Testing` 25%, процитировать назначение из спеки.

**Шаг 1 — search-docs MCP: что это за фича и от чего зависит.**

Tool call:

```
search_project_docs(query="semantic_search feature dependencies vector search embeddings", top_k=8)
```

Top-результаты ранжированы по `score` (BM25 + vector + Cohere rerank).
Релевантные чанки — все из `docs/feature-flags-spec.md`:

| score   | source_file              | section                                          |
|---------|--------------------------|--------------------------------------------------|
| 0.9978  | docs/feature-flags-spec.md | §3 Tool Contract → set_feature_state (пример с `semantic_search`) |
| 0.9963  | docs/feature-flags-spec.md | §3 Tool Contract → set_feature_state (signature) |
| 0.9948  | docs/feature-flags-spec.md | §4 Catalog → `search_v2` (зависимость)           |
| 0.0129  | docs/feature-flags-spec.md | §5 Rollout Strategies → Canary Deployment        |
| 0.0023  | docs/feature-flags-spec.md | §2 Status Semantics                              |

Из метаданных (`source_file=docs/feature-flags-spec.md`) и snippet'ов видно:
файл-первоисточник один. Для извлечения секции `semantic_search` целиком
сделал точечный grep по строке 321 в найденном файле — это разрешённый
fallback, когда vector-поиск показал нужный файл, но не нужный заголовок.

Извлечённая запись каталога (`docs/feature-flags-spec.md:321-330`):

```
#### `semantic_search` — Semantic Vector Search
Default state: Disabled

Extends `search_v2` with embedding-based retrieval. Product embeddings are
pre-computed and stored; at query time, the user's search string is embedded
and matched by cosine similarity. Dramatically improves discoverability for
natural-language queries ("something warm to wear for a hike") that keyword
search cannot handle.

System impact: New embedding pipeline (background job), vector index on
Product collection, extended productController search endpoint. High
infrastructure cost — requires GPU or embedding API budget.

Typical rollout: Internal only → 5% beta → 25% after precision metrics
validation.

Dependencies: search_v2 must be "Enabled" first. If search_v2 is still in
Testing, semantic search results and keyword results will be inconsistent
across user sessions.
```

**Зависимости (по docs):** `semantic_search` → `search_v2` (должна быть
`Enabled`; иначе результаты непоследовательны между сессиями — это
warning, не hard-block).

**Шаг 2 — feature-flags MCP: текущее состояние.**

Tool call:

```
get_feature_info(feature_name="semantic_search")
```

MCP response:

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Disabled",
  "traffic_percentage": 0,
  "last_modified": "2026-02-14",
  "depends_on": ["search_v2"],
  "dependencies_state": [
    {
      "feature_id": "search_v2",
      "name": "New Search Algorithm",
      "status": "Testing",
      "traffic_percentage": 25
    }
  ]
}
```

**Decision matrix (условие задачи):**

| Проверка                          | Значение  | Pass? |
|-----------------------------------|-----------|-------|
| `semantic_search.status == Disabled` | Disabled  | ✅    |
| Все зависимости НЕ в Disabled        | search_v2 = Testing | ✅    |

Оба условия выполнены → переводим в `Testing` и поднимаем трафик до 25%.

> Замечание: docs (§4) формально требуют `search_v2 = Enabled`, но
> пользовательское правило мягче — "не Disabled". Идём по
> пользовательскому правилу; warning от MCP про неполное соответствие
> прилетает на следующем шаге и логируется ниже.

**Шаг 3 — set_feature_state: Disabled → Testing.**

Tool call:

```
set_feature_state(feature_name="semantic_search", state="Testing")
```

MCP response:

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Testing",
  "traffic_percentage": 10,
  "last_modified": "2026-05-08",
  "depends_on": ["search_v2"],
  "dependencies_state": [
    {
      "feature_id": "search_v2",
      "name": "New Search Algorithm",
      "status": "Testing",
      "traffic_percentage": 25
    }
  ],
  "warnings": [
    "Dependency 'search_v2' is in status 'Testing', not 'Enabled'. semantic_search may not function correctly."
  ]
}
```

Сервер выставил каноничный default `traffic_percentage=10` для перехода в
`Testing` и пробросил предупреждение про `search_v2` — соответствует доке
(`Dependencies: search_v2 must be "Enabled" first`). Hard-block не
срабатывает: блокировка только когда зависимость `Disabled`.

**Шаг 4 — adjust_traffic_rollout: 10% → 25%.**

Tool call:

```
adjust_traffic_rollout(feature_name="semantic_search", percentage=25)
```

MCP response:

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-08",
  "depends_on": ["search_v2"],
  "dependencies_state": [
    {
      "feature_id": "search_v2",
      "name": "New Search Algorithm",
      "status": "Testing",
      "traffic_percentage": 25
    }
  ]
}
```

**Шаг 5 — confirm.**

Tool call:

```
get_feature_info(feature_name="semantic_search")
```

MCP response (финал):

```json
{
  "feature_id": "semantic_search",
  "name": "Semantic Vector Search",
  "status": "Testing",
  "traffic_percentage": 25,
  "last_modified": "2026-05-08",
  "depends_on": ["search_v2"],
  "dependencies_state": [
    {
      "feature_id": "search_v2",
      "name": "New Search Algorithm",
      "status": "Testing",
      "traffic_percentage": 25
    }
  ]
}
```

**Итоговое состояние фичи:** `semantic_search` →
`status=Testing`, `traffic_percentage=25`, `last_modified=2026-05-08`,
зависимость `search_v2` в `Testing` 25% (warning остаётся, пока
`search_v2` не доедет до `Enabled`).

**Зачем эта фича нужна — цитата из `docs/feature-flags-spec.md`
(§4 Catalog → Search & Discovery → `semantic_search`):**

> Extends `search_v2` with embedding-based retrieval. Product embeddings
> are pre-computed and stored; at query time, the user's search string is
> embedded and matched by cosine similarity. **Dramatically improves
> discoverability for natural-language queries ("something warm to wear
> for a hike") that keyword search cannot handle.**

**Цепочка tool calls (свод):**

1. `search_project_docs(query="semantic_search feature dependencies vector search embeddings", top_k=8)` — search-docs MCP, 8 чанков, top score 0.9978, все из `docs/feature-flags-spec.md`.
2. `get_feature_info(feature_name="semantic_search")` — feature-flags MCP, текущий статус `Disabled` (0%), зависимость `search_v2` в `Testing` 25%.
3. `set_feature_state(feature_name="semantic_search", state="Testing")` — переход в `Testing` (canonical default 10%), warning про `search_v2`.
4. `adjust_traffic_rollout(feature_name="semantic_search", percentage=25)` — трафик 10% → 25%.
5. `get_feature_info(feature_name="semantic_search")` — подтверждение: `Testing`, 25%, `last_modified=2026-05-08`.
