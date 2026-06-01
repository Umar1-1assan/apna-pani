import { Link } from "react-router-dom";

const features = [
  "JWT auth with phone-first onboarding",
  "Cloudinary upload flow for media assets",
  "Express API and MongoDB models ready to extend",
  "Realtime socket wiring for dashboards"
];

export function LandingPage() {
  return (
    <section className="hero-grid">
      <div className="hero-copy card">
        <p className="eyebrow">React + Node.js + Express + Cloudinary</p>
        <h1>Ship the SaaS skeleton first, then layer in product logic.</h1>
        <p className="hero-text">
          This starter gives you a real monorepo baseline: authenticated API routes, reusable React pages, Cloudinary-ready uploads, and clean extension points for billing, tenants, and workflows.
        </p>

        <div className="hero-actions">
          <Link className="primary-button" to="/login">
            Open demo login
          </Link>
          <Link className="secondary-button" to="/dashboard">
            View dashboard shell
          </Link>
        </div>
      </div>

      <aside className="card feature-card">
        <h2>Included foundation</h2>
        <ul>
          {features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </aside>
    </section>
  );
}
