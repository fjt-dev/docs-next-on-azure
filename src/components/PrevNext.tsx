import Link from "next/link";
import { flatNav } from "@/lib/nav";

export function PrevNext({ route }: { route: string }) {
  const pages = flatNav();
  const i = pages.findIndex((p) => p.href === route);
  if (i < 0) return null;
  const prev = pages[i - 1];
  const next = pages[i + 1];
  if (!prev && !next) return null;
  return (
    <nav className="prevnext" aria-label="Pagination">
      {prev ? (
        <Link href={prev.href} className="prev">
          <span>Previous</span>
          {prev.title}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link href={next.href} className="next">
          <span>Next</span>
          {next.title}
        </Link>
      )}
    </nav>
  );
}
