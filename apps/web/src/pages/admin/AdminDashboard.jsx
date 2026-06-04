import { Lock, Settings, Plus, RefreshCw, AlertTriangle, Building2, Users, Bike, Activity, Key, CreditCard, Home, Check, X } from 'lucide-react';
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { StatCard } from "../../components/StatCard";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { AdminInvoices } from "./AdminInvoices";
import { AdminSubscriptions } from "./AdminSubscriptions";

// Water drop SVG icon
function DropIcon({ size = 20, color = "#1d4ed8" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0C19 10.5 12 2 12 2Z" />
    </svg>
  );
}

function AdminSettings({ user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
       setMsg({ text: "Passwords do not match", type: "error" });
       return;
    }
    setLoading(true);
    setMsg({ text: "", type: "" });
    try {
      await api.post("/admin/change-password", { currentPassword, newPassword });
      setMsg({ text: "Password changed successfully! You can use it next time you login.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMsg({ text: err.response?.data?.message || "Failed to update password", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const [activeSubTab, setActiveSubTab] = useState("general");

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fadeIn">
      <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-xl shadow-gray-100/50">
        <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Settings className="w-5 h-5" /> Super Admin Settings
          </h2>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveSubTab("general")} 
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              General Settings
            </button>
            <button 
              onClick={() => setActiveSubTab("pricing")} 
              className={`pb-2 text-sm font-semibold border-b-2 transition-colors ${activeSubTab === "pricing" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
            >
              Pricing & Packages
            </button>
          </div>
        </div>
        
        {activeSubTab === "general" ? (
          <div className="p-8 max-w-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Lock className="w-5 h-5" /> Security Settings
            </h3>
        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-100" : "bg-green-50 text-green-700 border border-green-100"}`}>
            {msg.text}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
           <div>
             <label className="block text-sm font-semibold text-gray-600 mb-1">Current Password</label>
             <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" />
           </div>
           <div>
             <label className="block text-sm font-semibold text-gray-600 mb-1">New Password</label>
             <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" minLength={6} />
           </div>
           <div>
             <label className="block text-sm font-semibold text-gray-600 mb-1">Confirm New Password</label>
             <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none" minLength={6} />
           </div>
           <button disabled={loading} type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all">
             {loading ? "Updating..." : "Update Password"}
           </button>
            </form>
          </div>
        ) : (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Subscription Packages</h3>
                <p className="text-sm text-gray-500">Manage plans, features, and monthly pricing for your customers.</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-sm transition-all">+ Create New Plan</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Plan */}
              <div className="border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-shadow">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">Starter</span>
                <h4 className="text-2xl font-bold mt-4">Basic</h4>
                <div className="flex items-end gap-1 my-2">
                  <span className="text-4xl font-extrabold text-gray-800">$49</span><span className="text-gray-400 font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Essential tools for small delivery operations.</p>
                <ul className="space-y-3 mb-8 text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> Up to 3 Riders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> Basic Route Optimization</li>
                  <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-gray-400 inline-block" /> Standard Support</li>
                  <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-gray-400 inline-block" /> Advanced Reporting</li>
                  <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-gray-400 inline-block" /> WhatsApp Integration</li>
                </ul>
                <button className="w-full py-3 border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">Edit Plan</button>
              </div>

              {/* Standard/Premium Plan */}
              <div className="border-2 border-blue-600 rounded-3xl p-6 shadow-xl relative transform scale-105 bg-white z-10">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-3xl uppercase tracking-widest">Most Popular</div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full">Growth</span>
                <h4 className="text-2xl font-bold mt-4 text-blue-900">Standard</h4>
                <div className="flex items-end gap-1 my-2">
                  <span className="text-4xl font-extrabold text-blue-900">$129</span><span className="text-blue-400 font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Advanced features for growing delivery fleets.</p>
                <ul className="space-y-3 mb-8 text-sm text-gray-700 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 inline-block" /> Up to 10 Riders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 inline-block" /> Advanced Route Optimization</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 inline-block" /> Priority Support</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 inline-block" /> Advanced Reporting</li>
                  <li className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4 text-gray-400 inline-block" /> WhatsApp Integration</li>
                </ul>
                <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors">Edit Plan</button>
              </div>

              {/* Enterprise Plan */}
              <div className="border border-gray-200 rounded-3xl p-6 hover:shadow-lg transition-shadow">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-2 py-1 rounded-full">Scale</span>
                <h4 className="text-2xl font-bold mt-4">Enterprise</h4>
                <div className="flex items-end gap-1 my-2">
                  <span className="text-4xl font-extrabold text-gray-800">$299</span><span className="text-gray-400 font-semibold mb-1">/mo</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">Custom solutions for large-scale operations.</p>
                <ul className="space-y-3 mb-8 text-sm text-gray-600 font-medium">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> Unlimited Riders</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> Dynamic Re-routing</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> 24/7 Dedicated Support</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> Custom Analytics Dashboards</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-500 inline-block" /> WhatsApp Integration</li>
                </ul>
                <button className="w-full py-3 border-2 border-blue-100 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">Edit Plan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminDashboard({ user, activeTab = "overview" }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [invoices, setInvoices] = useState([]);
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    supplierId: null,
    currentStatus: false,
    loading: false
  });
  
  const [formData, setFormData] = useState({
    businessName: "",
    taxId: "",
    businessType: "Sole Proprietorship",
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "Rawalpindi",
    state: "Punjab",
    postalCode: "",
    country: "Pakistan",
    username: "",
    password: "",
    region: "",
    plan: "basic",
    isActive: true
  });
  
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendEmailToggle, setSendEmailToggle] = useState(true);

  // Fetch suppliers list
  async function loadSuppliers() {
    try {
      setLoading(true);
      const res = await api.get("/admin/suppliers");
      setSuppliers(res.data.data || []);
      setError("");
    } catch (err) {
      setError("Failed to fetch registered suppliers. Ensure the server is online.");
    } finally {
      setLoading(false);
    }
  }

  async function loadInvoices() {
    try {
      const res = await api.get("/admin/invoices");
      setInvoices(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadSuppliers();
    loadInvoices();
  }, []);

  const handleChange = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  // Helper to generate a nice temporary password
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$";
    let pass = "";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: pass }));
  };

  async function handlePlanChange(supplierId, newPlan) {
    try {
      await api.put(`/admin/suppliers/${supplierId}/plan`, { plan: newPlan });
      loadSuppliers();
    } catch (err) {
      alert("Failed to update plan: " + (err.response?.data?.message || err.message));
    }
  }

  function requestToggleStatus(supplierId, currentStatus) {
    setConfirmModal({
      isOpen: true,
      supplierId,
      currentStatus,
      loading: false
    });
  }

  async function executeToggleStatus() {
    const { supplierId, currentStatus } = confirmModal;
    setConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      await api.put(`/admin/suppliers/${supplierId}/status`, { isActive: !currentStatus });
      await loadSuppliers();
      setConfirmModal({ isOpen: false, supplierId: null, currentStatus: false, loading: false });
    } catch (err) {
      alert("Failed to toggle status: " + (err.response?.data?.message || err.message));
      setConfirmModal(prev => ({ ...prev, loading: false }));
    }
  }

  async function handleCreateSupplier(e) {
    e.preventDefault();
    setFormError("");
    
    // Strict validations
    if (!formData.businessName || !formData.fullName || !formData.phone || !formData.address) {
      setFormError("Please fill in all required fields (marked with *)");
      return;
    }

    if (!formData.username || !formData.password) {
      setFormError("Username and Temporary Password credentials are required");
      return;
    }

    if (formData.username.length < 3) {
      setFormError("Username must be at least 3 characters");
      return;
    }

    if (formData.password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/admin/suppliers", formData);
      setShowModal(false);
      // Reset form
      setFormData({
        businessName: "",
        taxId: "",
        businessType: "Sole Proprietorship",
        fullName: "",
        phone: "",
        email: "",
        address: "",
        city: "Rawalpindi",
        state: "Punjab",
        postalCode: "",
        country: "Pakistan",
        username: "",
        password: "",
        region: "",
        plan: "basic",
        isActive: true
      });
      loadSuppliers();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create supplier. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate statistics
  const activeCount = suppliers.filter(s => s.isActive).length;
  const totalRiders = suppliers.reduce((acc, curr) => acc + (curr.totalRiders || 0), 0);
  const totalCustomers = suppliers.reduce((acc, curr) => acc + (curr.totalCustomers || 0), 0);
  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);

  if (activeTab === "settings") {
    return <AdminSettings user={user} />;
  }

  if (activeTab === "system_info") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn">
        <div className="bg-white p-10 rounded-3xl text-center border border-gray-100 shadow-xl">
          <span className="text-5xl block mb-4">⚙️</span>
          <h2 className="text-xl font-bold text-gray-800">System Information</h2>
          <p className="text-gray-500 mt-2">Server health and environment details will appear here.</p>
        </div>
      </div>
    );
  }

  if (activeTab === "invoices") {
    return <AdminInvoices invoices={invoices} suppliers={suppliers} loadInvoices={loadInvoices} />;
  }

  if (activeTab === "subscriptions") {
    return <AdminSubscriptions />;
  }

  if (activeTab === "overview") {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
              <DropIcon size={24} color="#3b82f6" /> Super Admin Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">Platform wide statistics and revenue tracking.</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
            <AlertTriangle className="w-4 h-4 inline-block" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-500/10 flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
            <div>
              <p className="text-blue-100 text-xs font-bold mb-2 uppercase tracking-wider">Total Revenue</p>
              <h3 className="text-4xl font-black">${totalRevenue.toLocaleString()}</h3>
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm text-blue-100 font-semibold bg-white/10 py-1.5 px-3 rounded-xl w-fit">
              <CreditCard className="w-4 h-4" /> <span>Paid Invoices</span>
            </div>
          </div>
          <StatCard label="Total Suppliers" value={loading ? "…" : suppliers.length} icon={<Building2 className="w-6 h-6 text-blue-600" />} sub={`${activeCount} Active Tenants`} />
          <StatCard label="Affiliated Customers" value={loading ? "…" : totalCustomers} icon={<Users className="w-6 h-6 text-blue-600" />} sub="Platform customers" />
          <StatCard label="Active Riders" value={loading ? "…" : totalRiders} icon={<Bike className="w-6 h-6 text-blue-600" />} sub="Managing deliveries" />
        </div>
      </div>
    );
  }

  // default to suppliers
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <DropIcon size={24} color="#3b82f6" /> Water Supplier Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Configure global suppliers and monitor their tenants.</p>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(""); }}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2 text-sm self-start md:self-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add New Water Supplier
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
          <AlertTriangle className="w-4 h-4 inline-block" /> {error}
        </div>
      )}

      {/* Main Suppliers Workspace */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md shadow-gray-100/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <div>
            <h2 className="font-bold text-gray-800">Water Supplying Companies</h2>
            <p className="text-xs text-gray-400 mt-0.5">List of verified water tenants registered on the AquaFlow platform.</p>
          </div>
          <button onClick={loadSuppliers} className="text-xs text-blue-600 font-semibold hover:underline flex items-center gap-1">
            <RefreshCw className="w-3 h-3 inline-block" /> Refresh List
          </button>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-blue-600 rounded-full mb-3" role="status" />
            <p>Loading registered water companies...</p>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <span className="text-4xl block mb-2">🏢</span>
            <p className="text-sm font-semibold">No suppliers onboarded yet</p>
            <p className="text-xs text-gray-400 mt-1">Click the "Add New Water Supplier" button to register the first one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-100">
                  <th className="px-6 py-4">Company & Owner</th>
                  <th className="px-6 py-4">Credentials</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Subscription Plan</th>
                  <th className="px-6 py-4">Riders & Customers</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-gray-800">{s.businessName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Owner: {s.userId?.fullName || "N/A"}</p>
                        <p className="text-xs text-gray-400">Phone: {s.userId?.phone || "N/A"}</p>
                        {s.userId?.email && <p className="text-xs text-gray-400">Email: {s.userId.email}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-2xl space-y-1.5 w-[200px]">
                        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>User:</span> 
                          <span className="font-mono text-blue-600 font-bold select-all truncate ml-auto">{s.userId?.username || "—"}</span>
                        </p>
                        <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span>Pass:</span> 
                          <span className="font-mono text-gray-700 bg-white px-1.5 py-0.5 rounded border border-gray-100 font-bold select-all ml-auto">{s.userId?.passwordText || "—"}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-700">{s.city}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{s.region || "No region set"}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={s.plan}
                        onChange={(e) => handlePlanChange(s._id, e.target.value)}
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg uppercase tracking-wider outline-none cursor-pointer ${
                          s.plan === "enterprise" ? "bg-purple-50 text-purple-700 border border-purple-200" :
                          s.plan === "standard" ? "bg-blue-50 text-blue-700 border border-blue-200" :
                          "bg-gray-50 text-gray-600 border border-gray-200"
                        }`}
                      >
                        <option value="basic">BASIC</option>
                        <option value="standard">STANDARD</option>
                        <option value="enterprise">ENTERPRISE</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-700 flex items-center gap-1"><Bike className="w-3.5 h-3.5 text-gray-400" /> Riders: {s.totalRiders || 0}</p>
                        <p className="text-xs font-semibold text-gray-700 mt-1 flex items-center gap-1"><Home className="w-3.5 h-3.5 text-gray-400" /> Customers: {s.totalCustomers || 0}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => requestToggleStatus(s._id, s.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold hover:shadow-sm transition-all cursor-pointer ${
                          s.isActive ? "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100" : "bg-red-50 text-red-700 border border-red-100 hover:bg-red-100"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        {s.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── ADD NEW SUPPLIER SINGLE-PAGE SCROLLABLE MODAL ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white select-none">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <DropIcon size={20} color="#1d4ed8" /> Add New Water Supplier
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="px-6 py-6 max-h-[68vh] overflow-y-auto space-y-6 bg-white scroll-smooth">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs sticky top-0 z-10 shadow-sm flex items-center gap-1.5">
                  <span><AlertTriangle className="w-4 h-4 inline-block" /></span> {formError}
                </div>
              )}

              {/* ── SECTION 1: BUSINESS INFO ── */}
              <div className="space-y-4">
                <h4 className="font-bold text-blue-700 text-sm border-b border-gray-100 pb-1.5 flex items-center gap-1">
                  <span>1.</span> Business Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Legal Business Name *</label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={handleChange("businessName")}
                      placeholder="e.g. Pure Water Co. Ltd"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tax ID / VAT Number</label>
                    <input
                      type="text"
                      value={formData.taxId}
                      onChange={handleChange("taxId")}
                      placeholder="XX-XXXXXXX"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Business Type *</label>
                    <select
                      value={formData.businessType}
                      onChange={handleChange("businessType")}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    >
                      <option>Sole Proprietorship</option>
                      <option>Partnership</option>
                      <option>Private Limited</option>
                      <option>LLC</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: CONTACT DETAILS ── */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-blue-700 text-sm border-b border-gray-100 pb-1.5 flex items-center gap-1">
                  <span>2.</span> Contact Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Primary Contact Name *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange("fullName")}
                      placeholder="Ahmed Khan"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange("phone")}
                      placeholder="03001234567"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleChange("email")}
                      placeholder="contact@business.com"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ── SECTION 3: BILLING ADDRESS ── */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-blue-700 text-sm border-b border-gray-100 pb-1.5 flex items-center gap-1">
                  <span>3.</span> Billing Address
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={handleChange("address")}
                      placeholder="123 Water St"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">City *</label>
                    <select
                      value={formData.city}
                      onChange={handleChange("city")}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    >
                      {["Rawalpindi", "Islamabad", "Lahore", "Karachi", "Multan", "Peshawar", "Quetta", "Faisalabad", "Other"].map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">State / Province</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={handleChange("state")}
                      placeholder="Punjab"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Postal Code</label>
                    <input
                      type="text"
                      value={formData.postalCode}
                      onChange={handleChange("postalCode")}
                      placeholder="46000"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={handleChange("country")}
                      placeholder="Pakistan"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: LOGIN CREDENTIALS ── */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-blue-700 text-sm border-b border-gray-100 pb-1.5 flex items-center gap-1">
                  <span>4.</span> Login Credentials
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={handleChange("username")}
                      placeholder="supplier_admin"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Temporary Password *</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.password}
                        onChange={handleChange("password")}
                        placeholder="••••••••"
                        className="flex-1 px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="px-3 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 hover:text-gray-800 font-bold rounded-xl text-xs transition-colors shrink-0"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── SECTION 5: OPERATIONAL DETAILS ── */}
              <div className="space-y-4 pt-2">
                <h4 className="font-bold text-blue-700 text-sm border-b border-gray-100 pb-1.5 flex items-center gap-1">
                  <span>5.</span> Operational Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Region/District</label>
                    <input
                      type="text"
                      value={formData.region}
                      onChange={handleChange("region")}
                      placeholder="e.g. North District"
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Initial Subscription Plan *</label>
                    <select
                      value={formData.plan}
                      onChange={handleChange("plan")}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-gray-800 text-sm bg-white"
                    >
                      <option value="basic">Basic Plan</option>
                      <option value="standard">Standard Plan</option>
                      <option value="enterprise">Enterprise Plan</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-2xl mt-2 select-none">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Initial Account Status</p>
                      <p className="text-xs text-gray-400 mt-0.5">Enable supplier immediately upon creation</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleChange("isActive")}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer / Buttons */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center select-none">
              
              {/* Send email credentials toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmailToggle}
                  onChange={(e) => setSendEmailToggle(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold text-gray-500 hover:text-gray-700">Send credentials via email</span>
              </label>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateSupplier}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-100 transition-colors"
                >
                  {submitting ? "Processing..." : "Create Supplier"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={executeToggleStatus}
        title={confirmModal.currentStatus ? "Deactivate Supplier?" : "Activate Supplier?"}
        message={`Are you sure you want to ${confirmModal.currentStatus ? 'deactivate' : 'activate'} this water supplier? ${confirmModal.currentStatus ? 'They will instantly lose access to their dashboard.' : 'They will regain full access to their dashboard immediately.'}`}
        confirmText={confirmModal.currentStatus ? "Yes, Deactivate" : "Yes, Activate"}
        cancelText="Cancel"
        type={confirmModal.currentStatus ? "danger" : "success"}
        loading={confirmModal.loading}
      />
    </div>
  );
}
