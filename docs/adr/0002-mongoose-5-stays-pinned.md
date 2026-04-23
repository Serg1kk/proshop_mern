# ADR 0002 — Stay on Mongoose 5.x for now

- **Status:** Accepted (until someone explicitly schedules the upgrade)
- **Date:** 2026-04 (this fork, M2 homework)
- **Confidence:** **MEDIUM** — the choice is implicit; I am codifying it.

## Context

`package.json` pins `"mongoose": "^5.10.6"`. The current Mongoose is 8.x
(four majors ahead). The older major:

- Accepts the now-deprecated `useUnifiedTopology`, `useNewUrlParser`,
  `useCreateIndex` flags in `backend/config/db.js`.
- Still supports `Model.remove()` callbacks — called in `userController.js`
  (`user.remove()`) and `productController.js` (`product.remove()`); both
  would need to become `deleteOne()` in Mongoose 7+.
- Doesn't enforce `strictQuery`, which changes filter behaviour across 6 → 7.

There is **no test suite**, so a blind bump has no safety net.

## Decision

Keep Mongoose at `^5.10.6` for the M2 homework window. Document the upgrade
as a future task with three gates:

1. Write characterization tests for `userController`, `productController`,
   and `orderController` (at least happy path + one error branch each).
2. Bump to Mongoose **7** first (the smaller migration — removes deprecated
   flags, renames `remove()` → `deleteOne()`, sets `strictQuery: true`).
3. Only then bump to **8**, which mostly cleans up TypeScript typings we do
   not consume.

## Alternatives

- **Jump straight to 8** — rejected; compound migration with no tests.
- **Replace Mongoose with the native MongoDB driver** — rejected; would
  touch every controller and every model, far beyond the homework scope.
- **Abandon this fork and use `proshop-v2`** — out of scope; the point of
  the exercise is inheriting messy code.

## Consequences

- **+** We ship the M2 homework without introducing a four-major dependency
  change we cannot verify.
- **+** Existing controllers keep working; seeder and models keep working.
- **−** Carries a known-deprecated driver. CVE exposure is via the transitive
  `bson` and `mongodb` packages — worth a `npm audit` before any production
  use (which this fork is not destined for).
- **−** Blocks MongoDB 8 upgrade; server stays on 7 in
  `docker-compose.yml` for compatibility.
