import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("portal routes use the shared Workbench shell", async () => {
  const [layout, shell, promptsPage, legalPage, progressPage, header, a11y] = await Promise.all([
    read("app/layout.tsx"),
    read("app/portal-shell.tsx"),
    read("app/prompts/page.tsx"),
    read("app/legal/page.tsx"),
    read("app/progress/page.tsx"),
    read("app/portal-header.tsx"),
    read("app/accessibility-polish.css"),
  ]);

  assert.match(layout, /<PortalHeader\s*\/>/);
  assert.match(layout, /<PortalShell\s*\/>/);
  assert.match(layout, /<LegalFooter\s*\/>/);
  assert.match(layout, /Microsoft 365/);
  assert.match(shell, /<GGWWorkbench\s*\/>/);
  assert.match(shell, /<NonprofitOperationsHub\s*\/>/);
  assert.match(shell, /<HomeGoogleWorkspaceHub\s*\/>/);
  assert.match(shell, /<CanvaHelper\s*\/>/);
  assert.match(shell, /<ConnectorGuides\s*\/>/);
  assert.match(shell, /const isHome/);
  assert.doesNotMatch(promptsPage, /SiteHeader|PromptLibraryView|academy-app/);
  assert.doesNotMatch(legalPage, /SiteHeader|academy-app/);
  assert.doesNotMatch(progressPage, /GGW learner|learning record|DashboardView|SiteHeader/);
  assert.match(progressPage, /old learning-progress view has been retired/i);
  assert.match(a11y, /body > \.academy-app\{display:none!important\}/);
  assert.match(header, /Run &amp; Grow GGW/);
  assert.match(header, /Tools &amp; AI/);
  assert.match(header, /Prompt Library/);
  assert.match(header, /Workbenches/);
});

test("operational workbench routes are present", async () => {
  const [hub, outreach, batch, actions] = await Promise.all([
    read("app/workbench/page.tsx"),
    read("app/workbench/outreach/page.tsx"),
    read("app/workbench/batch-outreach/page.tsx"),
    read("app/workbench/actions/page.tsx"),
  ]);

  assert.match(hub, /GGW Operations Workbench/);
  assert.match(hub, /\/data-cleanup/);
  assert.match(hub, /\/workbench\/outreach/);
  assert.match(hub, /\/workbench\/batch-outreach/);
  assert.match(hub, /\/workbench\/actions/);
  assert.match(outreach, /Write One Message/);
  assert.match(batch, /Contact a Group/);
  assert.match(actions, /Meeting/);
});

test("homepage does not expose a non-functional search bar and only shows populated categories", async () => {
  const home = await read("app/ggw-workbench.tsx");
  assert.doesNotMatch(home, /ggw-workbench-search/);
  assert.doesNotMatch(home, /No exact match/);
  assert.match(home, /availableCategories/);
  assert.match(home, /filter\(\(item\) => item\.count > 0\)/);
  assert.match(home, /Choose a work area and get the job done/);
  assert.match(home, /Outlook/);
  assert.match(home, /Microsoft Copilot/);
});

test("WildApricot actions point to WildApricot, not the GGW public site", async () => {
  const registry = await read("app/tool-registry.ts");
  assert.match(registry, /WildApricot:[\s\S]*?url:\s*"https:\/\/www\.wildapricot\.com\/"/);
  assert.doesNotMatch(registry, /WildApricot:[\s\S]*?url:\s*"https:\/\/www\.globalgamingwomen\.org\/"/);
  assert.match(registry, /label:\s*"WildApricot"/);
});

test("prompt library includes nonprofit operations and inline variable completion", async () => {
  const [workbench, nonprofit] = await Promise.all([
    read("app/prompt-workbench.tsx"),
    read("app/nonprofit-prompt-data.ts"),
  ]);

  assert.match(workbench, /nonprofitPrompts/);
  assert.match(workbench, /platformExpansionPrompts/);
  assert.match(workbench, /promptVariables/);
  assert.match(workbench, /Customize prompt/);
  assert.match(workbench, /completedPrompt/);
  assert.match(workbench, /URLSearchParams\(window\.location\.search\)/);
  assert.match(nonprofit, /nonprofit-compliance-calendar/);
  assert.match(nonprofit, /nonprofit-990-prep/);
  assert.match(nonprofit, /nonprofit-grant-application/);
  assert.match(nonprofit, /nonprofit-fundraising-plan/);
  assert.match(nonprofit, /nonprofit-financial-controls/);
  assert.match(nonprofit, /nonprofit-records-retention/);
});

