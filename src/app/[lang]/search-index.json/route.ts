import { searchIndex } from "@/lib/content";
import { isLang, langs } from "@/lib/i18n";

export const dynamic = "force-static";

export function generateStaticParams() {
  return langs.map((lang) => ({ lang }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLang(lang)) return new Response("Not found", { status: 404 });
  return Response.json(await searchIndex(lang));
}
