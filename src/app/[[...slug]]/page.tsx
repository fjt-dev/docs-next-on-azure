import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PrevNext } from "@/components/PrevNext";
import { Toc } from "@/components/Toc";
import { getPage, routes } from "@/lib/content";

type Params = { slug?: string[] };

const routeOf = (slug?: string[]) => (slug && slug.length > 0 ? `/${slug.join("/")}` : "/");

export function generateStaticParams(): Params[] {
  return routes().map((route) => ({ slug: route === "/" ? [] : route.slice(1).split("/") }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const page = await getPage(routeOf((await params).slug));
  if (!page) return {};
  return { title: page.route === "/" ? undefined : page.title, description: page.description };
}

export default async function DocPage({ params }: { params: Promise<Params> }) {
  const route = routeOf((await params).slug);
  const page = await getPage(route);
  if (!page) notFound();
  const editBase = process.env.NEXT_PUBLIC_EDIT_BASE; // e.g. https://github.com/<owner>/<repo>/blob/main
  return (
    <div className="page">
      <main className="main">
        <Breadcrumb route={page.route} title={page.title} />
        <h1 className="page-title">{page.title}</h1>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: the HTML is made from this site's own markdown at build time */}
        <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
        <PrevNext route={page.route} />
      </main>
      <Toc headings={page.headings} editUrl={editBase && page.source ? `${editBase}/${page.source}` : undefined} />
    </div>
  );
}
