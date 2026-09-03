"use client";

import { usePathname } from "next/navigation";
import { ExternalLink, Mail, Sparkles } from "lucide-react";
import { toolRegistry } from "./tool-registry";

export default function HomeMicrosoftOptions() {
  const pathname = usePathname();
  if (pathname.includes("/prompts") || pathname.includes("/legal") || pathname.includes("/progress")) return null;

  const outlook = toolRegistry.Outlook;
  const copilot = toolRegistry["Microsoft Copilot"];

  return <section className="ggw-ms-options" id="microsoft-tools" aria-labelledby="ggw-ms-title">
    <div className="ggw-ms-head">
      <div><span>Microsoft 365 options</span><h2 id="ggw-ms-title">Use the tools you actually work in.</h2></div>
      <p>GGW workflows should work whether someone prefers Gmail + Gemini or Outlook + Microsoft Copilot. Availability of Copilot features can vary by Microsoft 365 license and administrator settings.</p>
    </div>
    <div className="ggw-ms-grid">
      <article>
        <div className="ggw-ms-icon"><Mail size={22} /></div>
        <div><strong>Outlook</strong><p>Use Outlook for GGW email and calendar work. Where Copilot in Outlook is available, it can help summarize threads, draft messages, improve tone/clarity, and prepare for meetings—then the user verifies the source before sending or acting.</p></div>
        <div className="ggw-ms-actions"><a href={outlook.url} target="_blank" rel="noreferrer">Open Outlook <ExternalLink size={12} /></a>{outlook.learnUrl && <a href={outlook.learnUrl} target="_blank" rel="noreferrer">Microsoft help <ExternalLink size={12} /></a>}</div>
      </article>
      <article>
        <div className="ggw-ms-icon"><Sparkles size={22} /></div>
        <div><strong>Microsoft Copilot</strong><p>Use Copilot Chat for approved drafting, research, summaries, meeting preparation, and reporting. It must not claim access to email, files, meetings, or organizational data that the current account cannot actually access.</p></div>
        <div className="ggw-ms-actions"><a href={copilot.url} target="_blank" rel="noreferrer">Open Copilot <ExternalLink size={12} /></a>{copilot.learnUrl && <a href={copilot.learnUrl} target="_blank" rel="noreferrer">Microsoft help <ExternalLink size={12} /></a>}</div>
      </article>
    </div>
    <div className="ggw-ms-note"><strong>Same GGW rule in either ecosystem:</strong><span>Use approved sources, minimize sensitive information, verify names/dates/links/amounts/claims, and keep a human approval point before external communications or compliance-sensitive decisions.</span></div>
  </section>;
}
