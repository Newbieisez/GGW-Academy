"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Mail,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

type Aid = {
  id: string;
  title: string;
  summary: string;
  useWhen: string;
  time: string;
  icon: "mail" | "event" | "members" | "data" | "automation" | "visual";
  steps: string[];
  prompt: string;
  check: string[];
};

type AutomationAid = {
  id: string;
  title: string;
  outcome: string;
  connector: "Zapier" | "Make" | "Webhook / API";
  whatItIs: string;
  whyUseful: string;
  steps: string[];
  aiStep: string;
  verify: string[];
};

type PromptAddition = {
  id: string;
  title: string;
  tool: string;
  summary: string;
  prompt: string;
  tags: string[];
};

const aids: Aid[] = [
  {
    id: "member-email",
    title: "Write or improve a member email",
    summary: "Turn rough notes, an event update, or a WildApricot audience into a polished message without starting from a blank page.",
    useWhen: "You know what needs to be communicated but want help making it clear, concise, and on-brand.",
    time: "5 min",
    icon: "mail",
    steps: [
      "Start with the audience, purpose, approved facts, and desired action.",
      "Use the prompt below in Gemini or the approved AI tool available in Google Workspace.",
      "Review names, dates, links, promises, audience, and attachments before sending from Gmail or WildApricot.",
    ],
    prompt: "Draft a concise GGW member email using only the facts below. Audience: [AUDIENCE]. Purpose: [PURPOSE]. Desired action: [ACTION]. Approved facts: [FACTS]. Tone: confident, welcoming, human, and inclusive. Give me: subject line, preview text, email body, CTA, and a CHECK BEFORE SENDING list. Do not invent dates, benefits, links, or commitments.",
    check: ["Audience is correct", "Dates and links match the source", "No invented promises", "CTA is obvious"],
  },
  {
    id: "event-kit",
    title: "Turn one event into a promotion kit",
    summary: "Create email, social copy, talking points, and a visual brief from one approved WildApricot event record.",
    useWhen: "An event is already created and the team needs channel-ready promotion without rewriting the same details repeatedly.",
    time: "10 min",
    icon: "event",
    steps: [
      "Copy only the approved event facts: title, audience, date/time, location, description, registration link, and deadline.",
      "Ask AI to create channel-specific drafts from those facts only.",
      "Check every channel against the WildApricot event record before publishing.",
    ],
    prompt: "Create a GGW event promotion kit using only these approved event facts: [PASTE FACTS]. Return: 1) member email, 2) LinkedIn post, 3) short social caption, 4) 5 talking points, 5) a visual brief for Canva or image generation, and 6) a final fact-check list. Preserve the event name, date, time, location, registration URL, deadline, and eligibility exactly. Mark anything missing as [CHECK].",
    check: ["Registration URL works", "Date/time/location match WildApricot", "Eligibility is accurate", "Visual claims are supported"],
  },
  {
    id: "member-insights",
    title: "Understand member or registration data",
    summary: "Turn a WildApricot export into useful segments, patterns, follow-up lists, and questions to investigate.",
    useWhen: "You need insight from members, registrations, renewals, or event activity without manually scanning rows.",
    time: "10 min",
    icon: "data",
    steps: [
      "Export only the fields needed for the question and work from a copy in Google Sheets.",
      "Use Gemini in Sheets or an approved AI tool to summarize patterns and propose segments.",
      "Validate sample rows before using the result for outreach, reporting, or record updates.",
    ],
    prompt: "Analyze this WildApricot export for GGW. Goal: [GOAL]. Use only the columns provided. Return: key patterns, useful segments, outliers or missing data, a prioritized follow-up list, and 5 questions the team should investigate. Do not infer sensitive attributes or invent member intent. For every recommendation, name the field or pattern that supports it.",
    check: ["Only necessary fields were exported", "Segments are supported by data", "No sensitive inference", "Sample rows were verified"],
  },
  {
    id: "renewal-engagement",
    title: "Prepare better renewal or engagement outreach",
    summary: "Use membership status and engagement signals to create more relevant drafts while keeping a person in control of outreach.",
    useWhen: "You have a defined member segment and want a faster first draft for renewal, re-engagement, or welcome communication.",
    time: "10 min",
    icon: "members",
    steps: [
      "Define the segment and the exact reason they are receiving the message.",
      "Give AI only the approved benefits, deadlines, and next step.",
      "Review tone, eligibility, membership status, and merge fields before sending through WildApricot.",
    ],
    prompt: "Create a GGW [renewal / re-engagement / welcome] message for this segment: [SEGMENT]. Reason for outreach: [REASON]. Approved benefits or facts: [FACTS]. Deadline or next step: [NEXT STEP]. Write a concise subject line, preview text, email, CTA, and optional short follow-up. Do not invent benefits, discounts, deadlines, or membership status. Add a CHECK BEFORE SENDING list.",
    check: ["Segment definition is intentional", "Benefits are approved", "Membership status is accurate", "Merge fields are tested"],
  },
  {
    id: "automation-helper",
    title: "Automate repetitive WildApricot work",
    summary: "Connect WildApricot to Google tools and AI so routine lists, drafts, summaries, and updates do not require repeated copying.",
    useWhen: "A staff member repeats the same trigger → copy → update → draft sequence every week or after every event.",
    time: "15 min setup",
    icon: "automation",
    steps: [
      "Write the workflow in one sentence: When X happens in WildApricot, prepare Y in Z tool.",
      "Choose Zapier for a simple trigger/action flow or Make for a multi-step workflow.",
      "Test one fictional or low-risk record, confirm duplicates and permissions, then enable it for real work.",
    ],
    prompt: "Design the simplest automation for this GGW workflow: [DESCRIBE WORKFLOW]. WildApricot is the system of record. Return: trigger, required fields, connector recommendation (Zapier, Make, or API), actions in order, where AI adds value, human approval point, duplicate protection, failure handling, and a 5-step test plan. Prefer no-code and the fewest moving parts.",
    check: ["System of record stays clear", "Least data needed", "Duplicate behavior tested", "Human approval exists before external impact"],
  },
  {
    id: "deck-video",
    title: "Create a deck, visual, or short video faster",
    summary: "Turn approved facts into a clear story before asking AI to generate slides, images, or video scenes.",
    useWhen: "You need a presentation or media asset and want AI to accelerate the first draft without creating random decoration.",
    time: "10 min",
    icon: "visual",
    steps: [
      "Write the audience, one message, approved facts, and desired action first.",
      "Ask AI for the narrative, slide/scene structure, and visual purpose before generating assets.",
      "Review claims, accessibility, representation, links, and brand fit before publishing.",
    ],
    prompt: "Build a concise GGW [presentation / visual / 60-second video] plan. Audience: [AUDIENCE]. One message they should remember: [MESSAGE]. Approved facts: [FACTS]. Desired action: [ACTION]. Return the minimum number of slides or scenes needed, purpose of each, suggested visual, speaker/voiceover notes, accessibility text, and [CHECK] markers for anything that needs confirmation. Keep the style modern, confident, inclusive, and human.",
    check: ["One clear audience outcome", "Facts match source", "Accessibility included", "No unsupported visual claims"],
  },
];

