import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { useAuthStore } from "./store/authStore";

function RequireAuth({ children, roles }) {
  const { accessToken, user } = useAuthStore();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  const navigate = useNavigate();
  const { user, accessToken, logout } = useAuthStore();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <Routes>
      {/* Auth page — no layout wrapper */}
      <Route path="/login" element={<LoginPage />} />

      {/* Dashboard page — unified sidebar shell layout (no default black topbar) */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      {/* Landing page & other marketing pages use standard topbar layout */}
      <Route
        path="/*"
        element={
          <Layout token={accessToken} user={user} onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
}
