# Deploy

## Heroku

### Buildpacks

Buildpacks transform deployed code into runtime artifacts. Heroku autodetects buildpacks based on files in your repo (for example, `package.json` triggers the Node.js buildpack). For this project the Node.js buildpack handles both backend and frontend through the `heroku-postbuild` script defined in the root package.json. The script runs after dependency installation and before the dyno boots, so any compiled assets land in the slug instead of being rebuilt on every request.

Buildpack ordering matters when more than one is configured. Heroku runs them in declaration order and each buildpack can produce environment variables that the next one consumes. The official registry hosts community buildpacks for nearly every language and toolchain, including a Chrome buildpack for headless browser tests and an FFmpeg buildpack for media processing. Custom buildpacks are git repositories that Heroku clones at build time, which is convenient for private toolchains but slows down the build. The Procfile sits alongside the buildpacks and declares the process types — web, worker, release — that Heroku will run from the slug.

### Config Vars

Environment variables on Heroku are managed via `heroku config:set KEY=VALUE`. The same variables you have in `.env` must be set in Heroku's config dashboard or via the CLI: `MONGO_URI`, `JWT_SECRET`, `PAYPAL_CLIENT_ID`, `NODE_ENV=production`. The `heroku config` command prints the current values, with secrets redacted in the dashboard but visible in plain text on the CLI for the authenticated owner of the application.

Config var sources fan out beyond the manual setter. Heroku addons inject their own variables when provisioned: the MongoDB Atlas addon sets `MONGO_URI`, the Heroku Redis addon sets `REDIS_URL`, the Papertrail addon sets log-related credentials. Setting a variable to a different value overrides the addon default until the addon is reprovisioned. Secret rotation follows the same flow as the local `.env`: generate a new value, run `heroku config:set`, and Heroku restarts the dynos automatically so every process picks up the change. The release-phase command in the Procfile runs once per deploy with the new config and is the right place for one-off migrations that depend on the new value.