const automations: AutomationAid[] = [
  {
    id: "registration-sheet",
    title: "New event registration → Google Sheet → AI summary",
    outcome: "Keep an always-current working registration sheet and use AI to summarize attendance patterns or prepare follow-up groups.",
    connector: "Zapier",
    whatItIs: "Zapier is a no-code connector that watches for a trigger in one app and performs an action in another.",
    whyUseful: "Best for straightforward workflows where WildApricot should trigger one or two actions without someone exporting data manually.",
    steps: [
      "In Zapier, choose WildApricot as the trigger app and select the supported registration/contact event that matches the workflow.",
      "Connect the approved WildApricot account and test the trigger with a test or low-risk record.",
      "Add Google Sheets as the action and map only the fields the team actually needs.",
      "Turn on duplicate protection using a unique member, contact, or registration identifier where available.",
      "Use Gemini in the Sheet for summaries, segments, or follow-up preparation; keep record changes in WildApricot intentional.",
    ],
    aiStep: "Ask Gemini to summarize registrations, group attendees by useful non-sensitive fields, identify missing data, or prepare a reviewed follow-up list.",
    verify: ["Correct event", "Correct field mapping", "No duplicate rows", "Sheet access is appropriate", "AI does not update WildApricot without review"],
  },
  {
    id: "member-outreach",
    title: "Membership change → prepared outreach",
    outcome: "Prepare timely welcome, renewal, or follow-up drafts when a supported WildApricot member/contact event occurs.",
    connector: "Zapier",
    whatItIs: "Zapier is the easiest starting point when the workflow is essentially: when this happens in WildApricot, do this next.",
    whyUseful: "It reduces missed follow-up and repetitive drafting while keeping WildApricot as the source of membership status.",
    steps: [
      "Choose the WildApricot trigger that matches the membership/contact event available in the connector.",
      "Add a controlled Google Sheet, Gmail draft, or other approved destination as the next step.",
      "Pass only the fields needed to prepare the outreach.",
      "Use AI to draft the message from approved facts and the reason for outreach.",
      "Keep the workflow in draft/review mode until the team has verified segment logic and merge fields.",
    ],
    aiStep: "Generate a draft based on membership status, approved benefits, and the intended next action; do not let AI invent eligibility or benefits.",
    verify: ["Membership status is current", "Segment logic is correct", "Merge fields work", "No unintended recipients", "First versions are not auto-sent"],
  },
  {
    id: "event-campaign",
    title: "WildApricot event → multi-step campaign workflow",
    outcome: "Move approved event information through several preparation steps without recreating the same work in each tool.",
    connector: "Make",
    whatItIs: "Make is a visual no-code automation platform. It is useful when a workflow has several steps, branches, filters, or data transformations.",
    whyUseful: "Use it when one WildApricot event needs to feed a Sheet, internal checklist, content preparation, and follow-up workflow in a controlled sequence.",
    steps: [
      "Create a scenario in Make and connect WildApricot using the supported module/API connection available to the team.",
      "Start with the event or registration trigger and add a filter so only the intended event/workflow continues.",
      "Route only approved event fields to each destination step.",
      "Add AI only where transformation helps: summaries, channel copy, categorization, or draft preparation.",
      "Test every route with test data and configure visible error handling before scheduling the scenario.",
    ],
    aiStep: "Transform one approved event source into channel-specific drafts, internal summaries, or follow-up preparation without changing the source record.",
    verify: ["Filter catches only the intended event", "Private fields do not travel unnecessarily", "Failed routes are visible", "AI output is reviewed", "Schedule is appropriate"],
  },
  {
    id: "custom-webhook",
    title: "WildApricot change → custom workflow",
    outcome: "Start a custom process when a ready-made Zapier or Make connector does not expose the exact event or action needed.",
    connector: "Webhook / API",
    whatItIs: "A webhook is a notification sent when something changes. An API is a controlled way for another system to read or update WildApricot data.",
    whyUseful: "This is the advanced option for gaps that no-code connectors cannot cover. It should have a technical owner because authentication, errors, rate limits, and permissions matter.",
    steps: [
      "Confirm that Zapier or Make cannot cover the requirement first.",
      "Define the exact WildApricot event/data needed and the minimum fields required.",
      "Have the technical owner configure authentication, webhook/API handling, logging, retries, and failure alerts.",
      "Use AI downstream for preparation or analysis, not as an unreviewed authority to change membership or financial records.",
      "Test in a controlled environment and document how to disable or roll back the workflow.",
    ],
    aiStep: "Use AI after the integration has safely delivered the required fields—for example to classify, summarize, or prepare a draft for review.",
    verify: ["Technical owner assigned", "Authentication is secure", "Rate/error handling exists", "Least privilege used", "Rollback documented"],
  },
];

