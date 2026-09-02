"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Search, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { prompts, type PromptItem } from "./prompt-data";
import { nonprofitPrompts } from "./nonprofit-prompt-data";
import { toolRegistry, type ToolId } from "./tool-registry";

const libraryPrompts = [...prompts, ...nonprofitPrompts];
const libraryOutcomes = Array.from(new Set(libraryPrompts.map((item) => item.outcome)));
const libraryTools = Array.from(new Set(libraryPrompts.flatMap((item) => item.tools)));
const popularSearches = ["event promotion", "member renewal", "board report", "grant", "compliance", "cash flow", "fundraising", "automation"];

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
      <div>
        <span>{item.level}</span>
        <em>{item.outcome}</em>
      </div>
      <button onClick={copyPrompt} aria-label={`Copy ${item.title} prompt`}>
        {copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}
      </button>
    </div>
    <h3>{item.title}</h3>
    <p>{item.summary}</p>
    <div className="ggw-pw-tool-links" aria-label="Open tools used by this prompt">
      {item.tools.map((tool) => {
        const link = toolRegistry[tool];
        return <a key={tool} href={link.url} target="_blank" rel="noreferrer"><ExternalLink size={12} />{link.label}</a>;
      })}
    </div>
    <button className="ggw-pw-expand" onClick={() => setOpen(!open)} aria-expanded={open}>
      {open ? "Hide prompt" : "Open prompt"}<ChevronDown size={15} />
    </button>
    {open && <div className="ggw-pw-open-area">
      {variables.length > 0 && <div className="ggw-pw-builder-bar">
        <div><SlidersHorizontal size={15} /><span><strong>Fill it here</strong><small>{completedCount}/{variables.length} fields completed</small></span></div>
        <button onClick={() => setCustomize(!customize)}>{customize ? "Hide fields" : "Customize prompt"}</button>
      </div>}

      {customize && variables.length > 0 && <div className="ggw-pw-variable-builder">
        <div className="ggw-pw-variable-head"><div><strong>Replace the brackets before copying</strong><span>Only add information needed for this task. Leave a field blank if it still needs an owner or source check.</span></div><button onClick={clearValues}>Clear fields</button></div>
        <div className="ggw-pw-variable-grid">
          {variables.map((label) => <label key={label}>
            <span>{label}</span>
            {prefersLongField(label)
              ? <textarea value={values[label] || ""} onChange={(event) => updateValue(label, event.target.value)} placeholder={`Enter ${label.toLowerCase()}…`} rows={3} />
              : <input value={values[label] || ""} onChange={(event) => updateValue(label, event.target.value)} placeholder={`Enter ${label.toLowerCase()}…`} />}
          </label>)}
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

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return libraryPrompts.filter((item) => {
      const matchesTool = tool === "All" || item.tools.includes(tool);
      const matchesOutcome = outcome === "All" || item.outcome === outcome;
      if (!matchesTool || !matchesOutcome) return false;
      if (!q) return true;
      const haystack = [item.title, item.summary, item.outcome, item.prompt, ...item.tools, ...item.tags].join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }, [query, tool, outcome]);

  const clear = () => { setQuery(""); setTool("All"); setOutcome("All"); };

  return <main className="ggw-prompt-workbench">
    <section className="ggw-pw-hero">
      <span><Sparkles size={16} /> GGW POWER PROMPT LIBRARY</span>
      <h1>Search the job. Fill the fields. Do the work.</h1>
      <p>Search by the job in front of you—membership, events, grants, fundraising, finance, board operations, compliance, reporting, Google Workspace, or automation. Open a prompt, fill its variables directly in the portal, then copy a task-ready version.</p>
    </section>

    <section className="ggw-pw-controls" aria-label="Prompt filters">
      <label className="ggw-pw-search">
        <Search size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: renewal, grant, board, compliance, cash flow, fundraising, event follow-up…" />
        {query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </label>

      <div className="ggw-pw-popular">
        <strong>Try a job</strong>
        <div>{popularSearches.map((value) => <button key={value} onClick={() => setQuery(value)}>{value}</button>)}</div>
      </div>

      <div className="ggw-pw-selects">
        <label><strong>Solution</strong><select value={tool} onChange={(event) => setTool(event.target.value as "All" | ToolId)}><option value="All">All solutions</option>{libraryTools.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label><strong>Work outcome</strong><select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option value="All">All outcomes</option>{libraryOutcomes.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>

      <div className="ggw-pw-result-count"><strong>{results.length}</strong><span>matching prompts</span><span className="ggw-pw-total">{libraryPrompts.length} total in the library</span><button onClick={clear}>Reset filters</button></div>
    </section>

    {results.length ? <section className="ggw-pw-grid">{results.map((item) => <PromptCard key={item.id} item={item} />)}</section> : <section className="ggw-pw-empty"><Search size={24} /><strong>No matching prompt yet.</strong><span>Try a broader job word or reset the filters.</span><button onClick={clear}>Show all prompts</button></section>}

    <section className="ggw-pw-foot"><ShieldCheck size={20} /><div><strong>The prompt is the accelerator, not the authority.</strong><span>WildApricot, approved Google files, signed agreements, official regulator/funder sources, GGW policy, and qualified professional guidance remain authoritative. Verify names, dates, links, amounts, restrictions, eligibility, recipients, claims, approvals, and compliance-sensitive decisions before use.</span></div></section>
  </main>;
}
