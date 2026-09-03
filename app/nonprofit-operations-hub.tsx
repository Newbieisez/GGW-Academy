"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BadgeDollarSign, BriefcaseBusiness, Building2, HandHeart, Landmark, Scale, ShieldCheck, TrendingUp } from "lucide-react";

const areas = [
  {
    title: "Board & governance",
    description: "Prepare agendas, board packets, draft minutes, dashboards, policy reviews, and decision-ready materials.",
    icon: Landmark,
    query: "board governance",
    examples: "Agenda · minutes · board packet · dashboard · conflict process",
  },
  {
    title: "Grants & funders",
    description: "Assess opportunities, prepare source-grounded applications, track restrictions, and organize grant reporting evidence.",
    icon: HandHeart,
    query: "grant",
    examples: "Grant scorecard · application · restricted funds · grant report",
  },
  {
    title: "Fundraising & sponsorship",
    description: "Build fundraising plans, sponsor pipelines, sponsorship inventory, donor acknowledgments, and stewardship workflows.",
    icon: TrendingUp,
    query: "fundraising sponsorship",
    examples: "Fundraising plan · sponsor pipeline · sponsor package · donor acknowledgment",
  },
  {
    title: "Finance & controls",
    description: "Create cash-flow working aids, budget variance reviews, expense checks, and documented financial approval controls.",
    icon: BadgeDollarSign,
    query: "finance cash flow budget controls",
    examples: "Cash flow · budget vs actual · expense review · financial controls",
  },
  {
    title: "Compliance & records",
    description: "Organize confirmed obligations and source checks without pretending AI is the legal, tax, or regulatory authority.",
    icon: ShieldCheck,
    query: "compliance",
    examples: "Compliance calendar · 990 prep · state tracker · records retention · access review",
  },
  {
    title: "Programs & impact",
    description: "Turn mission needs into executable programs, measurement plans, feedback loops, and evidence-based reporting.",
    icon: Building2,
    query: "program measurement impact",
    examples: "Program plan · measurement plan · survey synthesis · reporting",
  },
  {
    title: "Volunteer operations",
    description: "Create consistent intake, onboarding, assignment, communication, access, recognition, and offboarding workflows.",
    icon: BriefcaseBusiness,
    query: "volunteer operations",
    examples: "Volunteer workflow · outreach · onboarding · access removal",
  },
  {
    title: "Scale the operation",
    description: "Convert recurring work into SOPs, quarterly priorities, operating plans, risk registers, and safe automations.",
    icon: Scale,
    query: "operations SOP automation risk",
    examples: "Annual plan · quarterly plan · SOP · risk register · automation decision",
  },
];

export default function NonprofitOperationsHub() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const sync = () => setShow(document.body.dataset.ggwWorkbenchView === "home");
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-ggw-workbench-view"] });
    return () => observer.disconnect();
  }, []);

  if (!show) return null;

  return (
    <section className="ggw-nonprofit-hub" id="nonprofit-operations">
      <div className="ggw-nonprofit-head">
        <div>
          <span><HandHeart size={15} /> RUN &amp; GROW GGW</span>
          <h2>AI support for the nonprofit work behind the mission.</h2>
          <p>The Workbench goes beyond email and events. Use it to organize operations, grow revenue responsibly, support the board, manage programs, and keep compliance-sensitive work tied to authoritative sources and human review.</p>
        </div>
        <a href="/prompts">Browse GGW prompts <ArrowRight size={14} /></a>
      </div>
      <div className="ggw-nonprofit-grid">
        {areas.map((area) => {
          const Icon = area.icon;
          return <article key={area.title}>
            <div className="ggw-nonprofit-icon"><Icon size={19} /></div>
            <h3>{area.title}</h3>
            <p>{area.description}</p>
            <small>{area.examples}</small>
            <a href={`/prompts?q=${encodeURIComponent(area.query)}`}>Find help <ArrowRight size={13} /></a>
          </article>;
        })}
      </div>
      <div className="ggw-nonprofit-guardrail"><ShieldCheck size={18} /><div><strong>Compliance rule</strong><span>The portal can organize sources, build checklists, surface gaps, and prepare questions. It does not decide legal, tax, accounting, employment, or regulatory requirements. Use current authoritative sources and qualified professional review when required.</span></div></div>
    </section>
  );
}
