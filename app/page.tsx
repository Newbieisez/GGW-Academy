"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Info,
  LayoutTemplate,
  LockKeyhole,
  Mail,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
  Video,
} from "lucide-react";

// GitHub Pages exports this client-rendered experience as static HTML. The
// hosted deployment keeps the same page interactive through the normal
// runtime, while this directive tells vinext that no request-time data is
// needed to render the shell.
export const dynamic = "force-static";

type AppView = "home" | "prompts" | "sandbox" | "module" | "dashboard" | "admin";
export type ModuleId = "daily" | "data" | "visuals" | "automation" | "agents" | "governance";
type SandboxId = "sheets" | "drive" | "docs" | "gmail";
type SaveState = "connecting" | "connected" | "saving" | "offline";
export type AcademyStorageMode = "cloud" | "browser" | "offline";
type WorkProduct = { kind: string; title: string; content: unknown };
const sandboxModuleMap: Record<SandboxId, ModuleId> = { sheets: "data", drive: "governance", docs: "daily", gmail: "daily" };

export const GITHUB_PAGES_MODE = process.env.NEXT_PUBLIC_GGW_STATIC === "true";
const PUBLIC_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const ACADEMY_API_BASE = (process.env.NEXT_PUBLIC_ACADEMY_API_BASE || "").replace(/\/$/, "");
const GEMINI_API_ENDPOINT = (process.env.NEXT_PUBLIC_GEMINI_API_URL || "").replace(/\/$/, "");
export const ACADEMY_API_CONFIGURED = Boolean(ACADEMY_API_BASE);
const REMOTE_ACADEMY_ENABLED = !GITHUB_PAGES_MODE || ACADEMY_API_CONFIGURED;

export function academyPath(rawPath: string): string {
  const [rawPathname, query = ""] = rawPath.split("?");
  const pathname = rawPathname.startsWith("/") ? rawPathname : "/" + rawPathname;
  const withSlash = GITHUB_PAGES_MODE && pathname !== "/" && !pathname.endsWith("/") ? pathname + "/" : pathname;
  return `${PUBLIC_BASE_PATH}${withSlash}${query ? "?" + query : ""}` || "/";
}

export function academyApiUrl(path: string): string {
  return `${ACADEMY_API_BASE || (GITHUB_PAGES_MODE ? PUBLIC_BASE_PATH : "")}${path}`;
}

export type LocalAcademyState = {
  progress?: { view?: AppView; activeModule?: ModuleId | null; activeSandbox?: SandboxId | null; step?: number; completed?: string[] };
  moduleProgress?: ModuleProgressRow[];
  recentAttempts?: AttemptRow[];
  outcomes?: OutcomeRow[];
  workProducts?: Array<{ kind?: string; title?: string; created_at?: string }>;
};

const LOCAL_ACADEMY_STORAGE_KEY = "ggw-ai-academy-progress-v2";

