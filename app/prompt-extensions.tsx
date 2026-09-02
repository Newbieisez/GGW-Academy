"use client";

import { useEffect, useState } from "react";
import { Copy, Sparkles } from "lucide-react";

const ggwPrompts = [
  { title: "WildApricot renewal outreach", tool: "WildApricot + Gemini", summary: "Create segmented renewal messages from a member export.", prompt: "Using this approved renewal list, group members by renewal status and membership type. Draft one concise GGW renewal message for each group. Keep the tone warm, professional, and member-focused. Mention only benefits and dates provided in the source. Do not invent discounts, deadlines, or membership terms. Finish each draft with CHECK BEFORE SENDING: member name, membership type, renewal date, payment link, and contact information." },
  { title: "Event registration follow-up", tool: "WildApricot + Gmail", summary: "Draft a clear follow-up for attendees after an event.", prompt: "Draft a GGW follow-up email for attendees of [event name]. Use only these approved facts: [paste facts]. Include: 1) thank-you, 2) one key takeaway, 3) next action or resource, and 4) upcoming relevant GGW opportunity if provided. Keep it concise and human. Do not invent attendance numbers, quotes, links, or future commitments. End with CHECK BEFORE SENDING." },
  { title: "Member engagement summary", tool: "WildApricot + Sheets + Gemini", summary: "Turn an export into a short engagement brief.", prompt: "Review this WildApricot member/event export and create an internal GGW engagement brief. Return: total records reviewed, notable participation patterns, members or segments needing follow-up based only on the provided fields, data-quality issues, and 3 recommended next actions. Separate facts from recommendations. Do not infer personal characteristics that are not explicitly present in the data." },
  { title: "New member welcome draft", tool: "WildApricot + Zapier + Gemini", summary: "Create a reusable welcome-message step for an automation.", prompt: "Draft a personalized GGW welcome email using only these fields from WildApricot: first name, membership type, join date, and approved benefits. Keep it under 180 words. Make the member feel welcomed without sounding automated. Do not invent benefits, events, discounts, or contacts. Return subject line, email body, and CHECK BEFORE SENDING fields." },
  { title: "Automation design helper", tool: "WildApricot + Zapier / Make", summary: "Turn a repetitive process into a simple no-code workflow.", prompt: "Help me design a low-risk automation for this GGW process: [describe the repetitive task]. Return exactly: Trigger in WildApricot, fields required, connector to use (Zapier or Make), AI step if useful, Google Workspace action, human review gate, error handling, test plan, and what must never happen automatically. Prefer drafts and reversible actions before sends or record changes." },
  { title: "Event description from approved details", tool: "WildApricot + Gemini", summary: "Turn event notes into polished member-facing copy.", prompt: "Using only these approved event details, write a WildApricot event description for GGW. Structure it as: short hook, who it is for, what attendees will gain, date/time/location, what to expect, and clear registration CTA. Keep the voice confident, welcoming, inclusive, and practical. Do not invent speakers, sponsors, benefits, capacity, pricing, or logistics. Mark missing items as [CHECK]." },
];

export default function PromptExtensions() {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    setShow(/\/prompts$/i.test(path));
  }, []);

  if (!show) return null;
  const copy = async (title: string, value: string) => { await navigator.clipboard.writeText(value); setCopied(title); window.setTimeout(() => setCopied(""), 1400); };

  return <section className="ggw-prompt-extension">
    <div className="ggw-prompt-extension-head"><div><span>GGW + WILDAPRICOT</span><h2>Prompts for the work GGW actually does.</h2><p>Use these for membership, events, renewals, engagement, and automation design. Replace bracketed fields, then review before anything is sent or changed.</p></div><Sparkles size={28} /></div>
    <div className="ggw-prompt-extension-grid">{ggwPrompts.map((item) => <article key={item.title}><div className="ggw-prompt-tool">{item.tool}</div><h3>{item.title}</h3><p>{item.summary}</p><div className="ggw-prompt-copy"><span>{item.prompt}</span><button onClick={() => copy(item.title, item.prompt)}><Copy size={14} />{copied === item.title ? "Copied" : "Copy prompt"}</button></div></article>)}</div>
  </section>;
}
