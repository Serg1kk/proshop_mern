# ProShop — MERN e-commerce (M2 fork)

> Legacy MERN shopping cart app. This is a **course fork** of
> [bradtraversy/proshop_mern](https://github.com/bradtraversy/proshop_mern) used for
> the AI-IDE practicum in Module 2. The upstream is officially deprecated in
> favour of [proshop-v2](https://github.com/bradtraversy/proshop-v2) (Redux Toolkit);
> we keep the original intentionally "dirty" to have real onboarding problems to solve.

![screenshot](https://github.com/bradtraversy/proshop_mern/blob/master/uploads/Screen%20Shot%202020-09-29%20at%205.50.52%20PM.png)

## What it does

Classic storefront: product list with search + pagination, product detail with
reviews, cart saved in `localStorage`, login/register, checkout wizard
(shipping → payment → place order → PayPal sandbox), user profile with order
history, and an admin area for managing users, products, and orders.

## Tech stack

Versions come from the on-disk `package.json` files — these are deliberately old.

### Backend (`/`, runs in `backend/`)
- **Node.js** ≥ 16 (tested on Node 22, CRA proxy requires Node 14.6+)
- **Express** `^4.17.1`
- **Mongoose** `^5.10.6` (four majors behind — see FINDINGS.md)
- `express-async-handler` for controller error bubbling
- `jsonwebtoken` `^8.5.1`, `bcryptjs` for auth
- `multer` `^1.4.2` for image uploads
- `morgan`, `colors` for dev logging
- `nodemon` + `concurrently` for dev workflow
- ES modules (`"type": "module"`) — **use `.js` suffix on relative imports**

### Frontend (`frontend/`)
- **React** `16.13` with class-free components (Hooks + Redux)
- **react-scripts** `3.4` (webpack 4 — needs `NODE_OPTIONS=--openssl-legacy-provider` on Node 17+)
- **Redux** `^4.0.5` + `redux-thunk` + `redux-devtools-extension`
- **React Router** v5
- **React-Bootstrap** `^1.3.0` + bundled `bootstrap.min.css`
- `axios` for API calls
- `react-paypal-button-v2` for checkout

### Infra
- **MongoDB 7** via `docker-compose.yml` (or any local / Atlas instance)
- `Procfile` — legacy Heroku config, kept for historical reference, not used

## Repository layout

```
proshop_mern/
├── backend/
│   ├── config/db.js            # Mongoose connection
│   ├── controllers/            # route handlers (product / user / order)
│   ├── data/                   # seed data (users, products, unsplashImages)
│   ├── middleware/             # authMiddleware, errorMiddleware
│   ├── models/                 # Mongoose schemas
│   ├── routes/                 # Express routers mounted in server.js
│   ├── utils/                  # generateToken, …
│   ├── seeder.js               # `npm run data:import` / `data:destroy`
│   ├── seedExtra.js            # optional bigger catalogue (Unsplash images)
│   └── server.js               # entry point, reads .env, mounts API
├── frontend/
│   └── src/
│       ├── actions/            # Redux thunks
│       ├── components/         # presentational components
│       ├── constants/          # Redux action types
│       ├── reducers/
│       ├── screens/            # routed pages
│       ├── App.js              # Router + route definitions
│       ├── store.js            # Redux store
│       └── index.js            # CRA entry
├── uploads/                    # multer drop-zone (served at /uploads)
├── docker-compose.yml          # mongo:7 on :27017
├── .env.example                # copy → .env and fill in
├── AGENTS.md                   # rules for AI IDEs (Codex/Cursor/Copilot/…)
├── CLAUDE.md                   # symlink → AGENTS.md (Claude Code reads this name)
├── FINDINGS.md                 # code-review notes + fix log
└── docs/
    ├── architecture.md         # Mermaid C4-container diagram
    └── adr/                    # architecture decision records
```

## Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| Node.js | 16.x – 22.x | Works on modern Node thanks to `--openssl-legacy-provider` |
| npm | ≥ 8 | Shipped with Node |
| Docker | any recent | Easiest way to run MongoDB 7 |
| PayPal sandbox account | free | Optional — only needed to test checkout |

Windows users: use WSL2 or Git Bash. The `NODE_OPTIONS=...` inline env var in
`package.json` scripts does not parse natively on `cmd.exe`.

## Setup — 30 minutes from `git clone` to green UI

1. **Clone your fork**

   ```bash
   git clone https://github.com/<your-user>/proshop_mern.git
   cd proshop_mern
   ```

2. **Create your `.env`**

   ```bash
   cp .env.example .env
   ```

   The defaults work for local Docker Mongo. Change `MONGO_URI` if you use
   Atlas. `PAYPAL_CLIENT_ID=sb` is PayPal's public sandbox value — fine for dev.

3. **Install dependencies** (two places: root and `frontend/`)

   ```bash
   npm install
   npm install --prefix frontend
   ```

4. **Start MongoDB**

   Docker (recommended):

   ```bash
   npm run mongo:up     # runs: docker compose up -d mongo
   ```

   Or point `MONGO_URI` at a local Mongo service / Atlas cluster.

5. **Seed sample data** (6 products, 3 users; destroys existing data first)

   ```bash
   npm run data:import
   ```

   Optional larger catalogue (~40 products with Unsplash imagery):

   ```bash
   npm run data:import-extra
   ```

6. **Run the app**

   ```bash
   npm run dev
   ```

   - Backend: http://127.0.0.1:5001/api/products
   - Frontend: http://127.0.0.1:3000/
   - CRA dev server proxies `/api/*` to the backend.

7. **Log in with a seeded account**

   | Role | Email | Password |
   |------|-------|----------|
   | Admin | `admin@example.com` | `123456` |
   | Customer | `john@example.com` | `123456` |
   | Customer | `jane@example.com` | `123456` |

## Scripts reference

From the repo root (`package.json`):

| Script | What it does |
|--------|--------------|
| `npm run dev` | backend + frontend concurrently |
| `npm run server` | backend only (`nodemon --legacy-watch`) |
| `npm run client` | frontend only (CRA dev server with legacy OpenSSL flag) |
| `npm run data:import` | wipe + seed products / users |
| `npm run data:destroy` | wipe everything |
| `npm run data:import-extra` | optional larger seed |
| `npm run mongo:up` / `mongo:down` | start/stop Dockerised Mongo |
| `npm start` | run built backend against prod env |

## Troubleshooting

**`Error: digital envelope routines::unsupported` on `npm start`** in the frontend.
CRA 3 + webpack 4 need the legacy OpenSSL provider on Node 17+. The `client`
and `heroku-postbuild` scripts set `NODE_OPTIONS=--openssl-legacy-provider`
already; run the frontend via `npm run client` rather than `npm start` inside `frontend/`.

**`MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`.**
Mongo isn't running. `docker ps` should show `proshop-mongo Up`. If not,
`npm run mongo:up`. On Apple Silicon the `mongo:7` image is multi-arch and
works natively.

**`Request failed with status code 500`** in the UI on load.
Server is up but DB is empty or misconnected. Check the backend log: if you
see "MongoDB Connected" but products 500, run `npm run data:import`.

**Backend starts on `:5000` on macOS and Control Centre eats it.**
Already handled — `PORT=5001` is the default in `.env.example` and the frontend
proxy points at `:5001`. If you forced `:5000`, also change
`frontend/package.json → "proxy"`.

**PayPal button shows "Sorry, your default language is not supported" / fails to load.**
Sandbox throttling or an expired client id. `PAYPAL_CLIENT_ID=sb` is the public
sandbox and works most of the time; for consistent results create your own app
at https://developer.paypal.com/ and paste its client id.

**Hot reload doesn't pick up backend changes.**
`nodemon` runs with `--legacy-watch` because fsevents misses changes when the
repo path contains spaces. If you moved the project to a no-space path, you can
drop the flag (optional).

**`npm run dev` exits immediately with `concurrently` error.**
One of the two processes failed to start. Scroll up — usually it's the
backend failing to connect to Mongo (see above).

## Deployment

The `Procfile` is a leftover from the original Heroku deployment and is
kept for historical reference — **this fork is not deployed**. For the M2
homework we only care about local dev. See `docs/adr/0003-*.md` for context.

## License

MIT — Copyright (c) 2020 Traversy Media. See the upstream repo for the full
license text. This fork is a course exercise.
