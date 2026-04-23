# FINDINGS — proshop_mern

Structured bug-hunt performed during Module 2 onboarding. Top issues ranked by
risk, discovered by reading the code in `backend/` and `frontend/src/`. No
line numbers on purpose — they drift; grep inside the listed `file::symbol`.

| # | Risk | Where | What | How to fix | Status |
|---|------|-------|------|------------|--------|
| 1 | 🔴 critical | `backend/routes/uploadRoutes.js::POST /api/upload` | Upload endpoint has **no auth and no size/type hardening** — the route is mounted in `server.js` without `protect`/`admin`, `multer` has no `limits`, and `path.extname(file.originalname)` is written verbatim into the filename. An unauthenticated attacker can spam arbitrary JPEG/PNG blobs into `uploads/` until the disk fills. | Require `protect, admin` on the route, cap `multer({ limits: { fileSize: 2 * 1024 * 1024 } })`, and sanitize the extension (`const ext = path.extname(file.originalname).toLowerCase(); if (!['.jpg','.jpeg','.png'].includes(ext)) cb(new Error('bad ext'))`). | ✅ fixed in [`58e39e1`](../../commit/58e39e1) |
| 2 | 🔴 critical | `backend/controllers/productController.js::getProducts` | `req.query.keyword` is dropped into `{ $regex: req.query.keyword, $options: 'i' }` **without escaping**. Any regex metacharacter from the URL becomes part of the query — classic ReDoS surface (`.*.*.*.*a` and friends) and a way to force full collection scans. | Escape regex metacharacters before building the filter (`keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`) or switch to a Mongo text index with `$text`. | 🔴 not yet |
| 3 | 🟡 medium | `backend/controllers/orderController.js::addOrderItems` | Guard is `if (orderItems && orderItems.length === 0)` — it only fires when the caller sends `[]`. A missing `orderItems` (undefined) slips through and `new Order({...})` is saved with no line items and a `NaN`-friendly total. The `return` after `throw new Error` is also unreachable (dead code). | Replace with `if (!orderItems || orderItems.length === 0)` and drop the dead `return`. | 🔴 not yet |
| 4 | 🟡 medium | `backend/controllers/userController.js::getUsers` | Admin endpoint returns the full user document, **including `password` hash**. Even though `bcrypt` makes it costly to crack, leaking hashes still breaks the principle of least exposure and makes any future JWT/secret leak far worse. | `await User.find({}).select('-password')` — same pattern already used in `getUserById`. | 🔴 not yet |
| 5 | 🟡 medium | root `package.json` — `mongoose ^5.10.6` | Mongoose 5 is **four majors behind** (current 8.x) and its `useFindAndModify`/`useCreateIndex` driver flags are ignored on modern Node. Also pulls transitive `bson` with known CVEs. Blocks any upgrade path (MongoDB 7 server is still compatible but 8+ isn't guaranteed). | Plan migration to Mongoose 8 in a dedicated branch: remove deprecated connection options, convert `Model.remove()` → `deleteOne()`, and re-test every controller (no test suite, so write characterization tests first). | 🔴 not yet |
| 6 | 🟢 cosmetic | `frontend/src/actions/cartActions.js` | `localStorage.setItem(...)` calls are fire-and-forget — in Safari private mode / quota-exceeded they throw synchronously and crash the thunk chain. No `try/catch`. | Wrap each write in `try { localStorage.setItem(...) } catch (e) { console.warn('cart persist failed', e) }`. | 🔴 not yet |

## Summary

Five real issues + one cosmetic. Finding **#1** is the one the course asks us
to fix, and it's the single highest-impact change:

- the missing auth guard is a one-line fix but closes a live abuse vector,
- the file-size cap prevents disk exhaustion,
- the extension allow-list stops obvious shell-drops (`.php`, `.html`, `.svg`).

See the commit referenced in the "Status" column for the exact diff.
