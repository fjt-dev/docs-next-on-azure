import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ThemeSync } from "@/components/ThemeSync";
import { isLang, langs, ui } from "@/lib/i18n";
import "../globals.css";


export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  return {
    title: { default: "next-on-azure", template: "%s - next-on-azure" },
    description: ui[lang].description,
    alternates: { languages: { en: "/en", ja: "/ja" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111111" },
  ],
};

// Applies a saved choice of colour scheme before the first paint, so that the page does not flash in
// the wrong scheme. The choice is the content of <meta name="color-scheme"> ("light dark" follows the
// system); the CSS maps it to the color-scheme property. Nothing else runs here (modern-web-guidance,
// dark-mode-toggle).
const themeScript = `(function(){try{var p=localStorage.getItem("theme");if(p==="light"||p==="dark")document.querySelector('meta[name="color-scheme"]').content=p;}catch(e){}})();`;

export default async function RootLayout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    // The script below changes the meta tag before React hydrates; suppressHydrationWarning keeps React
    // from putting the server value back, also on a client-side navigation (a change of language).
    <html lang={lang} suppressHydrationWarning>
      <head>
        {/* itemProp: React 19 hoists a plain <meta> and, after the script changed it, would add a second one on hydration. */}
        <meta name="color-scheme" content="light dark" itemProp="color-scheme" suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeSync />
        <Header lang={lang} />
        <div className="shell">
          <Sidebar />
          <div className="content-col">{children}</div>
        </div>
      </body>
    </html>
  );
}
