import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

test("homepage does not expose the unreliable free-text search", async () => {
  const home = await read("app/ggw-workbench.tsx");
  assert.doesNotMatch(home, /ggw-workbench-search/);
  assert.doesNotMatch(home, /Search GGW AI job aids/);
  assert.match(home, /availableCategories/);
  assert.match(home, /filter\(\(item\) => item\.count > 0\)/);
  assert.match(home, /\{item\.label\} <span>\(\{item\.count\}\)<\/span>/);
});

test("member renewal is backed by real prompt content and semantic aliases", async () => {
  const [workbench, data] = await Promise.all([
    read("app/prompt-workbench.tsx"),
    read("app/prompt-data.ts"),
  ]);
  assert.match(workbench, /"member renewal"/);
  assert.match(workbench, /member:\s*\["member", "members", "membership"\]/);
  assert.match(workbench, /renewal:\s*\["renew", "renewal", "renewing"/);
  assert.match(workbench, /re-engagement/);
  assert.match(workbench, /terms\.every\(\(term\) => termMatches\(haystack, term\)\)/);
  assert.match(data, /renewal-campaign/);
  assert.match(data, /Build a renewal campaign by segment/);
  assert.match(data, /member-welcome/);
});

test("Prompt Library dropdowns only expose content-backed options and counts", async () => {
  const workbench = await read("app/prompt-workbench.tsx");
  assert.match(workbench, /const toolOptions = useMemo/);
  assert.match(workbench, /const outcomeOptions = useMemo/);
  assert.match(workbench, /toolOptions\.map\(\(\[value, count\]\)/);
  assert.match(workbench, /outcomeOptions\.map\(\(\[value, count\]\)/);
  assert.match(workbench, /verifiedPopularSearches/);
  assert.match(workbench, /filter\(\(item\) => item\.count > 0\)/);
  assert.match(workbench, /changeTool/);
  assert.match(workbench, /changeOutcome/);
  assert.match(workbench, /usingFallback \? libraryPrompts : directMatches/);
  assert.doesNotMatch(workbench, /No matching prompt yet/);
});

test("Google Calendar reporting gap is filled with substantive GGW prompts", async () => {
  const expansion = await read("app/platform-expansion-prompt-data.ts");
  assert.match(expansion, /calendar-reporting-cadence/);
  assert.match(expansion, /calendar-board-reporting-cycle/);
  assert.match(expansion, /calendar-grant-reporting/);
  assert.match(expansion, /"Reporting", \["Google Calendar"/);
  assert.match(expansion, /Do not invent board, tax, grant, regulatory, or funder deadlines/);
});

test("Outlook and Microsoft Copilot are first-class, content-backed options", async () => {
  const [registry, expansion, home, hub] = await Promise.all([
    read("app/tool-registry.ts"),
    read("app/platform-expansion-prompt-data.ts"),
    read("app/ggw-workbench.tsx"),
    read("app/google-workspace-hub.tsx"),
  ]);
  assert.match(registry, /\| "Outlook"/);
  assert.match(registry, /\| "Microsoft Copilot"/);
  assert.match(registry, /https:\/\/outlook\.office\.com\//);
  assert.match(registry, /https:\/\/m365\.cloud\.microsoft\/chat/);
  assert.match(expansion, /outlook-ggw-email/);
  assert.match(expansion, /outlook-thread-actions/);
  assert.match(expansion, /outlook-weekly-commitments/);
  assert.match(expansion, /copilot-weekly-ops/);
  assert.match(expansion, /copilot-source-research/);
  assert.match(home, /"Outlook"/);
  assert.match(home, /"Microsoft Copilot"/);
  assert.match(home, /license dependent/);
  assert.match(hub, /PRODUCTIVITY TOOLS \+ AI/);
  assert.match(hub, /Copilot features vary by Microsoft 365\/Copilot license/);
});
