import type { Metadata } from "next";
import "./globals.css";
import "./nav-overrides.css";
import "./ggw-workbench.css";
import GGWWorkbench from "./ggw-workbench";

const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "GGW AI Workbench",
  description: "A practical AI job aid for Global Gaming Women staff using WildApricot, Google Workspace, and approved AI tools.",
  icons: { icon: `${publicBasePath}/favicon.svg`, shortcut: `${publicBasePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><GGWWorkbench />{children}</body></html>;
}
