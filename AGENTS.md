# AGENTS.md

## System Prompt

You are working in `proshop_mern`, a legacy MERN e-commerce application forked from
Brad Traversy's deprecated ProShop course project.

Your job is to make focused, low-risk changes that keep the project runnable locally.
Prefer surgical fixes over broad rewrites unless the user explicitly asks for
modernization.

## Project Context

- Backend: Node.js + Express 4 + Mongoose 5, ES modules (`"type": "module"`), code in `backend/`
- Frontend: Create React App, React 16, Redux + thunk, React Router v5, code in `frontend/`
- Static uploads are served from `uploads/` at the repo root
- The upstream project is deprecated — prioritize compatibility and maintainability
  over introducing new architecture

## Local Runbook

Use these commands from the repository root:

```bash
npm run mongo:up         # start local MongoDB 7 via docker-compose
npm run data:import      # seed sample users + products (wipes DB first)
npm run dev              # backend (5001) + frontend (3000) concurrently
```

Useful single-service commands:

```bash
npm run server           # backend only, nodemon with --legacy-watch
npm run client           # frontend only, CRA dev server
npm run data:destroy     # wipe products/users/orders
npm run data:import-extra  # optional: larger product catalogue from Unsplash seed
npm run mongo:down       # stop docker mongo
```

## Local Environment Assumptions

- Root `.env` is the source of truth for backend runtime values
- Local backend port is `5001` (not 5000 — that port often collides on macOS)
- Frontend dev server runs on `127.0.0.1:3000`
- Frontend proxy (in `frontend/package.json`) targets `http://127.0.0.1:5001`
- Local MongoDB URI is `mongodb://localhost:27017/proshop`
- Docker Compose is available for MongoDB via `docker-compose.yml`
- `PAYPAL_CLIENT_ID=sb` is the sandbox value for local dev — safe to commit as default in `.env.example`

## Known Gotchas

- Frontend uses old `react-scripts@3.4` / webpack 4, which needs
  `NODE_OPTIONS=--openssl-legacy-provider` on Node 17+. The `client` and
  `heroku-postbuild` scripts already set it — **do not remove** unless you are
  intentionally upgrading the frontend toolchain.
- Backend `nodemon` uses `--legacy-watch` because fsevents can miss changes in
  paths containing spaces (this repo path has a space).
- If the UI shows `Request failed with status code 500` for products/search,
  first check that MongoDB is running and sample data has been imported.
- Mongoose 5 ignores unknown query operators silently — do not trust absence of
  errors when changing query shape; verify results in the response.
- `uploads/` is served statically; uploaded files persist across restarts.

## Unwritten Rules (team conventions)

These are not inferrable from the code — keep them explicit here:

- **Preserve behavior** on refactors. The upstream is deprecated and has no
  test suite; if you change observable output, write a characterization test first.
- **Commit style:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`,
  `refactor:`) and a scope when useful: `fix(orderController): ...`.
  Avoid `wip`, `update`, `..`, and multi-purpose commits.
- **After adding a new Mongoose model**, update `backend/seeder.js` so fresh
  `npm run data:import` leaves the DB in a complete state.
- **Do not touch `Procfile`** — it is legacy Heroku deployment config. The repo
  is no longer deployed there; removing it is out of scope.
- **Never commit `.env`.** `.env.example` is the canonical list of variables.
  If you add a new `process.env.*` lookup in code, add it to `.env.example`.
- **Bootstrap is pinned** — the frontend bundles `frontend/src/bootstrap.min.css`
  rather than depending on the npm package. Leave it alone unless migrating
  the UI framework wholesale.

## Preferred Change Strategy

- Preserve existing behavior and routes unless the user asks for a product change
- Keep the current stack unless a migration is explicitly requested
- Favor small, readable edits over introducing abstractions
- Match the existing coding style in surrounding files (single quotes, no
  semicolons in JSX, 2-space indent, trailing commas)
- Be careful around old package versions; compatibility fixes are usually
  safer than version bumps

## Verification Checklist

After making changes, verify the smallest relevant slice:

- Backend-only changes: hit the affected API route directly with `curl` or
  the frontend, and watch the server log for stack traces
- Frontend-only changes: check the page in the dev server and watch the
  browser console plus CRA build warnings
- Data-layer changes: confirm MongoDB is up and reseed if the schema moved
- Cross-cutting changes: ensure `npm run dev` still starts cleanly

## High-Signal Paths

- Backend entry: `backend/server.js`
- DB connection: `backend/config/db.js`
- API routes: `backend/routes/`
- Controllers: `backend/controllers/`
- Auth middleware: `backend/middleware/authMiddleware.js`
- Error middleware: `backend/middleware/errorMiddleware.js`
- Frontend app shell: `frontend/src/App.js`
- Redux store: `frontend/src/store.js`
- Frontend screens: `frontend/src/screens/`
- Redux actions: `frontend/src/actions/`
- Redux reducers: `frontend/src/reducers/`

## What NOT to Do

- Don't bump Mongoose, React, or `react-scripts` casually — each is
  a coordinated migration that deserves its own ADR and characterization tests
- Don't add new `dotenv.config()` calls in library files; it is already
  invoked once in `backend/server.js` and `backend/seeder.js`
- Don't replace `asyncHandler` with raw `try/catch` on new controllers —
  match the surrounding pattern so the error middleware keeps working
- Don't introduce a second state manager or bring in Redux Toolkit unless
  the user explicitly asks; the v2 repo already did that migration

## When In Doubt

Get the app running locally → reproduce the issue → patch the narrowest
possible layer → manually verify → commit with a conventional message.
