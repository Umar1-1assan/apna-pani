import { useEffect, useState, cloneElement } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuthStore } from "../store/authStore";
import { useTranslation } from "../contexts/LanguageContext";

// Import role-specific dashboards
import { SupplierDashboard } from "./supplier/SupplierDashboard";
import { RiderDashboard } from "./rider/RiderDashboard";
import { CustomerDashboard } from "./customer/CustomerDashboard";
import { AdminDashboard } from "./admin/AdminDashboard";
import ProfileModal from "../components/modals/ProfileModal";

import { LayoutDashboard, Settings, Building2, Receipt, Lock, MapPin, Package, LogOut, CalendarDays, Users, Bike, Truck, Plus, Banknote, CreditCard, Layers } from "lucide-react";

const roleLabel = {
  super_admin: "Super Admin",
  supplier: "Business Owner",
  delivery_boy: "Delivery Rider",
  customer: "Customer"
};

// Water drop SVG icon
function DropIcon({ size = 28, color = "#0058bf" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2Z" />
    </svg>
  );
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useTranslation();
  const [currentDate, setCurrentDate] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    // Set dynamic date formatted nicely
    const options = { weekday: "short", year: "numeric", month: "long", day: "numeric" };
    setCurrentDate(new Date().toLocaleDateString("en-US", options));

    // Force native browser scrollbars and widgets (calendar/select) to render in light mode
    document.documentElement.style.colorScheme = "light";
    document.documentElement.classList.add("no-scrollbar");

    return () => {
      // Restore native scrollbars to dark mode on unmount
      document.documentElement.style.colorScheme = "dark";
      document.documentElement.classList.remove("no-scrollbar");
    };
  }, []);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const displayName = user?.fullName ?? "User";
  const role = user?.role ?? "supplier";

  // Get user avatar initials
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Determine which dashboard to render
  let DashboardContent;
  let navItems = [];

  switch (role) {
    case "super_admin":
      DashboardContent = AdminDashboard;
      navItems = [
        { id: "overview", label: "Overview", icon: <LayoutDashboard size={20} /> },
        { id: "system_info", label: "System Info", icon: <Settings size={20} /> },
        { id: "suppliers", label: "Suppliers", icon: <Building2 size={20} /> },
        { id: "invoices", label: "Invoices", icon: <Receipt size={20} /> },
        { id: "subscriptions", label: "Subscriptions", icon: <CreditCard size={20} /> },
        { id: "settings", label: "Settings", icon: <Lock size={20} /> }
      ];
      break;
    case "delivery_boy":
      DashboardContent = RiderDashboard;
      navItems = [
        { id: "overview", label: t("overview_cockpit"), icon: <LayoutDashboard size={20} /> },
        { id: "history", label: t("delivery_history"), icon: <MapPin size={20} /> },
        { id: "performance", label: t("performance"), icon: <Banknote size={20} /> }
      ];
      break;
    case "customer":
      DashboardContent = CustomerDashboard;
      navItems = [
        { id: "overview", label: t("overview"), icon: <LayoutDashboard size={20} /> },
        { id: "request", label: t("request_delivery"), icon: <Plus size={20} /> },
        { id: "orders", label: t("order_history"), icon: <Package size={20} /> },
        { id: "billing", label: t("billing_and_invoices"), icon: <Receipt size={20} /> }
      ];
      break;
    case "supplier":
    default:
      DashboardContent = SupplierDashboard;
      navItems = [
        { id: "overview", label: t("overview"), icon: <LayoutDashboard size={20} /> },
        { id: "products", label: t("products"), icon: <Package size={20} /> },
        { id: "customers", label: t("customer_mgmt"), icon: <Users size={20} /> },
        { id: "riders", label: t("fleet_status"), icon: <Bike size={20} /> },
        { id: "routing", label: t("route_map"), icon: <MapPin size={20} /> },
        { id: "deliveries", label: t("deliveries_log"), icon: <Truck size={20} /> },
        { id: "invoices", label: t("invoices"), icon: <Receipt size={20} /> },
        { id: "subscription", label: t("subscriptions"), icon: <CreditCard size={20} /> }
      ];
      break;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex flex-col md:flex-row font-sans antialiased max-w-full overflow-x-hidden">
      {/* ─── DESKTOP SIDEBAR NAVIGATION (aside) ─── */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-white border-r border-gray-100 flex-col py-6 z-40 shadow-sm transition-all duration-300">
        {/* Brand container */}
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
            <DropIcon size={22} color="#ffffff" />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight leading-none">AquaFlow</h1>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 block">{roleLabel[role] ?? role}</span>
          </div>
        </div>

        {/* Sidebar Nav links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-4 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl mx-2 text-sm text-left font-semibold transition-all duration-200 ${
                activeTab === item.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={activeTab === item.id ? "text-blue-600" : "text-gray-400"}>{item.icon}</span> 
              {item.label}
            </button>
          ))}
        </nav>

        {/* User profile footer inside Sidebar */}
        <div className="mt-auto px-6 pt-4 flex flex-col gap-3 shrink-0">

          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shadow-inner shrink-0">
              {initials}
            </div>
            <div className="overflow-hidden flex-1">
              <h4 className="font-bold text-xs text-gray-800 truncate">{displayName}</h4>
              <p className="text-[10px] text-gray-500 truncate">{user?.phone || 'No Phone'}</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={16} />
            </button>
          </div>
          
          {/* Language Switcher */}
          {role !== "super_admin" && (
            <button onClick={toggleLanguage} className="mt-2 w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-colors">
              <Settings size={14} />
              {language === 'en' ? 'اردو میں تبدیل کریں' : 'Switch to English'}
            </button>
          )}

        </div>
      </aside>

      {/* ─── MOBILE BOTTOM NAVIGATION (nav) ─── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-3 py-2 bg-white/90 backdrop-blur-md border-t border-[#dce9ff] shadow-[0_-8px_30px_rgba(0,0,0,0.04)] rounded-t-3xl">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 py-1.5 px-2 rounded-full transition-all duration-300 ${
                isActive 
                  ? "bg-blue-50 text-blue-600 font-bold px-3" 
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <span className="shrink-0">{cloneElement(item.icon, { size: 18 })}</span>
              <span className={`text-[11px] whitespace-nowrap overflow-hidden transition-all duration-300 ${
                isActive ? "max-w-[100px] opacity-100" : "max-w-0 opacity-0"
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 py-1.5 px-2 text-red-400 hover:text-red-500 rounded-full transition-all duration-300"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </nav>

      {/* ─── MAIN CONTENT WORKSPACE (main) ─── */}
      <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden md:ml-64 flex flex-col min-h-screen pb-24 md:pb-6 bg-[#f8f9ff]">
        {/* Workspace Top Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full px-6 py-6 border-b border-[#eff4ff] bg-white gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 leading-none">Logistics Console</h2>
            <p className="text-xs text-gray-400 mt-1.5">Welcome back to the regional hub system cockpit.</p>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
            {/* Current dynamic date */}
            <span className="inline-flex items-center gap-1.5 bg-[#eff4ff] px-3.5 py-1 rounded-full text-xs font-bold text-[#0058bf] border border-[#dce9ff]">
              <CalendarDays size={14} /> {currentDate || "Loading date..."}
            </span>
            <button
              onClick={() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shadow-inner hover:bg-blue-200 transition-colors"
            >
              {initials}
            </button>
          </div>
        </header>

        {/* Render role-specific workspace content */}
        <div className="flex-1 bg-[#f8f9ff]">
          <DashboardContent user={user} activeTab={activeTab} />
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
    </div>
  );
}