test("prompt search supports GGW job language and never offers empty curated jobs", async () => {
  const workbench = await read("app/prompt-workbench.tsx");
  assert.match(workbench, /"member renewal"/);
  assert.match(workbench, /member:\s*\["member", "members", "membership"\]/);
  assert.match(workbench, /renewal:\s*\["renew", "renewal", "renewing"/);
  assert.match(workbench, /terms\.every\(\(term\) => termMatches\(haystack, term\)\)/);
  assert.match(workbench, /verifiedPopularSearches/);
  assert.match(workbench, /filter\(\(item\) => item\.count > 0\)/);
  assert.match(workbench, /usingFallback \? libraryPrompts : directMatches/);
  assert.match(workbench, /available prompts shown — no dead end/);
  assert.doesNotMatch(workbench, /No matching prompt yet/);
});

test("prompt filters are dynamically backed by matching content", async () => {
  const workbench = await read("app/prompt-workbench.tsx");
  assert.match(workbench, /const toolOptions = useMemo/);
  assert.match(workbench, /const outcomeOptions = useMemo/);
  assert.match(workbench, /toolOptions\.map\(\(\[value, count\]\)/);
  assert.match(workbench, /outcomeOptions\.map\(\(\[value, count\]\)/);
  assert.match(workbench, /changeTool/);
  assert.match(workbench, /changeOutcome/);
  assert.match(workbench, /setOutcome\("All"\)/);
  assert.match(workbench, /setTool\("All"\)/);
});

test("expanded prompt pack covers real GGW reporting, Outlook, and Copilot jobs", async () => {
  const [expansion, registry] = await Promise.all([
    read("app/platform-expansion-prompt-data.ts"),
    read("app/tool-registry.ts"),
  ]);

  for (const id of [
    "calendar-reporting-cadence",
    "calendar-board-reporting-cycle",
    "calendar-grant-reporting",
    "forms-reporting-summary",
    "meet-action-report",
    "drive-reporting-source-pack",
    "slides-board-report",
    "notebooklm-reporting-brief",
    "outlook-ggw-email",
    "outlook-thread-actions",
    "outlook-meeting-prep",
    "outlook-weekly-commitments",
    "copilot-weekly-ops",
    "copilot-source-research",
    "copilot-board-prep",
  ]) assert.match(expansion, new RegExp(id));

  assert.match(registry, /\| "Outlook"/);
  assert.match(registry, /\| "Microsoft Copilot"/);
  assert.match(registry, /https:\/\/outlook\.office\.com\//);
  assert.match(registry, /https:\/\/m365\.cloud\.microsoft\/chat/);
});

test("productivity hub includes Google plus Microsoft options with license guardrails", async () => {
  const [hub, wrapper] = await Promise.all([
    read("app/google-workspace-hub.tsx"),
    read("app/home-google-workspace-hub.tsx"),
  ]);
  for (const product of [
    "Gmail",
    "Outlook",
    "Google Sheets",
    "Google Docs",
    "Google Drive",
    "Google Calendar",
    "Google Meet",
    "Google Slides",
    "Google Forms",
    "Gemini",
    "Microsoft Copilot",
    "NotebookLM",
  ]) {
    assert.match(hub, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(hub, /PRODUCTIVITY TOOLS \+ AI/);
  assert.match(hub, /Features worth knowing/);
  assert.match(hub, /GGW use cases/);
  assert.match(hub, /Copilot features vary by Microsoft 365\/Copilot license/);
  assert.match(hub, /Open \{tool\.name\}/);
  assert.match(wrapper, /pathname\.includes\("\/prompts"\)/);
  assert.match(wrapper, /pathname\.includes\("\/legal"\)/);
  assert.match(wrapper, /pathname\.includes\("\/progress"\)/);
});

test("legal layer, connector anchor, and accessibility safeguards are globally available", async () => {
  const [footer, legal, connectors, a11y] = await Promise.all([
    read("app/legal-footer.tsx"),
    read("app/legal/page.tsx"),
    read("app/connector-guides.tsx"),
    read("app/accessibility-polish.css"),
  ]);

  assert.match(footer, /Erez Haimowicz\. All Rights Reserved/);
  assert.match(footer, /Terms &amp; Disclaimer/);
  assert.match(legal, /No professional advice/);
  assert.match(legal, /Limitation of responsibility/);
  assert.match(connectors, /id="ggw-connectors-helper"/);
  assert.match(a11y, /focus-visible/);
  assert.match(a11y, /prefers-reduced-motion/);
});

test("production Cloudflare config protects identity boundaries and targets the GGW hostname", async () => {
  const [worker, wrangler, vite, launch] = await Promise.all([
    read("worker/index.ts"),
    read("wrangler.jsonc"),
    read("vite.config.ts"),
    read("docs/PRODUCTION_LAUNCH.md"),
  ]);

  assert.match(wrangler, /"name":\s*"ggw-academy"/);
  assert.match(wrangler, /"pattern":\s*"ggw\.its-ez\.com"/);
  assert.match(wrangler, /"custom_domain":\s*true/);
  assert.match(wrangler, /"binding":\s*"DB"/);
  assert.match(wrangler, /"database_name":\s*"ggw-workbench-prod"/);
  assert.match(wrangler, /"binding":\s*"ASSETS"/);
  assert.match(wrangler, /"run_worker_first":\s*false/);
  assert.match(wrangler, /"binding":\s*"IMAGES"/);
  assert.match(worker, /TRUSTED_IDENTITY_HEADERS/);
  assert.match(worker, /headers\.delete\(header\)/);
  assert.match(worker, /ctx\.access\.getIdentity\(\)/);
  assert.match(worker, /isProtectedPath/);
  assert.match(worker, /@globalgamingwomen\.org/);
  assert.match(worker, /cf-access-authenticated-user-email/);
  assert.match(worker, /oai-authenticated-user-email/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.doesNotMatch(vite, /SITE_CREATOR_PLACEHOLDER_DATABASE_ID/);
  assert.match(launch, /Protect this Worker behind Access/);
  assert.match(launch, /GEMINI_API_KEY/);
});
