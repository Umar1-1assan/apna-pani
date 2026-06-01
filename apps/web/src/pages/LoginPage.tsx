import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form, setForm] = useState({
    fullName: "Demo Supplier",
    phone: "+923001234567",
    role: "tenant_admin",
    tenantName: "AquaFlow Demo"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await api.post("/auth/demo-login", form);
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user
      });
      navigate("/dashboard");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="card auth-card">
        <p className="eyebrow">Demo bootstrap</p>
        <h1>Sign in with a tenant admin starter account</h1>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Full name
            <input
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              placeholder="Demo Supplier"
            />
          </label>

          <label>
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="+923001234567"
            />
          </label>

          <label>
            Tenant name
            <input
              value={form.tenantName}
              onChange={(event) => setForm((current) => ({ ...current, tenantName: event.target.value }))}
              placeholder="AquaFlow Demo"
            />
          </label>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Start demo session"}
          </button>

          {error ? <p className="error-text">{error}</p> : null}
        </form>
      </div>
    </section>
  );
}
