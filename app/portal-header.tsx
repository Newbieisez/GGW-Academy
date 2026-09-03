"use client";

import { usePathname } from "next/navigation";

const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const portalPath = (path: string) => `${publicBasePath}${path}` || "/";

export default function PortalHeader() {
  const pathname = usePathname();
  const promptsActive = pathname.includes("/prompts");
  const legalActive = pathname.includes("/legal");

  return (
    <header className="ggw-portal-header">
      <div className="ggw-portal-header-inner">
        <a className="ggw-portal-brand" href={portalPath("/")} aria-label="GGW AI Workbench home">
          <span className="ggw-portal-mark">GGW<b>:</b></span>
          <span><strong>AI Workbench</strong><small>Global Gaming Women</small></span>
        </a>
        <nav className="ggw-portal-nav" aria-label="Main navigation">
          <a className={!promptsActive && !legalActive ? "active" : ""} href={portalPath("/#job-aids")}>Get help</a>
          <a href={portalPath("/#nonprofit-operations")}>Run &amp; Grow GGW</a>
          <a href={portalPath("/#google-workspace")}>Tools &amp; AI</a>
          <a className={promptsActive ? "active" : ""} href={portalPath("/prompts")}>Prompt Library</a>
          <a href={portalPath("/#automations")}>Automations</a>
          <a href={portalPath("/#ggw-connectors-helper")}>Connect tools</a>
        </nav>
      </div>
    </header>
  );
}
