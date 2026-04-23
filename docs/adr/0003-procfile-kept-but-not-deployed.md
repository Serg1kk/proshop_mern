# ADR 0003 — Keep `Procfile` and `heroku-postbuild`, but do not deploy

- **Status:** Accepted
- **Date:** 2026-04
- **Confidence:** **LOW** — partly inferred from the upstream project's
  historical README and from the fact that Heroku's free tier no longer exists.

## Context

The repo ships a `Procfile` (`web: node backend/server.js`) and a
`heroku-postbuild` script in root `package.json` that installs frontend deps
and runs `react-scripts build`. The original course (Brad Traversy, 2020)
targeted Heroku Free, which was shut down in 2022.

Today the fork is used for local practice only. The temptation is to delete
both and declare the repo "local-only". The temptation to resist is: the
build pipeline encoded in `heroku-postbuild` also happens to be a reasonable
production build recipe (install front-end deps at the repo root, produce
`frontend/build`, serve it statically from Express in `NODE_ENV=production`).
The `else`-branch in `backend/server.js` relies on that build existing.

## Decision

- **Keep `Procfile`** for historical reference.
- **Keep `heroku-postbuild`** because it is the only production build recipe
  we have; removing it and the `NODE_ENV==='production'` branch in
  `server.js` would be a product change, not just a cleanup.
- **Do not deploy** this fork anywhere. The `README.md` "Deployment" section
  states this explicitly so future readers do not assume CI/CD.

## Alternatives

- **Delete `Procfile`** and the `NODE_ENV==='production'` block — rejected:
  compound product change outside the M2 scope.
- **Replace with Docker / Fly.io / Render scripts** — worth doing later, not
  now. When someone does this, write ADR-0004.

## Consequences

- **+** Zero drift from upstream on infra files; easier to diff against the
  original Traversy repo.
- **+** A future maintainer can still `npm run heroku-postbuild` on a
  generic PaaS and get a working deploy.
- **−** Two dead-ish files in the tree signal a deploy path that does not
  actually exist. The `AGENTS.md` and `README.md` explicitly flag this.
