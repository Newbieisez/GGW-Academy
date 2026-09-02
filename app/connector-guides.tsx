"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Link2, ShieldCheck, Sparkles, Wrench } from "lucide-react";

type Guide = {
  id: string;
  name: string;
  useFor: string;
  requires: string;
  connect: string[];
  test: string[];
  fallback: string[];
  note?: string;
};

const guides: Guide[] = [
  {
    id: "canva",
    name: "Canva",
    useFor: "GGW event graphics, social posts, flyers, reports, presentations, and reusable brand templates.",
    requires: "A Canva account. Brand Templates require a Canva plan with Brand Template access. Automated template autofill may require Canva Enterprise or an approved integration.",
    connect: [
      "Sign in to Canva with the GGW-approved Canva account or team.",
      "Confirm the correct GGW Brand Kit, fonts, colors, logos, and approved templates are available before creating anything.",
      "If using Canva through an AI assistant, open the assistant's app/connector settings, choose Canva, and follow the Canva authorization prompts.",
      "If GGW later enables a direct Workbench-to-Canva integration, use the Connect to Canva button and approve the requested Canva permissions. The site should never ask for a Canva password directly.",
      "For a reusable template workflow, start from an approved GGW Brand Template instead of generating a new visual from scratch.",
    ],
    test: [
      "Create one test design from a non-sensitive event example.",
      "Confirm the design opens in the correct GGW Canva team and remains editable.",
      "Check logo, colors, fonts, event facts, dates, links, and accessibility before reuse.",
    ],
    fallback: [
      "Open Canva manually in the browser and choose the approved GGW template.",
      "Copy the AI-prepared title, body copy, event facts, and visual brief from the Workbench into the template fields.",
      "Duplicate the approved design for each new event instead of editing the master template.",
      "Use Canva's built-in Resize/repurpose tools only if they are available on the team's Canva plan; otherwise duplicate and resize manually.",
    ],
    note: "Do not let an automation invent event details or overwrite the GGW master template. WildApricot remains the source for event facts.",
  },
  {
    id: "zapier",
    name: "Zapier",
    useFor: "Simple trigger → action workflows such as a new WildApricot registration creating or updating a Google Sheet row or preparing a Gmail draft.",
    requires: "A Zapier account plus permission to connect the GGW WildApricot and Google accounts used by the workflow.",
    connect: [
      "Sign in to Zapier and choose Create → Zap.",
      "Choose WildApricot as the trigger app and select the trigger that matches the workflow.",
      "When prompted, connect the approved WildApricot account and authorize access.",
      "Add the Google app needed for the action, such as Google Sheets or Gmail, and sign in with the approved GGW Google account.",
      "Map only the fields the workflow actually needs. Do not send full member records when a few fields will do.",
      "Keep external communication as a draft/review step during the pilot instead of auto-sending.",
    ],
    test: [
      "Test with a fictional or low-risk WildApricot record.",
      "Confirm the correct Google file/account is used.",
      "Test duplicate records, an update, and a cancellation/status change when applicable.",
      "Confirm someone knows how to turn the Zap off if it behaves incorrectly.",
    ],
    fallback: [
      "Export the required WildApricot records manually.",
      "Open the approved Google Sheet and paste/import only the required fields.",
      "Use the Workbench prompt to prepare the draft, grouping, or summary.",
      "Complete the final send/update manually after review.",
    ],
  },
  {
    id: "make",
    name: "Make",
    useFor: "Multi-step or branching workflows that move WildApricot data through several Google Workspace or content-preparation steps.",
    requires: "A Make account, an active WildApricot account, and access to the WildApricot Authorized Applications/API key area when the connection requires it.",
    connect: [
      "Sign in to Make and create a new Scenario.",
      "Add a WildApricot module and choose the trigger/action required for the workflow.",
      "Create the WildApricot connection. If Make asks for an API key, obtain it from the approved WildApricot Authorized Applications area rather than sharing a personal password.",
      "Add the Google modules required by the workflow and connect the approved GGW Google account.",
      "Add filters so only the intended records continue through each route.",
      "Add AI only where it transforms approved text/data into a summary, classification, or draft for review.",
    ],
    test: [
      "Run the Scenario once with low-risk test data before scheduling it.",
      "Inspect every module output and confirm field mapping.",
      "Test the branches/filters with both matching and non-matching records.",
      "Add an error route or alert so failed automations are visible.",
    ],
    fallback: [
      "Perform the handoffs manually in the same order shown in the Scenario.",
      "Use Google Sheets as the visible working layer so the team can inspect each step.",
      "Use the Workbench prompt for the AI transformation step.",
      "Keep a short checklist of the manual process until the connection is approved.",
    ],
  },
  {
    id: "wildapricot-google",
    name: "WildApricot + Google Workspace",
    useFor: "Moving approved member/event data into Sheets, creating reviewed communications, and keeping Drive/Docs as the working environment.",
    requires: "Access to the relevant WildApricot records and the approved GGW Google account/files.",
    connect: [
      "Confirm the WildApricot record or report is the correct source for the job.",
      "Export only the fields needed for the task, or use an approved connector if one has already been set up.",
      "Store the working copy in the correct GGW Google Drive folder with appropriate access.",
      "Use Sheets for working data, Docs/Gmail for reviewed communication, and Gemini only on the minimum information required.",
      "Do not paste sensitive member, payment, HR, legal, or donor details into an AI tool unless GGW has explicitly approved that use.",
    ],
    test: [
      "Compare several rows/records back to WildApricot.",
      "Confirm dates, amounts, statuses, links, and member identifiers match the source.",
      "Check that the Google file is shared only with the people who need it.",
    ],
    fallback: [
      "If no connector is approved, use WildApricot export → Google Sheets import as the standard manual handoff.",
      "Use the Workbench job aid and prompt from there.",
      "Apply final updates in WildApricot manually so the system of record remains controlled.",
    ],
  },
];

