"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Presentation,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { toolRegistry, type ToolId } from "./tool-registry";

type Category = "all" | "members" | "events" | "communications" | "reporting" | "content" | "automation";

type Aid = {
  id: string;
  category: Exclude<Category, "all">;
  title: string;
  summary: string;
  useWhen: string;
  time: string;
  tools: ToolId[];
  icon: "mail" | "event" | "members" | "data" | "automation" | "visual" | "doc";
  steps: string[];
  prompt: string;
  check: string[];
};

type AutomationAid = {
  id: string;
  title: string;
  trigger: string;
  outcome: string;
  connector: "Zapier" | "Make" | "Webhook / API";
  whatItIs: string;
  whyUseful: string;
  tools: ToolId[];
  steps: string[];
  aiStep: string;
  verify: string[];
};

const categories: Array<{ id: Category; label: string }> = [
  { id: "all", label: "All help" },
  { id: "members", label: "Members" },
  { id: "events", label: "Events" },
  { id: "communications", label: "Communications" },
  { id: "reporting", label: "Reporting" },
  { id: "content", label: "Content" },
  { id: "automation", label: "Automations" },
];

const aids: Aid[] = [
  {
    id: "member-welcome",
    category: "members",
    title: "Welcome a new member",
    summary: "Turn approved membership details into a warm first-touch message without writing from scratch.",
    useWhen: "A new member joins and you want a personalized welcome draft quickly.",
    time: "3–5 min",
    tools: ["WildApricot", "Gemini", "Gmail"],
    icon: "members",
    steps: [
      "Open the member record in WildApricot and confirm membership type, join date, and approved benefits.",
      "Give Gemini only the fields needed for the message using the prompt below.",
      "Review the draft, test links and merge fields, then send from the approved GGW Gmail account.",
    ],
    prompt: "Draft a personalized GGW welcome email using only these approved WildApricot fields: first name [NAME], membership type [TYPE], join date [DATE], approved benefits [BENEFITS], approved next step [NEXT STEP], and approved links [LINKS]. Keep it under 180 words, warm, confident, inclusive, and human. Return subject line, preview text, email body, CTA, and CHECK BEFORE SENDING. Do not invent benefits, discounts, events, eligibility, contacts, deadlines, or links.",
    check: ["Membership type is correct", "Benefits are approved", "Links work", "Merge fields are tested"],
  },
  {
    id: "renewal-engagement",
    category: "members",
    title: "Prepare renewal or re-engagement outreach",
    summary: "Create relevant drafts for a defined member segment while WildApricot stays the source of membership status.",
    useWhen: "You have a renewal, lapsed, or re-engagement segment and need better first-draft outreach.",
    time: "5–10 min",
    tools: ["WildApricot", "Google Sheets", "Gemini", "Gmail"],
    icon: "members",
    steps: [
      "Define the segment in WildApricot or from an approved export in Google Sheets.",
      "Give AI only the approved benefits, deadline, and next action for that segment.",
      "Review membership status, eligibility, tone, merge fields, recipients, and links before sending.",
    ],
    prompt: "Draft GGW [renewal / re-engagement] outreach for this segment: [SEGMENT]. Reason for outreach: [REASON]. Approved benefits/facts: [FACTS]. Deadline or next step: [NEXT STEP]. Return subject line, preview text, concise email, CTA, optional reminder, and CHECK BEFORE SENDING. Do not invent benefits, discounts, deadlines, eligibility, or member status.",
    check: ["Segment rule is intentional", "Member status is current", "No invented benefits", "CTA is clear"],
  },
  {
    id: "member-insights",
    category: "members",
    title: "Understand a member list quickly",
    summary: "Turn a WildApricot export into supported segments and follow-up ideas in Google Sheets.",
    useWhen: "You need insight from a member list faster than manually scanning rows.",
    time: "10 min",
    tools: ["WildApricot", "Google Sheets", "Gemini"],
    icon: "data",
    steps: [
      "Export only the fields needed for the business question and work from a controlled copy in Sheets.",
      "Ask Gemini to propose segments using only fields that actually exist in the export.",
      "Validate sample rows from every proposed segment before using the result.",
    ],
    prompt: "Review this approved WildApricot member export for GGW. Goal: [GOAL]. Suggest useful segments using only fields present in the export. For each segment show the rule, count if available, why it matters, and recommended next action. Flag missing or inconsistent data. Do not infer sensitive attributes, personal intent, protected traits, or eligibility that is not explicitly present.",
    check: ["Only needed fields were exported", "Rules are visible", "No sensitive inference", "Sample rows were checked"],
  },
  {
    id: "event-kit",
    category: "events",
    title: "Turn one event into a promotion kit",
    summary: "Use one approved event record to draft email, social copy, talking points, and a visual brief.",
    useWhen: "The event record is ready and the team needs channel-ready promotion without retyping the same facts.",
    time: "8–10 min",
    tools: ["WildApricot", "Gemini", "Canva", "Gmail"],
    icon: "event",
    steps: [
      "Copy the approved event facts from WildApricot: title, audience, date/time, location, description, registration URL, deadline, pricing, and eligibility.",
      "Use the prompt below to create channel-specific drafts from those facts only.",
      "Compare every draft and visual back to the WildApricot event record before publishing.",
    ],
    prompt: "Create a GGW event promotion kit using only these approved WildApricot event facts: [PASTE FACTS]. Return: 1) member email, 2) LinkedIn post, 3) short social caption, 4) five talking points, 5) Canva visual brief with headline/CTA/image direction/alt text, 6) reminder variations, and 7) a fact-check table. Preserve event name, date, time, location, registration URL, deadline, pricing, and eligibility exactly. Mark anything missing as [CHECK].",
    check: ["Registration URL works", "Date/time/location match", "Eligibility/pricing match", "Visual claims are supported"],
  },
  {
    id: "event-followup",
    category: "events",
    title: "Create post-event follow-up",
    summary: "Prepare attendee, no-show, speaker/partner, and internal follow-up without rewriting every message.",
    useWhen: "An event is complete and the team needs different follow-ups for different audiences.",
    time: "5–10 min",
    tools: ["WildApricot", "Gemini", "Gmail"],
    icon: "event",
    steps: [
      "Use the approved event details and registration/attendance status from WildApricot.",
      "Ask AI for audience-specific drafts and an internal action summary.",
      "Verify attendee status, links, names, commitments, and next steps before sending.",
    ],
    prompt: "Using these approved WildApricot event details and registration/attendance fields, prepare GGW post-event follow-up. Create: attendee thank-you, no-show follow-up, speaker/partner thank-you, and internal action summary. Use only provided facts. Preserve links, names, dates, resources, and commitments exactly. Add CHECK BEFORE SENDING to each audience version.",
    check: ["Correct audience list", "Attendance status is accurate", "Links are approved", "No invented takeaways or commitments"],
  },
  {
    id: "registration-insights",
    category: "events",
    title: "Understand event registrations quickly",
    summary: "Turn registration data into attendance patterns, follow-up groups, and data-quality issues in Sheets.",
    useWhen: "You need a quick operational view of who registered and what needs attention.",
    time: "5–10 min",
    tools: ["WildApricot", "Google Sheets", "Gemini"],
    icon: "data",
    steps: [
      "Export or sync the minimum registration fields into a controlled Google Sheet.",
      "Ask Gemini for patterns, useful groups, missing fields, and follow-up needs.",
      "Check a sample of rows before using any segment or count in communication or reporting.",
    ],
    prompt: "Analyze this approved GGW WildApricot event registration export. Goal: [GOAL]. Return: registration count, useful non-sensitive segments, cancellations/no-shows if present, missing or inconsistent fields, follow-up groups, and five operational questions to investigate. Use only fields provided. Separate facts from recommendations and name the field or pattern behind each recommendation.",
    check: ["Counts tie to source", "Cancellations are handled correctly", "No sensitive inference", "Sample rows match"],
  },
  {
    id: "email-helper",
    category: "communications",
    title: "Write or improve a GGW email",
    summary: "Turn rough notes, a long thread, or approved facts into a clear human message.",
    useWhen: "You know what needs to be said but want help making it concise and appropriate for the audience.",
    time: "3–5 min",
    tools: ["Gmail", "Gemini"],
    icon: "mail",
    steps: [
      "Start with the audience, purpose, approved facts, and desired action.",
      "Ask Gemini for a draft or rewrite using a fixed output shape.",
      "Check names, dates, links, promises, recipients, and attachments before sending.",
    ],
    prompt: "Draft a concise GGW email. Audience: [AUDIENCE]. Purpose: [PURPOSE]. Desired action: [ACTION]. Approved facts: [FACTS]. Required links/attachments: [ITEMS]. Tone: confident, welcoming, inclusive, and human. Return subject line, preview text, email body, CTA, and CHECK BEFORE SENDING. Do not invent dates, benefits, links, decisions, approvals, or commitments.",
    check: ["Audience is correct", "Facts match source", "Tone sounds human", "Recipients/attachments are correct"],
  },
  {
    id: "partner-update",
    category: "communications",
    title: "Draft a sponsor or partner update",
    summary: "Turn confirmed notes into a polished external update without creating new promises.",
    useWhen: "A sponsor, speaker, partner, or stakeholder needs a concise status update or next-step email.",
    time: "5 min",
    tools: ["Google Docs", "Gmail", "Gemini"],
    icon: "mail",
    steps: [
      "List only confirmed status, decisions, open questions, owner, and next date.",
      "Use AI to organize the message rather than create new commitments.",
      "Verify every deliverable, date, owner, and promise before sending externally.",
    ],
    prompt: "Draft a concise GGW sponsor/partner update from these confirmed notes: [NOTES]. Return: current status, completed items, next steps with owners/dates, open questions, and a short closing. Keep the tone professional, appreciative, and direct. Do not invent deliverables, dates, approvals, benefits, or commitments. Mark gaps as [CHECK].",
    check: ["Deliverables are confirmed", "Dates/owners match source", "No new promises", "External audience is correct"],
  },
  {
    id: "meeting-to-actions",
    category: "communications",
    title: "Turn meeting notes into actions",
    summary: "Convert a Meet recap or rough notes into decisions, owners, dates, blockers, and a clean follow-up.",
    useWhen: "A meeting ends with useful discussion but the next steps are scattered or unclear.",
    time: "5 min",
    tools: ["Google Meet", "Google Docs", "Gemini"],
    icon: "doc",
    steps: [
      "Use the approved Meet recap or your notes as the source.",
      "Ask Gemini to separate decisions, open questions, and action items with owners/dates.",
      "Compare the result to the source before sharing the follow-up.",
    ],
    prompt: "Turn these GGW meeting notes into a useful follow-up. Return: decisions already made, open questions, action items with owner and due date only when stated, risks/blockers, and a short follow-up email. If an owner or date is not stated, write NOT STATED. Do not invent commitments. Finish with CHECK BEFORE SHARING.",
    check: ["Decisions match notes", "Owners/dates are stated in source", "No invented commitments", "Sensitive notes removed if unnecessary"],
  },
  {
    id: "weekly-ops",
    category: "reporting",
    title: "Create a weekly operations brief",
    summary: "Turn approved member, event, and working data into a concise internal snapshot focused on change and action.",
    useWhen: "Staff or leadership needs a quick view of what changed, what needs attention, and what happens next.",
    time: "10–15 min",
    tools: ["WildApricot", "Google Sheets", "Google Docs", "Gemini"],
    icon: "data",
    steps: [
      "Choose the reporting period and agreed source metrics before asking AI to summarize anything.",
      "Use a controlled Sheet or approved report as the working source.",
      "Verify every total, comparison, exception, and next action before sharing the brief.",
    ],
    prompt: "Create a GGW weekly operations brief from these approved metrics and notes for [DATE RANGE]. Return: executive headline, key changes, membership/member-service items, event items, operational exceptions, risks/questions, and next actions with owner/date only when supplied. Separate facts from recommendations. Do not invent causes, commitments, or metrics.",
    check: ["Date range is correct", "Totals tie to source", "Facts and recommendations are separated", "Sensitive data is minimized"],
  },
  {
    id: "board-summary",
    category: "reporting",
    title: "Turn approved metrics into a board-ready summary",
    summary: "Create a concise leadership narrative while keeping every claim tied to evidence.",
    useWhen: "The board or leadership needs a short summary from approved metrics and operating notes.",
    time: "10–15 min",
    tools: ["Google Sheets", "Google Docs", "Gemini"],
    icon: "doc",
    steps: [
      "Confirm the metric definitions, reporting period, and approved source Sheet.",
      "Ask for a short narrative that separates measured facts from interpretation.",
      "Compare every number, percentage, and claim back to the source before sharing.",
    ],
    prompt: "Turn these approved GGW metrics and notes into a board-ready summary. Return: executive headline, 3–5 key facts, what changed versus the comparison period if provided, why it matters labeled as interpretation, risks/questions, and recommended next steps. Use only supplied data. Do not infer causation, impact, or ROI unless evidence is explicitly provided. Mark unsupported claims [CHECK].",
    check: ["Metrics tie to source", "Period is stated", "No unsupported ROI/causation", "Recommendations are labeled"],
  },
  {
    id: "sheet-cleanup",
    category: "reporting",
    title: "Clean a messy Google Sheet safely",
    summary: "Preview cleanup rules for dates, labels, duplicates, missing values, and formatting before changing the source meaning.",
    useWhen: "A member, event, finance, grant, or operations Sheet is hard to trust because the rows are inconsistent.",
    time: "10–20 min",
    tools: ["Google Sheets", "Gemini"],
    icon: "data",
    steps: [
      "Make a working copy before changing a source Sheet.",
      "Ask AI to propose cleanup rules and identify rows requiring human review before applying changes.",
      "Validate a sample of changed rows and totals before replacing or publishing any cleaned dataset.",
    ],
    prompt: "Help me clean this Google Sheet without changing the source meaning. First inspect the headers and sample rows. Propose a cleanup plan for dates, whitespace, capitalization, duplicates, missing values, and inconsistent labels. Do not delete or overwrite anything yet. Return the proposed rules, rows that need human review, and the safest order to apply the cleanup.",
    check: ["Working copy used", "Rules are documented", "Duplicates are reviewed before merge/delete", "Totals still reconcile"],
  },
  {
    id: "visual-helper",
    category: "content",
    title: "Turn approved facts into a visual or deck brief",
    summary: "Create a clean visual structure without asking AI to invent claims, metrics, or event details.",
    useWhen: "You need a slide, social asset, one-pager, or board visual from approved information.",
    time: "8–15 min",
    tools: ["Google Slides", "Canva", "Gemini"],
    icon: "visual",
    steps: [
      "Write the one-sentence audience message and gather the approved facts first.",
      "Use Gemini to propose hierarchy, visual structure, and concise copy while locking the facts.",
      "Build in the approved GGW Slides or Canva template and verify all claims before publishing.",
    ],
    prompt: "Create a visual production brief for GGW. Audience: [AUDIENCE]. Purpose: [PURPOSE]. Approved facts/metrics: [FACTS]. Required CTA: [CTA]. Return headline, information hierarchy, recommended chart/visual type, concise supporting copy, accessibility alt text, and a FACT LOCK list that must not change. Do not invent claims, numbers, quotes, dates, or commitments.",
    check: ["Approved template used", "Facts are locked", "Numbers tie to source", "Accessibility included"],
  },
  {
    id: "automation-decision",
    category: "automation",
    title: "Design the simplest WildApricot + Google automation",
    summary: "Choose the least complex safe handoff and document setup, test, review, failure handling, and fallback.",
    useWhen: "The same WildApricot-to-Google handoff keeps happening manually.",
    time: "15–30 min",
    tools: ["WildApricot", "Zapier", "Make", "Google Sheets", "Gmail", "Gemini"],
    icon: "automation",
    steps: [
      "Write the repetitive process exactly as it happens today, including the human approval point.",
      "Use Zapier for a simple trigger/action, Make for multi-step or branching work, and API/webhook only for a real connector gap.",
      "Test with low-risk data, duplicates, updates/reversals, permission failure, and an off switch before turning it on.",
    ],
    prompt: "Design the simplest automation for this GGW workflow: [WORKFLOW]. WildApricot is the system of record and Google Workspace is the primary work environment. Compare manual, Zapier, Make, and API/webhook only if needed. Return trigger, minimum required fields, actions in order, AI step if useful, human approval point, duplicate protection, failure alert, permissions, test cases, off switch, and manual fallback. Do not claim a connector action exists unless verified.",
    check: ["Minimum fields only", "Human review gate exists", "Duplicate/update behavior tested", "Failure/off switch documented"],
  },
];

