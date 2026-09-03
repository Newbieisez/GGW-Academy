"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ActionItem = { id: string; task: string; owner: string; dueDate: string; priority: "High" | "Medium" | "Low" | "Unassigned" };
type Plan = { title: string; date: string; decisions: string[]; actionItems: ActionItem[]; openQuestions: string[]; followUps: string[]; risks: string[] };
const emptyPlan: Plan = { title: "", date: "", decisions: [], actionItems: [], openQuestions: [], followUps: [], risks: [] };

export default function ActionsPage() {
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<Plan>(emptyPlan);
  const [stage, setStage] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function extract() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/actions/extract", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawNotes: notes }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not extract meeting actions.");
      setPlan({
        title: data.meetingTitle || "", date: data.meetingDate || "", decisions: data.decisions || [], openQuestions: data.openQuestions || [], followUps: data.followUps || [], risks: data.risks || [],
        actionItems: (data.actionItems || []).map((item: { task: string; owner?: string | null; dueDate?: string | null }, index: number) => ({ id: `action-${index}-${Date.now()}`, task: item.task, owner: item.owner || "", dueDate: item.dueDate || "", priority: "Unassigned" })),
      });
      setStage(2);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not extract meeting actions."); }
    finally { setBusy(false); }
  }

  function dateStatus(date: string) {
    if (!date) return "Needs assignment";
    const parts = date.split("-").map(Number);
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) return date;
    const due = new Date(parts[0], parts[1] - 1, parts[2]); due.setHours(0,0,0,0);
    const today = new Date(); today.setHours(0,0,0,0);
    const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
    if (days < 0) return `Overdue by ${Math.abs(days)}d`;
    if (days === 0) return "Due today";
    if (days <= 3) return `Due in ${days}d`;
    return date;
  }

  function updateAction(id: string, field: keyof ActionItem, value: string) { setPlan({ ...plan, actionItems: plan.actionItems.map(a => a.id === id ? { ...a, [field]: value } : a) }); }
  function addAction() { setPlan({ ...plan, actionItems: [...plan.actionItems, { id: `action-${Date.now()}`, task: "", owner: "", dueDate: "", priority: "Unassigned" }] }); }
  function updateList(key: "decisions" | "openQuestions" | "followUps" | "risks", index: number, value: string) { const next = [...plan[key]]; next[index] = value; setPlan({ ...plan, [key]: next }); }
  function addList(key: "decisions" | "openQuestions" | "followUps" | "risks") { setPlan({ ...plan, [key]: [...plan[key], ""] }); }
  function removeList(key: "decisions" | "openQuestions" | "followUps" | "risks", index: number) { setPlan({ ...plan, [key]: plan[key].filter((_, i) => i !== index) }); }

  async function copySummary() {
    const text = `Meeting: ${plan.title || "Untitled Meeting"}\nDate: ${plan.date || "Unspecified"}\n\nDecisions:\n${plan.decisions.filter(Boolean).map(v => `• ${v}`).join("\n")}\n\nAction Items:\n${plan.actionItems.filter(a => a.task.trim()).map(a => `• [${a.owner || "Unassigned"}] ${a.task} — Due: ${a.dueDate || "None"} — Priority: ${a.priority}`).join("\n")}\n\nFollow-ups:\n${plan.followUps.filter(Boolean).map(v => `• ${v}`).join("\n")}\n\nRisks / Blockers:\n${plan.risks.filter(Boolean).map(v => `• ${v}`).join("\n")}\n\nOpen Questions:\n${plan.openQuestions.filter(Boolean).map(v => `• ${v}`).join("\n")}`;
    await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function exportCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = ["Task,Owner,Due Date,Priority,Status", ...plan.actionItems.filter(a => a.task.trim()).map(a => [a.task, a.owner || "Unassigned", a.dueDate, a.priority, dateStatus(a.dueDate)].map(esc).join(","))];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "ggw-action-plan.csv"; a.click(); URL.revokeObjectURL(url);
  }

  function reset() { setNotes(""); setPlan(emptyPlan); setStage(1); setError(""); }

  const listSection = (key: "decisions" | "openQuestions" | "followUps" | "risks", title: string) => <div className="space-y-2"><div className="flex items-center justify-between"><strong className="text-sm">{title}</strong><Button size="sm" variant="outline" onClick={() => addList(key)}>+ Add</Button></div>{plan[key].map((value, index) => <div key={`${key}-${index}`} className="flex gap-2"><input className="w-full rounded-md border bg-background p-2 text-sm" value={value} onChange={(e) => updateList(key, index, e.target.value)} /><Button size="sm" variant="ghost" onClick={() => removeList(key, index)}>✕</Button></div>)}</div>;

  return <main className="mx-auto max-w-6xl px-4 py-10 space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><Link className="text-sm underline" href="/workbench">← All workbenches</Link><h1 className="mt-2 text-3xl font-bold">Meeting → Action Plan</h1><p className="text-muted-foreground">Turn meeting notes into confirmed decisions and accountable next steps.</p></div><Badge variant="outline">Nothing is assigned or sent automatically</Badge></div>

    {stage === 1 && <Card><CardHeader><CardTitle>1. Paste meeting notes or a transcript</CardTitle></CardHeader><CardContent className="space-y-3"><textarea className="min-h-64 w-full rounded-md border bg-background p-3" maxLength={15000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste board meeting notes, sponsor debrief notes, event planning notes, or a transcript..."/><div className="flex justify-between text-xs text-muted-foreground"><span>AI extracts only what is explicitly supported by the notes.</span><span>{notes.length.toLocaleString()} / 15,000</span></div><Button disabled={!notes.trim() || busy} onClick={extract}>{busy ? "Extracting..." : "Extract decisions & actions"}</Button>{error && <p className="text-sm text-red-700">{error}</p>}</CardContent></Card>}

    {stage === 2 && <>
      <Card><CardHeader><CardTitle>2. Confirm the plan</CardTitle></CardHeader><CardContent className="space-y-6"><div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"><strong>Human control:</strong> AI can identify possible commitments. Only GGW staff can confirm an action, assign an owner, set a deadline, or choose priority.</div><div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Meeting title<input className="mt-1 w-full rounded-md border bg-background p-2" value={plan.title} onChange={(e) => setPlan({ ...plan, title: e.target.value })}/></label><label className="text-sm">Meeting date<input type="date" className="mt-1 w-full rounded-md border bg-background p-2" value={plan.date} onChange={(e) => setPlan({ ...plan, date: e.target.value })}/></label></div>{listSection("decisions", "Decisions")}
      <div className="space-y-3"><div className="flex items-center justify-between"><strong className="text-sm">Action items</strong><Button size="sm" variant="outline" onClick={addAction}>+ Add action</Button></div>{plan.actionItems.map((a) => <div key={a.id} className="grid gap-2 rounded-md border p-3 md:grid-cols-5"><input className="rounded-md border bg-background p-2 md:col-span-2" placeholder="Task" value={a.task} onChange={(e) => updateAction(a.id, "task", e.target.value)}/><input className="rounded-md border bg-background p-2" placeholder="Owner" value={a.owner} onChange={(e) => updateAction(a.id, "owner", e.target.value)}/><input type="date" className="rounded-md border bg-background p-2" value={a.dueDate} onChange={(e) => updateAction(a.id, "dueDate", e.target.value)}/><div className="flex gap-2"><select className="min-w-0 flex-1 rounded-md border bg-background p-2" value={a.priority} onChange={(e) => updateAction(a.id, "priority", e.target.value)}><option>Unassigned</option><option>High</option><option>Medium</option><option>Low</option></select><Button variant="ghost" size="sm" onClick={() => setPlan({ ...plan, actionItems: plan.actionItems.filter(x => x.id !== a.id) })}>✕</Button></div><div className="text-xs text-muted-foreground md:col-span-5">Timeline: {dateStatus(a.dueDate)}</div></div>)}</div>
      {listSection("followUps", "Follow-ups")}{listSection("risks", "Risks / blockers")}{listSection("openQuestions", "Open questions")}
      </CardContent></Card>
      <Card><CardHeader><CardTitle>3. Use the action plan</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex flex-wrap gap-2"><Button onClick={copySummary}>Copy for Google Docs / Gmail</Button><Button variant="outline" onClick={exportCsv}>Download action items CSV</Button><Button variant="ghost" onClick={reset}>Start new meeting</Button></div>{copied && <p className="text-sm font-medium">Copied.</p>}<div className="rounded-md border bg-muted/30 p-3 text-xs"><strong>What happened?</strong> AI extracted possible decisions and actions; you confirmed the plan; due-date status is calculated locally; nothing was assigned or sent automatically.</div></CardContent></Card>
    </>}
  </main>;
}
