import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("portal routes use the shared Workbench shell", async () => {
  const [layout, promptsPage, legalPage, progressPage, header, a11y] = await Promise.all([
    read("app/layout.tsx"),
    read("app/prompts/page.tsx"),
    read("app/legal/page.tsx"),
    read("app/progress/page.tsx"),
    read("app/portal-header.tsx"),
    read("app/accessibility-polish.css"),
  ]);

  assert.match(layout, /<PortalHeader\s*\/>/);
  assert.match(layout, /<NonprofitOperationsHub\s*\/>/);
  assert.match(layout, /<HomeGoogleWorkspaceHub\s*\/>/);
  assert.match(layout, /<CanvaHelper\s*\/>/);
  assert.match(layout, /<ConnectorGuides\s*\/>/);
  assert.match(layout, /<LegalFooter\s*\/>/);
  assert.doesNotMatch(promptsPage, /SiteHeader|PromptLibraryView|academy-app/);
  assert.doesNotMatch(legalPage, /SiteHeader|academy-app/);
  assert.doesNotMatch(progressPage, /GGW learner|learning record|DashboardView|SiteHeader/);
  assert.match(progressPage, /old learning-progress view has been retired/i);
  assert.match(a11y, /body > \.academy-app\{display:none!important\}/);
  assert.match(header, /Run &amp; Grow GGW/);
  assert.match(header, /Google &amp; AI/);
  assert.match(header, /Prompt Library/);
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

test("Google Workspace hub covers the core GGW toolset and stays home-scoped", async () => {
  const [hub, wrapper] = await Promise.all([
    read("app/google-workspace-hub.tsx"),
    read("app/home-google-workspace-hub.tsx"),
  ]);
  for (const product of [
    "Gmail",
    "Google Sheets",
    "Google Docs",
    "Google Drive",
    "Google Calendar",
    "Google Meet",
    "Google Slides",
    "Google Forms",
    "Gemini",
    "NotebookLM",
  ]) {
    assert.match(hub, new RegExp(product.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(hub, /Features worth knowing/);
  assert.match(hub, /GGW use cases/);
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
  assert.match(worker, /cf-access-jwt-assertion/);
  assert.match(worker, /cf-access-authenticated-user-email/);
  assert.match(worker, /oai-authenticated-user-email/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.doesNotMatch(vite, /SITE_CREATOR_PLACEHOLDER_DATABASE_ID/);
  assert.match(launch, /Protect this Worker behind Access/);
  assert.match(launch, /GEMINI_API_KEY/);
});
