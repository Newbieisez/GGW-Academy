"use client";

import { usePathname } from "next/navigation";
import GGWWorkbench from "./ggw-workbench";
import ExpandedJobAids from "./expanded-job-aids";
import NonprofitOperationsHub from "./nonprofit-operations-hub";
import HomeGoogleWorkspaceHub from "./home-google-workspace-hub";
import CanvaHelper from "./canva-helper";
import ConnectorGuides from "./connector-guides";
import PortalAccount from "./portal-account";

export default function PortalShell() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname.endsWith("/GGW-Academy/");

  return (
    <>
      {isHome && (
        <>
          <GGWWorkbench />
          <ExpandedJobAids />
          <NonprofitOperationsHub />
          <HomeGoogleWorkspaceHub />
          <CanvaHelper />
          <ConnectorGuides />
        </>
      )}
      <PortalAccount />
    </>
  );
}
