this is a helper library for react related project.
It includes hooks and react related helper functions

Successor of `asma-helpers-react` (deprecated under that npm name — new development happens here).
Also contains the app auth-store machinery: `createAuthStore({ isJwtValid })` / `IAuth$` — apps keep a
thin binding that injects their own `isJwtValid` and re-exports `auth$` / `logout` / `checkIfUserIsAuthenticated`.

First release: publish manually at the manifest version (`pnpm build && npm publish --access public`),
then tag `v0.6.0` so the CI release workflow continues the lineage from there.
