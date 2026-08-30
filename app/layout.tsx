import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GGW AI Learning Academy",
  description: "A practical internal academy for using AI responsibly in Google Workspace at Global Gaming Women.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
