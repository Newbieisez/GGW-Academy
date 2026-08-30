import type { Metadata } from "next";
import "./globals.css";

const publicBasePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");

export const metadata: Metadata = {
  title: "GGW AI Learning Academy",
  description: "A practical internal academy for using AI responsibly in Google Workspace at Global Gaming Women.",
  icons: { icon: `${publicBasePath}/favicon.svg`, shortcut: `${publicBasePath}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