export function readLocalAcademyState(): LocalAcademyState {
  if (typeof window === "undefined") return {};
  try {
    const saved = window.localStorage.getItem(LOCAL_ACADEMY_STORAGE_KEY);
    if (!saved) return {};
    const parsed = JSON.parse(saved) as LocalAcademyState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalAcademyState(state: LocalAcademyState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_ACADEMY_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Browser storage can be disabled or full; the learning activity remains usable.
  }
}

function localCoachReply(question: string, activeModuleId?: ModuleId): string {
  const normalized = question.toLowerCase();
  const moduleHint = activeModuleId ? ` You are currently on the ${moduleTitle(activeModuleId)} path.` : "";
  if (normalized.includes("sheet") || normalized.includes("finance") || normalized.includes("990") || normalized.includes("receipt")) {
    return `Start with a copy of the source Sheet, then ask for one structured pass: standardize dates to YYYY-MM-DD, assign Program Services, Management & General, or Fundraising, and flag missing vendor detail or amounts over $1,000 as Requires Receipt/Audit. Check every uncertain row against the source and have GGW's finance owner make the final decision.${moduleHint}`;
  }
  if (normalized.includes("notebook") || normalized.includes("source") || normalized.includes("drive") || normalized.includes("file")) {
    return `Choose the current approved source before asking AI anything. Record the owner, last-updated date, shared location, and access status. In NotebookLM, ask it to use only the selected sources, show citations, and say when the sources disagree or do not answer the question.${moduleHint}`;
  }
  if (normalized.includes("email") || normalized.includes("gmail") || normalized.includes("draft")) {
    return `Ask for a draft or summary with a fixed shape: decision, open questions, action items with owners and dates, and CHECK BEFORE SHARING. Then compare names, dates, links, amounts, recipients, and attachments with the original before sending anything.${moduleHint}`;
  }
  if (normalized.includes("image") || normalized.includes("video") || normalized.includes("slide") || normalized.includes("vid")) {
    return `Write the one-sentence audience message and list approved facts before generating a visual. Ask for the visual purpose, accessibility description, scene or slide structure, and [CHECK] markers. Review claims, representation, captions, voiceover, links, and brand fit before publication.${moduleHint}`;
  }
  if (normalized.includes("script") || normalized.includes("automat") || normalized.includes("form")) {
    return `Start with a draft-first workflow: Trigger, Validate, Build, Draft, Log. Test with fictional data, required-field failures, duplicates, and permission errors. Keep email in draft mode until a named owner approves the recipients and message.${moduleHint}`;
  }
  if (normalized.includes("spark") || normalized.includes("agent") || normalized.includes("autonomous") || normalized.includes("monitor")) {
    return `Use O-R-E-G: Observe only named sources, Reason with visible evidence, Execute reversible preparation, and Gate every send, edit, share, delete, purchase, or permission change behind human confirmation. A schedule is not permission to act without limits.${moduleHint}`;
  }
  return `Pick one real outcome, name the source, and ask for a small first draft with a clear output format. Then verify the result against the source before sharing it. Try asking “How do I use Gemini in Sheets?” or “How do I check an AI draft?”${moduleHint}`;
}
export type ModuleProgressRow = {
  module_id?: string;
  status?: string;
  current_step?: number | string;
  best_score?: number | string;
  attempts?: number | string;
  lab_passed?: number | string;
  artifact_saved?: number | string;
  commitment_status?: string;
  commitment_due_at?: string | null;
  completed_at?: string | null;
  last_activity_at?: string | null;
};
export type AttemptRow = { module_id?: string; activity_id?: string; attempt_type?: string; score?: number | string | null; result?: string; created_at?: string };
export type OutcomeRow = { module_id?: string; commitment_text?: string; due_at?: string | null; status?: string; baseline_minutes?: number | string | null; after_minutes?: number | string | null; confidence_before?: number | string | null; confidence_after?: number | string | null; notes?: string; updated_at?: string };
type AdminOverview = {
  summary?: Record<string, number | null>;
  modules?: Array<Record<string, string | number | null>>;
  recentEvents?: Array<Record<string, string | number>>;
  outcomes?: Array<Record<string, string | number>>;
  window?: { activeUsers?: string; events?: string };
};
type TrackingEvent = {
  eventName: string;
  moduleId?: ModuleId;
  activityId?: string;
  metadata?: Record<string, string | number | boolean>;
  attempt?: { moduleId?: ModuleId; activityId?: string; attemptType?: string; score?: number; result?: string; response?: unknown };
  outcome?: { moduleId?: ModuleId; commitmentText?: string; dueAt?: string | null; status?: string; baselineMinutes?: number | null; afterMinutes?: number | null; confidenceBefore?: number | null; confidenceAfter?: number | null; notes?: string };
  moduleProgress?: { moduleId: ModuleId; status?: string; currentStep?: number; bestScore?: number; attempts?: number; labPassed?: boolean; artifactSaved?: boolean; commitmentStatus?: string; commitmentDueAt?: string | null; completedAt?: string | null };
};

type ModuleDefinition = {
  id: ModuleId;
  number: string;
  title: string;
  kicker: string;
  description: string;
  time: string;
  color: string;
  tools: string;
  icon: string;
  scenario: string;
  wiifm: string;
  diagnosticQuestion: string;
  diagnosticOptions: string[];
  diagnosticCorrect: number;
  diagnosticRationale: string[];
  frameworkTitle: string;
  frameworkSummary: string;
  frameworkRows: Array<{ label: string; action: string; check: string }>;
  labTitle: string;
  labIntro: string;
  labSteps: string[];
  labPrompt?: string;
  labData?: string;
  labCode?: string;
  blueprint?: Array<{ label: string; content: string }>;
  takeawayTitle: string;
  takeaway: string;
  commitment: string;
  sandbox?: SandboxId;
};

type PromptItem = {
  id: string;
  title: string;
  tool: string;
  summary: string;
  prompt: string;
  tags: string[];
  where: string;
};

type SheetRow = {
  date: string;
  vendor: string;
  type: string;
  category: string;
  amount: string;
  flag: "Clear" | "Requires Receipt/Audit";
};

const financeCsv = [
  "Date,Vendor/Source,Type,Amount,Fund",
  "1/5/2026,Google Workspace,Software,120,Operations",
  "2026-01-12,GGW Event Venue,Event venue,1850,Program",
  "01/18/26,,Banking fee,25,Operations",
  "Jan 22 2026,Game Studio Partner,Sponsor acquisition,500,Fundraising",
].join("\n");

const appsScriptCode = [
  "/*",
  "  GGW Form to Doc to PDF pipeline",
  "  Safe default: creates a Gmail draft. It does not send email.",
  "  Before use: set RESPONSE_SHEET_NAME and DESTINATION_FOLDER_ID.",
  "*/",
  "const CONFIG = {",
  "  RESPONSE_SHEET_NAME: \"Form Responses 1\",",
  "  DESTINATION_FOLDER_ID: \"PASTE_A_SHARED_DRIVE_FOLDER_ID_HERE\",",
  "  STATUS_HEADER: \"GGW Automation Status\",",
  "};",
  "",
  "function onFormSubmitCreatePdfAndDraft(e) {",
  "  if (!e || !e.range) {",
  "    throw new Error(\"Run this from a form-submit trigger, not the editor Run button.\");",
  "  }",
  "",
  "  const sheet = e.range.getSheet();",
  "  if (sheet.getName() !== CONFIG.RESPONSE_SHEET_NAME) return;",
  "",
  "  const rowNumber = e.range.getRow();",
  "  const lastColumn = sheet.getLastColumn();",
  "  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);",
  "  const values = sheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];",
  "  const record = {};",
  "  headers.forEach(function(header, index) { record[header.trim()] = values[index]; });",
  "",
  "  const name = String(record[\"Name\"] || record[\"Full Name\"] || \"Participant\").trim();",
  "  const email = String(record[\"Email\"] || record[\"Email Address\"] || \"\").trim();",
  "  const eventName = String(record[\"Event\"] || record[\"Event Name\"] || \"GGW event\").trim();",
  "  if (!email) throw new Error(\"The submitted row has no email address.\");",
  "",
  "  const folder = DriveApp.getFolderById(CONFIG.DESTINATION_FOLDER_ID);",
  "  const safeName = name.replace(/[^a-zA-Z0-9 _-]/g, \"\").trim() || \"Participant\";",
  "  const document = DocumentApp.create(\"GGW registration - \" + safeName);",
  "  const body = document.getBody();",
  "  body.appendParagraph(\"Global Gaming Women\").setHeading(DocumentApp.ParagraphHeading.TITLE);",
  "  body.appendParagraph(eventName).setHeading(DocumentApp.ParagraphHeading.HEADING1);",
  "  body.appendParagraph(\"Participant: \" + name);",
  "  body.appendParagraph(\"Email: \" + email);",
  "  body.appendParagraph(\"Submitted: \" + new Date().toISOString());",
  "  body.appendParagraph(\"Review the source response before sharing this document.\");",
  "  document.saveAndClose();",
  "",
  "  const pdfBlob = DriveApp.getFileById(document.getId()).getAs(MimeType.PDF);",
  "  const pdfFile = folder.createFile(pdfBlob).setName(\"GGW registration - \" + safeName + \".pdf\");",
  "  const subject = \"GGW registration received: \" + eventName;",
  "  const message = \"Hi \" + name + \",\\n\\nWe received your registration for \" + eventName + \". A team member will review the details and follow up if needed.\\n\\nThis message was created as a draft for review.\";",
  "  GmailApp.createDraft(email, subject, message, { attachments: [pdfFile.getBlob()] });",
  "",
  "  const statusColumn = getOrCreateStatusColumn_(sheet, headers);",
  "  sheet.getRange(rowNumber, statusColumn).setValue(\"Draft created \" + new Date().toISOString());",
  "}",
  "",
  "function getOrCreateStatusColumn_(sheet, headers) {",
  "  const existingIndex = headers.indexOf(CONFIG.STATUS_HEADER);",
  "  if (existingIndex >= 0) return existingIndex + 1;",
  "  const newColumn = sheet.getLastColumn() + 1;",
  "  sheet.getRange(1, newColumn).setValue(CONFIG.STATUS_HEADER);",
  "  return newColumn;",
  "}",
  "",
  "function installFormSubmitTrigger() {",
  "  const spreadsheet = SpreadsheetApp.getActive();",
  "  const alreadyInstalled = ScriptApp.getProjectTriggers().some(function(trigger) {",
  "    return trigger.getHandlerFunction() === \"onFormSubmitCreatePdfAndDraft\";",
  "  });",
  "  if (!alreadyInstalled) {",
  "    ScriptApp.newTrigger(\"onFormSubmitCreatePdfAndDraft\")",
  "      .forSpreadsheet(spreadsheet)",
  "      .onFormSubmit()",
  "      .create();",
  "  }",
  "}",
].join("\n");

const modules: ModuleDefinition[] = [
  {
    id: "daily",
    number: "01",
    title: "Everyday AI Acceleration",
    kicker: "Gmail · Docs · Meet · Chat",
    description: "Turn inboxes, notes, and meetings into clear next steps without handing over the final judgment.",
    time: "Target: reclaim 15–30 minutes per recurring workflow",
    color: "blue",
    tools: "Gmail, Google Docs, Google Meet, Google Chat",
    icon: "daily",
    scenario: "A sponsor thread contains a revised date, a different deliverable owner, and an unanswered question. The event lead skims it between meetings, misses the changed date, and sends a follow-up that creates confusion for the partner.",
    wiifm: "Target: save 10–15 minutes per long thread or meeting follow-up and reduce missed owners by requiring a decision, open-question, and action-item output every time.",
    diagnosticQuestion: "You inherit a 40-message Gmail thread five minutes before a team check-in. What is the best first move?",
    diagnosticOptions: [
      "Read only the newest message and assume it contains the full decision.",
      "Ask Gemini for a structured summary, then verify the summary against the thread before acting.",
      "Copy the entire thread into a separate document and manually highlight every sentence.",
    ],
    diagnosticCorrect: 1,
    diagnosticRationale: [
      "A fails because the newest message may refer to a decision or constraint earlier in the thread.",
      "B succeeds because it creates a fast first pass while keeping the original thread as the source a person checks.",
      "C can work, but it is slow, duplicates sensitive content, and still provides no consistent review format.",
    ],
    frameworkTitle: "C-L-E-A-R: Context, Limit, Expected output, Accuracy check, Release",
    frameworkSummary: "Give Gemini the smallest useful context, set a boundary, specify the shape of the answer, check it against the source, and release only the reviewed result. The final step is not optional: AI can summarize a conversation, but GGW decides what is accurate and what becomes a commitment.",
    frameworkRows: [
      { label: "Context", action: "Name the audience and the source.", check: "Is the source complete?" },
      { label: "Limit", action: "Say what Gemini must not invent or change.", check: "Are gaps marked?" },
      { label: "Expected output", action: "Request decisions, questions, owners, and dates.", check: "Can a teammate scan it?" },
      { label: "Accuracy check", action: "Compare names, dates, amounts, and decisions.", check: "What needs human review?" },
      { label: "Release", action: "Copy only the reviewed result to the next tool.", check: "Is the audience correct?" },
    ],
    labTitle: "The one-thread-to-follow-up lab",
    labIntro: "Use a low-risk or fictional thread. The same pattern works for a Gmail summary, a Docs first draft, a Meet recap, or a Chat decision log.",
    labSteps: [
      "Open Gmail and choose a thread you are allowed to use with AI. Do not use a thread containing sensitive information unless GGW policy and your Workspace settings permit it.",
      "Open the Gemini side panel or the approved Gemini experience available in your account. Ask for a summary, not a reply.",
      "Paste the prompt below. Read the result beside the original thread. Correct any owner, date, or decision that is not supported by the source.",
      "Open a Google Doc only after the summary is checked. Use Help me write to turn the approved action list into a short follow-up memo.",
      "If the source is a Meet recap, tell attendees that AI-assisted notes were used and review the recap before sharing it in Chat or email.",
    ],
    labPrompt: "Summarize this thread for a busy GGW teammate. Return: 1) decision or current status, 2) open questions, and 3) action items with owner and due date. If an owner or due date is not stated, write Not stated. Preserve names, dates, amounts, and commitments exactly. Do not invent context. Finish with a section called CHECK BEFORE SHARING.",
    takeawayTitle: "Daily AI review card",
    takeaway: "Source: What message, note, or document supports this? Audience: Who will rely on it? Accuracy: Which names, dates, amounts, and commitments need checking? Action: What is the next human-approved step?",
    commitment: "Within 24 hours, use the CLEAR prompt on one non-sensitive Gmail thread or meeting recap, verify three facts against the source, and save the reviewed action list in the appropriate GGW Doc or task location.",
    sandbox: "gmail",
  },
  {
    id: "data",
    number: "02",
    title: "Advanced Data Synthesis & Analysis",
    kicker: "Sheets · NotebookLM · Drive",
    description: "Move from scattered files and messy tables to an explainable answer with formulas, source boundaries, and citations.",
    time: "Target: reclaim 1–2 hours per recurring analysis",
    color: "lime",
    tools: "Google Sheets, Gemini in Sheets, Google Drive, NotebookLM",
    icon: "data",
    scenario: "A month-end finance export sits in one Drive folder, a budget in another, and the sponsor tracker is owned by a different team. Everyone has a version of the truth, but no one can explain which file was current or why a line was classified a certain way.",
    wiifm: "Target: cut the first-pass analysis from hours to minutes and surface missing source data before a finance, grant, or board deadline. The goal is fewer silent spreadsheet changes, not a black-box answer.",
    diagnosticQuestion: "You need to compare a finance export with a budget and three policy documents. Which approach scales?",
    diagnosticOptions: [
      "Upload every file you can find into one AI prompt and trust the most confident answer.",
      "Copy relevant paragraphs into a new Sheet and manually reconcile them without recording sources.",
      "Keep a small approved source set, use Sheets for structure and formulas, and use NotebookLM for grounded document questions with citations.",
    ],
    diagnosticCorrect: 2,
    diagnosticRationale: [
      "A fails because mixed versions and unclear authority make an answer look complete while hiding source conflicts.",
      "B is fragile because it loses provenance and creates another uncontrolled copy of the data.",
      "C succeeds because each tool has a defined job: Sheets calculates and structures, Drive helps locate, and NotebookLM answers from the sources you selected.",
    ],
    frameworkTitle: "S-S-S-V: Source, Structure, Synthesize, Verify",
    frameworkSummary: "Separate the source-of-truth decision from the calculation and from the narrative. A formula can be correct against the wrong rows; a grounded briefing can be well cited against an outdated document. Keep each step visible so another person can reproduce the result.",
    frameworkRows: [
      { label: "Source", action: "Choose current, approved files and record owner/date.", check: "Could someone find the same file?" },
      { label: "Structure", action: "Normalize headers, dates, amounts, and IDs.", check: "Are blank or duplicate rows visible?" },
      { label: "Synthesize", action: "Use formulas or NotebookLM for the requested comparison.", check: "Does the method match the question?" },
      { label: "Verify", action: "Check output rows and citations against sources.", check: "What remains uncertain?" },
    ],
    labTitle: "The finance export and source notebook lab",
    labIntro: "This fictional exercise produces the GGW month-end review shape: Date | Vendor | Type | Category | Amount | Audit Flag. It also shows where a NotebookLM notebook belongs in the workflow.",
    labSteps: [
      "In Google Drive, create or use a clearly named working folder. Do not combine approved policy sources with unverified drafts.",
      "Open a copy of a Google Sheet. Paste the sample CSV below starting in cell A1. Keep the original export unchanged.",
      "In Sheets, ask Gemini to standardize dates to YYYY-MM-DD, classify each row as Program Services, Management & General, or Fundraising, and flag missing vendor detail or amounts over $1,000.",
      "Check the generated result row by row. Confirm that event, mentorship, and education items are Program Services; admin, software, legal, and banking items are Management & General; donor campaigns, gala overhead, and sponsor acquisition are Fundraising.",
      "Create a NotebookLM notebook with only approved bylaws, grant terms, sponsor agreements, and the dated finance policy. Ask a question using only those sources and require citations.",
      "Record the Sheet name, source folder, update date, reviewer, and unresolved questions in the review log. Functional classification is a review aid; GGW’s finance owner or CPA makes the final accounting decision.",
    ],
    labPrompt: "Review this transaction table. Standardize every date to YYYY-MM-DD. Assign each row to Program Services, Management & General, or Fundraising using the description and fund context. Flag any row missing vendor detail or with an amount over $1,000 as Requires Receipt/Audit. Return exactly these columns: Date | Vendor | Type | Category | Amount | Audit Flag. Preserve source values and list any uncertain classification below the table. Do not make a tax or accounting conclusion.",
    labData: financeCsv,
    takeawayTitle: "Source and analysis checklist",
    takeaway: "Source file name and link; owner; last updated date; approved/current status; Sheet copy name; formula or prompt used; rows changed; citations checked; reviewer; unresolved questions; next review date.",
    commitment: "Within 24 hours, choose one recurring report, identify its actual source-of-truth file, record its owner and update date, and create a one-page review log before asking AI to summarize it.",
    sandbox: "sheets",
  },
  {
    id: "visuals",
    number: "03",
    title: "Visuals, Media & Narrative",
    kicker: "Slides · Images · Google Vids",
    description: "Use AI to shape a story, create visual concepts, and draft video scenes while keeping brand, accessibility, and review visible.",
    time: "Target: remove one draft cycle from a deck or short video",
    color: "violet",
    tools: "Google Slides, Gemini image generation, Google Vids",
    icon: "visuals",
    scenario: "A leadership presentation has accurate data but no narrative. The team asks for AI-generated images and a quick promo video the night before an event, then discovers that the visuals contain unreviewed claims, inaccessible text, and a tone that does not sound like GGW.",
    wiifm: "Target: save 1–2 hours in the concept and storyboard stage and prevent late rework by reviewing the message, image rights, accessibility text, voiceover, and claims before publication.",
    diagnosticQuestion: "A team asks for a beautiful AI-generated slide and 60-second video. What should happen first?",
    diagnosticOptions: [
      "Define the audience, one message, required facts, visual purpose, and approval points before generating assets.",
      "Generate several attractive visuals immediately and choose the one people like.",
      "Copy the entire planning document into a slide generator and accept the first deck.",
    ],
    diagnosticCorrect: 0,
    diagnosticRationale: [
      "A succeeds because generation follows the story. People can review claims, representation, accessibility, and brand fit before an asset spreads.",
      "B produces decoration without a communication job and can create brand, accessibility, or representation problems.",
      "C may produce a fast deck, but a long document rarely maps cleanly to a useful slide narrative without decisions about priority.",
    ],
    frameworkTitle: "M-V-M-R: Message, Visual, Motion, Review",
    frameworkSummary: "Start with the message the audience must remember. Choose a visual that makes that message easier to understand. Add motion only when it supports pacing or comprehension. Review every claim, image, voiceover, alt-text description, and call to action before publishing.",
    frameworkRows: [
      { label: "Message", action: "Write one audience outcome per slide or scene.", check: "Could the audience repeat it?" },
      { label: "Visual", action: "Define subject, composition, and accessibility text.", check: "Does it support the message?" },
      { label: "Motion", action: "Set scene order, pacing, voiceover, and transition.", check: "Is the pace usable?" },
      { label: "Review", action: "Check facts, rights, representation, and brand voice.", check: "Who approves release?" },
    ],
    labTitle: "The one-message-to-video lab",
    labIntro: "Use a fictional GGW mentoring event. You will create a concept prompt for Slides and a storyboard prompt for Vids. The objective is a reviewable draft, not an automatic publication.",
    labSteps: [
      "In Google Docs, write the source facts first: event name, audience, date, approved description, registration link, and the one action you want viewers to take.",
      "In Google Slides, select a blank slide or a copied template. Open the Gemini feature available in your account and ask for a visual concept using the prompt below.",
      "Review the concept for representation, accessibility text, image purpose, and any claim that was not in the source facts. Generate or insert an image only after the concept is approved.",
      "In Google Vids, start a new video from the approved facts. Ask for five scenes, a 60-second runtime, voiceover, on-screen text, and transitions.",
      "Preview the video with sound and without sound. Check captions, pacing, pronunciation, URLs, and the final call to action. Have a GGW owner approve it before sharing externally.",
    ],
    labPrompt: "For a Global Gaming Women mentoring event, create two connected drafts. First, propose one Google Slides visual concept: audience, message, subject, composition, color direction, accessibility text, and what must not appear in the image. Second, plan a 60-second Google Vids video in five scenes with scene purpose, suggested visual, on-screen text, voiceover, transition, and approval check. Use only these source facts: [paste approved facts]. Mark every claim that needs confirmation as [CHECK]. Keep the voice confident, welcoming, inclusive, and human. Do not place unverified text inside an image.",
    takeawayTitle: "Creative release checklist",
    takeaway: "Message is one sentence; facts match source; image serves the message; text is readable; alt text or accessibility description is present; representation is respectful; voiceover and captions match; links work; claims are approved; a person owns release.",
    commitment: "Within 24 hours, take one upcoming GGW announcement and write its one-sentence audience outcome plus a five-scene storyboard before opening an image or video generator.",
    sandbox: "docs",
  },
  {
    id: "automation",
    number: "04",
    title: "Low-Code Automation Engine",
    kicker: "Apps Script · Workspace APIs",
    description: "Turn a stable, repeatable manual process into a testable workflow with triggers, drafts, logs, and deliberate permissions.",
    time: "Target: reclaim 3–5 hours per month on one repeatable process",
    color: "coral",
    tools: "Google Apps Script, Gmail, Docs, Drive, Forms",
    icon: "automation",
    scenario: "A registration form receives dozens of responses. Someone manually copies each response into a document, exports a PDF, emails the attendee, and updates a tracker. One row is sent to the wrong recipient, and nobody can tell which rows were already processed.",
    wiifm: "Target: remove repetitive copying while preserving a draft-first review step, a status column, and an error trail. The result is faster processing with a smaller chance of duplicate or misdirected messages.",
    diagnosticQuestion: "A team wants to automate form registrations tomorrow. What is the safest first implementation?",
    diagnosticOptions: [
      "Ask Gemini to write a script that sends every email immediately when a form is submitted.",
      "Define one trigger, validate required fields, create a document and PDF, create a Gmail draft, write a status, and test with fictional data.",
      "Build a large all-in-one script, paste it into Apps Script, and troubleshoot after the first real run.",
    ],
    diagnosticCorrect: 1,
    diagnosticRationale: [
      "A creates an external blast radius before the team has tested recipients, fields, scopes, and duplicate behavior.",
      "B succeeds because each stage is visible, reversible, logged, and testable before a later owner chooses to change draft creation into sending.",
      "C is fragile because a large untested workflow is difficult to isolate when one step fails.",
    ],
    frameworkTitle: "T-V-B-D-L: Trigger, Validate, Build, Draft, Log",
    frameworkSummary: "Triggers start work; validation stops bad data; building creates the requested artifact; drafting pauses before external impact; logging makes the outcome visible. Add one stage at a time. Never use automation to hide an approval that the organization still needs.",
    frameworkRows: [
      { label: "Trigger", action: "Choose form-submit, edit, or time-driven timing.", check: "Can it fire twice?" },
      { label: "Validate", action: "Check required fields and allowed values.", check: "What happens on missing data?" },
      { label: "Build", action: "Create the Doc, PDF, or tracker update.", check: "Where is it stored?" },
      { label: "Draft", action: "Create a Gmail draft instead of sending.", check: "Who approves release?" },
      { label: "Log", action: "Write status, timestamp, and error details.", check: "Can a person audit it?" },
    ],
    labTitle: "The form-to-Doc-to-PDF draft pipeline lab",
    labIntro: "The code below is a complete starter for a Google Sheet receiving Form responses. It creates a Google Doc, saves a PDF in a chosen folder, creates a Gmail draft with the PDF attached, and writes a status. It does not send email.",
    labSteps: [
      "Create a copy of the response Sheet and a test-only Drive folder. Make sure the response headers include Name, Email, and Event or adjust the header names in the code.",
      "Open Extensions → Apps Script. Replace the editor contents with the code below. Set RESPONSE_SHEET_NAME and DESTINATION_FOLDER_ID before saving.",
      "Run installFormSubmitTrigger once from the Apps Script editor. Approve only the scopes your organization permits. Do not run the form handler from the editor because it needs a real form-submit event.",
      "Submit one fictional test response. Confirm that the Doc and PDF appear in the test folder, that a Gmail draft exists for the test address, and that the Sheet has a status.",
      "Test missing email, duplicate submission, and a folder permission error. Record the behavior before considering any change to send real email.",
    ],
    labCode: appsScriptCode,
    takeawayTitle: "Automation preflight",
    takeaway: "Owner; trigger; inputs; required fields; destination folder; scopes; test data; draft or send mode; duplicate behavior; status column; error owner; rollback step; approval to go live.",
    commitment: "Within 24 hours, document one repetitive GGW process in five stages—trigger, inputs, action, review gate, log—without writing code. Get the process owner to approve that description before automating it.",
  },
  {
    id: "agents",
    number: "05",
    title: "Autonomous Background Agents",
    kicker: "Proactive agents · Gemini Spark",
    description: "Plan connected, multi-step work with explicit observation limits, action gates, and a human decision at the edge.",
    time: "Target: remove 20 minutes of manual status checking per workday",
    color: "blue",
    tools: "Gemini Spark, Gemini Apps, Drive, Gmail, Calendar",
    icon: "agents",
    scenario: "An operations helper is asked to monitor a shared folder and inbox for sponsor deliverables. It finds a late file, edits a tracker, and sends a partner reminder without showing the source or asking for approval. The task was helpful in intent but created an external commitment no one had reviewed.",
    wiifm: "Target: reduce repetitive monitoring while setting a hard boundary around edits, outbound communication, financial actions, and file changes. The measurable win is time returned with zero unapproved consequential actions.",
    diagnosticQuestion: "A connected agent notices that a sponsor deliverable is late. What should it do?",
    diagnosticOptions: [
      "Send the reminder immediately because the deadline has already passed.",
      "Keep checking until it finds enough context, then update the tracker and send a message.",
      "Show the source, explain the proposed next step, ask for confirmation, and only then perform an approved action.",
    ],
    diagnosticCorrect: 2,
    diagnosticRationale: [
      "A treats urgency as permission and creates an external blast radius.",
      "B adds more observation but still does not define authority, source evidence, or a review gate.",
      "C succeeds because the agent can surface a problem without silently converting a recommendation into an action.",
    ],
    frameworkTitle: "O-R-E-G: Observe, Reason, Execute, Gate",
    frameworkSummary: "Observe only the approved sources. Reason over those sources and show the evidence. Execute only reversible internal preparation by default. Gate every external, destructive, financial, or permission-changing action behind a named human confirmation. A background schedule is not permission to act without limits.",
    frameworkRows: [
      { label: "Observe", action: "Read named folders, labels, or calendars.", check: "Is the source allowed?" },
      { label: "Reason", action: "Compare status to a stated rule and show evidence.", check: "Can a person reproduce it?" },
      { label: "Execute", action: "Prepare a draft, queue, or internal summary.", check: "Is the action reversible?" },
      { label: "Gate", action: "Ask for confirmation before consequential changes.", check: "Who approves and where?" },
    ],
    labTitle: "The Gemini Spark operations scout blueprint lab",
    labIntro: "Gemini Spark is described by Google as a personal AI agent in Gemini Apps for complex or ongoing tasks and schedules across connected apps. It is separate from the Gemini side panel inside Workspace, and access or permissions can vary. Use the blueprint below as a planning specification, not as permission to monitor or act on GGW data.",
    labSteps: [
      "Open Spark only if it is available in the user’s approved Gemini experience. Begin with a fictional or low-risk workflow and read the account’s access and sharing controls.",
      "Paste the configuration blueprint into the planning conversation. Ask Spark to show the sources, schedule, proposed actions, and confirmation points before it starts.",
      "Run the workflow manually once. Compare the agent’s proposed result to the named source files and record any false positive or missing source.",
      "Keep the default action as a draft or internal queue. Require a named person to approve any email, edit, share, delete, purchase, or calendar change.",
      "Review the activity log after the test. Pause the workflow if it cannot show what it read, why it decided, or what it changed.",
    ],
    blueprint: [
      { label: "Identity", content: "Name: GGW Operations Scout. Role: read approved operational sources and prepare a daily exception brief. It is not a finance approver, sender, editor, or owner of GGW decisions." },
      { label: "Triggers", content: "Manual run for the first two weeks. If approved for a schedule, run once each weekday at 8:30 AM in the team’s chosen time zone. Never trigger from an unreviewed external message." },
      { label: "Grounding sources", content: "Only the named Shared Drive folder for current sponsor deliverables, the dated event tracker, and the approved operations calendar. Do not search all Drive, personal Drive, private mail, or unrelated member records." },
      { label: "Step-by-step logic", content: "1) Read the named sources. 2) Identify items whose status is overdue or missing. 3) Cite the file, row, or message used. 4) Prepare an exception table. 5) Draft an internal summary. 6) Ask for confirmation before any edit or outbound message." },
      { label: "Guardrails", content: "No send, share, delete, purchase, permission change, external edit, or calendar change without explicit confirmation. Stop on conflicting dates, missing source, unclear owner, sensitive data, or a request outside the named sources." },
    ],
    labPrompt: "Help me plan a low-risk, reversible workflow for [goal]. First show the sources you would use, the steps you would take, and what access each step needs. Ask for confirmation before sending, editing, deleting, purchasing, or creating anything. If the task is ambiguous, stop and ask one question. After the workflow, give me a review checklist.",
    takeawayTitle: "Agent approval card",
    takeaway: "What may be observed; what may be prepared; what requires confirmation; who confirms; where the evidence appears; how the run is logged; how to pause it; what happens on an error.",
    commitment: "Within 24 hours, choose one fictional monitoring task and write its four O-R-E-G boundaries. Identify the exact action that must stop for a human confirmation.",
  },
  {
    id: "governance",
    number: "06",
    title: "Governance, Scalability & HITL Safeguards",
    kicker: "Least privilege · AppSheet · Review gates",
    description: "Scale AI use without scaling risk. Define access, data silos, human approvals, dashboards, and failure recovery before rollout.",
    time: "Target: complete a 30-minute workflow and access review",
    color: "lime",
    tools: "Google Workspace admin controls, AppSheet, Drive, Apps Script",
    icon: "governance",
    scenario: "A useful automation is shared broadly because everyone wants the time savings. It can read more folders than it needs, writes into a live tracker, and has no owner for errors. A minor prompt mistake becomes a data exposure and a confusing operational cleanup.",
    wiifm: "Target: limit each workflow to the smallest source set and permission scope, make every exception visible, and reduce recovery time from an unknown investigation to a documented pause-and-review process.",
    diagnosticQuestion: "A successful pilot is ready to roll out to the whole organization. What must happen before scaling?",
    diagnosticOptions: [
      "Review least-privilege access, data boundaries, approval gates, error handling, ownership, and a small staged rollout.",
      "Share the automation broadly and let users report problems as they appear.",
      "Add more features and a dashboard first so leaders can see activity.",
    ],
    diagnosticCorrect: 0,
    diagnosticRationale: [
      "A succeeds because governance is part of the system design: the organization knows what the automation can see, do, stop, and report.",
      "B scales the blast radius before the team understands access, failure modes, or ownership.",
      "C improves visibility but does not prevent an over-permissioned or incorrectly configured workflow.",
    ],
    frameworkTitle: "P-S-A-G-L: Permission, Source, Action, Gate, Log",
    frameworkSummary: "Every workflow needs the least access needed, a named source boundary, a defined action boundary, a human gate for consequential changes, and a log that helps a person investigate. A dashboard improves visibility; it does not replace good permissions or an owner.",
    frameworkRows: [
      { label: "Permission", action: "Grant the smallest role and scope.", check: "Can access be reduced?" },
      { label: "Source", action: "Separate approved, working, and sensitive data.", check: "Is the boundary named?" },
      { label: "Action", action: "Define read, prepare, edit, send, and delete.", check: "What is forbidden?" },
      { label: "Gate", action: "Require a person before impact.", check: "Who approves?" },
      { label: "Log", action: "Record runs, exceptions, and pause steps.", check: "Can the team recover?" },
    ],
    labTitle: "The HITL operations dashboard blueprint lab",
    labIntro: "Use this configuration blueprint to plan an AppSheet or Workspace operations dashboard. The dashboard should make workflow state visible; it should not become a new place where anyone can bypass approvals.",
    labSteps: [
      "List one workflow and classify its data as public, internal, confidential, or restricted. Put restricted data in a separate approved source or exclude it.",
      "Create a permission table with user role, source, action, and approval authority. Remove any access that is not required for the workflow’s job.",
      "Design an AppSheet view or Sheet dashboard with status, last run, owner, exception, approval state, source link, and pause control. Do not show sensitive fields to users who do not need them.",
      "Test four failures: missing input, conflicting source, unauthorized user, and downstream service error. The expected response is a visible exception and a stopped action, not a guess.",
      "Run a staged pilot with fictional data, then a small internal group. Review the log and approve the next stage only when the owner can explain how to pause and recover.",
    ],
    blueprint: [
      { label: "Identity", content: "Name: GGW Workflow Steward. Role: monitor approved automations, review exceptions, and coordinate owners. It cannot grant access, approve its own actions, or make policy decisions." },
      { label: "Triggers", content: "Manual review for pilot runs. A scheduled health check may report status, but it must not change records or send messages. Pause the schedule automatically after a repeated error threshold." },
      { label: "Grounding sources", content: "A current workflow register, approved data classification policy, permission matrix, incident log, and the specific source link for each workflow. No broad Drive or inbox search." },
      { label: "Step-by-step logic", content: "1) Read the workflow register. 2) Check owner, last run, and permission state. 3) Identify exceptions or repeated errors. 4) Prepare a dashboard row and an internal recommendation. 5) Route consequential decisions to the named owner. 6) Record approval, pause, or rollback." },
      { label: "Guardrails", content: "Least privilege; no autonomous external blast radius; no self-approval; no permission changes; no deletion; no financial commitment; no bypassing data silos; stop on missing source, identity mismatch, policy conflict, or repeated failure." },
    ],
    labPrompt: "Design a human-in-the-loop control plan for [workflow]. Return: data classification, source boundary, user roles, allowed actions, prohibited actions, approval gate, dashboard fields, error states, pause rule, rollback step, owner, and review cadence. Assume the system must stop rather than guess when a source is missing or a permission is unclear.",
    takeawayTitle: "HITL launch checklist",
    takeaway: "Data class; source boundary; least-privilege role; allowed actions; prohibited actions; human approver; exception states; logging fields; pause control; rollback; owner; pilot group; review date.",
    commitment: "Within 24 hours, review one existing shared automation or AI workflow against P-S-A-G-L and document one permission or approval gate that should be tightened.",
  },
];

const prompts: PromptItem[] = [
  { id: "gmail-summary", title: "Summarize a Gmail thread", tool: "Gmail + AI", summary: "Turn a long conversation into a decision and action list.", prompt: "Summarize this thread for a busy GGW teammate. Return: 1) decision or current status, 2) open questions, and 3) action items with owner and due date. If an owner or due date is not stated, write Not stated. Preserve names, dates, amounts, and commitments exactly. Do not invent context.", tags: ["daily", "email", "review"], where: "Open the thread in Gmail and ask Gemini." },
  { id: "docs-review", title: "Review a Google Doc", tool: "Google Docs", summary: "Find gaps without rewriting the author’s intent.", prompt: "Review this document for clarity, missing facts, audience fit, and actionability. Return: strengths, questions, items that need source verification, and three specific edits. Preserve names, dates, amounts, and links. Do not silently rewrite or add facts.", tags: ["docs", "review", "writing"], where: "Open a copy or use a review-only pass in Google Docs." },
  { id: "meet-followup", title: "Create a Meet follow-up", tool: "Google Meet", summary: "Give a meeting a useful afterlife with owners and next steps.", prompt: "Using the meeting notes below, create a follow-up memo with purpose, decisions, unresolved questions, action items, owners, due dates, and a short message I can send to attendees. Separate confirmed information from items that need review.", tags: ["meet", "follow-up", "operations"], where: "Use after notes are available in Meet or a Doc." },
  { id: "sheet-finance", title: "Review a finance export", tool: "Google Sheets", summary: "Standardize dates, classify functional expense categories, and flag review items.", prompt: "Review this transaction table. Standardize every date to YYYY-MM-DD. Assign each row to Program Services, Management & General, or Fundraising using the description and fund context. Flag any row missing vendor detail or with an amount over $1,000 as Requires Receipt/Audit. Return exactly: Date | Vendor | Type | Category | Amount | Audit Flag. Do not make a tax or accounting conclusion.", tags: ["finance", "990", "sheets"], where: "Use on a copy of a Sheet and review the result before posting." },
  { id: "sheets-formula", title: "Explain a Sheets formula", tool: "Google Sheets", summary: "Ask for a formula and an explanation a teammate can maintain.", prompt: "Write a Google Sheets formula for [goal] using these columns: [list columns]. Prefer a readable formula. Explain each part in plain language, show a small example, and list one edge case. Do not overwrite the source data. If a QUERY, LAMBDA, or REGEXEXTRACT approach is possible, show why you chose it.", tags: ["sheets", "formulas", "analysis"], where: "Ask Gemini in a copied Sheet or a scratch tab." },
  { id: "drive-source", title: "Find the source of truth in Drive", tool: "Google Drive", summary: "Compare candidate files by owner, date, location, access, and status.", prompt: "Help me identify the best source document for [question]. Compare the candidate files by title, owner, last updated date, folder, status, and access. Explain which file is the best starting point and list anything I should verify before relying on it. Do not move, rename, share, or delete files.", tags: ["drive", "files", "governance"], where: "Use with a small set of candidate files or a folder summary." },
  { id: "notebook-briefing", title: "Ask NotebookLM for a cited briefing", tool: "NotebookLM", summary: "Ground a question in approved sources and keep unknowns visible.", prompt: "Using only the sources in this notebook, create a one-page briefing on [topic]. Include: answer, supporting source names or citations, open questions, and a short list of decisions needed. If the sources disagree or do not answer the question, say so clearly. Do not fill gaps from general knowledge.", tags: ["notebooklm", "sources", "briefing"], where: "Ask inside a notebook that contains approved sources." },
  { id: "slide-image", title: "Create a visual concept for Slides", tool: "Google Slides", summary: "Generate a purposeful image or slide direction instead of decoration.", prompt: "Create a visual concept for one Google Slides page about [topic] for [audience]. Describe the message, subject, composition, color direction, accessibility text, and where the image supports the story. Keep the visual on-brand for Global Gaming Women: confident, welcoming, modern, and human. Avoid stereotypes and text inside the image.", tags: ["slides", "images", "brand"], where: "Use in Slides when drafting a page or generating an image idea." },
  { id: "vids-plan", title: "Plan a short video in Vids", tool: "Google Vids", summary: "Turn an outcome into a storyboard, voiceover, and review plan.", prompt: "Plan a 60-second Google Vids video for [audience] whose goal is [outcome]. Return a five-scene storyboard with scene purpose, suggested visual, on-screen text, voiceover, and transition. Keep the voice warm and direct. End with one clear call to action. Mark any visual or claim that needs human approval.", tags: ["vids", "video", "storytelling"], where: "Use in Vids to start a video outline and then review every scene." },
  { id: "forms-intake", title: "Draft a simple Google Form", tool: "Google Forms", summary: "Create an intake form that asks only what the workflow needs.", prompt: "Draft a short Google Form for [purpose]. Recommend the question, response type, whether it is required, and why it is needed. Use plain language for adult learners. Avoid collecting sensitive personal information unless it is necessary and explain how responses will be handled.", tags: ["forms", "intake", "privacy"], where: "Use Gemini in Forms or draft the plan before building." },
  { id: "apps-script", title: "Ask for a safe Apps Script", tool: "Apps Script", summary: "Describe the trigger, inputs, outputs, and review step before code.", prompt: "Design a beginner-friendly Google Apps Script for [repetitive task]. First explain the workflow in plain language. Then provide the smallest script possible, identify the files or scopes it needs, include a test mode that does not send or delete anything, and list exactly what a person should review before running it.", tags: ["automation", "script", "safety"], where: "Use after the manual workflow is understood and tested." },
  { id: "spark-plan", title: "Plan a low-risk Gemini Spark workflow", tool: "Gemini Spark", summary: "Use Spark as a planning partner for a connected, multi-step task with confirmation gates.", prompt: "Help me plan a low-risk, reversible workflow for [goal]. First show the sources you would use, the steps you would take, and what access each step needs. Ask for confirmation before sending, editing, deleting, purchasing, or creating anything. If the task is ambiguous, stop and ask one question. After the workflow, give me a review checklist.", tags: ["spark", "agent", "guardrails"], where: "Use in Gemini Spark if it is available in your account." },
  { id: "hitl-plan", title: "Design a human review gate", tool: "Governance", summary: "Make approval, logging, pause, and rollback explicit before rollout.", prompt: "Design a human-in-the-loop control plan for [workflow]. Return: data classification, source boundary, user roles, allowed actions, prohibited actions, approval gate, dashboard fields, error states, pause rule, rollback step, owner, and review cadence. Assume the system must stop rather than guess when a source is missing or a permission is unclear.", tags: ["governance", "hitl", "safety"], where: "Use during an automation or agent design review." },
];

const featureMap = [
  { tool: "Gmail + Gemini", area: "Daily messages", capability: "Summarize threads, draft replies, and find details in conversations.", move: "Ask for a summary first. Review names, dates, and tone before sending." },
  { tool: "Google Docs + Gemini", area: "Writing and review", capability: "Draft, rewrite, summarize, organize, and turn notes into a document.", move: "Start with a first draft, then use a person for facts and final voice." },
  { tool: "Google Sheets + Gemini", area: "Tables and analysis", capability: "Create tables, suggest formulas, summarize data, and spot patterns.", move: "Work from a copy. Ask for a preview and check the source rows." },
  { tool: "Google Drive + Gemini", area: "Files and folders", capability: "Summarize files, find information, and help organize work.", move: "Confirm owner, date, access, and source-of-truth status." },
  { tool: "Google Slides + Gemini", area: "Presentations and images", capability: "Draft slides, help rewrite content, and support image concepts or generation.", move: "Define one message per slide and add accessibility text for visuals." },
  { tool: "Google Forms + Gemini", area: "Intake and feedback", capability: "Draft forms and questions for registrations, surveys, or intake workflows.", move: "Ask only for information the workflow truly needs." },
  { tool: "Google Meet + Gemini", area: "Meetings", capability: "Support meeting notes, recaps, and follow-up work where enabled.", move: "Tell attendees when AI notes are used and review the recap before sharing." },
  { tool: "Google Vids", area: "Video generation", capability: "Plan scenes, narration, and short videos for internal or external communication.", move: "Start from the audience and outcome, then review every generated scene." },
  { tool: "NotebookLM", area: "Grounded research", capability: "Ask questions across selected sources and create grounded briefings.", move: "Create a notebook with approved sources and keep a review log." },
  { tool: "Gemini Gems", area: "Reusable helpers", capability: "Create custom instructions for repeatable roles, voice, or workflows.", move: "Give a Gem one job, clear boundaries, and a required output format." },
  { tool: "Gemini Spark", area: "Connected workflows", capability: "A personal AI agent in Gemini Apps for ongoing or complex tasks and schedules across connected apps.", move: "Show the plan and sources, then confirm each consequential action." },
  { tool: "Apps Script / Workspace Studio", area: "Repeatable processes", capability: "Turn a known workflow into a script or a guided automation.", move: "Test with copies and a no-send mode before connecting real work." },
];

const notebookSections = [
  { name: "01 · Start here", purpose: "Purpose, audience, owner, and what questions belong in the notebook." },
  { name: "02 · Approved sources", purpose: "Bylaws, policies, grants, agreements, trackers, and dated source files." },
  { name: "03 · Working questions", purpose: "Questions to ask using only the sources in this notebook." },
  { name: "04 · Briefings and outputs", purpose: "Reviewed summaries, decision memos, and reusable answers." },
  { name: "05 · Review log", purpose: "Date, reviewer, decision, source gaps, and next update." },
];

const driveFiles = [
  { id: "old", title: "FY25 event budget - working copy", owner: "Former event lead", updated: "Updated 2024-11-03", location: "My Drive / Old event planning", status: "Old working copy" },
  { id: "approved", title: "FY26 finance ledger - approved", owner: "GGW Finance", updated: "Updated 2026-01-31", location: "Shared drive / Finance / FY26", status: "Current source" },
  { id: "export", title: "January event transactions export", owner: "Programs team", updated: "Updated 2026-01-25", location: "Shared drive / Programs / Exports", status: "Supporting export" },
];

function iconFor(kind: string, size = 22): ReactNode {
  if (kind === "sheets" || kind === "data") return <FileSpreadsheet size={size} strokeWidth={1.8} />;
  if (kind === "drive") return <FolderOpen size={size} strokeWidth={1.8} />;
  if (kind === "docs" || kind === "daily" || kind === "visuals") return <FileText size={size} strokeWidth={1.8} />;
  if (kind === "gmail") return <Mail size={size} strokeWidth={1.8} />;
  if (kind === "assistant" || kind === "agents") return <Sparkles size={size} strokeWidth={1.8} />;
  if (kind === "automation") return <Send size={size} strokeWidth={1.8} />;
  if (kind === "video") return <Video size={size} strokeWidth={1.8} />;
  if (kind === "table") return <Table2 size={size} strokeWidth={1.8} />;
  if (kind === "notebook") return <LayoutTemplate size={size} strokeWidth={1.8} />;
  if (kind === "governance") return <ShieldCheck size={size} strokeWidth={1.8} />;
  return <CircleHelp size={size} strokeWidth={1.8} />;
}

function normalizeDate(value: string): string {
  const clean = value.trim();
  if (!clean) return "Needs date check";
  const iso = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return iso[1] + "-" + iso[2].padStart(2, "0") + "-" + iso[3].padStart(2, "0");
  const slash = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (slash) {
    const year = slash[3].length === 2 ? "20" + slash[3] : slash[3];
    return year + "-" + slash[1].padStart(2, "0") + "-" + slash[2].padStart(2, "0");
  }
  const parsed = Date.parse(clean);
  if (Number.isNaN(parsed)) return "Needs date check";
  const date = new Date(parsed);
  return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0");
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === "\"") {
      if (quoted && line[index + 1] === "\"") {
        value += "\"";
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      result.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  result.push(value.trim());
  return result;
}

function categorize(type: string, vendor: string, fund: string): string {
  const text = (type + " " + vendor + " " + fund).toLowerCase();
  if (/donor|fundrais|gala|sponsor|campaign|auction|appeal/.test(text)) return "Fundraising";
  if (/event|mentor|education|program|scholar|stipend|travel|workshop|conference/.test(text)) return "Program Services";
  return "Management & General";
}

function reviewSheet(text: string): SheetRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];
  const first = parseCsvLine(lines[0]);
  const hasHeader = first.some((item) => /date|vendor|source|type|amount|fund/i.test(item));
  const headers = hasHeader ? first.map((item) => item.toLowerCase()) : [];
  const data = hasHeader ? lines.slice(1) : lines;
  const findIndex = (patterns: RegExp[], fallback: number) => {
    const found = headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
    return found >= 0 ? found : fallback;
  };
  const dateIndex = findIndex([/date/], 0);
  const vendorIndex = findIndex([/vendor/, /source/, /merchant/, /payee/], 1);
  const typeIndex = findIndex([/type/, /description/, /memo/, /category/], 2);
  const amountIndex = findIndex([/amount/, /total/, /value/], 3);
  const fundIndex = findIndex([/fund/, /program/, /department/], 4);
  return data.map((line) => {
    const cells = parseCsvLine(line);
    const vendor = (cells[vendorIndex] || "").trim();
    const type = (cells[typeIndex] || "Uncategorized").trim() || "Uncategorized";
    const amountNumber = Number((cells[amountIndex] || "0").replace(/[$,]/g, "").trim()) || 0;
    return {
      date: normalizeDate(cells[dateIndex] || ""),
      vendor: vendor || "Missing vendor detail",
      type,
      category: categorize(type, vendor, cells[fundIndex] || ""),
      amount: amountNumber.toLocaleString("en-US", { style: "currency", currency: "USD" }),
      flag: !vendor || amountNumber > 1000 ? "Requires Receipt/Audit" : "Clear",
    };
  });
}

