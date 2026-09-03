"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Status = "pending" | "ready" | "review" | "missing_info" | "excluded" | "error";
type RecordItem = { id: string; name: string; email: string; organization: string; event: string; status: Status; issueReasons: string[]; subject?: string; body?: string; unsupported?: Array<{ text: string; reason: string }> };

const recipientOptions = ["Sponsor / Donor", "Event Attendee", "New Member", "Renewing Member"] as const;
type Recipient = (typeof recipientOptions)[number];
const goals: Record<Recipient, string[]> = {
  "Sponsor / Donor": ["Thank them", "Follow up after a meeting", "Sponsorship opportunity", "Request next steps", "Send requested information", "Reconnect with an existing sponsor"],
  "Event Attendee": ["Registration confirmation", "Event reminder", "Thank you for attending", "Post-event resources", "Feedback request", "Invite to another event"],
  "New Member": ["Welcome message", "Getting-started instructions", "Introduce benefits/resources", "Invite to upcoming event", "Introduce volunteer opportunities"],
  "Renewing Member": ["Friendly renewal reminder", "Renewal approaching", "Membership expired", "Re-engagement message", "Thank them for renewing"],
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) { const c = text[i], n = text[i + 1]; if (quoted) { if (c === '"' && n === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; } else if (c === '"') quoted = true; else if (c === ',') { row.push(field.trim()); field = ""; } else if (c === '\r' || c === '\n') { if (c === '\r' && n === '\n') i++; row.push(field.trim()); if (row.some(Boolean)) rows.push(row); row = []; field = ""; } else field += c; }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row); return rows;
}
function validEmail(value: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value); }
function esc(value: string) { return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value; }