function GuideCard({ guide }: { guide: Guide }) {
  const [open, setOpen] = useState(false);
  return <article className={open ? "ggw-connector-guide open" : "ggw-connector-guide"}>
    <button className="ggw-connector-guide-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="ggw-connector-guide-icon"><Link2 size={18} /></span>
      <span><strong>{guide.name}</strong><small>{guide.useFor}</small></span>
      <ChevronDown size={18} />
    </button>
    {open && <div className="ggw-connector-guide-detail">
      <div className="ggw-connector-requires"><ShieldCheck size={17} /><div><strong>What you need</strong><span>{guide.requires}</span></div></div>
      <div className="ggw-connector-columns">
        <div><strong>Connect it</strong><ol>{guide.connect.map((step) => <li key={step}>{step}</li>)}</ol></div>
        <div><strong>Test it</strong><ol>{guide.test.map((step) => <li key={step}>{step}</li>)}</ol></div>
      </div>
      <div className="ggw-manual-fallback"><Wrench size={17} /><div><strong>If you cannot connect it</strong><ol>{guide.fallback.map((step) => <li key={step}>{step}</li>)}</ol></div></div>
      {guide.note && <div className="ggw-connector-note"><Sparkles size={16} /><span>{guide.note}</span></div>}
    </div>}
  </article>;
}

export default function ConnectorGuides() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const sync = () => setShow(document.body.dataset.ggwWorkbenchView === "home");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-ggw-workbench-view"] });
    return () => observer.disconnect();
  }, []);

  if (!show) return null;
  return <section className="ggw-connectors-helper" id="ggw-connectors-helper">
    <div className="ggw-connectors-helper-head">
      <div><span>CONNECT THE TOOLS</span><h2>Need a connector? Here is exactly how to set it up.</h2><p>If a workflow needs Canva, Zapier, Make, or a WildApricot-to-Google handoff, open the guide. If you do not have permission to connect it, use the manual fallback and ask the GGW tool owner/admin for access.</p></div>
    </div>
    <div className="ggw-connector-guide-list">{guides.map((guide) => <GuideCard key={guide.id} guide={guide} />)}</div>
  </section>;
}
