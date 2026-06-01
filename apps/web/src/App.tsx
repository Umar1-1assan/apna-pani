import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { useAuthStore } from "./store/authStore";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.accessToken);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.accessToken);
  const logout = useAuthStore((state) => state.logout);

  const navActions = useMemo(
    () => ({
      logout: () => {
        logout();
        navigate("/login");
      },
      toggleMenu: () => setMenuOpen((value) => !value)
    }),
    [logout, navigate]
  );

  return (
    <Layout token={token} onLogout={navActions.logout} menuOpen={menuOpen} onToggleMenu={navActions.toggleMenu}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <DashboardPage />
            </RequireAuth>
          }
        />
      </Routes>
    </Layout>
  );
}
