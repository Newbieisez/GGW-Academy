import Link from "next/link";

export const dynamic = "force-static";

export default function ProgressPage() {
  return (
    <main className="ggw-retired-route">
      <span>GGW AI WORKBENCH</span>
      <h1>Start with the work you need to do.</h1>
      <p>The old learning-progress view has been retired from the GGW portal. Use the Workbench for task help, the Prompt Library for task-ready prompts, and the Run &amp; Grow GGW section for nonprofit operations.</p>
      <Link href="/">Return to the Workbench</Link>
    </main>
  );
}
