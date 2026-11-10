import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CodeCopy } from "@/components/CodeCopy";
import { PrevNext } from "@/components/PrevNext";
import { Toc } from "@/components/Toc";
import { TranslationNotice } from "@/components/TranslationNotice";
import { getPage, routes } from "@/lib/content";
import { isLang, langs } from "@/lib/i18n";
import { localizedTitle } from "@/lib/nav";

type Params = { lang: string; slug?: string[] };

const routeOf = (slug?: string[]) => (slug && slug.length > 0 ? `/${slug.join("/")}` : "/");


export function generateStaticParams(): Params[] {
  return langs.flatMap((lang) => routes().map((route) => ({ lang, slug: route === "/" ? [] : route.slice(1).split("/") })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLang(lang)) return {};
  const page = await getPage(lang, routeOf(slug));
  if (!page) return {};
  return { title: page.route === "/" ? undefined : localizedTitle(lang, page.title), description: page.description };
}

export default async function DocPage({ params }: { params: Promise<Params> }) {
  const { lang, slug } = await params;
  if (!isLang(lang)) notFound();
  const page = await getPage(lang, routeOf(slug));
  if (!page) notFound();
  const title = localizedTitle(lang, page.title);
  const editBase = process.env.NEXT_PUBLIC_EDIT_BASE; // e.g. https://github.com/<owner>/<repo>/blob/main
  return (
    <div className="page">
      <main className="main">
        <TranslationNotice lang={lang} route={page.route} source={page.source} fallback={page.fallback} />
        <Breadcrumb lang={lang} route={page.route} title={title} />
        <h1 className="page-title">{title}</h1>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the HTML is made from this site's own markdown at build time */}
        <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
        <CodeCopy />
        <PrevNext lang={lang} route={page.route} />
      </main>
      <Toc headings={page.headings} editUrl={editBase && page.source ? `${editBase}/${page.source}` : undefined} />
    </div>
  );
}
