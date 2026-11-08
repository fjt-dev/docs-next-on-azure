import Link from "next/link";
import { MenuButton } from "./MenuButton";
import { Search } from "./Search";

export function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <MenuButton />
        <Link href="/" className="brand" aria-label="next-on-azure, home">
          <em>next</em>
          <strong>ON</strong>
          <em>azure</em>
        </Link>
        <div className="header-end">
          <Search />
        </div>
      </div>
    </header>
  );
}
