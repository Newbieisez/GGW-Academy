# GGW AI Workbench — Production Launch

Production hostname: `ggw.its-ez.com`

## Target architecture

- GitHub `main` is the production source of truth.
- Cloudflare Workers Builds deploys the full-stack Workbench.
- `ggw.its-ez.com` is attached as a Cloudflare Worker Custom Domain.
- Cloudflare Access protects the Worker before requests reach the application.
- Google Workspace and/or Microsoft identity is used for staff sign-in.
- The Worker converts Cloudflare's verified Access identity into the internal identity headers used by the application APIs.
- Gemini is optional and is enabled only with a server-side `GEMINI_API_KEY` secret.
- D1 is optional for the current visible portal because the legacy progress route is retired; add the `DB` binding only if identity-aware activity/progress storage is enabled again.

## Cloudflare Workers Builds

1. Cloudflare dashboard → **Workers & Pages** → **Create application** → **Import a repository**.
2. Connect GitHub and select `Newbieisez/GGW-Academy`.
3. Production branch: `main`.
4. Worker name: `ggw-ai-workbench`.
5. Build command: `npm run build`.
6. Deploy command: `npx wrangler deploy`.
7. Save and deploy.
8. Confirm the generated `workers.dev` preview loads before attaching the production hostname.

## Production hostname

1. Open the Worker → **Settings → Domains & Routes**.
2. Add a **Custom Domain**.
3. Enter `ggw.its-ez.com`.
4. Cloudflare will create the DNS record and certificate for the Worker.
5. Do not use `its-ez.com/ggw` as the canonical URL.
6. If `www.ggw.its-ez.com` exists, redirect it to `https://ggw.its-ez.com` rather than maintaining two production hostnames.

## Private access

Preferred: protect the Worker itself so every attached domain, `workers.dev` URL, and preview is covered.

1. Worker → **Access** → **Protect this Worker behind Access**.
2. Protect **All traffic**.
3. Create an **Allow** policy for the GGW-approved staff identities. Prefer a verified organization email domain or an explicit approved-user list rather than a public one-time PIN policy.
4. In Zero Trust → **Integrations → Identity providers**, configure the GGW-approved Google Workspace and/or Microsoft identity provider.
5. If only one IdP is used, enable instant authentication so users go directly to that sign-in flow.
6. Test one allowed account and one account that should be blocked.
7. Do not consider the portal private until the blocked-account test fails as expected.

## Gemini helper

The portal works without a Gemini key; the Prompt Library remains available. To enable the in-portal helper:

1. Worker → **Settings → Variables and Secrets**.
2. Add `GEMINI_API_KEY` as an encrypted secret.
3. Optional variable: `GEMINI_MODEL=gemini-2.5-flash`.
4. Redeploy.
5. Sign in through Access and test a non-sensitive operational question.
6. Confirm the helper returns `401` when Access identity is absent.

Never expose the Gemini API key in client JavaScript, GitHub, a public `.env` file, or a prompt.

## D1 (only if activity/progress storage is enabled)

The visible production portal does not require D1 today. If staff activity/progress storage is enabled later:

1. Create a Cloudflare D1 database for the GGW Workbench.
2. Add the Worker binding with variable name `DB`.
3. Apply the migrations in `drizzle/`.
4. Configure `GGW_ADMIN_EMAILS` only for approved administrative accounts.
5. Verify the app stores metadata only and does not persist raw prompts, source documents, member/payment details, or other unnecessary sensitive content.

## Launch acceptance checks

- `https://ggw.its-ez.com` resolves over HTTPS.
- Unauthenticated visitors cannot reach the Worker.
- Approved staff can sign in with the approved IdP.
- Unapproved identities are blocked.
- Home, Prompt Library, Run & Grow GGW, Google & AI, Canva, connector guides, legal page, and external tool links load correctly.
- Prompt search, filters, variable fill-in, copy actions, expansion drawers, and deep links work on desktop and mobile.
- WildApricot links go to WildApricot, not the GGW public website.
- Gemini helper works only when the server secret is configured and the user is authenticated.
- No GitHub Pages production deployment is enabled.
- GitHub `main` CI is green after the production configuration commit.
