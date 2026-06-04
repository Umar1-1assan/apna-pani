import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export function Layout({ token, user, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLabel = {
    super_admin: "Super Admin",
    supplier: "Supplier",
    delivery_boy: "Delivery Rider",
    customer: "Customer"
  }[user?.role] || "Guest";

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">Aq</span>
          <span>
            AquaFlow
            <small>{token ? `${roleLabel} — ${user?.fullName ?? ""}` : "Water Delivery Platform"}</small>
          </span>
        </Link>

        <nav className={`topbar-nav ${menuOpen ? "open" : ""}`}>
          <Link to="/">Home</Link>
          {!token && <Link to="/login">Sign In</Link>}
          {token && <Link to="/dashboard">Dashboard</Link>}
          {token && (
            <button type="button" className="ghost-button" onClick={onLogout}>
              Sign Out
            </button>
          )}
        </nav>

        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "Close" : "Menu"}
        </button>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