const promptAdditions: PromptAddition[] = [
  {
    id: "wa-member-segments",
    title: "Find useful member segments from a WildApricot export",
    tool: "WildApricot + Sheets",
    summary: "Turn a member export into supported, non-sensitive groups for outreach or analysis.",
    prompt: "Review this WildApricot member export for GGW. Goal: [GOAL]. Suggest useful segments using only fields present in the export. For each segment, show the rule, count if available, why it matters, and a recommended next action. Flag missing or inconsistent data. Do not infer sensitive attributes, intent, or eligibility that is not explicitly present.",
    tags: ["WildApricot", "Members", "Sheets", "Segmentation"],
  },
  {
    id: "wa-event-followup",
    title: "Build post-event follow-up from registration data",
    tool: "WildApricot + Gemini",
    summary: "Prepare different follow-up drafts without manually rewriting each audience message.",
    prompt: "Using these approved WildApricot event details and registration fields, prepare post-event follow-up for GGW. Create: attendee thank-you, no-show follow-up, speaker/partner thank-you, and internal action summary. Use only provided facts. Preserve links, names, dates, and commitments exactly. Add a CHECK BEFORE SENDING list for each audience.",
    tags: ["WildApricot", "Events", "Follow-up", "Email"],
  },
  {
    id: "wa-renewal",
    title: "Draft renewal outreach by member segment",
    tool: "WildApricot + Gemini",
    summary: "Create a first draft from approved membership facts and a clearly defined segment.",
    prompt: "Draft GGW membership renewal outreach for this segment: [SEGMENT]. Approved membership facts/benefits: [FACTS]. Renewal deadline or next step: [NEXT STEP]. Return subject line, preview text, concise email, CTA, and optional reminder. Do not invent benefits, discounts, dates, eligibility, or member status. Add a merge-field and fact-check checklist.",
    tags: ["WildApricot", "Renewal", "Members", "Email"],
  },
  {
    id: "wa-event-kit",
    title: "Turn a WildApricot event into a campaign kit",
    tool: "WildApricot + Gemini",
    summary: "Reuse one approved event source across email, social, and creative work.",
    prompt: "Create a GGW campaign kit using only these approved WildApricot event facts: [FACTS]. Return: member email, LinkedIn post, short social caption, 5 talking points, Canva/image brief, and a fact-check list. Preserve event name, date, time, location, registration URL, deadline, and eligibility exactly. Mark missing information as [CHECK].",
    tags: ["WildApricot", "Events", "Marketing", "Canva"],
  },
  {
    id: "wa-engagement-brief",
    title: "Create a leadership engagement brief",
    tool: "WildApricot + Sheets",
    summary: "Turn member/event activity into a short evidence-based brief for decision makers.",
    prompt: "Turn this approved GGW WildApricot export into a one-page leadership engagement brief. Return: what changed, strongest signals, participation or renewal patterns, data-quality gaps, 3 implications, and 3 recommended questions for leadership. Separate facts from interpretation. Cite the exact fields or counts supporting each point. Do not infer intent or sensitive attributes.",
    tags: ["WildApricot", "Leadership", "Reporting", "Engagement"],
  },
  {
    id: "wa-automation-design",
    title: "Design the simplest WildApricot automation",
    tool: "WildApricot + Zapier / Make",
    summary: "Choose the lightest connector and map a safe workflow before building it.",
    prompt: "Design the simplest automation for this GGW workflow: [WORKFLOW]. WildApricot is the system of record. Recommend Zapier for simple trigger/action flows, Make for multi-step/branching workflows, or API/webhook only when needed. Return: trigger, minimum required fields, actions in order, AI step, human approval point, duplicate protection, failure handling, permissions, and a 5-step test plan. Prefer no-code and the fewest moving parts.",
    tags: ["WildApricot", "Automation", "Zapier", "Make"],
  },
];

