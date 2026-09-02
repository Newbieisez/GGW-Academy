"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Copy, ExternalLink, Palette, ShieldCheck } from "lucide-react";

type CanvaAid = {
  id: string;
  title: string;
  useWhen: string;
  outcome: string;
  steps: string[];
  prompt: string;
  checks: string[];
};

const canvaAids: CanvaAid[] = [
  {
    id: "event-creative",
    title: "Create event graphics from approved WildApricot facts",
    useWhen: "The WildApricot event record is approved and you need a flyer, social graphic, or email visual without retyping the event details.",
    outcome: "One accurate visual brief that can be dropped into an approved GGW Canva template.",
    steps: [
      "Open the approved event record in WildApricot and copy only the facts needed for the visual: event name, date, time, location, registration URL, audience, pricing, eligibility, and approved description.",
      "Use the prompt below in Gemini to turn those facts into a concise Canva brief. Do not ask AI to invent missing information.",
      "Open Canva in the GGW team and duplicate the approved GGW event template. Never edit the master template directly.",
      "Replace the template fields with the approved event facts and AI-prepared copy. Keep the original event name, date, time, location, price, eligibility, and registration URL unchanged.",
      "Check the final design against WildApricot before downloading, sharing, or publishing it.",
    ],
    prompt: "Create a Canva production brief for a GGW event using only these approved WildApricot facts: [PASTE FACTS]. Return: headline, short supporting copy, CTA, visual hierarchy, suggested image direction, and accessibility alt text. Preserve all dates, times, prices, eligibility, location, and URLs exactly. If anything is missing, write [CHECK] instead of inventing it.",
    checks: ["Event facts match WildApricot", "GGW approved template used", "Registration URL works", "Alt text is included"],
  },
  {
    id: "social-repurpose",
    title: "Repurpose one approved design for multiple social formats",
    useWhen: "You already have an approved GGW Canva design and need versions for different channels or placements.",
    outcome: "Channel-sized versions that keep the same approved message and brand treatment.",
    steps: [
      "Duplicate the approved design before changing size or layout.",
      "If the GGW Canva plan includes Resize or repurposing tools, use them to create the needed formats. If not, create a new design at the required dimensions and copy the approved content manually.",
      "Reflow the layout rather than shrinking everything. Keep the headline, CTA, event facts, logos, and required disclaimers readable.",
      "Use Gemini only to shorten copy when necessary. Tell it which facts and CTA must remain unchanged.",
      "Review every version separately before publishing because text can be cropped or links/QR codes can become unreadable after resizing.",
    ],
    prompt: "Shorten this approved GGW social copy for [CHANNEL / FORMAT] while preserving the event name, date, time, CTA, registration URL, eligibility, and required wording exactly: [COPY]. Return one concise version plus a CHECK list of anything that must be verified after resizing. Do not introduce new claims or hashtags unless provided.",
    checks: ["Required facts survived resizing", "Text is readable", "Logo/brand treatment is intact", "CTA or QR code is usable"],
  },
  {
    id: "board-visual",
    title: "Turn approved metrics into a board-ready Canva visual",
    useWhen: "Leadership needs a clean chart, one-page visual, or presentation graphic from approved GGW metrics.",
    outcome: "A concise visual that separates facts from interpretation and does not overstate impact.",
    steps: [
      "Start from an approved Google Sheet and confirm the reporting period, definitions, and totals before opening Canva.",
      "Use Gemini to propose the clearest visual structure from the supplied metrics: headline, chart/table choice, supporting text, and source note.",
      "Create the visual in an approved GGW Canva report or presentation template.",
      "Enter the numbers from the source Sheet directly. Do not copy AI-generated numbers into the design without checking them against the Sheet.",
      "Add the reporting period/source note and review every comparison, percentage, and claim before sharing with leadership.",
    ],
    prompt: "Using only these approved GGW metrics and definitions, create a Canva-ready visual brief for leadership: [PASTE METRICS]. Return: recommended headline, best chart/table format, 3 supporting facts, a short interpretation labeled Recommendation, and a source-note format. Do not infer causation, ROI, or impact that is not explicitly supported. Mark uncertain items [CHECK].",
    checks: ["Numbers tie to Google Sheets", "Reporting period is visible", "Facts and recommendations are separated", "No unsupported impact claim"],
  },
  {
    id: "member-spotlight",
    title: "Create a member or speaker spotlight safely",
    useWhen: "GGW has approved information and permission to feature a member, speaker, volunteer, or partner.",
    outcome: "A polished spotlight using only approved biography, role, quote, photo, and event information.",
    steps: [
      "Confirm GGW has permission to use the person’s name, photo, quote, role, and other supplied information for the intended channel.",
      "Gather only the approved source material. Do not ask AI to research or infer personal background from unrelated sources.",
      "Use Gemini to create concise spotlight copy from the approved material only.",
      "Duplicate the approved GGW Canva spotlight template and insert the approved photo and copy.",
      "Verify spelling, title, organization, quote, permissions, and any event details before publishing.",
    ],
    prompt: "Create concise GGW spotlight copy using only this approved information: [PASTE APPROVED BIO / ROLE / QUOTE / EVENT FACTS]. Return: headline, 60-word spotlight, short social caption, and alt text. Do not add achievements, personal details, quotes, affiliations, or claims that are not supplied. Mark any missing item [CHECK].",
    checks: ["Permission is confirmed", "Name/title/company are correct", "Quote is exact and approved", "Photo use is approved"],
  },
  {
    id: "repeatable-template",
    title: "Build a repeatable GGW Canva template workflow",
    useWhen: "The team repeatedly creates the same type of event, social, report, or member graphic and wants a safer faster process.",
    outcome: "A reusable template and checklist that staff can duplicate without rebuilding the design each time.",
    steps: [
      "Choose one recurring asset and identify which elements never change versus which fields change every time.",
      "Create or confirm the approved master in the GGW Canva team. Lock or clearly label brand elements that should not be changed when the Canva plan supports it.",
      "Use obvious placeholders such as EVENT NAME, DATE, CTA, PHOTO, and SOURCE so users know exactly what must be replaced.",
      "Create a short source checklist naming where each variable field comes from, such as WildApricot event record or an approved Google Sheet.",
      "Test the template with one fictional or low-risk example. Confirm a new user can duplicate it without changing the master.",
    ],
    prompt: "Design the content structure for a reusable GGW Canva template for [ASSET TYPE]. Approved source systems: [SOURCES]. Return: fixed brand elements, variable fields, placeholder labels, source for each variable field, final review checklist, and a short user instruction. Do not suggest fields that are not available in the named sources.",
    checks: ["Master is protected from accidental edits", "Variable fields have named sources", "New users can duplicate it", "Review checklist is attached"],
  },
];

