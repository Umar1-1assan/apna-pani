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

  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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

  const filteredInvoices = invoices.filter(inv => {
    const matchSupplier = filterSupplier === 'all' || inv.supplierId?._id === filterSupplier;
    const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
    
    let matchDate = true;
    if (filterStartDate || filterEndDate) {
      const invDate = new Date(inv.billingPeriodStart || inv.createdAt);
      if (filterStartDate) {
        matchDate = matchDate && invDate >= new Date(filterStartDate);
      }
      if (filterEndDate) {
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        matchDate = matchDate && invDate <= endDate;
      }
    }
    
    return matchSupplier && matchStatus && matchDate;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fadeIn space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-blue-600 shrink-0" /> Invoices
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage tenant billing and subscriptions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Generate New Invoice
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-black text-gray-900">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-inner">
            <Banknote className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Outstanding Invoices</p>
            <p className="text-3xl font-black text-gray-900">{outstandingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md shadow-gray-100/30 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/50 to-white">
          <h2 className="font-bold text-gray-800">Recent Billing</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto mt-2 xl:mt-0">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-300 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 shadow-sm">
              <input 
                type="date" 
                value={filterStartDate}
                onChange={e => setFilterStartDate(e.target.value)}
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="text-sm font-medium text-gray-700 outline-none bg-transparent cursor-pointer w-[118px] text-center"
                title="Start Date"
              />
              <span className="text-gray-400 font-medium">→</span>
              <input 
                type="date" 
                value={filterEndDate}
                onChange={e => setFilterEndDate(e.target.value)}
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => e.target.showPicker && e.target.showPicker()}
                className="text-sm font-medium text-gray-700 outline-none bg-transparent cursor-pointer w-[118px] text-center"
                title="End Date"
              />
            </div>
            
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer min-w-[160px] appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="all">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s._id} value={s._id}>{s.businessName}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm cursor-pointer min-w-[150px] appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em', paddingRight: '2.5rem' }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
              <option value="pending_verification">Verifying</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
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
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    {invoices.length === 0 ? "No invoices generated yet." : "No invoices match the selected filters."}
                  </td>
                </tr>
              ) : filteredInvoices.map(inv => (
                <tr key={inv._id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-bold text-gray-800">{inv.supplierId?.businessName}</td>
                  <td className="px-6 py-4 uppercase text-xs">
                    <span className="inline-flex px-2 py-0.5 bg-gray-100 border border-gray-200 rounded font-semibold text-gray-600">
                      {inv.supplierId?.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    {new Date(inv.billingPeriodStart).toLocaleDateString()} - {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-800">${inv.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      inv.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-100' :
                      inv.status === 'pending_verification' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      inv.status === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200' :
                      'bg-orange-50 text-orange-700 border border-orange-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        inv.status === 'paid' ? 'bg-green-500' :
                        inv.status === 'pending_verification' ? 'bg-blue-500' :
                        inv.status === 'overdue' ? 'bg-red-500' :
                        'bg-orange-500'
                      }`} />
                      {inv.status === 'pending_verification' ? 'Pending Verification' : inv.status.toUpperCase()}
                    </span>
                    {inv.paymentNotes && (
                      <div className="text-[10px] text-gray-500 mt-1 max-w-[150px] truncate" title={inv.paymentNotes}>
                        Notes: {inv.paymentNotes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === 'pending_verification' ? (
                      <button onClick={() => markAsPaid(inv._id)} className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
                        Verify & Mark Paid
                      </button>
                    ) : inv.status !== 'paid' && (
                      <button onClick={() => markAsPaid(inv._id)} className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 px-3.5 py-1.5 rounded-xl font-semibold transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]">
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
