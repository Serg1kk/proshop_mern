# Simple H2 fixture

## Authentication

Authentication is handled via JSON Web Tokens (JWTs). The user logs in with email and password, the backend verifies credentials with bcryptjs, and returns a signed token. The frontend stores this token in localStorage and attaches it to every subsequent API request via the `Authorization: Bearer <token>` header. This pattern keeps the backend stateless: any worker process can verify the request without consulting a session store, which simplifies horizontal scaling.

The backend middleware `authMiddleware.js` validates the token on every protected route. If the token is missing, expired, or signed with a different secret, the request is rejected with 401. The token payload contains the user id only; the full user object is loaded fresh from MongoDB on each request to ensure the role and permissions are current. This costs one extra query per request but avoids the stale-permissions problem that bites token-only systems when an admin is demoted.

JWT secrets are stored in the `.env` file as `JWT_SECRET` and must be at least 32 random bytes from a cryptographic source. Rotating the secret invalidates all existing tokens — users will be forced to log in again. This is the recommended response to a suspected secret leak. The deployment runbook documents the exact rotation procedure: generate a new secret with `openssl rand -hex 32`, update Heroku config vars, and restart the dynos so every request is verified against the new secret.

Tokens have a default expiration of thirty days, which balances convenience for returning users against the risk window for a stolen token. For higher-risk endpoints like password change, the application requires a re-authentication step within the last fifteen minutes. The session-management screen in the user profile lists active devices and lets the user revoke any of them; revocation works by adding the token jti to a small Redis blacklist that the middleware checks on every protected request.

## Authorization

Authorization is role-based. Users have a single role: either `admin` or `customer`. The role is stored as a boolean field `isAdmin` on the user document. Routes that require admin access are protected by the `admin` middleware, which checks `req.user.isAdmin === true` and rejects with 403 otherwise. Keeping the role model binary keeps the controllers readable and avoids the matrix of permissions that grows out of control on small teams without a dedicated security engineer.

Resource-level authorization (e.g., a user can only edit their own profile, view their own orders, or update their own shipping address) is enforced inside controllers by comparing `req.user._id` to the resource owner. There is no separate ACL or permission system — keeping this simple is intentional for the size of the application. The trade-off is that the rules live next to the business logic instead of in a central policy file, which means adding a new resource type requires one more place to remember to add the check.

For administrative operations like deleting users, modifying products, or changing order status, the admin middleware runs after the auth middleware in the route definition. Admin operations are audited by virtue of being logged in the morgan request log; there is no separate audit trail. If an audit requirement appears in the future, the recommended approach is to add a small middleware that writes structured events to a dedicated MongoDB collection, indexed by actor and timestamp, so admin-action queries do not interfere with the main application database.

Future work tracked in the backlog includes splitting the customer role into read-only buyer and reviewer permissions, and introducing a moderator role for handling product reviews. Both changes are deferred until the application has enough users to justify the additional complexity. For now, the binary admin flag plus per-resource ownership checks covers every real authorization decision the application needs to make.
