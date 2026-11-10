import { type NextRequest, NextResponse } from "next/server";

const langs = ["en", "ja"];

/** English, unless the visitor chose another language in the language menu (the `lang` cookie). */
function preferred(request: NextRequest): string {
  const saved = request.cookies.get("lang")?.value;
  return saved && langs.includes(saved) ? saved : "en";
}

/** A path without a language (`/`, `/faq`) goes to the page in the visitor's language. */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (langs.includes(pathname.split("/")[1] ?? "")) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${preferred(request)}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 307);
}

// Not for files (anything with a dot), nor for Next.js internals.
export const config = { matcher: ["/((?!_next|.*\\..*).*)"] };