function escapeCsv(value: string): string {
  return "\"" + value.replace(/"/g, "\"\"") + "\"";
}

function rowsToCsv(rows: SheetRow[]): string {
  return ["Date,Vendor,Type,Category,Amount,Audit Flag", ...rows.map((row) => [row.date, row.vendor, row.type, row.category, row.amount, row.flag].map(escapeCsv).join(","))].join("\n");
}

function makeDocDraft(type: string, notes: string): string {
  const title = type === "event" ? "Event Brief" : type === "board" ? "Board Memo" : "Working Document";
  return [title, "", "Purpose", "Use the notes below to make the intended outcome clear.", "", "Summary", notes.trim(), "", "Decisions or key points", "- [CHECK] Confirm the decisions and facts in the source notes.", "", "Action items", "- Owner: [CHECK]  Due date: [CHECK]  Next step: [CHECK]", "", "Review before sharing", "- Verify names, dates, amounts, links, and audience.", "- Remove any [CHECK] items that are not needed."].join("\n");
}

function makeEmailDraft(audience: string, purpose: string, details: string, tone: string): string {
  return ["Subject: " + purpose.trim(), "", audience.trim() ? "Hi " + audience.trim() + "," : "Hi everyone,", "", details.trim(), "", "Please let me know if you have questions or need anything else.", "", "Best,", "[Your name]", "", "Tone check: " + tone + ". Review names, dates, links, and attachments before sending."].join("\n");
}

