import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Mail, Users, ListChecks, ShieldCheck } from "lucide-react";

const tools = [
  { title: "Clean & Prepare Data", href: "/data-cleanup", icon: FileSpreadsheet, accent: "ops-card-green", description: "Upload a CSV or choose a Google Sheet, clean formatting, flag duplicates and invalid emails, preview changes, and export a cleaned copy.", bullets: ["CSV upload + Google Drive picker", "Safe local cleanup preview", "Download cleaned CSV"] },
  { title: "Write One Message", href: "/workbench/outreach", icon: Mail, accent: "ops-card-purple", description: "Enter notes or confirmed facts, then generate and validate a professional GGW email.", bullets: ["Always-visible Generate Message button", "Editable facts before/after extraction", "Copy subject and message"] },
  { title: "Contact a Group", href: "/workbench/batch-outreach", icon: Users, accent: "ops-card-pink", description: "Upload a CSV or choose a Google Sheet, map columns, generate drafts, fix exceptions, and export the reviewed batch.", bullets: ["CSV upload + Google Drive picker", "Editable exception queue with real rerun", "Nothing sends automatically"] },
  { title: "Meeting → Action Plan", href: "/workbench/actions", icon: ListChecks, accent: "ops-card-orange", description: "Paste or upload meeting notes, generate an editable action plan, confirm owners/dates, and export or copy it.", bullets: ["Upload transcript or notes", "Generate Action Plan button", "Copy summary or download actions CSV"] },
];

export default function WorkbenchHubPage() {
  return <main className="ops-page mx-auto max-w-6xl px-4 py-10 space-y-8">
    <section className="ops-hero space-y-4"><div className="flex flex-wrap items-center gap-2"><Badge>GGW Operations Workbench</Badge><Badge variant="outline">GGW staff only</Badge><Badge variant="secondary">Human review required</Badge></div><h1 className="text-3xl font-bold tracking-tight">What do you need to get done?</h1><p className="max-w-3xl">Each workbench now follows the same simple flow: bring your information in, run the tool, review the result, then export or use it.</p><div className="flex items-start gap-3 rounded-lg border bg-white/70 p-4 text-sm"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0"/><p><strong>Privacy:</strong> use GGW-approved business data only. Never paste passwords, payment card data, or authentication codes.</p></div></section>
    <section className="grid gap-5 md:grid-cols-2" aria-label="Operational workbenches">{tools.map(tool=>{const Icon=tool.icon;return <Card key={tool.href} className={`flex flex-col justify-between ${tool.accent}`}><div><CardHeader><div className="mb-2 flex items-center justify-between gap-3"><Icon className="h-7 w-7"/><Badge variant="outline">Ready to use</Badge></div><CardTitle>{tool.title}</CardTitle></CardHeader><CardContent className="space-y-4"><p className="text-sm text-muted-foreground">{tool.description}</p><ul className="list-disc space-y-1 pl-5 text-sm">{tool.bullets.map(item=><li key={item}>{item}</li>)}</ul></CardContent></div><CardContent><Button asChild size="lg" className="w-full"><Link href={tool.href}>Open {tool.title}</Link></Button></CardContent></Card>})}</section>
  </main>;
}
