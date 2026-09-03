"use client";

import { ExternalLink, Sparkles } from "lucide-react";

const productivityTools = [
  {
    name: "Gmail",
    vendor: "Google",
    domain: "mail.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://mail.google.com",
    purpose: "Member, event, partner, board, and volunteer communication with review before send.",
    features: ["Search operators, labels, filters, and templates", "Schedule send and snooze", "Thread summaries and writing help with Gemini when available", "Draft-first workflows for automations"],
    jobs: ["Welcome and renewal messages", "Event reminders and follow-up", "Sponsor and partner updates", "Board and volunteer communications"],
    open: "https://mail.google.com/",
    create: "https://mail.google.com/mail/u/0/#inbox?compose=new",
    createLabel: "Compose email",
    learn: "https://support.google.com/mail/",
    ai: "Gemini features depend on the GGW Google Workspace plan and administrator settings.",
  },
  {
    name: "Outlook",
    vendor: "Microsoft",
    domain: "outlook.office.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://outlook.office.com",
    purpose: "A first-class email and calendar option for GGW staff who work in Microsoft 365 instead of Gmail.",
    features: ["Folders, categories, search, rules, and calendar integration", "Copilot thread summaries when available", "Draft with Copilot and email coaching when licensed", "Meeting preparation and scheduling support where enabled"],
    jobs: ["Member and partner communication", "Board and committee email", "Long-thread catch-up and action extraction", "Meeting preparation and follow-up"],
    open: "https://outlook.office.com/",
    learn: "https://support.microsoft.com/outlook",
    ai: "Copilot features vary by Microsoft 365/Copilot license, Outlook version, tenant settings, and the content the signed-in user is permitted to access.",
  },
  {
    name: "Google Sheets",
    vendor: "Google",
    domain: "sheets.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://sheets.google.com",
    purpose: "The primary visible working layer for exports, trackers, analysis, reconciliation, and reporting.",
    features: ["Filters, filter views, tables, pivots, and charts", "Data validation, conditional formatting, and protected ranges", "Formulas such as XLOOKUP, SUMIFS, COUNTIFS, FILTER, QUERY, and ARRAYFORMULA", "Gemini-assisted analysis/formula help where available"],
    jobs: ["WildApricot member and registration exports", "Budget vs actual and cash-flow working aids", "Grant, sponsor, and compliance trackers", "Operational dashboards and data cleanup"],
    open: "https://sheets.google.com/",
    create: "https://sheets.new/",
    createLabel: "New Sheet",
    learn: "https://support.google.com/docs/topic/9054603",
    ai: "Use AI to explain, classify, draft formulas, or summarize. Validate formulas, totals, and source rows before relying on the result.",
  },
  {
    name: "Google Docs",
    vendor: "Google",
    domain: "docs.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://docs.google.com",
    purpose: "Create governed working documents, SOPs, briefs, board materials, policies, and collaborative drafts.",
    features: ["Headings, outline, comments, suggestions, and version history", "Templates and reusable document structures", "Smart chips for people, dates, files, and meetings", "Gemini drafting and summarization where enabled"],
    jobs: ["Board agendas and draft minutes", "SOPs and process documentation", "Grant narratives and reports", "Sponsor briefs, policies, and program plans"],
    open: "https://docs.google.com/",
    create: "https://docs.new/",
    createLabel: "New Doc",
    learn: "https://support.google.com/docs/",
    ai: "Keep signed agreements, approved policy, and source data authoritative. AI-assisted text still needs owner review.",
  },
  {
    name: "Google Drive",
    vendor: "Google",
    domain: "drive.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://drive.google.com",
    purpose: "Store the approved sources behind GGW operations and control who can access them.",
    features: ["Shared drives/folders and permission management", "Search by owner, type, date, and phrase", "Version history and activity", "Shortcuts and consistent folder structures"],
    jobs: ["Board and governance source files", "Grant agreements and reporting evidence", "Approved event/content assets", "Finance, policy, and operational records"],
    open: "https://drive.google.com/",
    learn: "https://support.google.com/drive/",
    ai: "Do not move sensitive member, donor, financial, HR, or legal content into an AI workflow unless GGW has approved that use.",
  },
  {
    name: "Google Calendar",
    vendor: "Google",
    domain: "calendar.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://calendar.google.com",
    purpose: "Turn deadlines, events, board meetings, grant reporting dates, and compliance obligations into visible reminders.",
    features: ["Shared calendars and event visibility", "Recurring events and reminders", "Appointment schedules where available", "Meet links, attachments, and guest controls"],
    jobs: ["Event operations calendar", "Board cadence", "Grant/reporting deadlines", "Confirmed compliance and renewal reminders"],
    open: "https://calendar.google.com/",
    create: "https://calendar.google.com/calendar/u/0/r/eventedit",
    createLabel: "New event",
    learn: "https://support.google.com/calendar/",
    ai: "Only add compliance dates once an authoritative source or qualified advisor has confirmed the requirement.",
  },
  {
    name: "Google Meet",
    vendor: "Google",
    domain: "meet.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://meet.google.com",
    purpose: "Run staff, board, partner, volunteer, and event meetings with a clean follow-through workflow.",
    features: ["Captions and meeting controls", "Recording/transcripts when plan and policy allow", "Meet notes/recaps where enabled", "Calendar and Docs integration"],
    jobs: ["Board and committee meetings", "Partner/sponsor calls", "Staff operating meetings", "Virtual event and speaker coordination"],
    open: "https://meet.google.com/",
    create: "https://meet.google.com/new",
    createLabel: "Start a meeting",
    learn: "https://support.google.com/meet/",
    ai: "Confirm consent, policy, and plan availability before recording or using transcripts. Verify AI-generated recaps against the meeting source.",
  },
  {
    name: "Google Slides",
    vendor: "Google",
    domain: "slides.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://slides.google.com",
    purpose: "Create board, sponsor, program, training, and event presentations from approved facts and visuals.",
    features: ["Themes, layouts, speaker notes, and collaboration", "Charts linked from Google Sheets", "Version history", "Gemini image/content assistance where available"],
    jobs: ["Board and leadership decks", "Sponsor presentations", "Event/program presentations", "Operational reporting"],
    open: "https://slides.google.com/",
    create: "https://slides.new/",
    createLabel: "New presentation",
    learn: "https://support.google.com/docs/topic/9054607",
    ai: "Keep metrics linked to approved Sheets data and re-check any AI-generated claims or visuals before presenting.",
  },
  {
    name: "Google Forms",
    vendor: "Google",
    domain: "forms.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://forms.google.com",
    purpose: "Collect structured feedback, volunteer intake, surveys, internal requests, and program data into Sheets.",
    features: ["Question logic and validation", "Response destination in Sheets", "Quizzes/surveys and confirmation messages", "Collaboration and response summaries"],
    jobs: ["Post-event feedback", "Volunteer interest/intake", "Program feedback", "Internal operational requests"],
    open: "https://forms.google.com/",
    create: "https://forms.new/",
    createLabel: "New Form",
    learn: "https://support.google.com/docs/topic/9055404",
    ai: "Collect only information GGW actually needs. Avoid unnecessary sensitive data and make the purpose of collection clear.",
  },
  {
    name: "Gemini",
    vendor: "Google",
    domain: "gemini.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://gemini.google.com",
    purpose: "Draft, organize, summarize, analyze, brainstorm, and review while keeping authoritative GGW sources in control.",
    features: ["Prompt-based drafting and transformation", "File/source analysis where available", "Structured outputs, checklists, and tables", "Critical review and fact-check workflows"],
    jobs: ["Draft communications", "Analyze approved exports", "Build plans/SOPs", "Review work for gaps before human approval"],
    open: "https://gemini.google.com/",
    learn: "https://support.google.com/gemini/",
    ai: "Never treat the model as the source of truth for legal, tax, regulatory, financial, HR, membership-status, or board decisions.",
  },
  {
    name: "Microsoft Copilot",
    vendor: "Microsoft",
    domain: "m365.cloud.microsoft",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://m365.cloud.microsoft",
    purpose: "AI support for staff working in Microsoft 365, including authorized email, meeting, file, and web context where the product and license allow it.",
    features: ["Copilot Chat and prompt-based drafting", "Outlook thread summaries with source links/citations where available", "Drafting and coaching in Outlook where licensed", "Meeting preparation using content the signed-in user is allowed to access"],
    jobs: ["Summarize long Outlook threads", "Prepare for meetings", "Create weekly operations briefs", "Source-grounded research and board preparation"],
    open: "https://m365.cloud.microsoft/chat",
    learn: "https://support.microsoft.com/microsoft-365-copilot",
    ai: "Copilot capabilities vary by license, application, administrator configuration, and user permissions. Do not assume it can access a file, email, meeting, or tenant source unless that content is actually available to the signed-in user.",
  },
  {
    name: "NotebookLM",
    vendor: "Google",
    domain: "notebooklm.google.com",
    icon: "https://www.google.com/s2/favicons?sz=64&domain_url=https://notebooklm.google.com",
    purpose: "Ask questions across a controlled set of approved source documents and keep answers tied to those sources.",
    features: ["Source-grounded Q&A and citations", "Briefing documents and summaries", "Study/FAQ-style outputs", "Audio Overview availability depending on product support"],
    jobs: ["Board/policy research", "Grant and agreement review", "Program source synthesis", "Create FAQs from approved source material"],
    open: "https://notebooklm.google.com/",
    learn: "https://support.google.com/notebooklm/",
    ai: "The notebook is only as authoritative as the sources added. Check citations and keep outdated or conflicting material out of the source set.",
  },
];

