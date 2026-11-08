import Link from "next/link";
import { trail } from "@/lib/nav";

export function Breadcrumb({ route, title }: { route: string; title: string }) {
  const parts = trail(route);
  const items = parts.length > 1 ? parts : parts.length === 1 && route !== "/" ? parts : [];
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      <Link href="/">next-on-azure</Link>
      {items.map((part, i) => (
        <span key={`${part}-${i}`}>
          <span className="sep" aria-hidden="true">
            ›
          </span>
          <span className={i === items.length - 1 ? "current" : undefined}>{part}</span>
        </span>
      ))}
      {items.length === 0 && route !== "/" && (
        <span>
          <span className="sep" aria-hidden="true">
            ›
          </span>
          <span className="current">{title}</span>
        </span>
      )}
    </nav>
  );
}