export default function BatchOutreachPage() {
  const [raw, setRaw] = useState(""); const [headers, setHeaders] = useState<string[]>([]); const [rows, setRows] = useState<string[][]>([]);
  const [nameCol, setNameCol] = useState(""); const [emailCol, setEmailCol] = useState(""); const [orgCol, setOrgCol] = useState(""); const [eventCol, setEventCol] = useState("");
  const [recipient, setRecipient] = useState<Recipient>("Event Attendee"); const [goal, setGoal] = useState(goals["Event Attendee"][0]); const [tone, setTone] = useState("Warm & Professional"); const [keepBrief, setKeepBrief] = useState(false);
  const [records, setRecords] = useState<RecordItem[]>([]); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(""); const [error, setError] = useState(""); const [filter, setFilter] = useState<"all" | Status>("all");

  function importData() {
    const parsed = parseCsv(raw.replace(/^\uFEFF/, "")); if (parsed.length < 2) { setError("Add a header row and at least one data row."); return; }
    const h = parsed[0]; setHeaders(h); setRows(parsed.slice(1)); setNameCol(h.find(v => /name/i.test(v)) || h[0] || ""); setEmailCol(h.find(v => /email/i.test(v)) || h[1] || ""); setOrgCol(h.find(v => /company|org|sponsor|donor/i.test(v)) || ""); setEventCol(h.find(v => /event|summit|session/i.test(v)) || ""); setRecords([]); setError("");
  }

  async function api(payload: Record<string, unknown>) { const res = await fetch("/api/outreach", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = await res.json(); if (!res.ok) throw new Error(data.error || "Request failed"); return data; }

  async function runBatch() {
    if (!headers.length || !rows.length) return; if (rows.length > 250) { setError("Batch v1 is limited to 250 records. Split the file and try again."); return; }
    setBusy(true); setError(""); setProgress("Running preflight checks...");
    const ni = headers.indexOf(nameCol), ei = headers.indexOf(emailCol), oi = headers.indexOf(orgCol), vi = headers.indexOf(eventCol);
    const freq = new Map<string, number>(); rows.forEach(r => { const e = ei >= 0 ? (r[ei] || "").trim().toLowerCase() : ""; if (e) freq.set(e, (freq.get(e) || 0) + 1); });
    let base: RecordItem[] = rows.map((r, i) => { const name = ni >= 0 ? (r[ni] || "").trim() : "", email = ei >= 0 ? (r[ei] || "").trim() : "", organization = oi >= 0 ? (r[oi] || "").trim() : "", event = vi >= 0 ? (r[vi] || "").trim() : ""; const reasons: string[] = []; let status: Status = "pending"; if (!name || !email) { status = "missing_info"; if (!name) reasons.push("Missing recipient name"); if (!email) reasons.push("Missing email address"); } else if (!validEmail(email)) { status = "review"; reasons.push("Email address format needs review"); } else if ((freq.get(email.toLowerCase()) || 0) > 1) { status = "review"; reasons.push("Duplicate email address in this batch"); } return { id: `${i}-${Date.now()}`, name, email, organization, event, status, issueReasons: reasons }; });
    setRecords(base);
    const eligible = base.filter(r => r.status === "pending");
    for (let i = 0; i < eligible.length; i += 5) {
      const chunk = eligible.slice(i, i + 5); setProgress(`Generating ${Math.min(i + chunk.length, eligible.length)} of ${eligible.length} eligible drafts...`);
      const updates = await Promise.all(chunk.map(async r => { try { const facts = { recipientName: r.name, recipientEmail: r.email, organization: r.organization, event: r.event, interest: "", nextStep: "" }; const gen = await api({ mode: "generate", recipient, goal, tone, keepBrief, confirmedFacts: facts }); const val = await api({ mode: "validate", recipient, goal, draftSubject: gen.subject, draftBody: gen.body, confirmedFacts: facts }); return { ...r, subject: gen.subject, body: gen.body, status: val.safe ? "ready" as Status : "review" as Status, issueReasons: val.safe ? [] : ["AI validation found details that need review"], unsupported: val.unsupportedClaims || [] }; } catch (e) { return { ...r, status: "error" as Status, issueReasons: [e instanceof Error ? e.message : "Draft generation failed"] }; } }));
      base = base.map(r => updates.find(u => u.id === r.id) || r); setRecords(base);
    }
    setProgress(""); setBusy(false);
  }

  function exclude(id: string) { setRecords(records.map(r => r.id === id ? { ...r, status: "excluded", issueReasons: ["Explicitly excluded by staff"] } : r)); }
  function retry(id: string) { const r = records.find(x => x.id === id); if (!r) return; if (!r.name || !r.email || !validEmail(r.email)) return; setRecords(records.map(x => x.id === id ? { ...x, status: "pending", issueReasons: [] } : x)); }

  const metrics = useMemo(() => ({ total: records.length, ready: records.filter(r => r.status === "ready").length, review: records.filter(r => r.status === "review" || r.status === "error").length, missing: records.filter(r => r.status === "missing_info").length, excluded: records.filter(r => r.status === "excluded").length }), [records]);
  const shown = records.filter(r => filter === "all" || r.status === filter || (filter === "review" && r.status === "error"));
  const unresolved = records.some(r => ["pending", "review", "missing_info", "error"].includes(r.status));

  function exportCsv() { if (unresolved) return; const lines = [["Name","Email","Organization","Event","Status","Subject","Draft Body","Validation Status","Review Notes"].join(","), ...records.map(r => [r.name,r.email,r.organization,r.event,r.status,r.subject || "",r.body || "",r.status === "ready" ? "Validated" : "Excluded",r.issueReasons.join("; ")].map(esc).join(","))]; const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "ggw-batch-outreach.csv"; a.click(); URL.revokeObjectURL(url); }

  return <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link className="text-sm underline" href="/workbench">← All workbenches</Link><h1 className="mt-2 text-3xl font-bold">Contact a Group</h1><p className="text-muted-foreground">Turn a CSV into reviewed outreach drafts with preflight checks and an exception queue.</p></div><Badge variant="outline">0 automatic sends</Badge></div>

    <Card><CardHeader><CardTitle>1. Import a CSV or spreadsheet export</CardTitle></CardHeader><CardContent className="space-y-3"><textarea className="min-h-44 w-full rounded-md border bg-background p-3 font-mono text-sm" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="Name,Email,Organization,Event\nJane Doe,jane@example.org,Example Sponsor,Leadership Summit"/><Button disabled={!raw.trim()} onClick={importData}>Parse data</Button></CardContent></Card>

    {headers.length > 0 && <Card><CardHeader><CardTitle>2. Map columns and choose communication settings</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[["Name",nameCol,setNameCol],["Email",emailCol,setEmailCol],["Organization",orgCol,setOrgCol],["Event",eventCol,setEventCol]] .map(([label,value,setter]) => <label key={label as string} className="text-sm">{label as string}<select className="mt-1 w-full rounded-md border bg-background p-2" value={value as string} onChange={(e) => (setter as (v:string)=>void)(e.target.value)}><option value="">Not mapped</option>{headers.map(h => <option key={h}>{h}</option>)}</select></label>)}<label className="text-sm">Audience<select className="mt-1 w-full rounded-md border bg-background p-2" value={recipient} onChange={(e) => { const r = e.target.value as Recipient; setRecipient(r); setGoal(goals[r][0]); }}>{recipientOptions.map(r => <option key={r}>{r}</option>)}</select></label><label className="text-sm">Goal<select className="mt-1 w-full rounded-md border bg-background p-2" value={goal} onChange={(e) => setGoal(e.target.value)}>{goals[recipient].map(g => <option key={g}>{g}</option>)}</select></label><label className="text-sm">Tone<select className="mt-1 w-full rounded-md border bg-background p-2" value={tone} onChange={(e) => setTone(e.target.value)}><option>Warm & Professional</option><option>Friendly & Conversational</option><option>Concise & Direct</option><option>Formal</option></select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={keepBrief} onChange={(e) => setKeepBrief(e.target.checked)}/> Keep it brief</label><div className="md:col-span-2 lg:col-span-4"><Button disabled={busy || !emailCol || !nameCol} onClick={runBatch}>{busy ? progress || "Working..." : `Run preflight + create drafts (${rows.length} rows)`}</Button></div></CardContent></Card>}

    {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

    {records.length > 0 && <><div className="grid grid-cols-2 gap-3 md:grid-cols-5">{Object.entries(metrics).map(([k,v]) => <Card key={k}><CardContent className="pt-6"><div className="text-2xl font-bold">{v}</div><div className="text-xs capitalize text-muted-foreground">{k}</div></CardContent></Card>)}</div><Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>3. Exception queue & drafts</CardTitle><div className="flex flex-wrap gap-1">{(["all","ready","review","missing_info","excluded"] as const).map(f => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f.replace("_"," ")}</Button>)}</div></div></CardHeader><CardContent className="space-y-3">{shown.map(r => <div key={r.id} className="rounded-md border p-3 text-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{r.name || "Missing name"}</strong><div className="text-muted-foreground">{r.email || "Missing email"}{r.organization ? ` · ${r.organization}` : ""}</div></div><Badge variant={r.status === "ready" ? "secondary" : r.status === "excluded" ? "outline" : "destructive"}>{r.status}</Badge></div>{r.issueReasons.length > 0 && <ul className="mt-2 list-disc pl-5 text-amber-800">{r.issueReasons.map(x => <li key={x}>{x}</li>)}</ul>}{r.subject && <div className="mt-3 rounded-md bg-muted/30 p-3"><strong>Subject:</strong> {r.subject}<div className="mt-2 whitespace-pre-wrap">{r.body}</div></div>}{r.unsupported && r.unsupported.length > 0 && <ul className="mt-2 list-disc pl-5 text-red-700">{r.unsupported.map((u,i) => <li key={i}>{u.text}: {u.reason}</li>)}</ul>}<div className="mt-3 flex gap-2">{r.status !== "ready" && r.status !== "excluded" && <Button size="sm" variant="outline" onClick={() => retry(r.id)}>Mark fixed for rerun</Button>}{r.status !== "excluded" && <Button size="sm" variant="ghost" onClick={() => exclude(r.id)}>Exclude record</Button>}</div></div>)}</CardContent></Card><Card><CardHeader><CardTitle>4. Export reviewed batch</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Resolve or explicitly exclude every exception before export. This workbench never sends email.</p><Button disabled={unresolved} onClick={exportCsv}>Export batch package CSV</Button>{unresolved && <p className="text-xs text-amber-700">Export is locked until all review, missing-info, pending, and error records are resolved or excluded.</p>}<div className="rounded-md border bg-muted/30 p-3 text-xs"><strong>What happened?</strong> Automation handled predictable validation and duplicate checks; AI drafted only eligible records; human review controls every exception and final use.</div></CardContent></Card></>}
  </main>;
}
