import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileSpreadsheet, Mail, Users, ListChecks, ShieldCheck } from "lucide-react";

const tools = [
  {
    title: "Clean & Prepare Data",
    href: "/data-cleanup",
    icon: FileSpreadsheet,
    description: "Check member, event, sponsor, donor, or other CSV data for formatting problems, duplicate emails, blanks, and invalid addresses.",
    bullets: ["Runs locally in the browser", "Flags ambiguous records for review", "Exports a cleaned copy without overwriting the source"],
  },
  {
    title: "Write One Message",
    href: "/workbench/outreach",
    icon: Mail,
    description: "Turn rough notes into a professional GGW email without writing a complex prompt.",
    bullets: ["Confirm extracted facts before drafting", "Choose audience, goal, and tone", "Validate the draft before copying to Gmail"],
  },
  {
    title: "Contact a Group",
    href: "/workbench/batch-outreach",
    icon: Users,
    description: "Create reviewed outreach drafts from a spreadsheet while keeping bad or incomplete records out of the ready queue.",
    bullets: ["Preflight email and duplicate checks", "Human exception queue", "CSV export; nothing is sent automatically"],
  },
  {
    title: "Turn Meetings Into Action",
    href: "/workbench/actions",
    icon: ListChecks,
    description: "Convert meeting notes into confirmed decisions, assigned action items, follow-ups, risks, and open questions.",
    bullets: ["AI extracts only what was stated", "Staff confirm owners and deadlines", "Copy to Google Docs/Gmail or export actions to CSV"],
  },
];

export default function WorkbenchHubPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>GGW Operations Workbench</Badge>
          <Badge variant="outline">GGW staff only</Badge>
          <Badge variant="secondary">Zero automatic sending</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">What do you need to get done?</h1>
        <p className="max-w-3xl text-muted-foreground">
          Use these guided workbenches for real GGW operational work. They combine deterministic checks, fact-controlled AI, and human approval so staff can move faster without handing decisions over to the model.
        </p>
        <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p><strong>Privacy:</strong> use GGW-approved business data only. Do not paste passwords, payment card data, authentication codes, or other credentials.</p>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2" aria-label="Operational workbenches">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Card key={tool.href} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Icon className="h-6 w-6" />
                    <Badge variant="outline">Ready to use</Badge>
                  </div>
                  <CardTitle>{tool.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{tool.description}</p>
                  <ul className="list-disc space-y-1 pl-5 text-sm">
                    {tool.bullets.map((item) => <li key={item}>{item}</li>)}
                  </ul>
                </CardContent>
              </div>
              <CardContent>
                <Button asChild className="w-full"><Link href={tool.href}>Open workbench</Link></Button>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
