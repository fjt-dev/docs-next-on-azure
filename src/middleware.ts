import { type NextRequest, NextResponse } from "next/server";

const langs = ["en", "ja"];

/** The language from the cookie that the language switch sets, else from Accept-Language, else English. */
function preferred(request: NextRequest): string {
  const saved = request.cookies.get("lang")?.value;
  if (saved && langs.includes(saved)) return saved;
  for (const part of (request.headers.get("accept-language") ?? "").split(",")) {
    const tag = part.trim().slice(0, 2).toLowerCase();
    if (langs.includes(tag)) return tag;
  }
  return "en";
}

/** A path without a language (`/`, `/faq`) goes to the page in the visitor's language. */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (langs.includes(pathname.split("/")[1] ?? "")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${preferred(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 307);
}

// Not for files (anything with a dot), nor for Next.js internals.
export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