function iconFor(kind: Aid["icon"]) {
  if (kind === "mail") return <Mail size={22} />;
  if (kind === "event") return <CalendarDays size={22} />;
  if (kind === "members") return <Users size={22} />;
  if (kind === "data") return <BarChart3 size={22} />;
  if (kind === "automation") return <Workflow size={22} />;
  return <Presentation size={22} />;
}

function copyText(value: string) {
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(value).catch(() => undefined);
}

function AidCard({ aid }: { aid: Aid }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyText(aid.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <article className={open ? "ggw-aid-card open" : "ggw-aid-card"}>
    <button className="ggw-aid-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="ggw-aid-icon">{iconFor(aid.icon)}</span>
      <span className="ggw-aid-copy"><strong>{aid.title}</strong><small>{aid.summary}</small></span>
      <span className="ggw-aid-time">{aid.time}</span>
      <ChevronDown className="ggw-aid-chevron" size={19} />
    </button>
    {open && <div className="ggw-aid-detail">
      <div className="ggw-aid-use"><strong>Use this when</strong><span>{aid.useWhen}</span></div>
      <div className="ggw-three-step"><strong>Do this</strong><ol>{aid.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div className="ggw-prompt-box"><div><strong>Copy this prompt</strong><span>Paste it into Gemini or the approved AI experience, then replace the brackets.</span></div><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy prompt"}</button><p>{aid.prompt}</p></div>
      <div className="ggw-check-row"><ShieldCheck size={17} /><div><strong>Before you use the result</strong><span>{aid.check.join(" · ")}</span></div></div>
    </div>}
  </article>;
}

function AutomationCard({ item }: { item: AutomationAid }) {
  const [open, setOpen] = useState(false);
  return <article className={open ? "ggw-auto-card open" : "ggw-auto-card"}>
    <button className="ggw-auto-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="ggw-auto-badge"><Zap size={15} />{item.connector}</span>
      <span><strong>{item.title}</strong><small>{item.outcome}</small></span>
      <ChevronDown size={19} />
    </button>
    {open && <div className="ggw-auto-detail">
      <div className="ggw-connector-blurb"><strong>What is {item.connector}?</strong><span>{item.whatItIs}</span><em>{item.whyUseful}</em></div>
      <div className="ggw-auto-steps"><strong>Set it up</strong><ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div className="ggw-ai-step"><Sparkles size={17} /><div><strong>Where AI helps</strong><span>{item.aiStep}</span></div></div>
      <div className="ggw-check-row"><ShieldCheck size={17} /><div><strong>Verify before turning it on</strong><span>{item.verify.join(" · ")}</span></div></div>
    </div>}
  </article>;
}

function WorkbenchHome() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return aids;
    return aids.filter((aid) => [aid.title, aid.summary, aid.useWhen, aid.prompt].join(" ").toLowerCase().includes(q));
  }, [query]);

  return <main className="ggw-workbench">
    <section className="ggw-workbench-hero">
      <div className="ggw-workbench-hero-copy">
        <span className="ggw-kicker"><Sparkles size={16} /> GGW AI Workbench</span>
        <h1>What are you trying to get done?</h1>
        <p>Pick the job. Get the steps. Copy the prompt. Use AI where it actually saves time.</p>
        <div className="ggw-workbench-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: member email, event, renewal, WildApricot, automation…" aria-label="Search GGW AI job aids" />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</div>
        <div className="ggw-hero-actions"><button onClick={() => { window.location.href = "?view=prompts"; }}>Find a prompt <ArrowRight size={15} /></button><span>No lesson plan. Just the help you need.</span></div>
      </div>
      <div className="ggw-workbench-hero-card">
        <strong>Use AI like a coworker, not a magic button.</strong>
        <div><span>1</span><p><b>Give it the job</b>What outcome do you need?</p></div>
        <div><span>2</span><p><b>Give it the source</b>What facts or data can it use?</p></div>
        <div><span>3</span><p><b>Check the result</b>What must a person verify?</p></div>
      </div>
    </section>

    <section className="ggw-aids-section">
      <div className="ggw-section-head"><div><span>Fast help for real GGW work</span><h2>Choose the job, not the course.</h2></div><small>{filtered.length} job aid{filtered.length === 1 ? "" : "s"}</small></div>
      <div className="ggw-aid-list">{filtered.map((aid) => <AidCard key={aid.id} aid={aid} />)}</div>
      {!filtered.length && <div className="ggw-empty"><Search size={20} /><strong>No exact match.</strong><span>Try a broader job like email, event, data, or automation.</span></div>}
    </section>

    <section className="ggw-automation-section">
      <div className="ggw-section-head"><div><span>WildApricot + AI automations</span><h2>Stop repeating work that a connector can handle.</h2><p>Start with Zapier for simple workflows. Use Make when there are several steps or branches. Use webhooks/API only when the no-code connectors cannot do the job.</p></div></div>
      <div className="ggw-connector-strip">
        <div><b>Zapier</b><span>Easiest: trigger → action</span></div>
        <div><b>Make</b><span>Multi-step and branching workflows</span></div>
        <div><b>Webhook / API</b><span>Advanced custom integration</span></div>
      </div>
      <div className="ggw-auto-list">{automations.map((item) => <AutomationCard key={item.id} item={item} />)}</div>
    </section>

    <section className="ggw-bottom-cta">
      <div><Sparkles size={21} /><span><strong>Already know what you need?</strong> The Prompt Library is the fastest path when the workflow itself is familiar.</span></div>
      <button onClick={() => { window.location.href = "?view=prompts"; }}>Open Prompt Library <ArrowRight size={15} /></button>
    </section>
  </main>;
}

