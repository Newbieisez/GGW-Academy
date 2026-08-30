# GGW Academy: Vercel migration preparation

Status: prepared migration plan and executable source audit, not a completed runtime migration. Do not import the current main branch and assume the existing database or access policy transfers to Vercel. The config example is intentionally not active at the repository root.

## CI recovery

The GitHub export stored shell scripts with mode 100644, while the Sites checkout stored them as 100755. `npm run build` starts Bash successfully, but its wrapper directly executes a non-executable helper; that helper also directly executes the build script again. The fix invokes Bash at both hops:

```bash
exec bash "${script_dir}/sites-env.sh" -- bash "$0" "$@"
```

This preserves the existing Sites build and removes reliance on executable bits. It does not migrate the output to Vercel. Keep `.github/workflows/ci.yml` as the existing-runtime verification job.

## Proposed target

Use native Next.js on Vercel, Auth.js Google sign-in with an explicit email allowlist, and a dedicated owner-controlled Cloudflare D1 database through a server-only HTTP adapter. This keeps the existing SQLite schema and SQL while moving rendering and API execution to Node. Do not assume the Sites-managed D1 database or credentials can be reused outside Sites. Provisioning and account access are not complete.

| Area | Current implementation | Required Vercel change |
| --- | --- | --- |
| Build | `vinext build`, Vite plugins, Worker output in `dist` | Add `build:vercel` using native `next build`; preserve the existing build for Sites |
| Database | `cloudflare:workers` DB binding | Server-only HTTP D1 adapter; no Cloudflare runtime imports in the Vercel application graph |
| Learner API | `app/api/academy/route.ts` uses `getD1()` and trusted Sites headers | Verified session identity; async data adapter retaining `prepare/bind/first/all/run` semantics and bound parameters |
| Gemini API | Cloudflare env plus trusted Sites header | Server environment variables plus verified session and allowlist; never trust client email headers |
| Sign-in | `app/chatgpt-auth.ts`, Sites platform routes | `auth.ts`, Google provider, `/api/auth/[...nextauth]/route.ts`, sign-in and sign-out UI |
| Privacy | Sites owner-only access policy | Server authorization for `/`, `/progress`, `/prompts` and both APIs; platform protection as an additional layer |
| Data | Seven academy tables across two migration files | Apply both migrations to a separate test DB first; export/import existing records only through an authorized supported path |
| Secrets | Sites bindings | Vercel environment settings; separate preview and production credentials |

## Implementation sequence

1. Start from the CI-fixed main branch. Preserve the current Sites hosting manifest, build commands and private access. Work on a migration branch. Do not overwrite main with an unverified migration.
2. Add and pin Auth.js with Google OAuth. Implement provider signature, issuer, audience, expiration, state and nonce validation using the library. Require a verified Google email, an explicit `GGW_ALLOWED_EMAILS` match, and a server session. Empty or missing allowlist means deny. Do not grant every Google user or every GGW domain member automatic access. Recheck the allowlist on protected requests so revocation takes effect without waiting for a long-lived session to expire.
3. Protect the page content server-side, not just the buttons. Both API routes must reject unauthenticated requests even if a caller supplies `oai-authenticated-user-email`. Return 401 for no valid session and 403 for a disallowed user. Check mutation origins/CSRF, avoid public caching of authenticated responses, and rate-limit Gemini per user.
4. Implement the D1 HTTP adapter using account ID, database ID and a narrowly scoped server token. Use parameter binding, request timeouts, result validation and sanitized errors. Preserve all seven tables, user email normalization and cross-user filtering. Do not automatically retry non-idempotent inserts. Validate D1 API response semantics and concurrent writes. Do not expose the token or a generic SQL execution route to browsers.
5. Replace direct Cloudflare env access with host-specific environment access. Keep any Sites adapter outside the native Next.js import graph. Adapt the unused Drizzle entrypoint as well, or exclude it explicitly from the Vercel TypeScript project. Do not stub the DB or use browser storage to make a production build pass.
6. Add `build:vercel` and `start:vercel` scripts for native Next.js. Audit the TypeScript include list: it currently includes Worker/Vite/example source. Preserve the Sites configuration but scope Vercel type checking appropriately. Resolve actual compile/type errors without `ignoreBuildErrors` or disabled lint rules.
7. Add a separate CI job: `npm ci`, lint, native Next.js build, and meaningful auth/data isolation tests. Keep the existing Vinext CI job. Run the source audit below; its success is advisory and never replaces security verification.
8. After the port passes, copy `docs/vercel.json.example` to the root and use the repository root as the Vercel project root, Node 22.x and the Next.js preset. Confirm preview AND production protection before publishing. Do not enable GitHub Pages as a workaround.

