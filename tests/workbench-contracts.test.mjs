import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("portal routes use the shared Workbench shell", async () => {
  const [layout, promptsPage, legalPage, header] = await Promise.all([
    read("app/layout.tsx"),
    read("app/prompts/page.tsx"),
    read("app/legal/page.tsx"),
    read("app/portal-header.tsx"),
  ]);

  assert.match(layout, /<PortalHeader\s*\/>/);
  assert.match(layout, /<NonprofitOperationsHub\s*\/>/);
  assert.match(layout, /<GoogleWorkspaceHub\s*\/>/);
  assert.match(layout, /<CanvaHelper\s*\/>/);
  assert.match(layout, /<ConnectorGuides\s*\/>/);
  assert.match(layout, /<LegalFooter\s*\/>/);
  assert.doesNotMatch(promptsPage, /SiteHeader|PromptLibraryView/);
  assert.doesNotMatch(legalPage, /SiteHeader/);
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

test("Google Workspace hub covers the core GGW toolset", async () => {
  const hub = await read("app/google-workspace-hub.tsx");
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
});

test("legal layer and connector anchor are globally available", async () => {
  const [footer, legal, connectors, headerCss] = await Promise.all([
    read("app/legal-footer.tsx"),
    read("app/legal/page.tsx"),
    read("app/connector-guides.tsx"),
    read("app/portal-header.css"),
  ]);

  assert.match(footer, /Erez Haimowicz\. All Rights Reserved/);
  assert.match(footer, /Terms &amp; Disclaimer/);
  assert.match(legal, /No professional advice/);
  assert.match(legal, /Limitation of responsibility/);
  assert.match(connectors, /id="ggw-connectors-helper"/);
  assert.match(headerCss, /body\[data-ggw-workbench-view="home"\]>\.academy-app\{display:none!important\}/);
});
