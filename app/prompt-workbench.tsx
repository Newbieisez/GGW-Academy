"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Search, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { prompts, type PromptItem } from "./prompt-data";
import { nonprofitPrompts } from "./nonprofit-prompt-data";
import { platformExpansionPrompts } from "./platform-expansion-prompt-data";
import { toolRegistry, type ToolId } from "./tool-registry";

const libraryPrompts = [...prompts, ...nonprofitPrompts, ...platformExpansionPrompts];

const popularSearches = [
  "member renewal",
  "event promotion",
  "board report",
  "grant",
  "compliance",
  "cash flow",
  "fundraising",
  "automation",
];

const stopWords = new Set(["a", "an", "and", "for", "from", "in", "of", "on", "the", "to", "with", "ggw"]);
const searchAliases: Record<string, string[]> = {
  member: ["member", "members", "membership"],
  members: ["member", "members", "membership"],
  membership: ["member", "members", "membership"],
  renew: ["renew", "renewal", "renewing"],
  renewal: ["renew", "renewal", "renewing"],
  renewals: ["renew", "renewal", "renewing"],
  event: ["event", "events", "registration", "attendee"],
  events: ["event", "events", "registration", "attendee"],
  board: ["board", "governance", "committee", "trustee"],
  report: ["report", "reporting", "dashboard", "brief", "summary"],
  reporting: ["report", "reporting", "dashboard", "brief", "summary"],
  email: ["email", "gmail", "outlook", "message", "communication"],
  emails: ["email", "gmail", "outlook", "message", "communication"],
  calendar: ["calendar", "deadline", "schedule", "cadence", "workback"],
  compliance: ["compliance", "990", "governance", "retention", "registration", "policy"],
  grant: ["grant", "grants", "funder", "funding"],
  grants: ["grant", "grants", "funder", "funding"],
  fundraising: ["fundraising", "donor", "sponsor", "sponsorship", "revenue"],
  sponsor: ["sponsor", "sponsorship", "partner"],
  finance: ["finance", "financial", "budget", "cash", "expense", "fund"],
  automation: ["automation", "automate", "zapier", "make", "workflow"],
  automate: ["automation", "automate", "zapier", "make", "workflow"],
  outlook: ["outlook", "microsoft", "copilot", "email"],
  copilot: ["copilot", "microsoft", "outlook"],
};

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function promptHaystack(item: PromptItem) {
  return normalize([item.title, item.summary, item.outcome, item.prompt, ...item.tools, ...item.tags].join(" "));
}

function queryTerms(query: string) {
  return normalize(query).split(/\s+/).filter((term) => term && !stopWords.has(term));
}

function termMatches(haystack: string, term: string) {
  const variants = searchAliases[term] || [term];
  return variants.some((variant) => haystack.includes(normalize(variant)));
}

function matchesSearch(item: PromptItem, query: string) {
  const terms = queryTerms(query);
  if (!terms.length) return true;
  const haystack = promptHaystack(item);
  return terms.every((term) => termMatches(haystack, term));
}

function countMatches(query: string) {
  return libraryPrompts.filter((item) => matchesSearch(item, query)).length;
}

function promptVariables(prompt: string) {
  return Array.from(new Set(Array.from(prompt.matchAll(/\[([^\]]+)\]/g)).map((match) => match[1].trim())));
}

function prefersLongField(label: string) {
  return /(paste|facts|source|notes|data|policy|rules|requirements|materials|inputs|metrics|workflow|process|description|content|agreement)/i.test(label);
}