## Required account configuration

These are proposed variable names for the port, not settings already consumed by the current source. Enter values in provider secret settings, not in chat or GitHub files.

| Variable | Purpose |
| --- | --- |
| `AUTH_GOOGLE_ID` | Google web OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google web OAuth client secret |
| `AUTH_SECRET` | Strong random session signing/encryption secret |
| `AUTH_URL` | Exact trusted application origin, if required by the selected Auth.js configuration |
| `GGW_ALLOWED_EMAILS` | Explicit approved learner addresses; empty denies everyone |
| `GGW_ADMIN_EMAILS` | Additional aggregate-report privilege; does not bypass learner authorization |
| `CLOUDFLARE_ACCOUNT_ID` | Owner-controlled Cloudflare account for the target D1 DB |
| `CLOUDFLARE_D1_DATABASE_ID` | Dedicated database; preview must not write to production |
| `CLOUDFLARE_API_TOKEN` | Server-only D1 API token with minimum necessary privileges |
| `GEMINI_API_KEY` | Server-only Gemini key |
| `GEMINI_MODEL` | Optional tested model selection |

Register the exact Google callback `https://<approved-host>/api/auth/callback/google`. Use a stable protected preview host for OAuth validation. Do not use wildcard redirects. Leave `GITHUB_PAGES`, `NEXT_PUBLIC_GGW_STATIC` and the `/GGW-Academy` static base path unset on Vercel. Use same-origin API routes; do not point the browser at the private Sites API as a shortcut.

The connected tools used for this preparation do not establish Vercel project settings, Google OAuth credentials, or access to an owner-controlled D1 database. Those remain launch prerequisites. Do not change the live Site or its access list while resolving them.

## Checks and release gates

```bash
node scripts/check-vercel-readiness.mjs
```

The audit currently must exit 1: the port has not been implemented. It reports source blockers only and never reads secret values. Do not remove checks to obtain a green result.

- Native production build passes on a clean Node 22 install; Vercel produces `.next`, not a Worker bundle or static Pages export.
- Logged-out requests cannot retrieve protected page content or either API's learner data. Forged Sites headers do not authenticate. A valid but unapproved Google account is denied.
- An approved Google account signs in, resumes progress across sessions/devices, and signs out successfully. Removing it from the allowlist revokes access.
- Two approved accounts cannot read or modify each other's progress, artifacts, attempts or outcomes. Only approved administrators see aggregate reporting.
- Gemini works for an authorized learner; missing keys, upstream failure and rate limits give safe errors. Keys do not appear in JS bundles, logs or browser requests.
- Apply `drizzle/0000_lazy_killer_shrike.sql` then `drizzle/0001_outstanding_joystick.sql`. Compare per-table counts and sampled user records after any authorized data import. A schema migration alone does not transfer existing progress.
- Verify protection on the preview URL, production URL and any custom domain. Repository privacy and GitHub Pages deployment guards do not configure Vercel access.
- Promote only the tested commit. Keep the existing private Site available until the new host passes these checks. Roll back traffic to the existing Site if needed; do not delete either database or reverse schema changes automatically. Reconcile writes made after cutover before moving traffic again.

## Primary references

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel build configuration](https://vercel.com/docs/builds/configure-a-build)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
- [Vercel deployment protection](https://vercel.com/docs/deployment-protection)
- [Auth.js Google provider](https://authjs.dev/getting-started/providers/google)
- [Cloudflare D1 HTTP API](https://developers.cloudflare.com/api/resources/d1/)
