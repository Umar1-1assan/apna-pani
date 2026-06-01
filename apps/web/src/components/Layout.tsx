import { Link } from "react-router-dom";

type LayoutProps = {
  token: string | null;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onLogout: () => void;
  children: React.ReactNode;
};

export function Layout({ token, menuOpen, onToggleMenu, onLogout, children }: LayoutProps) {
  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">A</span>
          <span>
            AquaFlow
            <small>SaaS boilerplate</small>
          </span>
        </Link>

        <nav className={`topbar-nav ${menuOpen ? "open" : ""}`}>
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/login">Login</Link>
          {token ? (
            <button type="button" className="ghost-button" onClick={onLogout}>
              Sign out
            </button>
          ) : null}
        </nav>

        <button type="button" className="menu-button" onClick={onToggleMenu}>
          Menu
        </button>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
