import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page">
      <main className="main">
        <h1 className="page-title">Page not found</h1>
        <p className="prose">
          There is no such page. Go to the <Link href="/">overview</Link>.
        </p>
      </main>
    </div>
  );
}
