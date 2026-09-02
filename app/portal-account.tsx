"use client";

import { useEffect, useState } from "react";
import { LockKeyhole, UserRound } from "lucide-react";

type Session = {
  authenticated?: boolean;
  user?: { email?: string; displayName?: string; source?: string } | null;
};

export default function PortalAccount() {
  const [session, setSession] = useState<Session | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const sync = () => {
      const view = document.body.dataset.ggwWorkbenchView;
      setShow(view === "home" || view === "prompts" || window.location.pathname.includes("/prompts"));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-ggw-workbench-view"], childList: true, subtree: true });
    fetch("/api/session", { credentials: "same-origin", cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(value => setSession(value || {}))
      .catch(() => setSession({}));
    return () => observer.disconnect();
  }, []);

  if (!show) return null;

  if (session?.authenticated && session.user?.email) {
    return <div className="ggw-account-pill" role="status" title="Verified portal account">
      <UserRound size={15}/><span><strong>Signed in</strong><small>{session.user.email}</small></span>
    </div>;
  }

  return <div className="ggw-account-pill preview" title="Authentication will be enabled on the protected production domain">
    <LockKeyhole size={15}/><span><strong>Protected portal</strong><small>Google or Microsoft sign-in at launch</small></span>
  </div>;
}
