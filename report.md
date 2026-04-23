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
