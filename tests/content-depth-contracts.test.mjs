import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const read = (relativePath) => readFile(path.join(root, relativePath), "utf8");

const stopWords = new Set(["a", "an", "and", "for", "from", "in", "of", "on", "the", "to", "with", "ggw"]);
const aliases = {
  member: ["member", "members", "membership"],
  members: ["member", "members", "membership"],
  membership: ["member", "members", "membership"],
  renew: ["renew", "renewal", "renewing", "re engagement", "reengagement"],
  renewal: ["renew", "renewal", "renewing", "re engagement", "reengagement"],
  renewals: ["renew", "renewal", "renewing", "re engagement", "reengagement"],
  event: ["event", "events", "registration", "attendee"],
  events: ["event", "events", "registration", "attendee"],
  board: ["board", "governance", "committee", "trustee"],
  report: ["report", "reporting", "dashboard", "brief", "summary"],
  reporting: ["report", "reporting", "dashboard", "brief", "summary"],
  email: ["email", "gmail", "outlook", "message", "communication"],
  emails: ["email", "gmail", "outlook", "message", "communication"],
  compliance: ["compliance", "990", "governance", "retention", "registration", "policy"],
  grant: ["grant", "grants", "funder", "funding"],
  grants: ["grant", "grants", "funder", "funding"],
  fundraising: ["fundraising", "donor", "sponsor", "sponsorship", "revenue"],
  automation: ["automation", "automate", "zapier", "make", "workflow"],
  outlook: ["outlook", "microsoft", "email"],
  copilot: ["copilot", "microsoft", "outlook"],
};

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function queryTerms(query) {
  return normalize(query).split(/\s+/).filter((term) => term && !stopWords.has(term));
}

function matches(entry, query) {
  const haystack = normalize(entry);
  return queryTerms(query).every((term) => (aliases[term] || [term]).some((variant) => haystack.includes(normalize(variant))));
}

function promptEntries(source) {
  return source.split("\n")
    .filter((line) => /^\s*(?:p|np|ep|fp)\("/.test(line))
    .map((line) => line.replace(/^\s*(?:p|np|ep|fp)\("[^"]+",\s*/, ""));
}

test("homepage exposes 36 substantive GGW job aids with six per work area", async () => {
  const source = await read("app/expanded-job-aids.tsx");
  const entries = source.split("\n").filter((line) => /^\s*j\("/.test(line));
  assert.equal(entries.length, 36, `expected 36 GGW job aids, found ${entries.length}`);
  for (const category of ["members", "events", "communications", "reporting", "content", "automation"]) {
    const count = entries.filter((line) => line.includes(`, "${category}",`)).length;
    assert.equal(count, 6, `expected 6 ${category} job aids, found ${count}`);
  }
  assert.match(source, /jobAids\.length/);
  assert.match(source, /Find more GGW prompts/);
});

test("every featured Common GGW Job resolves to at least 15 prompt entries", async () => {
  const sources = await Promise.all([
    read("app/prompt-data.ts"),
    read("app/nonprofit-prompt-data.ts"),
    read("app/platform-expansion-prompt-data.ts"),
    read("app/featured-job-prompt-depth.ts"),
  ]);
  const entries = sources.flatMap(promptEntries);
  for (const query of ["member renewal", "event promotion", "board report", "grant", "compliance", "cash flow", "fundraising", "automation", "Outlook email", "Copilot"]) {
    const count = entries.filter((entry) => matches(entry, query)).length;
    assert.ok(count >= 15, `${query} must have at least 15 prompt entries; found ${count}`);
  }
});

test("GGW-specific prompt language replaces the generic nonprofit CTA", async () => {
  const hub = await read("app/nonprofit-operations-hub.tsx");
  assert.match(hub, /Browse GGW prompts/);
  assert.doesNotMatch(hub, /Browse nonprofit prompts/);
  assert.match(hub, /href="\/prompts"/);
});

test("featured prompt depth is loaded before the prompt library builds its combined list", async () => {
  const [registry, runtime, workbench] = await Promise.all([
    read("app/tool-registry.ts"),
    read("app/prompt-depth-runtime.ts"),
    read("app/prompt-workbench.tsx"),
  ]);
  assert.match(registry, /import "\.\/prompt-depth-runtime"/);
  assert.match(runtime, /platformExpansionPrompts\.push\(\.\.\.featuredJobDepthPrompts\)/);
  assert.match(workbench, /platformExpansionPrompts/);
});
