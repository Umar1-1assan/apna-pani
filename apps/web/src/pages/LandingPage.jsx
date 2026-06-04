import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function LandingPage() {
  const token = useAuthStore((s) => s.accessToken);

  // Authenticated users go straight to dashboard
  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <section className="landing">
      <div className="hero-grid">
        <div className="hero-copy card emphasis-card">
          <p className="eyebrow">AquaFlow — Water Delivery Platform</p>
          <h1>Manage your water delivery business end-to-end.</h1>
          <p className="hero-text">
            A multi-tenant SaaS platform built for Pakistan's water industry. Manage customers,
            riders, deliveries, invoices and real-time notifications — all from one place.
          </p>

          <div className="hero-actions">
            <Link className="primary-button" to="/login">
              Sign In
            </Link>
            <Link className="secondary-button" to="/login">
              Register Your Business
            </Link>
          </div>

          <div className="hero-highlight-grid">
            {[
              { label: "4 Roles", value: "Super Admin, Supplier, Rider, Customer" },
              { label: "Multi-Tenant", value: "Complete data isolation per supplier" },
              { label: "Auth", value: "Phone OTP + JWT tokens" },
              { label: "Operations", value: "Deliveries, invoices, notifications" }
            ].map((item) => (
              <article className="mini-stat" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <aside className="card feature-card glass-panel">
          <p className="eyebrow">Platform capabilities</p>
          <h2>Everything you need</h2>
          <ol className="phase-list">
            <li>Tenant onboarding &amp; role-aware access</li>
            <li>Customer, rider &amp; delivery management</li>
            <li>Automated invoice &amp; billing workflows</li>
            <li>Real-time notifications via WhatsApp &amp; SMS</li>
          </ol>

          <div className="feature-badges">
            <span>JWT Auth</span>
            <span>Twilio OTP</span>
            <span>MongoDB Atlas</span>
            <span>Cloudinary</span>
            <span>Socket.io</span>
            <span>WhatsApp API</span>
          </div>
        </aside>
      </div>

      <section className="section-grid">
        <article className="card info-panel">
          <p className="eyebrow">For Suppliers</p>
          <h3>Control your entire delivery operation from one dashboard.</h3>
          <p className="muted">Register customers, assign riders, track deliveries, and generate monthly invoices automatically.</p>
        </article>

        <article className="card info-panel">
          <p className="eyebrow">For Riders</p>
          <h3>Know your route. Log deliveries instantly from the field.</h3>
          <p className="muted">Phone OTP login, assigned customer list, delivery logging with proof photos — simple and fast.</p>
        </article>
      </section>
    </section>
  );
}
