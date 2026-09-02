"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bot, CalendarDays, FileText, Mail, Sparkles, Users, Workflow, Zap } from "lucide-react";

const jobs = [
  { icon: Users, title: "Work with members", text: "Draft member messages, clean exports, summarize member trends, and prepare renewal outreach.", href: "?module=data", tag: "WildApricot + Sheets" },
  { icon: CalendarDays, title: "Run an event", text: "Create event copy, confirmation messages, follow-ups, attendee summaries, and repeatable registration workflows.", href: "?module=daily", tag: "WildApricot + Gmail + Docs" },
  { icon: Mail, title: "Write or improve a message", text: "Turn notes, threads, or rough ideas into a polished GGW email without losing the human voice.", href: "prompts/", tag: "Gmail + Gemini" },
  { icon: FileText, title: "Analyze information", text: "Turn exports, spreadsheets, survey responses, or source documents into decisions and next steps.", href: "?module=data", tag: "Sheets + NotebookLM" },
  { icon: Sparkles, title: "Create content", text: "Build event promotions, board summaries, social copy, slide concepts, images, or short video storyboards.", href: "?module=visuals", tag: "Docs + Slides + Vids" },
  { icon: Workflow, title: "Automate repetitive work", text: "Connect WildApricot and Google tools so routine member, event, and communications tasks happen with less manual effort.", href: "?module=automation", tag: "WildApricot + Zapier / Make" },
];

const automations = [
  { title: "New member → personalized welcome draft", stack: "WildApricot → Zapier → Gemini → Gmail", why: "Stops welcome emails from being rewritten from scratch while keeping a person in control of the final send.", steps: ["Trigger when a new WildApricot contact/member is created.", "Send only the fields needed for the message to the approved AI step.", "Ask AI to draft a GGW welcome message using the member type and approved benefits.", "Create a Gmail draft for review instead of auto-sending."] },
  { title: "Event registration → prep + follow-up workflow", stack: "WildApricot → Zapier / Make → Google Sheets + Gmail", why: "Removes manual copying between registration lists, trackers, and follow-up messages.", steps: ["Trigger from a new WildApricot event registration.", "Add/update the attendee in the approved event Sheet.", "Prepare the appropriate confirmation or internal task.", "After the event, use the attendee list to draft segmented follow-up messages."] },
  { title: "Renewal list → AI-assisted outreach", stack: "WildApricot export → Sheets → Gemini → Gmail", why: "Turns a membership list into focused outreach without asking staff to manually write each message.", steps: ["Export only the renewal fields required for the task.", "Use Sheets to group members by renewal status or membership type.", "Ask AI to draft message variants for each group using approved GGW language.", "Review, personalize where needed, and send through the approved channel."] },
  { title: "Weekly member & event brief", stack: "WildApricot → Make / API → Sheets → Gemini", why: "Gives staff a short operational snapshot instead of repeatedly checking multiple screens.", steps: ["Pull only the agreed member/event metrics on a schedule.", "Write the values to a simple reporting Sheet.", "Ask AI to summarize changes, exceptions, and follow-up items.", "Route the brief internally; do not expose raw member data in the summary."] },
];

export default function JobAidHome() {
  const [isHome, setIsHome] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const path = window.location.pathname.replace(/\/+$/, "");
    const home = path === "" || path === "/" || /\/GGW-Academy$/i.test(path);
    setIsHome(home);
    document.body.classList.toggle("ggw-job-aid-home", home);
    return () => document.body.classList.remove("ggw-job-aid-home");
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return jobs;
    return jobs.filter((job) => `${job.title} ${job.text} ${job.tag}`.toLowerCase().includes(value));
  }, [query]);

  if (!isHome) return null;

  return <main className="job-aid-shell">
    <section className="job-aid-hero">
      <div className="job-aid-kicker">GGW AI WORKBENCH</div>
      <h1>What are you trying to get done?</h1>
      <p>Skip the course. Pick the job in front of you and get the fastest useful AI workflow, prompt, or automation for it.</p>
      <div className="job-aid-search"><Sparkles size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try: renewals, event follow-up, member email, report, automate..." aria-label="Search GGW AI job aids" /></div>
      <div className="job-aid-hero-actions"><a className="job-aid-primary" href="prompts/">Open the prompt library <ArrowRight size={16} /></a><a className="job-aid-secondary" href="#automations">Show me automations <Zap size={16} /></a></div>
    </section>

    <section className="job-aid-section">
      <div className="job-aid-heading"><span>START WITH THE WORK</span><h2>Help me…</h2></div>
      <div className="job-aid-grid">{filtered.map((job) => { const Icon = job.icon; return <a className="job-aid-card" href={job.href} key={job.title}><div className="job-aid-icon"><Icon size={23} /></div><div className="job-aid-tag">{job.tag}</div><h3>{job.title}</h3><p>{job.text}</p><span className="job-aid-link">Show me how <ArrowRight size={15} /></span></a>; })}</div>
    </section>

    <section className="job-aid-section job-aid-wild" id="automations">
      <div className="job-aid-heading"><span>WILDAPRICOT + AI</span><h2>Automate the repetitive parts.</h2><p>WildApricot stays the system of record. AI and connectors help move information, prepare drafts, summarize activity, and reduce repetitive clicks.</p></div>
      <div className="connector-explainer"><div><Zap size={22} /><strong>What is a connector?</strong></div><p><b>Zapier</b> and <b>Make</b> connect apps without requiring staff to write software. A connector watches for a trigger in one tool—such as a new WildApricot member or event registration—and then performs approved steps in another tool. Use them when the same handoff happens repeatedly.</p></div>
      <div className="automation-grid">{automations.map((item) => <article className="automation-card" key={item.title}><div className="automation-stack"><Bot size={17} />{item.stack}</div><h3>{item.title}</h3><p>{item.why}</p><ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="automation-check"><strong>Before turning it on:</strong> test with fictional or low-risk data, use the minimum fields required, keep outbound messages in draft/review mode first, and confirm who owns errors.</div></article>)}</div>
    </section>

    <section className="job-aid-footer-cta"><div><span>NEED A WORDING STARTER?</span><h2>Use the prompt library like a toolbox.</h2><p>Copy a proven GGW prompt, replace the brackets, review the result, and get back to work.</p></div><a className="job-aid-primary" href="prompts/">Find a prompt <ArrowRight size={16} /></a></section>
  </main>;
}
