"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

const recipients = ["Sponsor / Donor", "Event Attendee", "New Member", "Renewing Member"] as const;
type Recipient = (typeof recipients)[number];
const goals: Record<Recipient, string[]> = {
  "Sponsor / Donor": ["Thank them", "Follow up after a meeting", "Sponsorship opportunity", "Request next steps", "Send requested information", "Reconnect with an existing sponsor"],
  "Event Attendee": ["Registration confirmation", "Event reminder", "Thank you for attending", "Post-event resources", "Feedback request", "Invite to another event"],
  "New Member": ["Welcome message", "Getting-started instructions", "Introduce benefits/resources", "Invite to upcoming event", "Introduce volunteer opportunities"],
  "Renewing Member": ["Friendly renewal reminder", "Renewal approaching", "Membership expired", "Re-engagement message", "Thank them for renewing"],
};
const tones = ["Warm & Professional", "Friendly & Conversational", "Concise & Direct", "Formal"] as const;
type Facts = { recipientName: string; recipientEmail: string; organization: string; event: string; interest: string; nextStep: string };
const emptyFacts: Facts = { recipientName: "", recipientEmail: "", organization: "", event: "", interest: "", nextStep: "" };
type Validation = { safe: boolean; unsupportedClaims: Array<{ text: string; reason: string }>; verifiedFacts: string[] };

export default function OutreachPage() {
  const [recipient, setRecipient] = useState<Recipient>("Sponsor / Donor");
  const [goal, setGoal] = useState(goals["Sponsor / Donor"][0]);
  const [tone, setTone] = useState<(typeof tones)[number]>("Warm & Professional");
  const [keepBrief, setKeepBrief] = useState(false);
  const [notes, setNotes] = useState("");
  const [facts, setFacts] = useState<Facts>(emptyFacts);
  const [uncertainties, setUncertainties] = useState<string[]>([]);
  const [draft, setDraft] = useState<{ subject: string; body: string } | null>(null);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  async function call(payload: Record<string, unknown>) {
    const res = await fetch("/api/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  async function extractFacts(): Promise<Facts> {
    if (!notes.trim()) return facts;
    const data = await call({ mode: "extract", contextInput: notes });
    const next = {
      recipientName: data.recipientName || facts.recipientName,
      recipientEmail: data.recipientEmail || facts.recipientEmail,
      organization: data.organization || facts.organization,
      event: data.event || facts.event,
      interest: data.interest || facts.interest,
      nextStep: data.nextStep || facts.nextStep,
    };
    setFacts(next);
    setUncertainties(Array.isArray(data.uncertainties) ? data.uncertainties : []);
    return next;
  }

  async function generate(styleTone = tone, brief = keepBrief) {
    setBusy(true); setError(""); setValidation(null);
    try {
      const confirmed = notes.trim() ? await extractFacts() : facts;
      if (!Object.values(confirmed).some(Boolean) && !notes.trim()) throw new Error("Add message details or notes first.");
      const generated = await call({ mode: "generate", recipient, goal, tone: styleTone, keepBrief: brief, confirmedFacts: confirmed, contextInput: notes });
      const checked = await call({ mode: "validate", recipient, goal, draftSubject: generated.subject, draftBody: generated.body, confirmedFacts: confirmed });
      setDraft({ subject: generated.subject, body: generated.body });
      setValidation(checked);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not generate the draft."); }
    finally { setBusy(false); }
  }

  async function copy(text: string, label: string) { await navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); }
  function reset() { setNotes(""); setFacts(emptyFacts); setUncertainties([]); setDraft(null); setValidation(null); setError(""); }
  const factFields: Array<[keyof Facts, string]> = [["recipientName","Recipient name"],["recipientEmail","Recipient email"],["organization","Organization"],["event","Event"],["interest","Interest / context"],["nextStep","Requested next step"]];

  return <main className="ops-page mx-auto max-w-5xl px-4 py-10 space-y-6">
    <section className="ops-hero"><Link className="text-sm underline" href="/workbench">← All workbenches</Link><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Write One Message</h1><p>Enter what you know, then generate a reviewed GGW email.</p></div><Badge variant="outline">Nothing is sent automatically</Badge></div></section>
    <Card className="ops-card-purple"><CardHeader><CardTitle>1. Choose the audience and goal</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-3">
      <label className="text-sm">Audience<select className="mt-1 w-full rounded-md border bg-background p-2" value={recipient} onChange={(e)=>{const r=e.target.value as Recipient;setRecipient(r);setGoal(goals[r][0]);}}>{recipients.map(r=><option key={r}>{r}</option>)}</select></label>
      <label className="text-sm">Goal<select className="mt-1 w-full rounded-md border bg-background p-2" value={goal} onChange={(e)=>setGoal(e.target.value)}>{goals[recipient].map(g=><option key={g}>{g}</option>)}</select></label>
      <label className="text-sm">Tone<select className="mt-1 w-full rounded-md border bg-background p-2" value={tone} onChange={(e)=>setTone(e.target.value as (typeof tones)[number])}>{tones.map(t=><option key={t}>{t}</option>)}</select></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepBrief} onChange={(e)=>setKeepBrief(e.target.checked)}/> Keep it brief</label>
    </CardContent></Card>
    <Card className="ops-card-blue"><CardHeader><CardTitle>2. Add message details</CardTitle></CardHeader><CardContent className="space-y-4"><textarea className="min-h-40 w-full rounded-md border bg-background p-3" value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Paste notes, an email thread summary, or rough bullet points..." maxLength={10000}/><div className="grid gap-3 md:grid-cols-2">{factFields.map(([key,label])=><label key={key} className="text-sm">{label}<input className="mt-1 w-full rounded-md border bg-background p-2" value={facts[key]} onChange={(e)=>setFacts({...facts,[key]:e.target.value})}/></label>)}</div>{uncertainties.length>0&&<div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><strong>Needs review:</strong><ul className="mt-1 list-disc pl-5">{uncertainties.map(u=><li key={u}>{u}</li>)}</ul></div>}<Button size="lg" className="w-full md:w-auto" disabled={busy || (!notes.trim() && !Object.values(facts).some(Boolean))} onClick={()=>generate()}><Sparkles className="mr-2 h-5 w-5"/>{busy?"Generating & validating...":"Generate Message"}</Button></CardContent></Card>
    {error&&<div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
    {draft&&<Card className="ops-card-green"><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle>3. Review your draft</CardTitle><Badge variant={validation?.safe?"secondary":"destructive"}>{validation?.safe?"Validation passed":"Review recommended"}</Badge></div></CardHeader><CardContent className="space-y-4"><div><div className="mb-1 flex justify-between text-xs font-semibold"><span>SUBJECT</span><button className="underline" onClick={()=>copy(draft.subject,"Subject copied")}>Copy subject</button></div><div className="rounded-md border bg-background p-3">{draft.subject}</div></div><div><div className="mb-1 flex justify-between text-xs font-semibold"><span>MESSAGE</span><button className="underline" onClick={()=>copy(draft.body,"Email copied")}>Copy email</button></div><div className="whitespace-pre-wrap rounded-md border bg-background p-4 text-sm leading-6">{draft.body}</div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>generate("Concise & Direct",true)}>Make shorter</Button><Button variant="outline" onClick={()=>generate("Friendly & Conversational",keepBrief)}>Make warmer</Button><Button variant="outline" onClick={()=>generate("Formal",keepBrief)}>Make formal</Button><Button variant="ghost" onClick={reset}>Start another</Button></div>{copied&&<p className="text-sm font-medium">{copied}</p>}</CardContent></Card>}
  </main>;
}
