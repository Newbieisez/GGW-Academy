"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Search, ShieldCheck, Sparkles } from "lucide-react";
import { promptOutcomes, prompts, promptTools, type PromptItem } from "./prompt-data";
import { toolRegistry, type ToolId } from "./tool-registry";

const popularSearches = ["event promotion", "member renewal", "clean a Sheet", "board report", "email follow-up", "automation", "cash flow"];

function PromptCard({ item }: { item: PromptItem }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(item.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

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
      {open ? "Hide full prompt" : "Show full prompt"}<ChevronDown size={15} />
    </button>
    {open && <div className="ggw-pw-prompt">{item.prompt}</div>}
    <div className="ggw-pw-tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
  </article>;
}

export default function PromptWorkbench() {
  const [query, setQuery] = useState("");
  const [tool, setTool] = useState<"All" | ToolId>("All");
  const [outcome, setOutcome] = useState("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prompts.filter((item) => {
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
      <h1>Search the job. Copy the prompt. Do the work.</h1>
      <p>This is the deep library—not a handful of examples. Search by the task in front of you, filter by the tool you are using, then open the full prompt. Every prompt is written for real GGW work and includes boundaries that keep the source facts controlled.</p>
    </section>

    <section className="ggw-pw-controls" aria-label="Prompt filters">
      <label className="ggw-pw-search">
        <Search size={19} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search: renewal, event follow-up, formula, board report, cash flow, Canva…" />
        {query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </label>

      <div className="ggw-pw-popular">
        <strong>Try a job</strong>
        <div>{popularSearches.map((value) => <button key={value} onClick={() => setQuery(value)}>{value}</button>)}</div>
      </div>

      <div className="ggw-pw-selects">
        <label><strong>Solution</strong><select value={tool} onChange={(event) => setTool(event.target.value as "All" | ToolId)}><option value="All">All solutions</option>{promptTools.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
        <label><strong>Work outcome</strong><select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option value="All">All outcomes</option>{promptOutcomes.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      </div>

      <div className="ggw-pw-result-count"><strong>{results.length}</strong><span>matching prompts</span><span className="ggw-pw-total">{prompts.length} total in the library</span><button onClick={clear}>Reset filters</button></div>
    </section>

    {results.length ? <section className="ggw-pw-grid">{results.map((item) => <PromptCard key={item.id} item={item} />)}</section> : <section className="ggw-pw-empty"><Search size={24} /><strong>No matching prompt yet.</strong><span>Try a broader job word or reset the filters.</span><button onClick={clear}>Show all prompts</button></section>}

    <section className="ggw-pw-foot"><ShieldCheck size={20} /><div><strong>The prompt is the accelerator, not the authority.</strong><span>WildApricot and approved Google files remain the source. Check names, dates, links, amounts, eligibility, recipients, claims, and commitments before using an AI-assisted result.</span></div></section>
  </main>;
}