export function SiteHeader({ view, onHome, onPrompts, onSandbox, onDashboard }: { view: AppView; onHome: () => void; onPrompts: () => void; onSandbox: () => void; onDashboard?: () => void }) {
  return <header className="site-header"><button className="brand-lockup" onClick={onHome} aria-label="Go to GGW AI Academy home"><span className="brand-mark">GGW</span><span><strong>Global Gaming Women</strong><small>AI Academy</small></span></button><nav className="main-nav" aria-label="Main navigation"><button className={view === "home" ? "active" : ""} onClick={onHome}>Home</button><button className={view === "prompts" ? "active" : ""} onClick={onPrompts}>Prompt Library</button><button className={view === "sandbox" ? "active" : ""} onClick={onSandbox}>Sandbox Exercises</button>{onDashboard && <button className={view === "dashboard" || view === "admin" ? "active" : ""} onClick={onDashboard}>My progress</button>}</nav></header>;
}

function CopyButton({ label = "Copy", value, onCopy }: { label?: string; value: string; onCopy: (label: string, value: string) => void }) {
  return <button className="copy-button" onClick={() => onCopy(label, value)}><Copy size={13} />{label}</button>;
}

function HomeView({ completed, onOpenModule, onOpenPrompts, onOpenSandbox, onCopy }: { completed: string[]; onOpenModule: (id: ModuleId) => void; onOpenPrompts: () => void; onOpenSandbox: (id: SandboxId) => void; onCopy: (label: string, value: string) => void }) {
  const featured = [prompts[0], prompts[3], prompts[11]];
  return <main className="page-shell"><section className="hero"><div className="hero-copy"><p className="eyebrow">Practical AI for GGW work</p><h1>Work smarter.<br /><em>Make room</em> for the work only GGW can do.</h1><p>Learn one familiar Google tool at a time. Start with a real outcome, use a ready-to-copy prompt, and review the result before it reaches a member, sponsor, donor, or board.</p><div className="hero-actions"><button className="brand-button" onClick={onOpenPrompts}>Open the prompt library <ArrowRight size={15} /></button><button className="quiet-button" onClick={() => onOpenSandbox("sheets")}>Try a safe exercise</button></div></div><div className="hero-card hero-image-card"><img src="https://www.globalgamingwomen.org/wp-content/uploads/2026/03/DSC03270-769x1024.jpg" alt="GGW community members gathered at a gaming industry event" loading="eager" /><div className="hero-image-caption"><span>Support. Inspire. Influence.</span><strong>Learn tools that give the work back to the people.</strong></div><div className="hero-rule"><ShieldCheck size={17} /><span>Review before you send, share, publish, or automate.</span></div></div></section><section className="content-section" aria-labelledby="paths-heading"><div className="section-heading"><div><p className="eyebrow">Start with an outcome</p><h2 id="paths-heading">Choose a learning path.</h2></div><span className="section-note">{completed.filter((item) => modules.some((module) => module.id === item)).length} of 6 paths complete</span></div><div className="module-grid">{modules.map((module) => <article className={"module-card " + module.color} key={module.id}><div className="module-top"><span className="module-tag">{module.number}</span>{completed.includes(module.id) && <span className="done-label"><CheckCircle2 size={13} /> Complete</span>}</div><div className="module-icon">{iconFor(module.icon, 25)}</div><p className="module-kicker">{module.kicker}</p><h3>{module.title}</h3><p>{module.description}</p><div className="module-tools">{module.tools}</div><button className="module-button" onClick={() => onOpenModule(module.id)}>{completed.includes(module.id) ? "Review module" : "Start module"} <ChevronRight size={17} /></button></article>)}</div></section><section className="familiar-section" aria-labelledby="tools-heading"><div className="section-heading"><div><p className="eyebrow">The tools GGW already uses</p><h2 id="tools-heading">Start with what is familiar.</h2></div><span className="section-note">No new software to learn first.</span></div><div className="familiar-grid">{[{ id: "sheets", title: "Google Sheets", description: "A table for numbers, lists, and simple tracking.", color: "lime", icon: "sheets" }, { id: "drive", title: "Google Drive", description: "A place to find, open, and organize files.", color: "violet", icon: "drive" }, { id: "docs", title: "Google Docs", description: "A place to write, edit, and share a document.", color: "coral", icon: "docs" }, { id: "gmail", title: "Gmail + AI", description: "A practical way to draft and improve everyday messages.", color: "blue", icon: "gmail" }].map((tool) => <button className={"familiar-card " + tool.color} key={tool.id} onClick={() => onOpenSandbox(tool.id as SandboxId)}><span className="familiar-icon">{iconFor(tool.icon, 27)}</span><strong>{tool.title}</strong><span>{tool.description}</span><span className="familiar-link">Open practice <ArrowRight size={16} /></span></button>)}</div></section><section className="prompt-strip" aria-labelledby="daily-kit-heading"><div className="prompt-strip-intro"><p className="eyebrow">Your daily work kit</p><h2 id="daily-kit-heading">Copy a prompt when you need it.</h2><p>These are small, repeatable requests for common GGW work. Open the full library to search by tool or outcome.</p><button className="text-button" onClick={onOpenPrompts}>See all prompts <ArrowRight size={15} /></button></div><div className="prompt-strip-list">{featured.map((item) => <div className="mini-prompt" key={item.id}><div><span>{item.tool}</span><strong>{item.title}</strong></div><CopyButton value={item.prompt} onCopy={onCopy} /></div>)}</div></section><footer className="site-footer"><span>Global Gaming Women · AI Academy</span><span>Learn once. Reuse often. Review every result.</span></footer></main>;
}

function PromptCard({ item, onCopy }: { item: PromptItem; onCopy: (label: string, value: string) => void }) {
  return <article className="prompt-card"><div className="prompt-card-top"><span className="tool-label">{item.tool}</span><CopyButton label="Copy prompt" value={item.prompt} onCopy={onCopy} /></div><h3>{item.title}</h3><p>{item.summary}</p><div className="prompt-card-body"><strong>Prompt</strong><span>{item.prompt}</span></div><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><small>{item.where}</small></article>;
}