const automations: AutomationAid[] = [
  {
    id: "new-member-draft",
    title: "New member → welcome draft",
    trigger: "A new member record is created or reaches the approved status in WildApricot.",
    outcome: "Prepare a Gmail welcome draft using only approved member fields; a person reviews and sends it.",
    connector: "Zapier",
    whatItIs: "Zapier connects apps with trigger-and-action workflows and is a good fit when the process is simple.",
    whyUseful: "This removes repetitive copying while keeping the final communication behind human review.",
    tools: ["WildApricot", "Zapier", "Gmail"],
    steps: ["Confirm the current WildApricot trigger in Zapier.", "Map only first name, membership type, approved benefit/next-step fields, and stable member ID.", "Create a Gmail draft rather than auto-send.", "Add duplicate protection using the stable member ID.", "Test a normal record, duplicate, missing field, and status reversal before turning it on."],
    aiStep: "Optional: use Gemini only to transform the approved fields into a friendly first draft. Keep the approved facts locked.",
    verify: ["Trigger verified", "Minimum fields mapped", "Draft-first", "Duplicate test passed", "Owner can disable Zap"],
  },
  {
    id: "registration-sheet",
    title: "Registration → working Sheet + follow-up prep",
    trigger: "A registration is created or updated in WildApricot.",
    outcome: "Keep an operations Sheet current and optionally prepare reviewed follow-up material.",
    connector: "Zapier",
    whatItIs: "Zapier is usually the lightest option for a single WildApricot event trigger feeding a Google action.",
    whyUseful: "Staff gets a visible working layer in Sheets without repeated export/paste work.",
    tools: ["WildApricot", "Zapier", "Google Sheets", "Gmail"],
    steps: ["Verify the WildApricot registration trigger/action available in the current connector.", "Map the minimum registration fields and a stable registration ID.", "Upsert the Sheet row instead of blindly appending duplicates.", "Keep any Gmail communication in draft mode during the pilot.", "Test create, update, cancellation, duplicate, and permission failure."],
    aiStep: "Use AI downstream for summaries or follow-up grouping only after the approved fields reach the working Sheet.",
    verify: ["Stable ID used", "Updates do not duplicate", "Cancellations tested", "Correct Sheet/account", "Manual fallback documented"],
  },
  {
    id: "membership-change",
    title: "Membership change → outreach draft",
    trigger: "A relevant membership status or level changes in WildApricot.",
    outcome: "Prepare the correct reviewed communication without inventing benefits or eligibility.",
    connector: "Make",
    whatItIs: "Make is useful when different statuses/levels need different routes or transformations.",
    whyUseful: "Branching logic can keep separate messages and review paths visible instead of hiding them in one giant automation.",
    tools: ["WildApricot", "Make", "Gmail", "Google Sheets"],
    steps: ["Verify the available WildApricot change trigger in Make.", "Route only the intended statuses/levels.", "Map approved benefits and CTA from a controlled source rather than AI memory.", "Create a Gmail draft and log the stable member ID/status in a Sheet.", "Test each route plus a status reversal and unknown value."],
    aiStep: "AI can prepare the wording after the route has selected the approved message facts.",
    verify: ["Every route tested", "Unknown values stop safely", "No invented benefits", "Draft reviewed", "Reversal handled"],
  },
  {
    id: "event-change",
    title: "Event change → promotion update prep",
    trigger: "An approved event record changes in WildApricot.",
    outcome: "Prepare updated email/social/visual copy while keeping changed event facts visible for review.",
    connector: "Make",
    whatItIs: "Make is a better fit when one event change needs several downstream preparation steps.",
    whyUseful: "The workflow can branch to content preparation without auto-publishing an unreviewed change.",
    tools: ["WildApricot", "Make", "Google Sheets", "Gmail", "Canva"],
    steps: ["Choose which event-field changes should trigger preparation.", "Store the previous/current values or a change summary for review.", "Prepare drafts for the channels actually used by GGW.", "Do not auto-publish or overwrite the Canva master template.", "Test date/time, location, cancellation, pricing, and registration-link changes."],
    aiStep: "AI can rewrite channel copy from the changed approved facts and flag every field that changed.",
    verify: ["Change is visible", "No auto-publish", "Master template protected", "Critical fields tested", "Owner approves release"],
  },
  {
    id: "payment-working-sheet",
    title: "Payment update → restricted finance working Sheet + review",
    trigger: "A relevant payment record is created or modified in WildApricot and the finance owner has approved the workflow.",
    outcome: "Prepare a restricted working record for finance review without making accounting or tax conclusions.",
    connector: "Make",
    whatItIs: "Make can handle field filtering, branching, and a controlled finance-only destination.",
    whyUseful: "It can reduce re-entry while preserving a visible review point and access boundary.",
    tools: ["WildApricot", "Make", "Google Sheets"],
    steps: ["Get finance-owner approval before moving payment data.", "Map only fields required for the approved working purpose.", "Write to a restricted Sheet with least-privilege access.", "Do not use AI to determine accounting treatment, deductibility, or fund availability.", "Test duplicates, reversals/refunds where relevant, permissions, and reconciliation back to the source."],
    aiStep: "If approved, AI may summarize anomalies or missing documentation using minimized fields; it must not make accounting/tax decisions.",
    verify: ["Finance owner approved", "Restricted access", "Minimum fields", "Reversal tested", "Reconciles to source"],
  },
  {
    id: "multi-step-google",
    title: "WildApricot activity → multi-step Google workflow",
    trigger: "A defined member/event activity needs several Google Workspace steps.",
    outcome: "Route approved data through Sheets/Docs/Gmail with filters, logs, and human gates.",
    connector: "Make",
    whatItIs: "Make is designed for scenarios with multiple modules, filters, branches, and error routes.",
    whyUseful: "It keeps a complex handoff inspectable without forcing a custom API build too early.",
    tools: ["WildApricot", "Make", "Google Sheets", "Google Docs", "Gmail", "Gemini"],
    steps: ["Map the current manual process first.", "Define the exact trigger and minimum source fields.", "Add filters/routes before any AI transformation.", "Log stable IDs/status so retries do not duplicate work.", "Add an error route/alert and a human review gate before external action."],
    aiStep: "Use AI for preparation—summaries, classifications, or drafts—after the source data has been filtered to the minimum needed.",
    verify: ["Routes documented", "Idempotency/stable IDs", "Error alert exists", "External action gated", "Manual fallback works"],
  },
  {
    id: "connector-gap",
    title: "Connector gap → webhook / API escalation",
    trigger: "A required WildApricot event or action is not available in the approved no-code connectors.",
    outcome: "Escalate to a technical integration only after proving the connector gap.",
    connector: "Webhook / API",
    whatItIs: "A webhook/API integration is custom technical work and should be the exception, not the default.",
    whyUseful: "It can cover a real connector gap, but it adds authentication, logging, retry, security, and maintenance responsibilities.",
    tools: ["WildApricot", "Google Sheets", "Gemini"],
    steps: ["Confirm Zapier or Make cannot cover the requirement first.", "Define the exact event/data needed and the minimum fields required.", "Assign a technical owner for authentication, logging, retries, failure alerts, and maintenance.", "Use AI downstream for preparation or analysis—not as an unreviewed authority to change records.", "Test in a controlled environment and document disable/rollback."],
    aiStep: "Use AI only after the integration safely delivers the required fields—for example to summarize, classify, or prepare a draft for review.",
    verify: ["Connector gap confirmed", "Technical owner assigned", "Authentication secure", "Error handling exists", "Rollback documented"],
  },
];

