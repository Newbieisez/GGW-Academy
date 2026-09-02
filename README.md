# GGW AI Workbench

GGW AI Workbench is a practical operations portal for Global Gaming Women staff. It is designed around the job in front of the user—not a course path.

The product model is:

**Find the job → open the right tool → follow the steps → fill/copy the prompt → verify the result → act.**

## What the portal supports

- WildApricot member, event, registration, and operational workflows
- Google Workspace: Gmail, Sheets, Docs, Drive, Calendar, Meet, Slides, Forms
- Gemini and NotebookLM source-grounded work
- Canva content production workflows
- Zapier, Make, Apps Script, and manual automation patterns
- Nonprofit operations, board/governance, grants, fundraising, sponsorships, finance working aids, programs, volunteers, and process design
- Compliance calendars, source checks, records/access review, grant restrictions, state-registration tracking, Form 990 preparation organization, financial controls, policy review, and escalation to qualified professionals
- A deep searchable prompt library with inline variables, tool filters, work-outcome filters, copy actions, and verification guidance

## Product routes

| Path | Purpose |
| --- | --- |
| `/` | Task-first GGW AI Workbench home experience |
| `/prompts` | Deep searchable GGW Power Prompt Library |
| `/legal` | Terms & Disclaimer |
| `/progress` | Legacy/internal progress route retained while the application is migrated; not part of the primary Workbench UX |
| `/api/academy` | Existing D1 identity/activity API retained for migration compatibility |
| `/api/gemini` | Server-side AI helper endpoint; must remain protected before production exposure |

## Core UX rules

1. Do not make staff learn a course before they can do their work.
2. Every workflow should identify the authoritative source.
3. Tool names should be actionable links where useful.
4. WildApricot remains authoritative for membership/event records when it is the source system.
5. Approved Google files, signed agreements, official regulator/funder sources, GGW policy, and qualified professional guidance remain authoritative for the relevant work.
6. AI can draft, summarize, organize, classify, explain, and review; it should not silently make compliance, financial, legal, tax, HR, governance, or record-changing decisions.
7. External communications and sensitive operational actions require a human review gate.
8. When a connector is unavailable, provide a clear manual fallback.

## Key UI modules

- `app/ggw-workbench.tsx` — task-first home/job aids and automation patterns
- `app/prompt-workbench.tsx` — searchable prompt library and inline prompt-variable builder
- `app/prompt-data.ts` — core GGW prompt library
- `app/nonprofit-prompt-data.ts` — nonprofit operations, growth, finance, governance, and compliance prompts
- `app/google-workspace-hub.tsx` — actionable Google Workspace feature/use-case hub
- `app/canva-helper.tsx` — Canva production job aids
- `app/connector-guides.tsx` — exact setup/test/fallback guidance for Canva, Zapier, Make, and WildApricot→Google handoffs
- `app/tool-registry.ts` — canonical direct links to WildApricot, Google tools, Canva, Zapier, and Make
- `app/legal-footer.tsx` + `app/legal/page.tsx` — small global legal footer and full Terms & Disclaimer
- `app/portal-account.tsx` — presentation/session status for the future protected production portal

## Run locally

Requirements:

- Node.js `>=22.13.0`
- npm

```bash
npm ci
npm run dev
```

Quality commands:

```bash
npm run lint
npm run build
npm test
```

## Hosting direction

The intended production URL is the GGW subdomain under `its-ez.com` rather than GitHub Pages. GitHub remains source/version control.

Production target:

- Cloudflare-hosted application
- Cloudflare Access at the portal edge
- Google Workspace and/or Microsoft identity for approved GGW users
- D1 for durable backend data where needed
- server-side AI credentials only
- no public production deployment before authentication and origin protection are configured

GitHub Pages deployment remains disabled unless the repository variables explicitly enabling it are set. It should not be used as the public production host for GGW.

## Authentication and identity

Current code retains the existing hosted-site identity path for compatibility. Production migration should move identity behind a verified access layer. Do not replace verified identity with an email input or trust an arbitrary user-supplied header.

The production application should validate the authenticated identity supplied by the protected hosting layer before any user-specific or sensitive server route is used.

## AI safety and data handling

- Use the minimum information required for the task.
- Avoid sending confidential member, donor, payment, HR, legal, credential, or other sensitive information to AI unless GGW has explicitly approved the use.
- Prefer redaction, aggregation, and placeholders.
- Validate names, dates, links, amounts, eligibility, statuses, recipients, metrics, restrictions, and commitments before action.
- Compliance-sensitive prompts organize source material and questions; they do not decide what the law requires.

Never commit API keys, OAuth secrets, service-account keys, production `.env` files, or other credentials.

## Tool availability

Third-party features depend on plan, permissions, administrator settings, and current connector support. The Workbench should label those dependencies rather than promise a feature that may not exist in GGW's account.

## Copyright

Unless otherwise identified, original Workbench structure, original prompt content, workflow design, and original portal materials are © Erez Haimowicz. All Rights Reserved. Third-party product names, logos, screenshots, and trademarks remain the property of their respective owners.