function FeatureMap() {
  return <section className="reference-section"><div className="section-heading"><div><p className="eyebrow">Google Workspace map</p><h2>What each tool is good for.</h2></div><span className="section-note">Access varies by plan, language, admin setting, and rollout.</span></div><div className="feature-table-wrap"><table className="feature-table"><thead><tr><th>Tool</th><th>Good for</th><th>Beginner move</th></tr></thead><tbody>{featureMap.map((row) => <tr key={row.tool}><td><strong>{row.tool}</strong><small>{row.area}</small></td><td>{row.capability}</td><td>{row.move}</td></tr>)}</tbody></table></div></section>;
}

function NotebookStarter({ onCopy }: { onCopy: (label: string, value: string) => void }) {
  const structure = notebookSections.map((section) => section.name + "\n" + section.purpose).join("\n\n");
  return <section className="notebook-panel"><div className="notebook-panel-intro"><p className="eyebrow">NotebookLM starter</p><h2>Make the notebook easy to trust.</h2><p>Keep source files, questions, outputs, and review notes in one predictable structure. Begin with a copy of approved material, not an entire Drive.</p><CopyButton label="Copy notebook structure" value={structure} onCopy={onCopy} /></div><div className="notebook-list">{notebookSections.map((section) => <div key={section.name}><strong>{section.name}</strong><span>{section.purpose}</span></div>)}</div></section>;
}

export function PromptLibraryView({ onCopy }: { onCopy: (label: string, value: string) => void }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) return prompts;
    return prompts.filter((item) => [item.title, item.tool, item.summary, item.prompt, item.tags.join(" ")].join(" ").toLowerCase().includes(text));
  }, [query]);
  return <main className="page-shell library-page"><section className="simple-hero"><p className="eyebrow">Reusable work support</p><h1>Prompt library</h1><p>Find a ready-to-copy request for Gmail, Docs, Sheets, Drive, NotebookLM, image generation, video generation, Gemini Gems, Gemini Spark, and more.</p><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by tool, task, or outcome" aria-label="Search prompt library" />{query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}</div></section><section className="library-section"><div className="section-heading"><div><p className="eyebrow">Copy, paste, adapt</p><h2>{filtered.length} prompts ready to use</h2></div><span className="section-note">Never paste confidential information unless GGW policy allows it.</span></div>{filtered.length ? <div className="prompt-library-grid">{filtered.map((item) => <PromptCard key={item.id} item={item} onCopy={onCopy} />)}</div> : <div className="empty-state"><Search size={20} /><strong>No prompts found.</strong><span>Try Sheets, Spark, NotebookLM, or a workflow name.</span></div>}</section><FeatureMap /><NotebookStarter onCopy={onCopy} /><section className="library-callout"><div><Info size={18} /><strong>Gemini Spark has its own lane.</strong><span>In this academy it means a connected Gemini Apps agent topic, separate from the Workspace side panel, with explicit confirmation gates.</span></div><a href="https://support.google.com/gemini/answer/17094507" target="_blank" rel="noreferrer">Read Google’s Spark help <ArrowRight size={14} /></a></section></main>;
}

