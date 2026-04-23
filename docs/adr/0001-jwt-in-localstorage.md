# ADR 0001 — Store the JWT in `localStorage`

- **Status:** Accepted (retrospective — decision inherited from the original project)
- **Date:** 2020-09 (inferred from upstream commit history)
- **Confidence:** **HIGH** — the choice is visible directly in code.

## Context

The backend issues a signed JWT on successful `POST /api/users/login` and
`POST /api/users` (register). Every private API route expects the token in
`Authorization: Bearer <token>`. We needed somewhere in the browser to hold
the token between page loads so that a shopper can close the tab, reopen, and
still be logged in.

The two realistic options:

1. Put the token in `localStorage` and read it client-side to build the
   `Authorization` header.
2. Put the token in an `httpOnly; Secure; SameSite=Lax` cookie set by the
   server and let the browser attach it automatically.

## Decision

Use `localStorage`.

Evidence in code:

- `frontend/src/actions/userActions.js` — the login/register thunks dispatch
  `USER_LOGIN_SUCCESS` and then call
  `localStorage.setItem('userInfo', JSON.stringify(data))`.
- `frontend/src/store.js` — hydrates `userLogin.userInfo` from
  `localStorage.getItem('userInfo')` on boot.
- Every action that hits a private route reads `userInfo.token` from the
  Redux store and injects it into the axios `Authorization` header.
- The backend never calls `res.cookie(...)` anywhere — there is no cookie
  story on the server side.

## Alternatives

- **httpOnly cookie** (option 2 above). Would sidestep XSS-driven token
  exfiltration but requires a CSRF mitigation (double-submit token, origin
  check, or `SameSite=Strict`) and changes the backend to call `res.cookie`.
  The v2 upstream (`proshop-v2`) moves in this direction. Not done here.
- **In-memory only** (no persistence). Would force a login after every
  refresh — rejected as too hostile for a storefront.

## Consequences

- **+** Simple, works uniformly for web, is trivial to reason about during
  course-style debugging.
- **+** No CSRF surface — each request has to actively pull the token.
- **−** Any XSS in the frontend (a product description, an injected
  third-party script) can read the token. React's default escaping mitigates
  but does not eliminate this.
- **−** Extends the JWT's practical lifetime to the life of the browser
  profile; no server-side revocation path (the project has no blocklist).

This ADR is recorded so that any future auth work explicitly replaces the
contract, not accidentally breaks it.
