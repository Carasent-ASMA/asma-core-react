this is a helper library for react related project.
It includes hooks and react related helper functions

Successor of `asma-helpers-react` (deprecated under that npm name — new development happens here).
Also contains the app auth-store machinery: `createAuthStore({ isJwtValid })` / `IAuth$` — apps keep a
thin binding that injects their own `isJwtValid` and re-exports `auth$` / `logout` / `checkIfUserIsAuthenticated`.

Supports React 18.3.1 and React 19, with `asma-core-helpers >=0.6.2 <1`,
`asma-types >=2.0.54 <3`, and `history ^5.3.0`. The `_useUserContext` hook restores
the legacy ME/RECIPIENT URL-context integration needed by migrating apps.

Validate changes with `pnpm install --ignore-workspace --frozen-lockfile` and
`pnpm build`. Merge through the ASMA PR workflow. A push to `master` runs
`.github/workflows/publish.yml`, which builds the package, derives the next
version from stable tags and conventional commits, and publishes through the
shared npm release workflow. Verify the workflow and the npm registry after
merging; a GitHub tag or release alone does not prove npm publication.

`v0.1.0` is an existing historical tag whose version was never published to npm.
Do not replace that tag or reuse its version; the compatibility release is `0.2.0`.