function Diagnostic({ module, onSubmitted }: { module: ModuleDefinition; onSubmitted: (correct: boolean) => void }) {
  const [answer, setAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submit = () => { if (answer === null) return; setSubmitted(true); onSubmitted(answer === module.diagnosticCorrect); };
  return <div className="diagnostic-card"><p className="eyebrow">Part 2 · Diagnostic challenge</p><h2>{module.diagnosticQuestion}</h2><div className="diagnostic-options">{module.diagnosticOptions.map((option, index) => <label className={submitted && index === module.diagnosticCorrect ? "correct" : submitted && index === answer ? "incorrect" : ""} key={option}><input type="radio" name={"diagnostic-" + module.id} checked={answer === index} onChange={() => { setAnswer(index); setSubmitted(false); }} /><span>{String.fromCharCode(65 + index)}</span>{option}</label>)}</div><button className="brand-button" disabled={answer === null} onClick={submit}>{submitted ? "Try another answer" : "Check my answer"} <Check size={15} /></button>{submitted && <div className={"diagnostic-feedback " + (answer === module.diagnosticCorrect ? "good" : "needs-review")}><strong>{answer === module.diagnosticCorrect ? "Best choice." : "Review the best-practice choice."}</strong>{module.diagnosticRationale.map((line) => <span key={line}>{line}</span>)}</div>}</div>;
}

function Framework({ module }: { module: ModuleDefinition }) {
  const [open, setOpen] = useState(false);
  return <section className="framework-card"><div className="framework-head"><div><p className="eyebrow">Part 3 · Mental model</p><h2>{module.frameworkTitle}</h2></div><button className="quiet-button" onClick={() => setOpen(!open)}>{open ? "Hide framework" : "Show framework"} <ChevronRight size={15} className={open ? "turn" : ""} /></button></div>{open && <><p>{module.frameworkSummary}</p><div className="framework-table-wrap"><table className="framework-table"><thead><tr><th>Move</th><th>Do this</th><th>Check</th></tr></thead><tbody>{module.frameworkRows.map((row) => <tr key={row.label}><td><strong>{row.label}</strong></td><td>{row.action}</td><td>{row.check}</td></tr>)}</tbody></table></div></>}</section>;
}

function Lab({ module, onCopy, onOpenSandbox }: { module: ModuleDefinition; onCopy: (label: string, value: string) => void; onOpenSandbox: (id: SandboxId) => void }) {
  return <section className="lab-card"><div className="lab-head"><div><p className="eyebrow">Part 4 · Hands-on sandbox</p><h2>{module.labTitle}</h2><p>{module.labIntro}</p></div>{module.sandbox && <button className="quiet-button" onClick={() => onOpenSandbox(module.sandbox as SandboxId)}>Open safe sandbox <ArrowRight size={15} /></button>}</div><ol className="lab-steps">{module.labSteps.map((step) => <li key={step}>{step}</li>)}</ol>{module.labPrompt && <div className="asset-block"><div className="asset-block-head"><span>Production-ready prompt</span><CopyButton label="Copy prompt" value={module.labPrompt} onCopy={onCopy} /></div><p>{module.labPrompt}</p></div>}{module.labData && <div className="asset-block"><div className="asset-block-head"><span>Safe practice data</span><CopyButton label="Copy CSV" value={module.labData} onCopy={onCopy} /></div><pre>{module.labData}</pre></div>}{module.labCode && <div className="asset-block code-block"><div className="asset-block-head"><span>Copy-paste Apps Script</span><CopyButton label="Copy code" value={module.labCode} onCopy={onCopy} /></div><pre>{module.labCode}</pre></div>}{module.blueprint && <div className="blueprint-grid">{module.blueprint.map((item) => <div key={item.label}><strong>{item.label}</strong><span>{item.content}</span></div>)}</div>}</section>;
}

function ModuleView({ module, completed, moduleProgress, outcome, onBack, onCopy, onOpenSandbox, onComplete, onSaveProduct, onRecordEvent }: { module: ModuleDefinition; completed: string[]; moduleProgress?: ModuleProgressRow; outcome?: OutcomeRow; onBack: () => void; onCopy: (label: string, value: string) => void; onOpenSandbox: (id: SandboxId) => void; onComplete: (id: ModuleId, product?: WorkProduct, completion?: { diagnosticScore: number; diagnosticAttempts: number; commitmentDueAt: string | null }) => void; onSaveProduct: (product: WorkProduct) => void; onRecordEvent: (event: TrackingEvent) => void }) {
  const [diagnosticDone, setDiagnosticDone] = useState(() => Number(moduleProgress?.attempts || 0) > 0);
  const [diagnosticAttempts, setDiagnosticAttempts] = useState(() => Number(moduleProgress?.attempts || 0));
  const [commitmentDone, setCommitmentDone] = useState(() => ["open", "completed", "done"].includes(String(moduleProgress?.commitment_status || "")));
  const [commitmentDueAt, setCommitmentDueAt] = useState<string | null>(() => moduleProgress?.commitment_due_at || null);
  const [baselineMinutes, setBaselineMinutes] = useState(() => outcome?.baseline_minutes ? String(outcome.baseline_minutes) : "");
  const alreadyComplete = completed.includes(module.id) || moduleProgress?.status === "completed";
  const submitDiagnostic = (correct: boolean) => {
    const nextAttempts = diagnosticAttempts + 1;
    setDiagnosticAttempts(nextAttempts);
    setDiagnosticDone(true);
    onRecordEvent({ eventName: "diagnostic_submitted", moduleId: module.id, activityId: "diagnostic", metadata: { correct }, attempt: { moduleId: module.id, activityId: "diagnostic", attemptType: "diagnostic", score: correct ? 100 : 0, result: correct ? "passed" : "needs_review", response: { correct } }, moduleProgress: { moduleId: module.id, status: "in_progress", currentStep: 1, bestScore: correct ? 100 : 0, attempts: nextAttempts, commitmentStatus: commitmentDone ? "open" : "not_started", commitmentDueAt } });
  };
  const updateCommitment = (checked: boolean) => {
    const dueAt = checked ? (commitmentDueAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()) : null;
    setCommitmentDone(checked);
    setCommitmentDueAt(dueAt);
    onRecordEvent({ eventName: checked ? "commitment_created" : "commitment_cleared", moduleId: module.id, activityId: "commitment", metadata: { checked }, outcome: { moduleId: module.id, commitmentText: module.commitment, dueAt, status: checked ? "open" : "not_started", baselineMinutes: baselineMinutes ? numberValue(baselineMinutes) : null }, moduleProgress: { moduleId: module.id, status: "in_progress", currentStep: checked ? 2 : 1, bestScore: Number(moduleProgress?.best_score || 0), attempts: diagnosticAttempts, commitmentStatus: checked ? "open" : "not_started", commitmentDueAt: dueAt } });
  };
  return <main className="page-shell module-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to learning paths</button><section className={"module-hero " + module.color}><div className="module-hero-icon">{iconFor(module.icon, 29)}</div><div><p className="eyebrow">Module {module.number} · {module.kicker}</p><h1>{module.title}</h1><p>{module.description}</p></div><span className="module-hero-time">{module.time}</span></section><div className="module-stepper"><span className="current">01 <b>Learn</b></span><span>02 <b>Practice</b></span><span>03 <b>Commit</b></span></div><section className="friction-card"><div><p className="eyebrow">Part 1 · The friction point</p><h2>When a small workflow becomes a high-cost interruption.</h2><p>{module.scenario}</p></div><div className="wiifm-card"><strong>What is in it for me?</strong><span>{module.wiifm}</span></div></section><Diagnostic module={module} onSubmitted={submitDiagnostic} /><Framework module={module} /><Lab module={module} onCopy={onCopy} onOpenSandbox={onOpenSandbox} /><section className="takeaway-card"><div><p className="eyebrow">Part 5 · Implementation tool</p><h2>{module.takeawayTitle}</h2><p>{module.takeaway}</p></div><CopyButton label="Copy takeaway" value={module.takeaway} onCopy={onCopy} /></section>{module.labPrompt && <button className="save-asset-button" onClick={() => onSaveProduct({ kind: "module-prompt", title: module.title + " production prompt", content: { prompt: module.labPrompt } })}><Copy size={14} /> Save this module asset</button>}<section className="commitment-card"><div><p className="eyebrow">24-hour commitment</p><h2>Put one small piece into practice.</h2><p>{module.commitment}</p></div><label className="commitment-baseline">How long does this take today?<input type="number" min="0" max="100000" value={baselineMinutes} onChange={(event) => setBaselineMinutes(event.target.value)} placeholder="Optional minutes" /><span>Use this only as a rough baseline for your result.</span></label><label className={commitmentDone ? "commitment-check checked" : "commitment-check"}><input type="checkbox" checked={commitmentDone} onChange={(event) => updateCommitment(event.target.checked)} /><span>{commitmentDone ? <Check size={14} /> : "24h"}</span>I will do this within 24 hours.</label><button className="brand-button" disabled={!diagnosticDone || !commitmentDone} onClick={() => onComplete(module.id, { kind: "module-completion", title: module.title + " completion", content: { diagnosticDone, commitment: module.commitment } }, { diagnosticScore: diagnosticDone ? 100 : 0, diagnosticAttempts, commitmentDueAt })}>{alreadyComplete ? "Keep module complete" : "Mark module complete"} <CheckCircle2 size={15} /></button>{!diagnosticDone || !commitmentDone ? <small>Check your diagnostic and 24-hour commitment to unlock completion.</small> : <small>Ready to save this path as complete.</small>}</section></main>;
}

function numberValue(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatActivityDate(value?: string | null): string {
  if (!value) return "Not yet recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not yet recorded" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function moduleTitle(moduleId?: string): string {
  return modules.find((module) => module.id === moduleId)?.title || "Learning activity";
}

function OutcomeCheckin({ outcome, onSave }: { outcome: OutcomeRow; onSave: (data: { afterMinutes: number | null; confidenceAfter: number | null; notes: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [afterMinutes, setAfterMinutes] = useState(outcome.after_minutes ? String(outcome.after_minutes) : "");
  const [confidenceAfter, setConfidenceAfter] = useState(outcome.confidence_after ? String(outcome.confidence_after) : "");
  const [notes, setNotes] = useState(outcome.notes || "");
  const done = outcome.status === "completed" || outcome.status === "done";
  if (done) return <div className="commitment-checkin done"><div><strong>{moduleTitle(outcome.module_id)}</strong><span>{outcome.commitment_text}</span><small>{outcome.after_minutes ? "Took " + outcome.after_minutes + " minutes" : "Result recorded"}{outcome.confidence_after ? " · Confidence " + outcome.confidence_after + "/5" : ""}</small></div><b className="commitment-done">Done</b></div>;
  return <div className="commitment-checkin"><div className="commitment-item-summary"><div><strong>{moduleTitle(outcome.module_id)}</strong><span>{outcome.commitment_text}</span></div><b className="commitment-open">Open</b><small>Due {formatActivityDate(outcome.due_at)}</small></div>{!open ? <button className="row-action" onClick={() => setOpen(true)}>Log result <ArrowRight size={14} /></button> : <div className="outcome-form"><label>Minutes this time<input type="number" min="0" max="100000" value={afterMinutes} onChange={(event) => setAfterMinutes(event.target.value)} placeholder="e.g. 20" /></label><label>Confidence now<select value={confidenceAfter} onChange={(event) => setConfidenceAfter(event.target.value)}><option value="">Choose</option><option value="1">1 · Need help</option><option value="2">2 · Getting started</option><option value="3">3 · Capable</option><option value="4">4 · Confident</option><option value="5">5 · Can teach it</option></select></label><label className="outcome-notes">What changed?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="One sentence about the result" /></label><div className="button-row"><button className="brand-button" disabled={!afterMinutes && !confidenceAfter && !notes.trim()} onClick={() => onSave({ afterMinutes: afterMinutes ? numberValue(afterMinutes) : null, confidenceAfter: confidenceAfter ? numberValue(confidenceAfter) : null, notes: notes.trim() })}>Save result <Check size={14} /></button><button className="quiet-button" onClick={() => setOpen(false)}>Cancel</button></div></div>}</div>;
}

type GeminiChatMessage = { role: "user" | "assistant"; text: string };

export function GeminiChatBox({ activeModuleId, trackingEnabled }: { activeModuleId?: ModuleId; trackingEnabled: boolean }) {
  const suggestions = ["What should I do next?", "How do I use Gemini in Sheets?", "How do I check an AI draft?"];
  const staticCoach = GITHUB_PAGES_MODE && !GEMINI_API_ENDPOINT;
  const coachLabel = staticCoach ? "Academy coach · GitHub Pages mode" : "Gemini coach · just in time";
  const [messages, setMessages] = useState<GeminiChatMessage[]>([
    { role: "assistant", text: staticCoach ? "Ask me about your learning path. I will give you a practical next step and a review point. This GitHub-hosted build uses built-in academy guidance until a secure Gemini endpoint is connected." : "Ask me about the learning path you are working on. I will give you a short next step and a review point." },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const recordQuestion = (configured: boolean) => {
    if (!trackingEnabled || !REMOTE_ACADEMY_ENABLED) return;
    fetch(academyApiUrl("/api/academy"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity: {
          eventName: "gemini_question_submitted",
          moduleId: activeModuleId,
          activityId: "progress-gemini-chat",
          metadata: { page: "progress", configured },
        },
      }),
    }).catch(() => undefined);
  };

  const ask = async (value = draft) => {
    const question = value.trim();
    if (!question || busy) return;
    setMessages((current) => [...current, { role: "user", text: question }]);
    setDraft("");
    setBusy(true);
    try {
      if (staticCoach) {
        setMessages((current) => [...current, { role: "assistant", text: localCoachReply(question, activeModuleId) }]);
        recordQuestion(false);
        return;
      }
      const response = await fetch(GEMINI_API_ENDPOINT || "/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, context: { page: "progress", moduleId: activeModuleId } }),
      });
      const payload = await response.json() as { reply?: string; configured?: boolean; error?: string };
      if (!response.ok) throw new Error(payload.reply || payload.error || "The coach could not answer right now.");
      setMessages((current) => [...current, { role: "assistant", text: payload.reply || "I do not have an answer yet. Try asking about one specific Google Workspace task." }]);
      recordQuestion(Boolean(payload.configured));
    } catch (error) {
      const message = error instanceof Error ? error.message : "The coach could not answer right now.";
      setMessages((current) => [...current, { role: "assistant", text: message }]);
    } finally {
      setBusy(false);
    }
  };

  return <section className="gemini-chat-card" aria-labelledby="progress-gemini-heading"><div className="gemini-chat-intro"><span className="gemini-chat-icon"><Sparkles size={21} /></span><div><p className="eyebrow">{coachLabel}</p><h2 id="progress-gemini-heading">Ask while you work.</h2><p>Get a plain-language next step, a prompt idea, or a reminder about what to review before you share the result.</p></div></div><div className="chat-suggestions" aria-label="Suggested questions">{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void ask(suggestion)} disabled={busy}>{suggestion}</button>)}</div><div className="chat-thread" aria-live="polite">{messages.map((message, index) => <div className={"chat-message " + message.role} key={message.role + index}><span>{message.role === "user" ? "You" : staticCoach ? "Academy coach" : "Gemini coach"}</span><p>{message.text}</p></div>)}{busy && <div className="chat-message assistant"><span>{staticCoach ? "Academy coach" : "Gemini coach"}</span><p className="chat-thinking">Thinking…</p></div>}</div><form className="chat-form" onSubmit={(event) => { event.preventDefault(); void ask(); }}><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={staticCoach ? "Ask the academy coach a question" : "Ask a Google Workspace question"} aria-label="Ask Gemini a question" maxLength={2000} /><button className="brand-button" type="submit" disabled={!draft.trim() || busy}><Send size={14} />{busy ? "Thinking…" : "Ask Gemini"}</button></form><p className="privacy-note"><ShieldCheck size={14} /> This coach receives your question and the selected learning path only. It cannot see GGW Drive, Gmail, or saved documents, and the question text is not saved in the learner record.</p></section>;
}

export function DashboardView({ userName, userEmail, trackingEnabled, storageMode = trackingEnabled ? "cloud" : "offline", completed, moduleProgress, attempts, outcomes, workProducts, isAdmin, onOpenModule, onOpenAdmin, onSaveOutcome }: { userName: string; userEmail?: string; trackingEnabled: boolean; storageMode?: AcademyStorageMode; completed: string[]; moduleProgress: ModuleProgressRow[]; attempts: AttemptRow[]; outcomes: OutcomeRow[]; workProducts: Array<{ kind?: string; title?: string; created_at?: string }>; isAdmin: boolean; onOpenModule: (id: ModuleId) => void; onOpenAdmin: () => void; onSaveOutcome: (moduleId: ModuleId, data: { afterMinutes: number | null; confidenceAfter: number | null; notes: string }) => void }) {
  const completedModules = modules.filter((module) => completed.includes(module.id) || moduleProgress.some((row) => row.module_id === module.id && row.status === "completed"));
  const nextModule = modules.find((module) => !completedModules.some((done) => done.id === module.id)) || modules[0];
  const nextRow = moduleProgress.find((row) => row.module_id === nextModule.id);
  const latestAttempt = attempts[0];
  const openOutcomes = outcomes.filter((outcome) => outcome.status !== "completed" && outcome.status !== "done");
  const browserMode = storageMode === "browser";
  return <main className="page-shell dashboard-page"><section className="simple-hero dashboard-hero"><p className="eyebrow">Your learning record</p><h1>Keep the useful work moving.</h1><p>{userName ? "Welcome back, " + userName.split(" ")[0] + ". " : ""}Your progress, practice results, saved artifacts, and 24-hour commitments live here so you can pick up where you left off.</p>{browserMode ? <div className="tracking-warning"><Info size={16} /><span>This GitHub-hosted build saves progress in this browser. Use the same browser to pick up where you left off.</span></div> : !trackingEnabled && <div className="tracking-warning"><Info size={16} /><span>This session is in practice mode. Sign in through the approved GGW account to save progress across devices.</span></div>}</section><section className="account-panel"><div className="account-panel-icon"><ShieldCheck size={21} /></div><div className="account-panel-copy"><p className="eyebrow">How your record works</p><h2>{browserMode ? "One browser. One learning record." : "One verified account. One learning record."}</h2><p>{browserMode ? "GitHub Pages cannot verify a Google account or run a private database. Your practice record is saved on this device until a secure backend is connected." : "The academy uses the authenticated account supplied by the private site. It never treats a typed email address as proof of identity."}</p></div><div className="account-status"><span>{browserMode ? "Browser save connected" : trackingEnabled ? "Verified account connected" : "No verified account connected"}</span><strong>{browserMode ? "This device" : trackingEnabled && userEmail ? userEmail : "Sign in to save your work"}</strong><small>{browserMode ? "Progress is not shared across devices or learners." : trackingEnabled ? "Your activity can be tied to this learner record." : "You can practice, but this session will not be saved."}</small></div></section><section className="progress-overview"><div className="progress-score"><span className="eyebrow">Course progress</span><strong>{completedModules.length}<small>/6</small></strong><span>learning paths complete</span></div><div className="progress-meter"><div className="progress-meter-head"><span>Six practical paths</span><b>{Math.round((completedModules.length / modules.length) * 100)}%</b></div><div className="progress-track"><span style={{ width: (completedModules.length / modules.length) * 100 + "%" }} /></div><p>Each path combines a real GGW friction point, a diagnostic, a safe practice task, and a 24-hour commitment.</p></div><div className="progress-signal"><span className="eyebrow">Latest evidence</span><strong>{latestAttempt?.score !== null && latestAttempt?.score !== undefined ? numberValue(latestAttempt.score) + "%" : "—"}</strong><span>{latestAttempt ? moduleTitle(latestAttempt.module_id) : "Complete a diagnostic to see a result."}</span></div></section><GeminiChatBox activeModuleId={nextModule.id} trackingEnabled={trackingEnabled} /><section className="continue-card"><div><p className="eyebrow">Next best step</p><h2>{nextRow?.status === "in_progress" ? "Resume " : "Start "}{nextModule.title}</h2><p>{nextModule.description}</p>{nextRow?.status === "in_progress" && <span className="resume-detail">Saved at {formatActivityDate(nextRow.last_activity_at)} · {nextRow.current_step ? "Step " + nextRow.current_step + " of 3" : "Lesson started"}</span>}</div><button className="brand-button" onClick={() => onOpenModule(nextModule.id)}>{nextRow?.status === "in_progress" ? "Resume path" : "Start path"} <ArrowRight size={15} /></button></section><section className="dashboard-section"><div className="section-heading"><div><p className="eyebrow">Your six paths</p><h2>See exactly what is next.</h2></div><span className="section-note">Progress saves as you practice.</span></div><div className="progress-list">{modules.map((module) => { const row = moduleProgress.find((item) => item.module_id === module.id); const done = completed.includes(module.id) || row?.status === "completed"; const status = done ? "Complete" : row?.status === "in_progress" ? "In progress" : "Not started"; return <article className="progress-row" key={module.id}><span className={"progress-row-icon " + module.color}>{iconFor(module.icon, 19)}</span><div className="progress-row-main"><strong>{module.title}</strong><span>{module.tools}</span></div><span className={"progress-status " + status.toLowerCase().replace(" ", "-")}>{status}</span><span className="progress-row-stat">{row && numberValue(row.best_score) ? numberValue(row.best_score) + "% best" : row && numberValue(row.attempts) ? numberValue(row.attempts) + " attempt" + (numberValue(row.attempts) === 1 ? "" : "s") : "Ready when you are"}</span><button className="row-action" onClick={() => onOpenModule(module.id)}>{done ? "Review" : row?.status === "in_progress" ? "Resume" : "Start"} <ChevronRight size={15} /></button></article>; })}</div></section><section className="dashboard-columns"><div className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Evidence you created</p><h2>Saved work</h2></div><span className="panel-count">{workProducts.length}</span></div>{workProducts.length ? <div className="evidence-list">{workProducts.slice(0, 6).map((item, index) => <div className="evidence-item" key={(item.kind || "item") + (item.title || "") + index}><span className="evidence-dot"><Check size={13} /></span><div><strong>{item.title || "Saved work item"}</strong><span>{item.kind || "Practice artifact"} · {formatActivityDate(item.created_at)}</span></div></div>)}</div> : <div className="panel-empty"><Sparkles size={18} /><span>Save a module prompt or finish a sandbox exercise and it will appear here.</span></div>}<p className="privacy-note"><ShieldCheck size={14} /> The tracker stores short activity metadata and your saved artifact summary—not raw Drive files.</p></div><div className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Applied learning</p><h2>24-hour commitments</h2></div><span className="panel-count">{openOutcomes.length}</span></div>{outcomes.length ? <div className="commitment-list">{outcomes.slice(0, 5).map((outcome, index) => outcome.module_id ? <OutcomeCheckin key={(outcome.module_id || "module") + index} outcome={outcome} onSave={(data) => onSaveOutcome(outcome.module_id as ModuleId, data)} /> : null)}</div> : <div className="panel-empty"><CircleHelp size={18} /><span>Commit to one small task inside a module. The due date and follow-up result will be tracked here.</span></div>}<p className="privacy-note"><Info size={14} /> Use the commitment as a work experiment: record what changed, not private client or donor information.</p></div></section>{isAdmin && <section className="leadership-link-card"><div><p className="eyebrow">GGW leadership</p><h2>See aggregate adoption signals.</h2><p>Review participation, completion, attempt quality, and commitment status without exposing individual work content.</p></div><button className="quiet-button" onClick={onOpenAdmin}>Open leadership view <ArrowRight size={15} /></button></section>}</main>;
}

function AdminDashboardView({ admin, error, onBack }: { admin?: AdminOverview; error?: string; onBack: () => void }) {
  const summary = admin?.summary || {};
  const moduleRows = admin?.modules || [];
  const value = (key: string) => numberValue(summary[key]);
  return <main className="page-shell dashboard-page admin-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to my progress</button><section className="simple-hero dashboard-hero"><p className="eyebrow">Restricted leadership view</p><h1>GGW adoption signals.</h1><p>This view is aggregate-only. It helps leadership see where people are engaging, where practice is completing, and where support is needed.</p><div className="tracking-warning"><LockKeyhole size={16} /><span>No raw prompts, source documents, email bodies, or individual learner names are shown here.</span></div></section>{error ? <section className="admin-lock-card"><LockKeyhole size={20} /><h2>Leadership access is restricted.</h2><p>{error}</p><p>Ask the site owner to add approved GGW leadership addresses to the <code>GGW_ADMIN_EMAILS</code> allowlist.</p></section> : !admin ? <section className="admin-lock-card"><Info size={20} /><h2>Loading leadership signals.</h2><p>Aggregate results will appear as soon as the learning record responds.</p></section> : <><section className="admin-metrics"><div><span>Active users · 7d</span><strong>{value("active_users_7d")}</strong></div><div><span>Registered users</span><strong>{value("total_users")}</strong></div><div><span>Completed paths</span><strong>{value("completed_modules")}</strong></div><div><span>Average diagnostic</span><strong>{value("average_attempt_score") ? Math.round(value("average_attempt_score")) + "%" : "—"}</strong></div><div><span>Labs passed</span><strong>{value("passed_labs")}</strong></div></section><section className="dashboard-panel admin-table-panel"><div className="panel-heading"><div><p className="eyebrow">Path health</p><h2>Participation by learning path</h2></div><span className="section-note">Aggregate only · all-time path record</span></div><div className="feature-table-wrap"><table className="feature-table admin-table"><thead><tr><th>Path</th><th>Started</th><th>Completed</th><th>Avg. score</th><th>Attempts</th><th>Labs</th></tr></thead><tbody>{modules.map((module) => { const row = moduleRows.find((item) => item.module_id === module.id) || {}; return <tr key={module.id}><td><strong>{module.title}</strong><small>{module.tools}</small></td><td>{numberValue(row.enrolled)}</td><td>{numberValue(row.completed)}</td><td>{numberValue(row.average_score) ? numberValue(row.average_score) + "%" : "—"}</td><td>{numberValue(row.attempts)}</td><td>{numberValue(row.labs_passed)}</td></tr>; })}</tbody></table></div></section><section className="dashboard-columns"><div className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Recent activity</p><h2>What people are trying</h2></div><span className="section-note">Last 30 days</span></div>{admin?.recentEvents?.length ? <div className="admin-event-list">{admin.recentEvents.map((event, index) => <div key={String(event.event_name) + index}><strong>{String(event.event_name).replaceAll("_", " ")}</strong><span>{numberValue(event.count)} events</span></div>)}</div> : <div className="panel-empty"><Info size={18} /><span>No activity has been recorded in the last 30 days.</span></div>}</div><div className="dashboard-panel"><div className="panel-heading"><div><p className="eyebrow">Applied learning</p><h2>Commitment status</h2></div></div>{admin?.outcomes?.length ? <div className="admin-event-list">{admin.outcomes.map((outcome, index) => <div key={String(outcome.status) + index}><strong>{String(outcome.status).replaceAll("_", " ")}</strong><span>{numberValue(outcome.count)} commitments</span></div>)}</div> : <div className="panel-empty"><Info size={18} /><span>No commitments have been recorded yet.</span></div>}</div></section></>}</main>;
}

function SandboxMenu({ onOpen }: { onOpen: (id: SandboxId) => void }) {
  const tools = [{ id: "sheets", title: "Google Sheets", description: "Standardize dates, classify transactions, and flag receipt review.", color: "lime", icon: "sheets" }, { id: "drive", title: "Google Drive", description: "Choose a source of truth from files in different folders.", color: "violet", icon: "drive" }, { id: "docs", title: "Google Docs", description: "Turn rough notes into a first draft with review markers.", color: "coral", icon: "docs" }, { id: "gmail", title: "Gmail + AI", description: "Draft a clear email without sending anything.", color: "blue", icon: "gmail" }];
  return <main className="page-shell sandbox-menu-page"><section className="simple-hero"><p className="eyebrow">Practice without risk</p><h1>Sandbox exercises</h1><p>Try the workflow with fictional information. Nothing sends, shares, edits, or downloads from this page.</p></section><div className="sandbox-menu-grid">{tools.map((tool) => <button className={"sandbox-menu-card " + tool.color} key={tool.id} onClick={() => onOpen(tool.id as SandboxId)}><span className="familiar-icon">{iconFor(tool.icon, 26)}</span><strong>{tool.title}</strong><span>{tool.description}</span><span className="familiar-link">Start exercise <ArrowRight size={16} /></span></button>)}</div><section className="sandbox-safety"><LockKeyhole size={19} /><div><strong>What this page does not do</strong><span>It does not connect to a Google account, send email, change a file, or run a script. It teaches the sequence so you can recognize the review points in the real tool.</span></div></section></main>;
}

function SandboxView({ sandboxId, onBack, onCopy, onComplete }: { sandboxId: SandboxId; onBack: () => void; onCopy: (label: string, value: string) => void; onComplete: (id: string, product?: WorkProduct) => void }) {
  const [step, setStep] = useState(0);
  const [csv, setCsv] = useState(financeCsv);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [error, setError] = useState("");
  const [selectedDrive, setSelectedDrive] = useState("");
  const [driveFeedback, setDriveFeedback] = useState("");
  const [docType, setDocType] = useState("event");
  const [docNotes, setDocNotes] = useState("The GGW mentoring mixer is planned for new mentors and mentees. The team needs an attendee welcome, a check-in plan, and a follow-up owner.");
  const [docDraft, setDocDraft] = useState("");
  const [emailAudience, setEmailAudience] = useState("GGW event attendees");
  const [emailPurpose, setEmailPurpose] = useState("A quick update about our upcoming GGW event");
  const [emailDetails, setEmailDetails] = useState("The event begins at 6:00 PM on Thursday. Please bring the name you used to register. Questions can go to the GGW events team.");
  const [emailTone, setEmailTone] = useState("Warm and concise");
  const [emailDraft, setEmailDraft] = useState("");
  const tool = sandboxId === "sheets" ? "Google Sheets" : sandboxId === "drive" ? "Google Drive" : sandboxId === "docs" ? "Google Docs" : "Gmail + AI";
  const begin = () => setStep(1);
  const runSheet = () => { const result = reviewSheet(csv); if (!result.length) { setError("Add at least one CSV data row."); return; } setError(""); setRows(result); setStep(2); onComplete("sandbox-sheets", { kind: "sandbox", title: "Finance review sandbox", content: { rows: result } }); };
  const chooseDrive = (id: string) => { setSelectedDrive(id); if (id === "approved") { setDriveFeedback("Correct. This is current, approved, owned by GGW Finance, and in the shared FY26 Finance folder."); setStep(2); onComplete("sandbox-drive", { kind: "sandbox", title: "Drive source-of-truth sandbox", content: { selected: id } }); } else setDriveFeedback("Not quite. Check owner, date, shared location, and status. This file is useful context but is not the current approved source."); };
  const createDoc = () => { if (!docNotes.trim()) { setError("Add a few notes before creating a draft."); return; } const draft = makeDocDraft(docType, docNotes); setDocDraft(draft); setStep(2); onComplete("sandbox-docs", { kind: "sandbox", title: "Google Docs draft sandbox", content: { draft } }); };
  const createEmail = () => { if (!emailPurpose.trim() || !emailDetails.trim()) { setError("Add a purpose and a few details before creating a draft."); return; } const draft = makeEmailDraft(emailAudience, emailPurpose, emailDetails, emailTone); setEmailDraft(draft); setStep(2); onComplete("sandbox-gmail", { kind: "sandbox", title: "Gmail draft sandbox", content: { draft } }); };
  const intro = sandboxId === "sheets" ? ["Use AI for the first pass, not the final decision.", "Give Gemini a small table and a specific job. It can clean dates, group transactions, and identify rows that need a receipt. A person still checks the source and approves the result.", "Dates become YYYY-MM-DD. Each row gets a Form 990 functional category. Missing vendor detail or an amount over $1,000 becomes Requires Receipt/Audit."] : sandboxId === "drive" ? ["The best file is not always the newest name.", "When information lives in different Drives and folders, compare the owner, update date, location, access, and status. Start with the source of truth, then use supporting exports.", "Find the current approved FY26 finance ledger. Nothing will be moved, shared, renamed, or deleted."] : sandboxId === "docs" ? ["Use a first draft to make review easier.", "Gemini can turn notes into a clear structure. It should not decide what GGW believes, promises, approves, or publishes.", "Make a short event brief or board memo with visible [CHECK] markers for facts a person must verify."] : ["Ask for a draft, then make it yours.", "Gemini can help you get past a blank page. You still check audience, request, names, dates, links, attachments, and tone before sending.", "Draft a warm, clear message about a fictional GGW event update. Nothing will be sent."]; 
  return <main className="page-shell sandbox-page"><button className="back-link" onClick={onBack}><ArrowLeft size={15} /> Back to sandbox exercises</button><section className={"sandbox-hero " + (sandboxId === "sheets" ? "lime" : sandboxId === "drive" ? "violet" : sandboxId === "docs" ? "coral" : "blue")}><div className="module-icon">{iconFor(sandboxId, 27)}</div><div><p className="eyebrow">Safe practice · {tool}</p><h1>Try one small task.</h1><p>This is a fictional exercise. You will see the workflow before using it with real GGW work.</p></div></section><div className="sandbox-steps"><span className={step === 0 ? "active" : ""}>01 <b>Understand</b></span><span className={step === 1 ? "active" : ""}>02 <b>Try</b></span><span className={step >= 2 ? "active" : ""}>03 <b>Review</b></span></div><section className="sandbox-card">{step === 0 && <div className="lesson-copy"><p className="eyebrow">Step 1 · Understand</p><h2>{intro[0]}</h2><p>{intro[1]}</p><div className="example-callout"><CircleHelp size={18} /><div><strong>What you will practice</strong><p>{intro[2]}</p></div></div><button className="brand-button" onClick={begin}>Use the safe example <ArrowRight size={15} /></button></div>}{sandboxId === "sheets" && step === 1 && <div className="practice-layout"><div><p className="eyebrow">Step 2 · Try it</p><h2>Give the reviewer a small list.</h2><p>Edit one date, vendor, or amount if you want to see how the flag changes.</p><textarea className="practice-editor" value={csv} onChange={(event) => setCsv(event.target.value)} aria-label="Practice spreadsheet data" spellCheck={false} />{error && <p className="form-error">{error}</p>}<button className="brand-button" onClick={runSheet}><Table2 size={15} /> Run the review</button></div><div className="side-tip"><ShieldCheck size={18} /><strong>Review point</strong><span>Compare the result to the original rows before using it for a month-end process.</span></div></div>}{sandboxId === "sheets" && step === 2 && <div className="result-layout"><div><p className="eyebrow">Step 3 · Review</p><h2>Your structured review.</h2><p>These flags are review prompts, not accounting conclusions. Confirm categories and documentation with GGW’s finance owner or CPA.</p><div className="result-table-wrap"><table><thead><tr><th>Date</th><th>Vendor</th><th>Type</th><th>Category</th><th>Amount</th><th>Audit Flag</th></tr></thead><tbody>{rows.map((row, index) => <tr key={String(index) + row.vendor}><td>{row.date}</td><td>{row.vendor}</td><td>{row.type}</td><td>{row.category}</td><td>{row.amount}</td><td><span className={row.flag === "Clear" ? "clear-pill" : "review-pill"}>{row.flag}</span></td></tr>)}</tbody></table></div><div className="button-row"><CopyButton label="Copy result table" value={rowsToCsv(rows)} onCopy={onCopy} /><button className="quiet-button" onClick={onBack}>Choose another exercise</button></div></div><div className="success-card"><CheckCircle2 size={20} /><strong>What you practiced</strong><span>Date standardization, Form 990 functional classification, and receipt/audit flags.</span></div></div>}{sandboxId === "drive" && step >= 1 && <div className="drive-practice"><div className="drive-toolbar"><div><p className="eyebrow">Step 2 · Try it</p><h2>Choose the source of truth.</h2><p>Read each file card. Select the one that is current, approved, and in the right shared location.</p></div><span className="source-badge"><LockKeyhole size={13} /> Practice files only</span></div><div className="drive-files">{driveFiles.map((file) => <button className={"drive-file " + (selectedDrive === file.id ? "selected" : "")} key={file.id} onClick={() => chooseDrive(file.id)}><FolderOpen size={20} /><span><strong>{file.title}</strong><small>{file.owner} · {file.updated} · {file.location}</small></span><b>{file.status}</b></button>)}</div>{driveFeedback && <div className={"drive-feedback " + (selectedDrive === "approved" ? "good" : "")}><Info size={15} /><span>{driveFeedback}</span></div>}<div className="drive-note"><ShieldCheck size={14} /> In real work, verify access and policy before using a file with AI.</div><button className="quiet-button" onClick={onBack}>Choose another exercise</button></div>}{sandboxId === "docs" && step === 1 && <div className="form-practice"><p className="eyebrow">Step 2 · Try it</p><h2>Give the document a job.</h2><label>Document type<select value={docType} onChange={(event) => setDocType(event.target.value)}><option value="event">Event brief</option><option value="board">Board memo</option><option value="working">Working document</option></select></label><label>Rough notes<textarea value={docNotes} onChange={(event) => setDocNotes(event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="brand-button" onClick={createDoc}><FileText size={15} /> Create first draft</button></div>}{sandboxId === "docs" && step === 2 && <div className="result-layout"><div><p className="eyebrow">Step 3 · Review</p><h2>Review the draft before it travels.</h2><p>Replace every [CHECK] marker with a verified fact or remove it.</p><pre className="document-result">{docDraft}</pre><div className="button-row"><CopyButton label="Copy draft" value={docDraft} onCopy={onCopy} /><button className="quiet-button" onClick={onBack}>Choose another exercise</button></div></div><div className="success-card"><CheckCircle2 size={20} /><strong>Review points</strong><span>Facts, audience, tone, links, decisions, and action owners.</span></div></div>}{sandboxId === "gmail" && step === 1 && <div className="form-practice"><p className="eyebrow">Step 2 · Try it</p><h2>Give the email a clear purpose.</h2><label>Audience<input value={emailAudience} onChange={(event) => setEmailAudience(event.target.value)} /></label><label>Purpose / subject<input value={emailPurpose} onChange={(event) => setEmailPurpose(event.target.value)} /></label><label>Details to include<textarea value={emailDetails} onChange={(event) => setEmailDetails(event.target.value)} /></label><label>Tone<select value={emailTone} onChange={(event) => setEmailTone(event.target.value)}><option>Warm and concise</option><option>Professional and direct</option><option>Celebratory and welcoming</option></select></label>{error && <p className="form-error">{error}</p>}<button className="brand-button" onClick={createEmail}><Mail size={15} /> Create draft</button></div>}{sandboxId === "gmail" && step === 2 && <div className="result-layout"><div><p className="eyebrow">Step 3 · Review</p><h2>Your draft is ready for a person.</h2><p>AI can prepare the words. The sender confirms recipients, facts, links, attachments, and final tone.</p><pre className="document-result">{emailDraft}</pre><div className="button-row"><CopyButton label="Copy draft" value={emailDraft} onCopy={onCopy} /><button className="quiet-button" onClick={onBack}>Choose another exercise</button></div></div><div className="success-card"><CheckCircle2 size={20} /><strong>Never skip</strong><span>Recipient check, link check, attachment check, and final read-through.</span></div></div>}</section></main>;
}

export default function Home() {
  const [view, setView] = useState<AppView>("home");
  const [activeModule, setActiveModule] = useState<ModuleId>("daily");
  const [activeSandbox, setActiveSandbox] = useState<SandboxId | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("connecting");
  const [savedCount, setSavedCount] = useState(0);
  const [notice, setNotice] = useState("");
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [storageMode, setStorageMode] = useState<AcademyStorageMode>("offline");
  const [hydrated, setHydrated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [moduleProgress, setModuleProgress] = useState<ModuleProgressRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([]);
  const [workProducts, setWorkProducts] = useState<Array<{ kind?: string; title?: string; created_at?: string }>>([]);
  const [admin, setAdmin] = useState<AdminOverview>();
  const [adminError, setAdminError] = useState("");
  const [progressMeta, setProgressMeta] = useState<{ view: AppView; activeModule: ModuleId | null; activeSandbox: SandboxId | null; step: number }>({ view: "home", activeModule: null, activeSandbox: null, step: 0 });

  useEffect(() => {
    let cancelled = false;
    const hydrate = (payload: { authenticated?: boolean; tracking?: { enabled?: boolean }; user?: { user_email?: string; display_name?: string }; isAdmin?: boolean; progress?: { completed?: string[]; view?: AppView; activeModule?: ModuleId; activeSandbox?: SandboxId; step?: number }; workProducts?: Array<{ kind?: string; title?: string; created_at?: string }>; moduleProgress?: ModuleProgressRow[]; recentAttempts?: AttemptRow[]; outcomes?: OutcomeRow[] }, mode: AcademyStorageMode) => {
      if (cancelled) return;
      const progress = payload.progress || {};
      const query = new URLSearchParams(window.location.search);
      const queryModule = query.get("module");
      const queryView = query.get("view");
      const requestedModule = modules.some((module) => module.id === queryModule) ? queryModule as ModuleId : null;
      const requestedView = requestedModule ? "module" : ["home", "prompts", "sandbox", "dashboard"].includes(queryView || "") ? queryView as AppView : null;
      const restoredView = progress.view === "admin" ? "dashboard" : (progress.view || "home");
      const nextMeta = { view: requestedView || restoredView, activeModule: requestedModule || progress.activeModule || null, activeSandbox: requestedView ? null : progress.activeSandbox || null, step: requestedModule ? 0 : typeof progress.step === "number" ? progress.step : 0 };
      setProgressMeta(nextMeta);
      if (Array.isArray(progress.completed)) setCompleted(progress.completed);
      if (restoredView) setView(restoredView);
      if (requestedView) setView(requestedView);
      if (requestedModule) setActiveModule(requestedModule);
      else if (progress.activeModule) setActiveModule(progress.activeModule);
      if (requestedView === "sandbox") setActiveSandbox(null);
      else if (progress.activeSandbox) setActiveSandbox(progress.activeSandbox);
      setUserName(payload.user?.display_name || (mode === "browser" ? "GGW learner" : ""));
      setUserEmail(payload.user?.user_email || "");
      setIsAdmin(Boolean(payload.isAdmin));
      setModuleProgress(Array.isArray(payload.moduleProgress) ? payload.moduleProgress : []);
      setAttempts(Array.isArray(payload.recentAttempts) ? payload.recentAttempts : []);
      setOutcomes(Array.isArray(payload.outcomes) ? payload.outcomes : []);
      setWorkProducts(Array.isArray(payload.workProducts) ? payload.workProducts : []);
      setSavedCount(Array.isArray(payload.workProducts) ? payload.workProducts.length : 0);
      setTrackingEnabled(mode !== "offline");
      setStorageMode(mode);
      setSaveState(mode === "offline" ? "offline" : "connected");
      setHydrated(true);
    };

    if (!REMOTE_ACADEMY_ENABLED) {
      const local = readLocalAcademyState();
      hydrate({
        progress: local.progress,
        moduleProgress: local.moduleProgress,
        recentAttempts: local.recentAttempts,
        outcomes: local.outcomes,
        workProducts: local.workProducts,
      }, "browser");
      return () => { cancelled = true; };
    }

    fetch(academyApiUrl("/api/academy")).then(async (response) => {
      const payload = await response.json() as { authenticated?: boolean; tracking?: { enabled?: boolean }; user?: { user_email?: string; display_name?: string }; isAdmin?: boolean; progress?: { completed?: string[]; view?: AppView; activeModule?: ModuleId; activeSandbox?: SandboxId; step?: number }; workProducts?: Array<{ kind?: string; title?: string; created_at?: string }>; moduleProgress?: ModuleProgressRow[]; recentAttempts?: AttemptRow[]; outcomes?: OutcomeRow[] };
      if (!response.ok) throw new Error("Unable to load the learning record.");
      if (!payload.authenticated || !payload.tracking?.enabled) { hydrate({}, "offline"); return; }
      hydrate(payload, "cloud");
    }).catch(() => {
      if (!cancelled) {
        hydrate(readLocalAcademyState(), "browser");
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!GITHUB_PAGES_MODE || ACADEMY_API_BASE || !hydrated) return;
    writeLocalAcademyState({
      progress: { ...progressMeta, completed },
      moduleProgress,
      recentAttempts: attempts,
      outcomes,
      workProducts,
    });
  }, [attempts, completed, hydrated, moduleProgress, outcomes, progressMeta, workProducts]);

  const applyTrackingState = (event?: TrackingEvent, workProduct?: WorkProduct) => {
    const now = new Date().toISOString();
    if (event?.moduleProgress) {
      const incoming = event.moduleProgress;
      setModuleProgress((current) => {
        const existing = current.find((row) => row.module_id === incoming.moduleId);
        const next: ModuleProgressRow = { ...existing, module_id: incoming.moduleId, status: incoming.status || existing?.status || "in_progress", current_step: incoming.currentStep ?? existing?.current_step ?? 0, best_score: Math.max(numberValue(existing?.best_score), incoming.bestScore || 0), attempts: Math.max(numberValue(existing?.attempts), incoming.attempts || 0), lab_passed: incoming.labPassed ? 1 : existing?.lab_passed || 0, artifact_saved: incoming.artifactSaved ? 1 : existing?.artifact_saved || 0, commitment_status: incoming.commitmentStatus || existing?.commitment_status || "not_started", commitment_due_at: incoming.commitmentDueAt ?? existing?.commitment_due_at ?? null, completed_at: incoming.completedAt || existing?.completed_at || null, last_activity_at: now };
        return [next, ...current.filter((row) => row.module_id !== incoming.moduleId)];
      });
    }
    if (event?.attempt) setAttempts((current) => [{ module_id: event.attempt?.moduleId, activity_id: event.attempt?.activityId, attempt_type: event.attempt?.attemptType, score: event.attempt?.score, result: event.attempt?.result, created_at: now }, ...current].slice(0, 20));
    if (event?.outcome?.moduleId) setOutcomes((current) => [{ module_id: event.outcome?.moduleId, commitment_text: event.outcome?.commitmentText, due_at: event.outcome?.dueAt, status: event.outcome?.status, baseline_minutes: event.outcome?.baselineMinutes, after_minutes: event.outcome?.afterMinutes, confidence_before: event.outcome?.confidenceBefore, confidence_after: event.outcome?.confidenceAfter, notes: event.outcome?.notes, updated_at: now }, ...current.filter((row) => row.module_id !== event.outcome?.moduleId)]);
    if (workProduct) setWorkProducts((current) => [{ kind: workProduct.kind, title: workProduct.title, created_at: now }, ...current.filter((item) => !(item.kind === workProduct.kind && item.title === workProduct.title))].slice(0, 25));
  };

  const postToAcademy = (body: Record<string, unknown>) => {
    if (!trackingEnabled) { setSaveState("offline"); return; }
    if (!REMOTE_ACADEMY_ENABLED) { setSaveState("connected"); return; }
    setSaveState("saving");
    fetch(academyApiUrl("/api/academy"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(async (response) => { const payload = await response.json() as { workProductCount?: number; saved?: boolean }; if (!response.ok || !payload.saved) throw new Error("Progress could not be saved."); return payload; }).then((payload) => { setSaveState("connected"); if (typeof payload.workProductCount === "number") setSavedCount(payload.workProductCount); }).catch(() => setSaveState("offline"));
  };

  const saveProgress = (overrides: Partial<{ view: AppView; activeModule: ModuleId | null; activeSandbox: SandboxId | null; step: number; completed: string[] }>, workProduct?: WorkProduct, event?: TrackingEvent) => {
    const next = { ...progressMeta, ...overrides, completed: overrides.completed || completed };
    setProgressMeta(next);
    applyTrackingState(event, workProduct);
    postToAcademy({ progress: next, workProduct, ...(event ? { activity: { eventName: event.eventName, moduleId: event.moduleId, activityId: event.activityId, metadata: event.metadata }, attempt: event.attempt, outcome: event.outcome, moduleProgress: event.moduleProgress } : {}) });
  };

  const recordEvent = (event: TrackingEvent) => { applyTrackingState(event); postToAcademy({ activity: { eventName: event.eventName, moduleId: event.moduleId, activityId: event.activityId, metadata: event.metadata }, attempt: event.attempt, outcome: event.outcome, moduleProgress: event.moduleProgress }); };

  const copyText = (label: string, value: string) => {
    if (!value) return;
    recordEvent({ eventName: "prompt_copied", activityId: label, metadata: { label } });
    navigator.clipboard?.writeText(value).then(() => { setNotice(label + " copied. Paste it into the matching Google tool."); window.setTimeout(() => setNotice(""), 3500); }).catch(() => setNotice("Select and copy the text manually."));
  };

  const goHome = () => { setView("home"); setActiveSandbox(null); saveProgress({ view: "home", activeModule: null, activeSandbox: null, step: 0 }, undefined, { eventName: "home_opened", activityId: "navigation" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openPrompts = () => { setView("prompts"); setActiveSandbox(null); saveProgress({ view: "prompts", activeModule: null, activeSandbox: null, step: 0 }, undefined, { eventName: "prompt_library_opened", activityId: "navigation" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openSandboxMenu = () => { setView("sandbox"); setActiveSandbox(null); saveProgress({ view: "sandbox", activeModule: null, activeSandbox: null, step: 0 }, undefined, { eventName: "sandbox_opened", activityId: "navigation" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openSandbox = (id: SandboxId) => { setView("sandbox"); setActiveSandbox(id); saveProgress({ view: "sandbox", activeModule: null, activeSandbox: id, step: 0 }, undefined, { eventName: "sandbox_started", activityId: id, metadata: { tool: id } }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openModule = (id: ModuleId) => { const row = moduleProgress.find((item) => item.module_id === id); setView("module"); setActiveModule(id); setActiveSandbox(null); saveProgress({ view: "module", activeModule: id, activeSandbox: null, step: numberValue(row?.current_step) }, undefined, { eventName: "module_started", moduleId: id, activityId: "module", metadata: { source: "learning_path" }, moduleProgress: { moduleId: id, status: row?.status === "completed" ? "completed" : "in_progress", currentStep: numberValue(row?.current_step), bestScore: numberValue(row?.best_score), attempts: numberValue(row?.attempts), labPassed: Boolean(numberValue(row?.lab_passed)), artifactSaved: Boolean(numberValue(row?.artifact_saved)), commitmentStatus: row?.commitment_status || "not_started", commitmentDueAt: row?.commitment_due_at || null, completedAt: row?.completed_at || null } }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openDashboard = () => { window.location.href = academyPath("/progress"); };
  const openAdmin = () => { setView("admin"); setAdmin(undefined); setAdminError(""); window.scrollTo({ top: 0, behavior: "smooth" }); if (!REMOTE_ACADEMY_ENABLED) { setAdminError("The GitHub Pages build keeps learner data on each device and does not provide an aggregate leadership database."); return; } fetch(academyApiUrl("/api/academy?mode=admin")).then(async (response) => { const payload = await response.json() as { admin?: AdminOverview; error?: string }; if (!response.ok) throw new Error(payload.error || "Leadership view is unavailable."); setAdmin(payload.admin); }).catch((error: unknown) => setAdminError(error instanceof Error ? error.message : "Leadership view is unavailable.")); };
  const saveOutcome = (moduleId: ModuleId, data: { afterMinutes: number | null; confidenceAfter: number | null; notes: string }) => { const current = outcomes.find((outcome) => outcome.module_id === moduleId); const row = moduleProgress.find((item) => item.module_id === moduleId); setNotice("Result logged for " + moduleTitle(moduleId) + "."); recordEvent({ eventName: "commitment_completed", moduleId, activityId: "outcome-checkin", metadata: { hasAfterMinutes: Boolean(data.afterMinutes), hasConfidenceAfter: Boolean(data.confidenceAfter) }, outcome: { moduleId, commitmentText: current?.commitment_text || modules.find((module) => module.id === moduleId)?.commitment, dueAt: current?.due_at || null, status: "completed", afterMinutes: data.afterMinutes, confidenceAfter: data.confidenceAfter, notes: data.notes }, moduleProgress: { moduleId, status: row?.status || "in_progress", currentStep: 3, bestScore: numberValue(row?.best_score), attempts: numberValue(row?.attempts), labPassed: Boolean(numberValue(row?.lab_passed)), artifactSaved: Boolean(numberValue(row?.artifact_saved)), commitmentStatus: "completed", commitmentDueAt: row?.commitment_due_at || current?.due_at || null, completedAt: row?.completed_at || null } }); };
  const complete = (id: string, product?: WorkProduct, completion?: { diagnosticScore: number; diagnosticAttempts: number; commitmentDueAt: string | null }) => { const next = completed.includes(id) ? completed : [...completed, id]; setCompleted(next); const selectedModule = modules.find((item) => item.id === id); if (selectedModule) { const row = moduleProgress.find((item) => item.module_id === id); const dueAt = completion?.commitmentDueAt || row?.commitment_due_at || null; setNotice(selectedModule.title + " marked complete. Keep the 24-hour commitment in motion."); saveProgress({ completed: next, view: "module", activeModule: id as ModuleId, activeSandbox: null, step: 3 }, { ...(product || {}), kind: product?.kind || "module-completion", title: product?.title || selectedModule.title + " completion", content: product?.content || {} }, { eventName: "module_completed", moduleId: id as ModuleId, activityId: "completion", metadata: { diagnosticScore: completion?.diagnosticScore || numberValue(row?.best_score), hasArtifact: Boolean(product) }, outcome: { moduleId: id as ModuleId, commitmentText: selectedModule.commitment, dueAt, status: "open" }, moduleProgress: { moduleId: id as ModuleId, status: "completed", currentStep: 3, bestScore: completion?.diagnosticScore || numberValue(row?.best_score), attempts: completion?.diagnosticAttempts || numberValue(row?.attempts), labPassed: Boolean(numberValue(row?.lab_passed)), artifactSaved: true, commitmentStatus: "open", commitmentDueAt: dueAt, completedAt: new Date().toISOString() } }); } else { const linkedModuleId = activeSandbox ? sandboxModuleMap[activeSandbox] : undefined; const row = linkedModuleId ? moduleProgress.find((item) => item.module_id === linkedModuleId) : undefined; setNotice("Sandbox result saved to your learning record."); saveProgress({ completed: next, step: 2 }, product, { eventName: "sandbox_completed", moduleId: linkedModuleId, activityId: id, metadata: { passed: true, sandbox: activeSandbox || "unknown" }, moduleProgress: linkedModuleId ? { moduleId: linkedModuleId, status: row?.status === "completed" ? "completed" : "in_progress", currentStep: 2, bestScore: numberValue(row?.best_score), attempts: numberValue(row?.attempts), labPassed: true, artifactSaved: Boolean(numberValue(row?.artifact_saved)), commitmentStatus: row?.commitment_status || "not_started", commitmentDueAt: row?.commitment_due_at || null, completedAt: row?.completed_at || null } : undefined }); } };
  const saveModuleAsset = (product: WorkProduct) => { const row = moduleProgress.find((item) => item.module_id === activeModule); saveProgress({ view: "module", activeModule, activeSandbox: null, step: 2 }, product, { eventName: "artifact_saved", moduleId: activeModule, activityId: "module-asset", metadata: { kind: product.kind }, moduleProgress: { moduleId: activeModule, status: row?.status === "completed" ? "completed" : "in_progress", currentStep: 2, bestScore: numberValue(row?.best_score), attempts: numberValue(row?.attempts), labPassed: Boolean(numberValue(row?.lab_passed)), artifactSaved: true, commitmentStatus: row?.commitment_status || "not_started", commitmentDueAt: row?.commitment_due_at || null, completedAt: row?.completed_at || null } }); };
  const saveLabel = saveState === "saving" ? "Saving progress…" : saveState === "connected" ? storageMode === "browser" ? "Saved on this browser" : savedCount ? savedCount + " saved work item" + (savedCount === 1 ? "" : "s") : "Progress saved" : saveState === "connecting" ? "Connecting…" : "Practice mode";
  const activeModuleDefinition = modules.find((module) => module.id === activeModule) || modules[0];
  const activeModuleProgress = moduleProgress.find((row) => row.module_id === activeModule);
  const activeOutcome = outcomes.find((row) => row.module_id === activeModule);

  return <div className="academy-app"><SiteHeader view={view} onHome={goHome} onPrompts={openPrompts} onSandbox={openSandboxMenu} onDashboard={openDashboard} />{notice && <div className="copy-notice" role="status"><CheckCircle2 size={15} />{notice}</div>}<div className="save-status"><span className={"save-dot " + saveState}></span>{saveLabel}</div>{view === "home" && <HomeView completed={completed} onOpenModule={openModule} onOpenPrompts={openPrompts} onOpenSandbox={openSandbox} onCopy={copyText} />}{view === "prompts" && <PromptLibraryView onCopy={copyText} />}{view === "sandbox" && !activeSandbox && <SandboxMenu onOpen={openSandbox} />}{view === "sandbox" && activeSandbox && <SandboxView key={activeSandbox} sandboxId={activeSandbox} onBack={openSandboxMenu} onCopy={copyText} onComplete={complete} />}{view === "module" && <ModuleView key={activeModuleDefinition.id} module={activeModuleDefinition} completed={completed} moduleProgress={activeModuleProgress} outcome={activeOutcome} onBack={goHome} onCopy={copyText} onOpenSandbox={openSandbox} onComplete={complete} onSaveProduct={saveModuleAsset} onRecordEvent={recordEvent} />}{view === "dashboard" && <DashboardView userName={userName} userEmail={userEmail} trackingEnabled={trackingEnabled} storageMode={storageMode} completed={completed} moduleProgress={moduleProgress} attempts={attempts} outcomes={outcomes} workProducts={workProducts} isAdmin={isAdmin} onOpenModule={openModule} onOpenAdmin={openAdmin} onSaveOutcome={saveOutcome} />}{view === "admin" && <AdminDashboardView admin={admin} error={adminError} onBack={openDashboard} />}</div>;
}
