import type { Metadata } from "next";
import "./globals.css";
import "./nav-overrides.css";
import "./portal-header.css";
import "./ggw-workbench.css";
import "./ggw-workbench-v2.css";
import "./prompt-workbench.css";
import "./prompt-workbench-v2.css";
import "./nonprofit-operations-hub.css";
import "./google-workspace-hub.css";
import "./canva-helper.css";
import "./connector-guides.css";
import "./portal-account.css";
import "./legal-footer.css";
import "./accessibility-polish.css";
import PortalHeader from "./portal-header";
import GGWWorkbench from "./ggw-workbench";
import NonprofitOperationsHub from "./nonprofit-operations-hub";
import HomeGoogleWorkspaceHub from "./home-google-workspace-hub";
import CanvaHelper from "./canva-helper";
import ConnectorGuides from "./connector-guides";
import PortalAccount from "./portal-account";
import LegalFooter from "./legal-footer";

const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "GGW AI Workbench",
  description: "A practical AI operations portal for Global Gaming Women staff using WildApricot, Google Workspace, Canva, automation tools, and approved AI.",
  icons: { icon: `${publicBasePath}/favicon.svg`, shortcut: `${publicBasePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <PortalHeader />
        <GGWWorkbench />
        <NonprofitOperationsHub />
        <HomeGoogleWorkspaceHub />
        <CanvaHelper />
        <ConnectorGuides />
        <PortalAccount />
        {children}
        <LegalFooter />
      </body>
    </html>
  );
}
