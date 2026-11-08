import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "next-on-azure", template: "%s - next-on-azure" },
  description: "Run a Next.js app on one Azure Function (Flex Consumption) with Blob and Table Storage.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

// Sets the theme before the first paint, so that a dark page does not flash white.
const themeScript = `(function(){try{var p=localStorage.getItem("theme")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";}catch(e){document.documentElement.dataset.theme="dark";}})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Header />
        <div className="shell">
          <Sidebar />
          <div className="content-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
