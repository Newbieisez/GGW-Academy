"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { prompts, type PromptItem } from "./prompt-data";
import { nonprofitPrompts } from "./nonprofit-prompt-data";
import { platformExpansionPrompts } from "./platform-expansion-prompt-data";

const allPrompts = [...prompts, ...nonprofitPrompts, ...platformExpansionPrompts];

function matches(item: PromptItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return [item.title, item.summary, item.outcome, item.prompt, ...item.tools, ...item.tags].join(" ").toLowerCase().includes(q);
}

export default function HomeSmartSearch() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!isHome) return;
    const frame = window.requestAnimationFrame(() => {
      const container = document.querySelector<HTMLElement>(".ggw-workbench-search");
      const input = container?.querySelector<HTMLInputElement>('input[aria-label="Search GGW AI job aids"]');
      if (!container || !input) return;
      setHost(container);
      const sync = () => setQuery(input.value);
      const syncAfterClick = () => window.setTimeout(sync, 0);
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== "Enter" || !input.value.trim()) return;
        event.preventDefault();
        window.location.href = `/prompts?q=${encodeURIComponent(input.value.trim())}`;
      };
      sync();
      input.addEventListener("input", sync);
      input.addEventListener("change", sync);
      input.addEventListener("keydown", onKeyDown);
      container.addEventListener("click", syncAfterClick);
      return () => {
        input.removeEventListener("input", sync);
        input.removeEventListener("change", sync);
        input.removeEventListener("keydown", onKeyDown);
        container.removeEventListener("click", syncAfterClick);
      };
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isHome]);

  const results = useMemo(() => allPrompts.filter((item) => matches(item, query)), [query]);
  const topResults = results.slice(0, 6);

  if (!isHome || !host || !query.trim()) return null;

  return createPortal(
    <div className="ggw-home-search-results" role="region" aria-live="polite" aria-label="Search results">
      {topResults.length ? <>
        <div className="ggw-home-search-head"><strong>{results.length} useful match{results.length === 1 ? "" : "es"}</strong><span>Press Enter to see all results</span></div>
        <div className="ggw-home-search-list">
          {topResults.map((item) => <a key={item.id} href={`/prompts?q=${encodeURIComponent(item.title)}`}>
            <span><strong>{item.title}</strong><small>{item.summary}</small></span>
            <em>{item.outcome}</em>
            <ArrowRight size={14} />
          </a>)}
        </div>
        {results.length > topResults.length && <a className="ggw-home-search-all" href={`/prompts?q=${encodeURIComponent(query.trim())}`}><Search size={14} />See all {results.length} matches</a>}
      </> : <div className="ggw-home-search-none"><strong>No exact match in the library.</strong><span>Press Enter to search the full Prompt Library, or try a broader phrase such as member, event, board, grant, email, reporting, Outlook, or automation.</span></div>}
    </div>,
    host,
  );
}
