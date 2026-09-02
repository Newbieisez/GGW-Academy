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

type Category = "all" | "members" | "events" | "communications" | "reporting" | "content" | "automation";

type Aid = {
  id: string;
  category: Exclude<Category, "all">;
  title: string;
  summary: string;
  useWhen: string;
  time: string;
  tools: string;
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
    summary: "Turn approved WildApricot member details into a warm first-touch message without writing from scratch.",
    useWhen: "A new member joins and you want a personalized welcome draft quickly.",
    time: "3–5 min",
    tools: "WildApricot + Gemini + Gmail",
    icon: "members",
    steps: [
      "Open the member record in WildApricot and confirm membership type, join date, and approved benefits.",
      "Give Gemini only the fields needed for the message using the prompt below.",
      "Review the draft, test links and merge fields, then send from the approved GGW channel.",
    ],
    prompt: "Draft a personalized GGW welcome email using only these approved WildApricot fields: first name [NAME], membership type [TYPE], join date [DATE], approved benefits [BENEFITS], and next step [NEXT STEP]. Keep it under 180 words, warm, confident, inclusive, and human. Return subject line, email body, CTA, and CHECK BEFORE SENDING. Do not invent benefits, discounts, events, contacts, or eligibility.",
    check: ["Membership type is correct", "Benefits are approved", "Links work", "Merge fields are tested"],
  },
  {
    id: "renewal-engagement",
    category: "members",
    title: "Prepare renewal or re-engagement outreach",
    summary: "Create relevant drafts for a defined member segment while WildApricot stays the source of membership status.",
    useWhen: "You have a renewal, lapsed, or re-engagement segment and need better first-draft outreach.",
    time: "5–10 min",
    tools: "WildApricot + Google Sheets + Gemini",
    icon: "members",
    steps: [
      "Define the segment in WildApricot or from an approved export in Google Sheets.",
      "Give AI only the approved benefits, deadline, and next action for that segment.",
      "Review membership status, eligibility, tone, merge fields, and links before sending.",
    ],
    prompt: "Draft GGW [renewal / re-engagement] outreach for this segment: [SEGMENT]. Reason for outreach: [REASON]. Approved benefits/facts: [FACTS]. Deadline or next step: [NEXT STEP]. Return subject line, preview text, concise email, CTA, optional reminder, and CHECK BEFORE SENDING. Do not invent benefits, discounts, deadlines, eligibility, or member status.",
    check: ["Segment rule is intentional", "Member status is current", "No invented benefits", "CTA is clear"],
  },
  {
    id: "member-insights",
    category: "members",
    title: "Understand a member list quickly",
    summary: "Turn a WildApricot export into useful, supported segments and follow-up ideas in Google Sheets.",
    useWhen: "You need insight from a member list faster than manually scanning rows.",
    time: "10 min",
    tools: "WildApricot + Google Sheets + Gemini",
    icon: "data",
    steps: [
      "Export only the fields needed for the business question and work from a copy in Sheets.",
      "Ask Gemini to propose segments using only fields that actually exist in the export.",
      "Validate sample rows from every proposed segment before using the result.",
    ],
    prompt: "Review this WildApricot member export for GGW. Goal: [GOAL]. Suggest useful segments using only fields present in the export. For each segment show: rule, count if available, why it matters, and recommended next action. Flag missing or inconsistent data. Do not infer sensitive attributes, personal intent, or eligibility that is not explicitly present.",
    check: ["Only needed fields were exported", "Rules are visible", "No sensitive inference", "Sample rows were checked"],
  },
  {
    id: "event-kit",
    category: "events",
    title: "Turn one event into a promotion kit",
    summary: "Use one approved WildApricot event record to draft email, social copy, talking points, and a visual brief.",
    useWhen: "The event record is ready and the team needs channel-ready promotion without retyping the same facts.",
    time: "8–10 min",
    tools: "WildApricot + Gemini + Canva / Slides",
    icon: "event",
    steps: [
      "Copy the approved event facts from WildApricot: title, audience, date/time, location, description, registration URL, deadline, pricing, and eligibility.",
      "Use the prompt below to create channel-specific drafts from those facts only.",
      "Compare every draft back to the WildApricot event record before publishing.",
    ],
    prompt: "Create a GGW event promotion kit using only these approved WildApricot event facts: [PASTE FACTS]. Return: 1) member email, 2) LinkedIn post, 3) short social caption, 4) five talking points, 5) Canva/image visual brief, and 6) fact-check list. Preserve event name, date, time, location, registration URL, deadline, pricing, and eligibility exactly. Mark anything missing as [CHECK].",
    check: ["Registration URL works", "Date/time/location match", "Eligibility/pricing match", "Visual claims are supported"],
  },
  {
    id: "event-followup",
    category: "events",
    title: "Create post-event follow-up",
    summary: "Prepare attendee, no-show, speaker/partner, and internal follow-up without rewriting every message.",
    useWhen: "An event is complete and the team needs different follow-ups for different audiences.",
    time: "5–10 min",
    tools: "WildApricot + Gemini + Gmail",
    icon: "event",
    steps: [
      "Use the approved event details and registration status from WildApricot.",
      "Ask AI for audience-specific drafts and an internal action summary.",
      "Verify attendee status, links, names, commitments, and next steps before sending.",
    ],
    prompt: "Using these approved WildApricot event details and registration fields, prepare GGW post-event follow-up. Create: attendee thank-you, no-show follow-up, speaker/partner thank-you, and internal action summary. Use only provided facts. Preserve links, names, dates, and commitments exactly. Add CHECK BEFORE SENDING to each audience version.",
    check: ["Correct audience list", "Attendance status is accurate", "Links are approved", "No invented takeaways or commitments"],
  },
  {
    id: "registration-insights",
    category: "events",
    title: "Understand event registrations quickly",
    summary: "Turn registration data into attendance patterns, follow-up groups, and data-quality issues in Sheets.",
    useWhen: "You need a quick operational view of who registered and what needs attention.",
    time: "5–10 min",
    tools: "WildApricot + Google Sheets + Gemini",
    icon: "data",
    steps: [
      "Export or sync the minimum registration fields into a controlled Google Sheet.",
      "Ask Gemini for patterns, useful groups, missing fields, and follow-up needs.",
      "Check a sample of rows before using any segment or count in communication or reporting.",
    ],
    prompt: "Analyze this GGW WildApricot event registration export. Goal: [GOAL]. Return: registration count, useful non-sensitive segments, cancellations/no-shows if present, missing or inconsistent fields, follow-up groups, and 5 operational questions to investigate. Use only fields provided. Separate facts from recommendations and name the field or pattern behind each recommendation.",
    check: ["Counts tie to source", "Cancellations are handled correctly", "No sensitive inference", "Sample rows match"],
  },
  {
    id: "email-helper",
    category: "communications",
    title: "Write or improve a GGW email",
    summary: "Turn rough notes, a long thread, or approved facts into a clear human message.",
    useWhen: "You know what needs to be said but want help making it concise and appropriate for the audience.",
    time: "3–5 min",
    tools: "Gmail + Gemini",
    icon: "mail",
    steps: [
      "Start with the audience, purpose, approved facts, and desired action.",
      "Ask Gemini for a draft or rewrite using a fixed output shape.",
      "Check names, dates, links, promises, recipients, and attachments before sending.",
    ],
    prompt: "Draft a concise GGW email. Audience: [AUDIENCE]. Purpose: [PURPOSE]. Desired action: [ACTION]. Approved facts: [FACTS]. Tone: confident, welcoming, inclusive, and human. Return subject line, preview text, email body, CTA, and CHECK BEFORE SENDING. Do not invent dates, benefits, links, decisions, or commitments.",
    check: ["Audience is correct", "Facts match source", "Tone sounds human", "Recipients/attachments are correct"],
  },
  {
    id: "partner-update",
    category: "communications",
    title: "Draft a sponsor or partner update",
    summary: "Turn confirmed notes into a polished external update without creating new promises.",
    useWhen: "A sponsor, speaker, partner, or stakeholder needs a concise status update or next-step email.",
    time: "5 min",
    tools: "Google Docs / Gmail + Gemini",
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
    summary: "Convert a Meet recap or rough notes into decisions, owners, dates, and a clean follow-up.",
    useWhen: "A meeting ends with useful discussion but the next steps are scattered or unclear.",
    time: "5 min",
    tools: "Google Meet + Docs + Gemini",
    icon: "doc",
    steps: [
      "Use the approved Meet recap or your notes as the source.",
      "Ask Gemini to separate decisions, open questions, and action items with owners/dates.",
      "Compare the result to the source before sharing the follow-up.",
    ],
    prompt: "Turn these GGW meeting notes into a useful follow-up. Return: 1) decisions, 2) open questions, 3) action items with owner and due date, 4) risks/blockers, and 5) a short follow-up email. If an owner or date is not stated, write Not stated. Do not invent commitments. Finish with CHECK BEFORE SHARING.",
    check: ["Decisions are supported", "Owners/dates were stated", "No invented commitments", "Follow-up audience is correct"],
  },
  {
    id: "operations-brief",
    category: "reporting",
    title: "Create a weekly operations brief",
    summary: "Turn member, event, and activity data into a short internal snapshot focused on changes and next actions.",
    useWhen: "The team needs an operational summary without repeatedly checking multiple screens and trackers.",
    time: "10 min",
    tools: "WildApricot + Google Sheets + Gemini",
    icon: "data",
    steps: [
      "Collect only the agreed metrics and date range into one controlled Sheet or export.",
      "Ask AI to summarize changes, exceptions, and follow-up items rather than simply repeating the numbers.",
      "Validate key totals and exceptions against the source before sharing internally.",
    ],
    prompt: "Create a concise GGW weekly operations brief from this approved data. Return: 1) what changed, 2) member signals, 3) event signals, 4) exceptions or data-quality issues, 5) actions with owner if provided, and 6) questions requiring a human decision. Separate facts from recommendations. Do not expose unnecessary personal data in the summary.",
    check: ["Date range is correct", "Totals tie to source", "PII is minimized", "Recommendations are labeled"],
  },
  {
    id: "board-brief",
    category: "reporting",
    title: "Turn activity data into a board-ready summary",
    summary: "Convert approved metrics and notes into a concise leadership narrative without overstating impact.",
    useWhen: "Leadership needs a short summary of activity, outcomes, risks, and next actions.",
    time: "10 min",
    tools: "Google Sheets + Docs + Gemini",
    icon: "data",
    steps: [
      "Start from approved metrics and source notes; do not ask AI to invent the story from raw numbers.",
      "Ask for a short narrative with fact, trend, implication, and next step.",
      "Verify every number, comparison, quote, and claim before placing it in a board deck or memo.",
    ],
    prompt: "Turn these approved GGW metrics and notes into a board-ready summary. Return: executive headline, 3–5 key facts, what changed versus the comparison period if provided, why it matters, risks/questions, and recommended next steps. Use only the supplied data. Do not infer causation, impact, or ROI unless the evidence is explicitly provided. Mark unsupported claims as [CHECK].",
    check: ["Every number is sourced", "Comparisons use the same period", "No invented causation", "Claims are supportable"],
  },
  {
    id: "sheet-cleanup",
    category: "reporting",
    title: "Clean up a messy Google Sheet",
    summary: "Use Gemini to standardize structure, flag missing data, and prepare a safer working copy without touching the source first.",
    useWhen: "A Sheet has inconsistent dates, duplicate rows, blank fields, or messy labels that make analysis slow.",
    time: "5–10 min",
    tools: "Google Sheets + Gemini",
    icon: "data",
    steps: [
      "Make a working copy of the Sheet and keep the original unchanged.",
      "Ask Gemini to preview the cleanup rules before changing anything.",
      "Apply the cleanup in small passes and spot-check rows after each pass.",
    ],
    prompt: "Help me clean this Google Sheet without changing the source meaning. First inspect the headers and sample rows. Propose a cleanup plan for dates, whitespace, capitalization, duplicates, missing values, and inconsistent labels. Do not delete or overwrite anything yet. Return the proposed rules, rows that need human review, and the safest order to apply the cleanup.",
    check: ["Original is unchanged", "Rules are visible", "Duplicates were reviewed", "Meaning was preserved"],
  },
  {
    id: "creative-helper",
    category: "content",
    title: "Create a deck, visual, or short video faster",
    summary: "Turn approved facts into a clear story before generating slides, imagery, or video scenes.",
    useWhen: "You need a presentation or media asset and want AI to accelerate the first draft without random decoration.",
    time: "10 min",
    tools: "Docs + Slides + Canva + Google Vids",
    icon: "visual",
    steps: [
      "Write the audience, one message, approved facts, and desired action first.",
      "Ask AI for the narrative/scene structure and visual purpose before generating assets.",
      "Review claims, accessibility, representation, links, captions, and brand fit before publishing.",
    ],
    prompt: "Build a concise GGW [presentation / visual / 60-second video] plan. Audience: [AUDIENCE]. One message they should remember: [MESSAGE]. Approved facts: [FACTS]. Desired action: [ACTION]. Return the minimum number of slides/scenes needed, purpose of each, suggested visual, speaker/voiceover notes, accessibility text, and [CHECK] markers for anything requiring confirmation. Keep the style modern, confident, inclusive, and human.",
    check: ["One clear audience outcome", "Facts match source", "Accessibility is included", "No unsupported visual claims"],
  },
  {
    id: "automation-helper",
    category: "automation",
    title: "Design the simplest WildApricot automation",
    summary: "Turn a repetitive trigger → copy → update → draft process into a safe no-code workflow.",
    useWhen: "Someone repeats the same handoff every week, after every member change, or after every event.",
    time: "10–15 min to map",
    tools: "WildApricot + Zapier / Make + Google Workspace",
    icon: "automation",
    steps: [
      "Write the workflow in one sentence: When X happens in WildApricot, prepare Y in a Google tool.",
      "Use Zapier for a simple trigger/action flow, Make for multi-step/branching, and API/webhook only for a real connector gap.",
      "Test with fictional or low-risk data, duplicate scenarios, permission errors, and a visible human review step.",
    ],
    prompt: "Design the simplest automation for this GGW workflow: [WORKFLOW]. WildApricot is the system of record and Google Workspace is the primary work environment. Recommend Zapier for a simple trigger/action flow, Make for multi-step/branching, or API/webhook only when needed. Return: trigger, minimum required fields, Google destination, actions in order, where AI adds value, human approval point, duplicate protection, failure handling, permissions, and a 5-step test plan. Prefer no-code and the fewest moving parts.",
    check: ["System of record stays clear", "Minimum data only", "Duplicates are tested", "External impact has review"],
  },
];