function PromptCard({ item }: { item: PromptAddition }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    copyText(item.prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return <article className="ggw-extra-prompt-card"><div className="ggw-extra-prompt-top"><span>{item.tool}</span><button onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button></div><h3>{item.title}</h3><p>{item.summary}</p><div className="ggw-extra-prompt-text">{item.prompt}</div><div className="ggw-extra-tags">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></article>;
}

function PromptExtension({ target }: { target: Element }) {
  return createPortal(<section className="ggw-prompt-extension"><div className="ggw-section-head"><div><span>GGW + WildApricot</span><h2>Prompts for the work you actually do.</h2><p>These focus on member operations, events, engagement, and automation. Use the minimum data needed and review results before updating records or sending outreach.</p></div></div><div className="ggw-extra-prompt-grid">{promptAdditions.map((item) => <PromptCard key={item.id} item={item} />)}</div></section>, target);
}

function getCurrentView() {
  const active = document.querySelector(".main-nav button.active")?.textContent?.trim().toLowerCase() || "home";
  if (active.includes("prompt")) return "prompts";
  if (active.includes("sandbox")) return "sandbox";
  if (active.includes("progress")) return "progress";
  return "home";
}

export default function GGWWorkbench() {
  const [view, setView] = useState("home");
  const [promptTarget, setPromptTarget] = useState<Element | null>(null);

  useEffect(() => {
    const sync = () => {
      const next = getCurrentView();
      setView(next);
      document.body.dataset.ggwWorkbenchView = next;
      const subtitle = document.querySelector(".brand-lockup small");
      if (subtitle && subtitle.textContent !== "AI Workbench") subtitle.textContent = "AI Workbench";
      setPromptTarget(next === "prompts" ? document.querySelector(".library-section") : null);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("popstate", sync);
    return () => {
      observer.disconnect();
      window.removeEventListener("popstate", sync);
      delete document.body.dataset.ggwWorkbenchView;
    };
  }, []);

  return <>{view === "home" && <WorkbenchHome />}{view === "prompts" && promptTarget && <PromptExtension target={promptTarget} />}</>;
}
