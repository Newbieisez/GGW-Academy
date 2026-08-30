"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { academyPath, PromptLibraryView, SiteHeader } from "../page";

export const dynamic = "force-static";

export default function PromptsPage() {
  const [notice, setNotice] = useState("");
  const copyText = (label: string, value: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setNotice(label + " copied.");
      window.setTimeout(() => setNotice(""), 3000);
    }).catch(() => setNotice("Select and copy the prompt manually."));
  };

  return (
    <div className="academy-app">
      <SiteHeader
        view="prompts"
        onHome={() => { window.location.href = academyPath("/"); }}
        onPrompts={() => { window.scrollTo({ top: 0, behavior: "smooth" }); }}
        onSandbox={() => { window.location.href = academyPath("/?view=sandbox"); }}
        onDashboard={() => { window.location.href = academyPath("/progress"); }}
      />
      {notice && <div className="copy-notice" role="status"><CheckCircle2 size={15} />{notice}</div>}
      <PromptLibraryView onCopy={copyText} />
    </div>
  );
}
