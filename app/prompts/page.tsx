"use client";

import { academyPath, SiteHeader } from "../page";
import PromptWorkbench from "../prompt-workbench";

export const dynamic = "force-static";

export default function PromptsPage() {
  return (
    <div className="academy-app">
      <SiteHeader
        view="prompts"
        onHome={() => { window.location.href = academyPath("/"); }}
        onPrompts={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onSandbox={() => { window.location.href = academyPath("/?view=sandbox"); }}
        onDashboard={() => { window.location.href = academyPath("/progress"); }}
      />
      <PromptWorkbench />
    </div>
  );
}