function PromptCard({ item }: { item: PromptItem }) {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [copied, setCopied] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const variables = useMemo(() => promptVariables(item.prompt), [item.prompt]);
  const completedPrompt = useMemo(() => item.prompt.replace(/\[([^\]]+)\]/g, (full, rawLabel: string) => {
    const label = rawLabel.trim();
    const value = values[label]?.trim();
    return value || full;
  }), [item.prompt, values]);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(completedPrompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const updateValue = (label: string, value: string) => setValues((current) => ({ ...current, [label]: value }));
  const clearValues = () => setValues({});
  const completedCount = variables.filter((label) => values[label]?.trim()).length;

  return <article className={open ? "ggw-pw-card open" : "ggw-pw-card"}>
    <div className="ggw-pw-card-top">
      <div><span>{item.level}</span><em>{item.outcome}</em></div>
      <button onClick={copyPrompt} aria-label={`Copy ${item.title} prompt`}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>
    </div>
    <h3>{item.title}</h3>
    <p>{item.summary}</p>
    <div className="ggw-pw-tool-links" aria-label="Open tools used by this prompt">
      {item.tools.map((itemTool) => {
        const link = toolRegistry[itemTool];
        return <a key={itemTool} href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={12} />{link.label}</a>;
      })}
    </div>
    <button className="ggw-pw-expand" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "Hide prompt" : "Open prompt"}<ChevronDown size={15} /></button>
    {open && <div className="ggw-pw-open-area">
      {variables.length > 0 && <div className="ggw-pw-builder-bar">
        <div><SlidersHorizontal size={15} /><span><strong>Fill it here</strong><small>{completedCount}/{variables.length} fields completed</small></span></div>
        <button onClick={() => setCustomize(!customize)}>{customize ? "Hide fields" : "Customize prompt"}</button>
      </div>}
      {customize && variables.length > 0 && <div className="ggw-pw-variable-builder">
        <div className="ggw-pw-variable-head"><div><strong>Replace the brackets before copying</strong><span>Only add information needed for this task. Leave a field blank if it still needs an owner or source check.</span></div><button onClick={clearValues}>Clear fields</button></div>
        <div className="ggw-pw-variable-grid">
          {variables.map((label) => <label key={label}><span>{label}</span>{prefersLongField(label)
            ? <textarea value={values[label] || ""} onChange={(event) => updateValue(label, event.target.value)} placeholder={`Enter ${label.toLowerCase()}…`} rows={3} />
            : <input value={values[label] || ""} onChange={(event) => updateValue(label, event.target.value)} placeholder={`Enter ${label.toLowerCase()}…`} />}</label>)}
        </div>
      </div>}
      <div className="ggw-pw-preview-head"><strong>{completedCount ? "Your completed prompt" : "Full prompt"}</strong><button onClick={copyPrompt}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy prompt"}</button></div>
      <div className="ggw-pw-prompt">{completedPrompt}</div>
    </div>}
    <div className="ggw-pw-tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
  </article>;
}

