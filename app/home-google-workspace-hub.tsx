"use client";

import { usePathname } from "next/navigation";
import GoogleWorkspaceHub from "./google-workspace-hub";

export default function HomeGoogleWorkspaceHub() {
  const pathname = usePathname();
  if (pathname.includes("/prompts") || pathname.includes("/legal") || pathname.includes("/progress")) return null;
  return <GoogleWorkspaceHub />;
}