function iconFor(kind: Aid["icon"]) {
  if (kind === "mail") return <Mail size={22} />;
  if (kind === "event") return <CalendarDays size={22} />;
  if (kind === "members") return <Users size={22} />;
  if (kind === "data") return <BarChart3 size={22} />;
  if (kind === "automation") return <Workflow size={22} />;
  if (kind === "doc") return <FileText size={22} />;
  return <Presentation size={22} />;
}

async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function ToolLinks({ tools }: { tools: ToolId[] }) {
  return <div className="ggw-aid-tool-links" aria-label="Open tools">
    {tools.map((tool) => {
      const item = toolRegistry[tool];
      return <a key={tool} href={item.url} target="_blank" rel="noreferrer"><ExternalLink size={11} />{item.label}</a>;
    })}
  </div>;
}

function AidCard({ aid }: { aid: Aid }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const success = await copyText(aid.prompt);
    setCopied(success);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return <article className={open ? "ggw-aid-card open" : "ggw-aid-card"}>
    <button className="ggw-aid-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="ggw-aid-icon">{iconFor(aid.icon)}</span>
      <span className="ggw-aid-copy"><strong>{aid.title}</strong><small>{aid.summary}</small><em>{aid.category}</em></span>
      <span className="ggw-aid-time">{aid.time}</span>
      <ChevronDown className="ggw-aid-chevron" size={19} />
    </button>
    <ToolLinks tools={aid.tools} />
    {open && <div className="ggw-aid-detail">
      <div className="ggw-aid-use"><strong>Use this when</strong><span>{aid.useWhen}</span></div>
      <div className="ggw-three-step"><strong>Do this</strong><ol>{aid.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
      <div className="ggw-prompt-box"><div><strong>Copy this prompt</strong><span>Replace the brackets with approved GGW information—or open the Prompt Library to fill variables inside the portal.</span></div><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy prompt"}</button><p>{aid.prompt}</p><a className="ggw-open-prompt-library" href={`/prompts?q=${encodeURIComponent(aid.title)}`}>Customize in Prompt Library <ArrowRight size={13} /></a></div>
      <div className="ggw-check-row"><ShieldCheck size={17} /><div><strong>Before you use the result</strong><span>{aid.check.join(" · ")}</span></div></div>
    </div>}
  </article>;
}

function AutomationCard({ item }: { item: AutomationAid }) {
  const [open, setOpen] = useState(false);
  return <article className={open ? "ggw-auto-card open" : "ggw-auto-card"}>
    <button className="ggw-auto-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="ggw-auto-badge"><Zap size={15} />{item.connector}</span>
      <span><strong>{item.title}</strong><small>{item.outcome}</small><em>{item.trigger}</em></span>
      <ChevronDown size={19} />
    </button>
    <ToolLinks tools={item.tools} />
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
  const [category, setCategory] = useState<Category>("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return aids.filter((aid) => {
      const matchesCategory = category === "all" || aid.category === category;
      const matchesQuery = !q || [aid.title, aid.summary, aid.useWhen, ...aid.tools, aid.prompt, aid.category].join(" ").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  const jumpTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return <main className="ggw-workbench">
    <section className="ggw-workbench-hero">
      <div className="ggw-workbench-hero-copy">
        <span className="ggw-kicker"><Sparkles size={16} /> GGW AI Workbench</span>
        <h1>What do you need help with?</h1>
        <p>Search the job in front of you. Get the steps, the prompt, the right tool, and the check before you use the result.</p>
        <div className="ggw-workbench-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: member renewal, event follow-up, clean a Sheet, sponsor email, automate…" aria-label="Search GGW AI job aids" />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</div>
        <div className="ggw-hero-actions"><a href="/prompts">Open Prompt Library <ArrowRight size={15} /></a><button onClick={() => jumpTo("google-workspace")}>Explore Google tools</button><span>Browser-first on Mac or Windows.</span></div>
      </div>
      <div className="ggw-workbench-hero-card">
        <strong>The GGW way to use AI</strong>
        <div><span>1</span><p><b>Start with the job</b>What are you trying to get done?</p></div>
        <div><span>2</span><p><b>Use the source</b>WildApricot or the approved Google file stays authoritative.</p></div>
        <div><span>3</span><p><b>Check before action</b>Review names, dates, links, amounts, recipients, claims, and commitments.</p></div>
      </div>
    </section>

    <section className="ggw-tool-strip" aria-label="Open the GGW work environment">
      {(["WildApricot", "Google Sheets", "Gmail", "Google Docs", "Google Drive", "Gemini"] as ToolId[]).map((tool) => {
        const item = toolRegistry[tool];
        return <a key={tool} href={item.url} target="_blank" rel="noreferrer"><strong>{item.label}</strong><span>{tool === "WildApricot" ? "Members, events, registrations" : tool === "Google Sheets" ? "Working data, analysis, trackers" : tool === "Gmail" ? "Reviewed communication" : tool === "Google Docs" ? "Briefs, SOPs, board docs" : tool === "Google Drive" ? "Approved source files" : "Draft, analyze, organize, review"}</span><ExternalLink size={12} /></a>;
      })}
    </section>

    <section className="ggw-aids-section" id="job-aids">
      <div className="ggw-section-head"><div><span>Fast help for real GGW work</span><h2>Choose the job, not the course.</h2></div><small>{filtered.length} job aid{filtered.length === 1 ? "" : "s"}</small></div>
      <div className="ggw-filter-row" aria-label="Filter job aids">{categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
      <div className="ggw-aid-list">{filtered.map((aid) => <AidCard key={aid.id} aid={aid} />)}</div>
      {!filtered.length && <div className="ggw-empty"><Search size={20} /><strong>No exact match.</strong><span>Try a broader job like member, event, email, Sheet, report, content, or automation—or search the full Prompt Library.</span><a href="/prompts">Search Prompt Library</a></div>}
    </section>

    <section className="ggw-automation-section" id="automations">
      <div className="ggw-section-head"><div><span>WildApricot + Google automations</span><h2>Stop repeating the handoff.</h2><p>WildApricot remains the system of record. Connectors move only the information needed into Google Workspace, where AI can prepare a draft, summary, group, or review item.</p></div></div>
      <div className="ggw-connector-strip">
        <a href={toolRegistry.Zapier.url} target="_blank" rel="noreferrer"><b>Zapier</b><span>Best for a simple trigger → Google action</span></a>
        <a href={toolRegistry.Make.url} target="_blank" rel="noreferrer"><b>Make</b><span>Best for several steps, filters, or branches</span></a>
        <div><b>Webhook / API</b><span>Advanced; use only for a real connector gap</span></div>
      </div>
      <div className="ggw-auto-list">{automations.map((item) => <AutomationCard key={item.id} item={item} />)}</div>
    </section>

    <section className="ggw-os-note">
      <strong>Mac or Windows?</strong>
      <span>The Workbench teaches browser and Google Workspace steps first. When a keyboard shortcut matters, use ⌘ on Mac or Ctrl on Windows. The workflow itself should not change.</span>
    </section>

    <section className="ggw-bottom-cta">
      <div><Sparkles size={21} /><span><strong>Already know what you need?</strong> The Prompt Library is the fastest path when the workflow itself is familiar.</span></div>
      <a href="/prompts">Open Prompt Library <ArrowRight size={15} /></a>
    </section>
  </main>;
}

export default function GGWWorkbench() {
  const pathname = usePathname();
  const view = pathname.includes("/prompts") ? "prompts" : pathname.includes("/legal") ? "legal" : pathname.includes("/progress") ? "progress" : "home";

  useEffect(() => {
    document.body.dataset.ggwWorkbenchView = view;
    const subtitle = document.querySelector(".brand-lockup small");
    if (subtitle && subtitle.textContent !== "AI Workbench") subtitle.textContent = "AI Workbench";
    return () => { delete document.body.dataset.ggwWorkbenchView; };
  }, [view]);

  if (view !== "home") return null;
  return <WorkbenchHome />;
}
