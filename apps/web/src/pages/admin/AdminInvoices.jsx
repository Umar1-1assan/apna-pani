import { Receipt, Plus, Banknote, AlertTriangle, Droplets } from 'lucide-react';
import { useState } from "react";
import { api } from "../../api/client";

export function AdminInvoices({ invoices, suppliers, loadInvoices }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    amount: "",
    billingPeriodStart: "",
    billingPeriodEnd: "",
  });

  const handleSupplierSelect = (supplierId) => {
    const s = suppliers.find(sup => sup._id === supplierId);
    let amount = 0;
    if (s) {
      if (s.plan === 'enterprise') amount = 2499;
      else if (s.plan === 'standard') amount = 129;
      else amount = 49;
    }
    setFormData(prev => ({ ...prev, supplierId, amount }));
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/invoices", formData);
      setShowModal(false);
      loadInvoices();
    } catch (err) {
      alert("Failed to generate invoice");
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (id) => {
    try {
      await api.put(`/admin/invoices/${id}/status`, { status: 'paid' });
      loadInvoices();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const totalRevenue = invoices.filter(inv => inv.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
  const outstandingCount = invoices.filter(inv => inv.status === 'unpaid').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 p-6 rounded-3xl border border-white/60 backdrop-blur-md">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Receipt className="w-6 h-6 inline-block" /> Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage tenant billing and subscriptions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg transition-all text-sm"
        >
          <Plus className="w-4 h-4 inline-block" /> Generate New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-800">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl"><Banknote className="w-6 h-6 inline-block" /></div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Outstanding Invoices</p>
            <p className="text-3xl font-bold text-gray-800">{outstandingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-xl"><AlertTriangle className="w-6 h-6 inline-block" /></div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
          <h2 className="font-bold text-gray-800">Recent Billing</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500 font-semibold border-b border-gray-100">
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Current Plan</th>
                <th className="px-6 py-4">Billing Period</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">No invoices generated yet.</td>
                </tr>
              ) : invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-800">{inv.supplierId?.businessName}</td>
                  <td className="px-6 py-4 uppercase text-xs">{inv.supplierId?.plan}</td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(inv.billingPeriodStart).toLocaleDateString()} - {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-semibold">${inv.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      inv.status === 'paid' ? 'bg-green-50 text-green-700' :
                      inv.status === 'overdue' ? 'bg-red-50 text-red-700' :
                      'bg-orange-50 text-orange-700'
                    }`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status !== 'paid' && (
                      <button onClick={() => markAsPaid(inv._id)} className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded font-semibold transition-colors">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
            
            {/* Form Side */}
            <div className="w-full md:w-1/2 p-8 border-r border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-800 text-xl">Generate New Invoice</h3>
                <button onClick={() => setShowModal(false)} className="md:hidden text-gray-400 text-2xl">&times;</button>
              </div>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Supplier</label>
                  <select 
                    required 
                    value={formData.supplierId} 
                    onChange={e => handleSupplierSelect(e.target.value)}
                    className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-sm"
                  >
                    <option value="">Select a supplier...</option>
                    {suppliers.map(s => <option key={s._id} value={s._id}>{s.businessName}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                    <input type="date" required value={formData.billingPeriodStart} onChange={e => setFormData({...formData, billingPeriodStart: e.target.value})} onClick={e => e.target.showPicker && e.target.showPicker()} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                    <input type="date" required value={formData.billingPeriodEnd} onChange={e => setFormData({...formData, billingPeriodEnd: e.target.value})} onClick={e => e.target.showPicker && e.target.showPicker()} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Invoice Number</label>
                  <input type="text" readOnly value={formData.invoiceNumber} className="w-full px-3 py-2.5 border-2 border-gray-200 bg-gray-50 rounded-xl text-sm outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Amount ($)</label>
                  <input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="pt-4 flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors">Cancel</button>
                  <button type="submit" disabled={loading} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-md">
                    {loading ? "Generating..." : "Generate & Send"}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview Side */}
            <div className="hidden md:block w-full md:w-1/2 p-8 bg-gray-50">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 text-center">Live Preview</h4>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
                <div className="flex justify-between items-start mb-10">
                  <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2"><Droplets className="w-6 h-6 inline-block text-blue-600" /> AquaFlow</h2>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-200 tracking-widest uppercase">Invoice</p>
                    <p className="text-sm font-bold text-gray-800 mt-1">{formData.invoiceNumber}</p>
                  </div>
                </div>
                <div className="mb-8">
                  <p className="text-xs font-bold text-gray-400 mb-1">BILL TO:</p>
                  <p className="font-bold text-gray-800">{suppliers.find(s => s._id === formData.supplierId)?.businessName || "Supplier Name"}</p>
                </div>
                <div className="border-t border-b border-gray-100 py-4 mb-8 flex justify-between">
                  <p className="text-sm font-semibold text-gray-600">Platform Subscription</p>
                  <p className="text-sm font-bold text-gray-800">${formData.amount || 0}</p>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-800">
                  <p>Total Due</p>
                  <p>${formData.amount || 0}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
