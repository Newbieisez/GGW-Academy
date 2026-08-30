# GGW AI Academy

GGW AI Academy is a beginner-friendly learning site for Global Gaming Women employees. It teaches practical AI workflows inside familiar Google Workspace tools and keeps the learner focused on a real work outcome:

- Gmail, Docs, Meet, and Chat drafting and summarization
- Sheets cleanup, Form 990 functional classification, and NotebookLM research
- Slides, Google Vids, image generation, and video storytelling
- Apps Script and low-code workflow automation
- Gemini Spark, proactive agents, and human-in-the-loop safeguards
- Governance, privacy, least privilege, and review-before-send habits

The experience follows a simple loop: choose a task, learn the workflow, practice safely, create an artifact, and record the result.

## What is included

| Path | Purpose |
| --- | --- |
| `/` | GGW-branded home page and six learning paths |
| `/progress` | Learner dashboard with completion, diagnostic attempts, saved work, commitments, and outcomes |
| `/prompts` | Searchable copy-and-use prompt library |
| `/api/academy` | Identity-aware D1 progress and activity API |
| `/api/gemini` | Server-side Gemini coach endpoint with a safe unconfigured fallback |
| `db/schema.ts` | Drizzle/D1 schema for users, progress, attempts, outcomes, artifacts, and activity metadata |
| `drizzle/` | Generated D1 migrations and schema snapshots |
| `tests/` | Build/render and component contract tests |

## Requirements

- Node.js `>=22.13.0`
- npm
- Linux with `flock`, `curl`, and GNU `timeout` for the provided Sites scripts
- A Cloudflare D1 database when deploying the durable progress backend

## Run locally

```bash
npm ci
npm run dev
```

The local development binding is declared in `vite.config.ts`. Production Sites values are configured in the hosting control plane; do not put production secrets in this repository.

Useful commands:

```bash
npm run lint
npm run build
npm test
npm run db:generate
```

`npm test` performs a build and runs the repository tests. The rendered-HTML test is designed for the starter runtime and may need Cloudflare/Vinext runtime support when run outside the hosted Sites environment.

## Runtime environment variables

Copy `.env.example` as a reference only. For production, set these values in the host’s secret/environment-variable manager:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GGW_ADMIN_EMAILS` | Optional | Comma-separated allowlist for the aggregate-only leadership view |
| `GEMINI_API_KEY` | Optional | Server-side key for the progress-page Gemini coach |
| `GEMINI_MODEL` | Optional | Gemini model name; defaults to `gemini-2.5-flash` |

The current Gemini coach deliberately does not send Drive, Gmail, Docs, Sheets, or saved artifact contents to the model. It sends the learner’s question plus a small page/module context. The question text is not written to the learner record; only a non-content activity event is recorded.

Never commit an API key, OAuth secret, service-account key, or production `.env` file.

## Authentication and learner identity

The academy does not trust an email typed into a form. The current hosted implementation reads the authenticated identity header supplied by the Sites platform:

```text
oai-authenticated-user-email
```

That identity is the key used for D1 progress records. The current hosted Site is private and owner-only. It is not yet a standalone Google Sign-In / Google Workspace SSO application. A GitHub deployment that needs GGW employees to sign in with Google must add one of these identity layers:

1. Deploy under a Google Workspace access policy that restricts the site to GGW accounts or an approved group.
2. Add Google Identity Services / OpenID Connect using a Google Cloud OAuth web client, server-side token verification, an exact authorized redirect URI, and an explicit GGW domain or allowlist check.

Do not replace this with an email input. An email input identifies a string; it does not verify the person.

## GitHub Pages build and private access

The repository also includes a static build for GitHub Pages. Run it locally with:

```bash
npm run build:github
```

The build uses `/GGW-Academy/` as its base path, writes static output to `dist/client`, and keeps the beginner learning paths, prompt library, progress page, and browser-safe practice coach functional without server routes. With no secure external API configured, progress is saved only in the current browser; it is not a verified Google account record and is not shared across devices.

The Pages workflow is intentionally manual and the deploy job is disabled until both repository variables `GGW_ENABLE_PAGES_DEPLOYMENT` and `GGW_PRIVATE_ACCESS_CONFIRMED` are set to `true`. GitHub Pages on a personal account is public by default, even when the source repository is private. GGW must configure GitHub Enterprise Cloud private Pages or an approved access-controlled host before enabling deployment. Read [`docs/GITHUB_PAGES_PRIVATE_SETUP.md`](docs/GITHUB_PAGES_PRIVATE_SETUP.md) for the activation checklist.

Do not put API keys in `NEXT_PUBLIC_*` variables. If a secure external backend is later configured, set `NEXT_PUBLIC_ACADEMY_API_BASE` and `NEXT_PUBLIC_GEMINI_API_URL` to protected endpoint URLs and keep `GEMINI_API_KEY`, OAuth secrets, service-account keys, and database credentials server-side.

## D1 data model

The site stores durable operational learning data keyed to the authenticated user:

- `academy_users`: account identity, display name, onboarding state, and last-seen time
- `academy_progress`: resumable navigation state and completed paths
- `academy_module_progress`: status, step, best diagnostic score, attempts, lab/artifact flags, and commitment state
- `academy_attempts`: scored diagnostic/practice attempts without raw source documents
- `academy_outcomes`: 24-hour commitments and before/after result check-ins
- `academy_work_products`: saved artifact summaries/content created by the learner
- `academy_activity_events`: compact event metadata for adoption and audit trails

Apply the migrations in `drizzle/` to the target D1 database before using the API. The deployed Sites version includes the migration files.

## Sites deployment

This repository includes `.openai/hosting.json` for the hosted Sites environment. That file declares the D1 binding name (`DB`) and the Sites project metadata used by the control plane.

For a Sites deployment, use the Sites lifecycle for the repository:

1. Install the locked dependencies with `npm run install:ci`.
2. Run `npm run lint` and `npm run build`.
3. Save a version from the exact source commit.
4. Deploy the saved version only after verifying the saved commit and project match.
5. Configure `GGW_ADMIN_EMAILS` and `GEMINI_API_KEY` in the Sites environment manager, then deploy a saved version so the environment revision is active.

If you move the project to another host, keep the application source and migrations but replace the hosting-specific configuration and deployment commands with that host’s equivalents.

## Safety boundaries

- Sandbox exercises use fictional data and do not send email, modify Drive, share files, or run scripts.
- Finance classification is a review aid, not a tax or accounting conclusion.
- AI-generated drafts require human checks for names, dates, amounts, recipients, links, attachments, and promises.
- Leadership reporting is aggregate-only and does not expose raw prompts, source documents, email bodies, or individual learner names.
- The Gemini coach abstains from claiming access to GGW systems it cannot see.

## License and brand

This project is prepared for Global Gaming Women’s internal enablement work. Confirm GGW permission and brand guidance before publishing it publicly or reusing GGW imagery outside the approved site.