export default function GoogleWorkspaceHub() {
  return (
    <section className="ggw-google-hub" id="google-workspace">
      <div className="ggw-google-hub-head">
        <div>
          <span><Sparkles size={15} /> PRODUCTIVITY TOOLS + AI</span>
          <h2>Use the tools GGW staff actually work in.</h2>
          <p>Google Workspace is the primary environment, while Outlook and Microsoft Copilot are supported for staff who work in Microsoft 365. Each card connects the tool to actual GGW nonprofit work and calls out when AI functionality depends on licensing or administrator settings.</p>
        </div>
      </div>

      <div className="ggw-google-grid">
        {productivityTools.map((tool) => (
          <article className="ggw-google-card" key={tool.name}>
            <div className="ggw-google-card-title">
              <span className="ggw-google-product-icon" style={{ backgroundImage: `url("${tool.icon}")` }} aria-hidden="true" />
              <div><h3>{tool.name}</h3><span>{tool.domain}</span></div>
            </div>
            <p className="ggw-google-purpose">{tool.purpose}</p>

            <div className="ggw-google-preview" aria-hidden="true">
              <div className="ggw-google-preview-bar"><i /><i /><i /><span>{tool.name}</span></div>
              <div className="ggw-google-preview-body">
                <strong>Useful at GGW</strong>
                {tool.jobs.slice(0, 3).map((job) => <span key={job}>✓ {job}</span>)}
              </div>
            </div>

            <details>
              <summary>Features worth knowing</summary>
              <ul>{tool.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </details>
            <details>
              <summary>GGW use cases</summary>
              <ul>{tool.jobs.map((job) => <li key={job}>{job}</li>)}</ul>
            </details>

            <div className="ggw-google-ai-note"><Sparkles size={14} /><span>{tool.ai}</span></div>
            <div className="ggw-google-actions">
              <a href={tool.open} target="_blank" rel="noreferrer"><ExternalLink size={13} />Open {tool.name}</a>
              {tool.create && <a href={tool.create} target="_blank" rel="noreferrer">{tool.createLabel}</a>}
              <a className="secondary" href={tool.learn} target="_blank" rel="noreferrer">{tool.vendor} help</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