export default function PromptWorkbench() {
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState<"All" | ToolId>("All");
  const [outcome, setOutcome] = useState("All");

  useEffect(() => {
    const deepLinkQuery = new URLSearchParams(window.location.search).get("q")?.trim();
    if (!deepLinkQuery) return;
    const frame = window.requestAnimationFrame(() => setQuery(deepLinkQuery));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const searchMatches = useMemo(() => libraryPrompts.filter((item) => matchesSearch(item, query)), [query]);

  const toolOptions = useMemo(() => {
    const counts = new Map<ToolId, number>();
    for (const item of searchMatches) {
      if (outcome !== "All" && item.outcome !== outcome) continue;
      for (const itemTool of item.tools) counts.set(itemTool, (counts.get(itemTool) || 0) + 1);
    }
    return Array.from(counts.entries()).sort(([a], [b]) => toolRegistry[a].label.localeCompare(toolRegistry[b].label));
  }, [searchMatches, outcome]);

  const outcomeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of searchMatches) {
      if (tool !== "All" && !item.tools.includes(tool)) continue;
      counts.set(item.outcome, (counts.get(item.outcome) || 0) + 1);
    }
    return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [searchMatches, tool]);

  const results = useMemo(() => searchMatches.filter((item) => {
    const matchesTool = tool === "All" || item.tools.includes(tool);
    const matchesOutcome = outcome === "All" || item.outcome === outcome;
    return matchesTool && matchesOutcome;
  }), [searchMatches, tool, outcome]);

  const changeQuery = (value: string) => {
    setQuery(value);
    setTool("All");
    setOutcome("All");
  };

  const changeTool = (value: "All" | ToolId) => {
    setTool(value);
    if (value !== "All" && outcome !== "All" && !searchMatches.some((item) => item.tools.includes(value) && item.outcome === outcome)) setOutcome("All");
  };

  const changeOutcome = (value: string) => {
    setOutcome(value);
    if (value !== "All" && tool !== "All" && !searchMatches.some((item) => item.outcome === value && item.tools.includes(tool))) setTool("All");
  };

  const clear = () => { setQuery(""); setTool("All"); setOutcome("All"); };
  const verifiedPopularSearches = popularSearches.map((value) => ({ value, count: countMatches(value) })).filter((item) => item.count > 0);

  return <main className="ggw-prompt-workbench">
    <section className="ggw-pw-hero">
      <span><Sparkles size={16} /> GGW POWER PROMPT LIBRARY</span>
      <h1>Find the job. Fill the fields. Do the work.</h1>
      <p>Use plain job language such as member renewal, event follow-up, board report, grant reporting, Outlook email, compliance, or cash flow. The library matches the meaning across titles, tools, tags, outcomes, and prompt content.</p>
    </section>

    <section className="ggw-pw-controls" aria-label="Prompt filters">
      <label className="ggw-pw-search">
        <Search size={19} />
        <input value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Find a job: member renewal, event follow-up, board report, grant reporting…" aria-label="Search GGW prompt library" />
        {query && <button onClick={() => changeQuery("")} aria-label="Clear search">×</button>}
      </label>

      <div className="ggw-pw-popular">
        <strong>Common GGW jobs</strong>
        <div>{verifiedPopularSearches.map(({ value, count }) => <button key={value} onClick={() => changeQuery(value)}>{value} <small>{count}</small></button>)}</div>
      </div>

      <div className="ggw-pw-selects">
        <label><strong>Solution</strong><select value={tool} onChange={(event) => changeTool(event.target.value as "All" | ToolId)}><option value="All">All solutions ({searchMatches.filter((item) => outcome === "All" || item.outcome === outcome).length})</option>{toolOptions.map(([value, count]) => <option value={value} key={value}>{toolRegistry[value].label} ({count})</option>)}</select></label>
        <label><strong>Work outcome</strong><select value={outcome} onChange={(event) => changeOutcome(event.target.value)}><option value="All">All outcomes ({searchMatches.filter((item) => tool === "All" || item.tools.includes(tool)).length})</option>{outcomeOptions.map(([value, count]) => <option value={value} key={value}>{value} ({count})</option>)}</select></label>
      </div>

      <div className="ggw-pw-result-count" aria-live="polite"><strong>{results.length}</strong><span>matching prompts</span><span className="ggw-pw-total">{libraryPrompts.length} total in the library</span><button onClick={clear}>Reset filters</button></div>
    </section>

    {results.length ? <section className="ggw-pw-grid">{results.map((item) => <PromptCard key={item.id} item={item} />)}</section> : <section className="ggw-pw-empty"><Search size={24} /><strong>No direct match for that phrase.</strong><span>The dropdown filters never offer empty combinations. Try one broader job term, or reset to see the full library.</span><button onClick={clear}>Show all prompts</button></section>}

    <section className="ggw-pw-foot"><ShieldCheck size={20} /><div><strong>The prompt is the accelerator, not the authority.</strong><span>WildApricot, approved Google or Microsoft files, signed agreements, official regulator/funder sources, GGW policy, and qualified professional guidance remain authoritative. Verify names, dates, links, amounts, restrictions, eligibility, recipients, claims, approvals, and compliance-sensitive decisions before use.</span></div></section>
  </main>;
}