const automations: AutomationAid[] = [
  {
    id: "new-member-welcome",
    title: "New member → welcome draft",
    trigger: "WildApricot: Contact or Member Created / Updated",
    outcome: "Prepare a personalized welcome draft without manually copying member details into an email.",
    connector: "Zapier",
    whatItIs: "Zapier is a no-code connector that watches for a trigger in one app and runs an action in another.",
    whyUseful: "Use it when one WildApricot event should cause one or two predictable Google Workspace steps.",
    steps: [
      "Create a Zap and choose WildApricot as the trigger app.",
      "Choose the contact/member created or updated trigger and test it with a low-risk record.",
      "Map only the fields needed for the welcome into the next step.",
      "Use Gemini to draft the welcome, then create a Gmail draft or review row in Google Sheets.",
      "Test merge fields and duplicate behavior before enabling the Zap.",
    ],
    aiStep: "Draft the welcome from approved membership facts; AI should not invent benefits, eligibility, or membership status.",
    verify: ["Correct trigger", "Only needed fields", "Draft-first pilot", "Merge fields tested", "Owner for errors"],
  },
  {
    id: "event-registration",
    title: "New registration → Google Sheet + follow-up prep",
    trigger: "WildApricot: Event Registration Created / Updated / Canceled",
    outcome: "Keep an operational registration Sheet current and prepare useful attendee groups without repeated exports.",
    connector: "Zapier",
    whatItIs: "Zapier can listen for supported WildApricot registration events and pass selected fields into Google Sheets or another approved Google tool.",
    whyUseful: "This removes repetitive export/copy work and keeps an operational tracker current between events.",
    steps: [
      "Choose the event-registration trigger that matches the workflow and select the intended event.",
      "Add Google Sheets as the action and map only the operational fields the team needs.",
      "Use a stable contact or registration identifier for dedupe/update logic.",
      "Use Gemini in the Sheet to summarize patterns or prepare reviewed follow-up groups.",
      "Test a new registration, update, cancellation, and duplicate before enabling.",
    ],
    aiStep: "Summarize registration patterns, identify missing information, and prepare follow-up groups using non-sensitive fields.",
    verify: ["Correct event", "Field mapping verified", "Dedupe works", "Cancellation tested", "Sheet access is appropriate"],
  },
  {
    id: "membership-level",
    title: "Membership-level change → correct outreach draft",
    trigger: "WildApricot: Membership Level Updated",
    outcome: "Prepare the appropriate message or internal action when a member's level changes.",
    connector: "Zapier",
    whatItIs: "Zapier is the simplest choice when a supported status change should trigger one controlled follow-up.",
    whyUseful: "It reduces missed follow-up while keeping the actual membership level in WildApricot as the source of truth.",
    steps: [
      "Use Membership Level Updated as the WildApricot trigger.",
      "Add a filter if only particular old/new levels should continue.",
      "Pass only the fields required to Google Sheets, Gemini, or a Gmail draft step.",
      "Generate the correct approved message variant or internal review task.",
      "Test expected and unexpected level changes before enabling.",
    ],
    aiStep: "Draft the appropriate message from the actual membership level and approved benefits; never infer eligibility from unrelated fields.",
    verify: ["Old/new level is correct", "Filter logic tested", "No unintended recipients", "Benefits approved", "Draft-first pilot"],
  },
  {
    id: "event-content",
    title: "Event created/changed → promotion preparation",
    trigger: "WildApricot: Event Created or Modified",
    outcome: "Turn one approved event record into several prepared content assets without repeatedly copying the same facts.",
    connector: "Make",
    whatItIs: "Make is a visual no-code automation platform designed for workflows with several steps, filters, branches, or transformations.",
    whyUseful: "Use Make when one WildApricot event needs to feed several Google/content preparation steps in a controlled sequence.",
    steps: [
      "Create a Make scenario and connect the approved WildApricot account/application.",
      "Use the event trigger and add a filter so only intended events continue.",
      "Route approved event fields to a Google Sheet or content-preparation step.",
      "Use AI to transform the same facts into channel-specific drafts; do not edit the WildApricot source record automatically.",
      "Add visible error handling and test every route before scheduling the scenario.",
    ],
    aiStep: "Transform one approved event source into email, social, visual brief, and internal checklist drafts.",
    verify: ["Filter catches intended events only", "Private fields do not travel", "Errors are visible", "Output is reviewed", "No automatic source edits"],
  },
  {
    id: "payment-reporting",
    title: "Payment update → finance working Sheet + exception review",
    trigger: "WildApricot: Payment Updated / Refund Created or Updated",
    outcome: "Reduce manual transaction copying while keeping payment records authoritative in WildApricot and human-reviewed in reporting.",
    connector: "Zapier",
    whatItIs: "Zapier can pass a supported payment/refund event into a controlled Google Sheet for reconciliation or operational reporting.",
    whyUseful: "It can eliminate repetitive data entry without letting AI alter payment records or make accounting decisions.",
    steps: [
      "Choose the payment/refund trigger required for the reporting workflow.",
      "Map only the transaction identifiers, dates, status, amount, and other approved fields into a restricted Google Sheet.",
      "Use a stable transaction identifier to update rather than duplicate rows.",
      "Use Gemini only to summarize exceptions or data-quality issues, not to change financial records.",
      "Reconcile sample transactions to WildApricot before relying on the Sheet.",
    ],
    aiStep: "Summarize exceptions, missing information, or changes for a finance owner to review; do not make tax/accounting conclusions.",
    verify: ["Amounts/status match source", "Restricted Sheet access", "No duplicate transactions", "Refunds tested", "Finance owner reviews exceptions"],
  },
  {
    id: "multi-step-ops",
    title: "WildApricot activity → multi-step Google workflow",
    trigger: "WildApricot contact, event, registration, invoice, or payment module",
    outcome: "Handle several linked preparation steps when a simple one-trigger/one-action Zap is no longer enough.",
    connector: "Make",
    whatItIs: "Make is useful for visual workflows that need multiple steps, filters, branching logic, scheduled searches, or transformations.",
    whyUseful: "It is a better fit when a single WildApricot change needs to update a Sheet, prepare a Doc, create a draft, and route an internal review.",
    steps: [
      "Write the full workflow first and identify the exact WildApricot source event or scheduled lookup.",
      "Build one route at a time and filter out records that should not continue.",
      "Keep Google Sheets or Drive as visible working destinations so staff can inspect the result.",
      "Add AI only where it transforms text/data into a useful draft or summary.",
      "Create an error route and document who pauses or fixes the scenario.",
    ],
    aiStep: "Use AI for summarization, categorization, draft creation, or exception explanation—not as the owner of member, event, or payment data.",
    verify: ["Every route has a purpose", "Filters tested", "Errors visible", "Human review before external action", "Pause owner documented"],
  },
  {
    id: "custom-integration",
    title: "Connector gap → custom workflow",
    trigger: "A required WildApricot event/action is not covered by the approved no-code flow",
    outcome: "Use an API/webhook only when Zapier or Make cannot support the business requirement cleanly.",
    connector: "Webhook / API",
    whatItIs: "A webhook notifies another system when something changes. An API is a controlled way for another system to read or update WildApricot data.",
    whyUseful: "This is the advanced option for genuine connector gaps. It needs a technical owner because authentication, errors, rate limits, logging, and permissions matter.",
    steps: [
      "Confirm Zapier or Make cannot cover the requirement first.",
      "Define the exact event/data needed and the minimum fields required.",
      "Have the technical owner configure authentication, webhook/API handling, logging, retries, and failure alerts.",
      "Use AI downstream for preparation or analysis, not as an unreviewed authority to change records.",
      "Test in a controlled environment and document how to disable or roll back the workflow.",
    ],
    aiStep: "Use AI after the integration safely delivers the required fields—for example to summarize, classify, or prepare a draft for review.",
    verify: ["Technical owner assigned", "Authentication is secure", "Error handling exists", "Least privilege used", "Rollback documented"],
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
    id: "wa-event-promo",
    title: "Create an event promotion kit from one WildApricot record",
    tool: "WildApricot + Gemini + Canva",
    summary: "Reuse one approved event source across email, social, talking points, and visuals.",
    prompt: "Create a GGW event promotion kit using only these approved WildApricot event facts: [PASTE FACTS]. Return: member email, LinkedIn post, short social caption, five talking points, Canva visual brief, and a final fact-check list. Preserve event name, date, time, location, registration URL, deadline, pricing, and eligibility exactly. Mark missing items as [CHECK].",
    tags: ["WildApricot", "Events", "Content", "Canva"],
  },
  {
    id: "wa-registration-analysis",
    title: "Analyze event registrations in Google Sheets",
    tool: "WildApricot + Sheets + Gemini",
    summary: "Create a quick operational view of registrations without manually scanning rows.",
    prompt: "Analyze this WildApricot event registration export in Google Sheets. Goal: [GOAL]. Return: registration count, useful non-sensitive segments, cancellation/no-show indicators if present, missing or inconsistent data, follow-up groups, and five questions to investigate. Use only the provided fields. Separate facts from recommendations.",
    tags: ["WildApricot", "Events", "Sheets", "Analysis"],
  },
  {
    id: "sheet-cleanup",
    title: "Plan a safe cleanup for a messy Google Sheet",
    tool: "Google Sheets + Gemini",
    summary: "Preview cleanup rules before changing dates, labels, duplicates, or missing values.",
    prompt: "Help me clean this Google Sheet without changing the source meaning. First inspect the headers and sample rows. Propose a cleanup plan for dates, whitespace, capitalization, duplicates, missing values, and inconsistent labels. Do not delete or overwrite anything yet. Return the proposed rules, rows that need human review, and the safest order to apply the cleanup.",
    tags: ["Sheets", "Cleanup", "Data", "Gemini"],
  },
  {
    id: "meeting-actions",
    title: "Turn a GGW meeting recap into actions",
    tool: "Google Meet + Docs + Gemini",
    summary: "Convert meeting notes into decisions, owners, dates, and a follow-up draft.",
    prompt: "Turn these GGW meeting notes into a useful follow-up. Return: decisions, open questions, action items with owner and due date, risks/blockers, and a short follow-up email. If an owner or date is not stated, write Not stated. Do not invent commitments. Finish with CHECK BEFORE SHARING.",
    tags: ["Meet", "Docs", "Actions", "Follow-up"],
  },
  {
    id: "partner-update",
    title: "Draft a sponsor or partner update",
    tool: "Docs / Gmail + Gemini",
    summary: "Organize confirmed status and next steps without creating new commitments.",
    prompt: "Draft a concise GGW sponsor/partner update from these confirmed notes: [NOTES]. Return: current status, completed items, next steps with owners/dates, open questions, and a short closing. Keep the tone professional, appreciative, and direct. Do not invent deliverables, dates, approvals, benefits, or commitments. Mark gaps as [CHECK].",
    tags: ["Partners", "Gmail", "Docs", "Communication"],
  },
  {
    id: "board-summary",
    title: "Turn approved metrics into a board-ready summary",
    tool: "Sheets + Docs + Gemini",
    summary: "Create a concise leadership narrative while keeping claims tied to evidence.",
    prompt: "Turn these approved GGW metrics and notes into a board-ready summary. Return: executive headline, 3–5 key facts, what changed versus the comparison period if provided, why it matters, risks/questions, and recommended next steps. Use only supplied data. Do not infer causation, impact, or ROI unless evidence is explicitly provided. Mark unsupported claims as [CHECK].",
    tags: ["Board", "Reporting", "Sheets", "Docs"],
  },
  {
    id: "wa-automation-design",
    title: "Design the simplest WildApricot + Google automation",
    tool: "WildApricot + Zapier / Make",
    summary: "Choose the lightest connector and map a safe Google-first workflow before building it.",
    prompt: "Design the simplest automation for this GGW workflow: [WORKFLOW]. WildApricot is the system of record and Google Workspace is the primary work environment. Recommend Zapier for simple trigger/action flows, Make for multi-step/branching workflows, or API/webhook only when needed. Return: trigger, minimum required fields, Google destination, actions in order, AI step, human approval point, duplicate protection, failure handling, permissions, and a 5-step test plan. Prefer no-code and the fewest moving parts.",
    tags: ["WildApricot", "Automation", "Zapier", "Make", "Google"],
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
      <span className="ggw-aid-copy"><strong>{aid.title}</strong><small>{aid.summary}</small><em>{aid.tools}</em></span>
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
      <span><strong>{item.title}</strong><small>{item.outcome}</small><em>{item.trigger}</em></span>
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
  const [category, setCategory] = useState<Category>("all");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return aids.filter((aid) => {
      const matchesCategory = category === "all" || aid.category === category;
      const matchesQuery = !q || [aid.title, aid.summary, aid.useWhen, aid.tools, aid.prompt, aid.category].join(" ").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return <main className="ggw-workbench">
    <section className="ggw-workbench-hero">
      <div className="ggw-workbench-hero-copy">
        <span className="ggw-kicker"><Sparkles size={16} /> GGW AI Workbench</span>
        <h1>What do you need help with?</h1>
        <p>Search the job in front of you. Get the steps, the prompt, the Google workflow, and the check before you use the result.</p>
        <div className="ggw-workbench-search"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try: member renewal, event follow-up, clean a Sheet, sponsor email, automate…" aria-label="Search GGW AI job aids" />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</div>
        <div className="ggw-hero-actions"><button onClick={() => { window.location.href = "?view=prompts"; }}>Open Prompt Library <ArrowRight size={15} /></button><span>Works in the browser on Mac or Windows.</span></div>
      </div>
      <div className="ggw-workbench-hero-card">
        <strong>The GGW way to use AI</strong>
        <div><span>1</span><p><b>Start with the job</b>What are you trying to get done?</p></div>
        <div><span>2</span><p><b>Use the source</b>WildApricot or the approved Google file stays authoritative.</p></div>
        <div><span>3</span><p><b>Check before action</b>Review names, dates, links, amounts, recipients, and commitments.</p></div>
      </div>
    </section>

    <section className="ggw-tool-strip" aria-label="GGW work environment">
      <div><strong>WildApricot</strong><span>Members, events, registrations, payments</span></div>
      <div><strong>Google Sheets</strong><span>Working data, analysis, trackers</span></div>
      <div><strong>Gmail + Docs</strong><span>Reviewed drafts and communication</span></div>
      <div><strong>Drive + Gemini</strong><span>Approved sources, summaries, research</span></div>
    </section>

    <section className="ggw-aids-section">
      <div className="ggw-section-head"><div><span>Fast help for real GGW work</span><h2>Choose the job, not the course.</h2></div><small>{filtered.length} job aid{filtered.length === 1 ? "" : "s"}</small></div>
      <div className="ggw-filter-row" aria-label="Filter job aids">{categories.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
      <div className="ggw-aid-list">{filtered.map((aid) => <AidCard key={aid.id} aid={aid} />)}</div>
      {!filtered.length && <div className="ggw-empty"><Search size={20} /><strong>No exact match.</strong><span>Try a broader job like member, event, email, Sheet, report, content, or automation.</span></div>}
    </section>

    <section className="ggw-automation-section" id="automations">
      <div className="ggw-section-head"><div><span>WildApricot + Google automations</span><h2>Stop repeating the handoff.</h2><p>WildApricot remains the system of record. Connectors move only the information needed into Google Workspace, where AI can prepare a draft, summary, group, or review item.</p></div></div>
      <div className="ggw-connector-strip">
        <div><b>Zapier</b><span>Best for a simple trigger → Google action</span></div>
        <div><b>Make</b><span>Best for several steps, filters, or branches</span></div>
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
  return createPortal(<section className="ggw-prompt-extension"><div className="ggw-section-head"><div><span>GGW + WildApricot + Google</span><h2>Prompts for the work you actually do.</h2><p>Member operations, events, Google Sheets, communication, reporting, content, and automation. Replace the brackets, use the minimum data needed, then review the result before changing a record or sending anything.</p></div></div><div className="ggw-extra-prompt-grid">{promptAdditions.map((item) => <PromptCard key={item.id} item={item} />)}</div></section>, target);
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