function CanvaAidCard({ aid }: { aid: CanvaAid }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(aid.prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return <article className={open ? "ggw-canva-card open" : "ggw-canva-card"}>
    <button className="ggw-canva-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="ggw-canva-icon"><Palette size={19} /></span>
      <span className="ggw-canva-copy"><strong>{aid.title}</strong><small>{aid.outcome}</small></span>
      <ChevronDown size={18} />
    </button>
    {open && <div className="ggw-canva-detail">
      <div className="ggw-canva-use"><strong>Use this when</strong><span>{aid.useWhen}</span></div>
      <div className="ggw-canva-steps"><strong>Do it</strong><ol>{aid.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div className="ggw-canva-prompt"><div><strong>Copy this prompt</strong><span>Replace the brackets with approved GGW information.</span></div><button onClick={copyPrompt}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy"}</button><p>{aid.prompt}</p></div>
      <div className="ggw-canva-check"><ShieldCheck size={18} /><div><strong>Final check</strong><span>{aid.checks.join(" · ")}</span></div></div>
    </div>}
  </article>;
}

export default function CanvaHelper() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const sync = () => setShow(document.body.dataset.ggwWorkbenchView === "home");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-ggw-workbench-view"] });
    return () => observer.disconnect();
  }, []);

  if (!show) return null;

  const jumpToConnector = () => document.getElementById("ggw-connectors-helper")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <section className="ggw-canva-helper" aria-labelledby="ggw-canva-title">
    <div className="ggw-canva-head">
      <div><span>CANVA + GGW</span><h2 id="ggw-canva-title">Create the visual. Keep the facts controlled.</h2><p>Use Canva when the job is visual. WildApricot and approved Google files remain the source for facts; Gemini helps prepare copy and structure; Canva turns that approved content into branded assets.</p></div>
      <button onClick={jumpToConnector}><ExternalLink size={16} />How to connect Canva</button>
    </div>
    <div className="ggw-canva-list">{canvaAids.map((aid) => <CanvaAidCard key={aid.id} aid={aid} />)}</div>
  </section>;
}
