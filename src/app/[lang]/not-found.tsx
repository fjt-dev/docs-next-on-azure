"use client";

import Link from "next/link";
import { withLang } from "@/lib/i18n";
import { useLang } from "@/lib/use-lang";

export default function NotFound() {
  const { lang, t } = useLang();
  return (
    <div className="page">
      <main className="main">
        <h1 className="page-title">{t.notFoundTitle}</h1>
        <p className="prose">
          <Link href={withLang(lang, "/")}>{t.notFoundBody}</Link>
        </p>
      </main>
    </div>
  );
}
