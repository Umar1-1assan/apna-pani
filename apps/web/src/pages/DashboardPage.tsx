import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";

type Customer = {
  _id: string;
  name: string;
  phone: string;
  address: string;
  status: string;
};

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [health, setHealth] = useState<string>("loading");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [healthResponse, customerResponse] = await Promise.all([
          api.get("/health"),
          api.get("/customers")
        ]);

        if (!mounted) {
          return;
        }

        setHealth(healthResponse.data.status);
        setCustomers(customerResponse.data.customers ?? []);
      } catch {
        if (mounted) {
          setHealth("offline");
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post("/uploads", formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    setUploadUrl(data.url);
  }

  return (
    <section className="dashboard-grid">
      <div className="card dashboard-panel">
        <p className="eyebrow">Session</p>
        <h1>Welcome back, {user?.fullName ?? "demo user"}</h1>
        <p className="hero-text">API health: {health}</p>
        <p className="muted">Role: {user?.role ?? "unknown"}</p>
      </div>

      <div className="card dashboard-panel">
        <p className="eyebrow">Cloudinary upload</p>
        <form className="stack" onSubmit={handleUpload}>
          <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
          <button className="primary-button" type="submit">
            Upload file
          </button>
        </form>
        {uploadUrl ? (
          <p className="muted">
            Uploaded URL: <a href={uploadUrl}>{uploadUrl}</a>
          </p>
        ) : null}
      </div>

      <div className="card dashboard-panel wide-panel">
        <p className="eyebrow">Customers</p>
        <div className="table-shell">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer._id}>
                  <td>{customer.name}</td>
                  <td>{customer.phone}</td>
                  <td>{customer.address}</td>
                  <td>{customer.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
