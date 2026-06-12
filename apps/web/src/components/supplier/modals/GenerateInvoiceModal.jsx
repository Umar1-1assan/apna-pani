import { X, Send, Plus, Receipt } from 'lucide-react';
import React, { useState } from 'react';

export function GenerateInvoiceModal({ customers, onClose, onGenerate, submitting }) {
  const [form, setForm] = useState({
    customerId: "",
    startDate: "",
    endDate: "",
    sendEmail: true,
    markPaid: false,
    lineItems: [
      { id: 1, description: "Water Bottles (20L)", qty: 45, unitPrice: 6.50 },
      { id: 2, description: "Service Fee", qty: 1, unitPrice: 45.00 }
    ]
  });

  const handleLineItemChange = (id, field, value) => {
    setForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const addLineItem = () => {
    setForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, { id: Date.now(), description: "", qty: 1, unitPrice: 0 }]
    }));
  };

  const subtotal = form.lineItems.reduce((acc, item) => acc + (item.qty * item.unitPrice), 0);
  const tax = subtotal * 0.10;
  const total = subtotal + tax;

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerate({ ...form, total });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Generate New Invoice</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          <form id="generateInvoiceForm" onSubmit={handleSubmit} className="flex flex-col gap-6">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</label>
              <select 
                required 
                value={form.customerId} 
                onChange={(e) => setForm(prev => ({ ...prev, customerId: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm bg-white"
              >
                <option value="" disabled>Select Customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>{c.userId?.fullName || 'N/A'}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Start Date</label>
                <input type="date" required value={form.startDate} onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">End Date</label>
                <input type="date" required value={form.endDate} onChange={(e) => setForm(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice Details</label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-blue-50/50 text-gray-600 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Item Description</th>
                      <th className="px-4 py-2 font-semibold w-20">Qty</th>
                      <th className="px-4 py-2 font-semibold w-28">Unit Price</th>
                      <th className="px-4 py-2 font-semibold w-24 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {form.lineItems.map(item => (
                      <tr key={item.id} className="bg-white">
                        <td className="px-4 py-3">
                          <input type="text" value={item.description} onChange={(e) => handleLineItemChange(item.id, 'description', e.target.value)} className="w-full bg-transparent outline-none font-medium text-gray-800" placeholder="Description" />
                        </td>
                        <td className="px-4 py-3">
                          <input type="number" value={item.qty} onChange={(e) => handleLineItemChange(item.id, 'qty', Number(e.target.value))} className="w-full bg-transparent outline-none text-gray-600" min="1" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-gray-400 mr-1">Rs</span>
                            <input type="number" value={item.unitPrice} onChange={(e) => handleLineItemChange(item.id, 'unitPrice', Number(e.target.value))} className="w-full bg-transparent outline-none text-gray-600" min="0" step="0.01" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                          Rs {(item.qty * item.unitPrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={addLineItem} className="w-full py-3 bg-blue-50/30 text-blue-600 hover:bg-blue-50 text-sm font-semibold flex items-center justify-center gap-2 transition-colors border-t border-gray-200">
                  <Plus className="w-4 h-4" /> Add Line Item
                </button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-end gap-6 mt-4">
              <div className="flex flex-col gap-4 w-full md:w-auto">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm(prev => ({ ...prev, sendEmail: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">Send via Email automatically</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.markPaid} onChange={(e) => setForm(prev => ({ ...prev, markPaid: e.target.checked }))} className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-semibold text-gray-700">Mark as Paid (Direct Debit)</span>
                </label>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 w-full md:w-64">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500 font-semibold">Subtotal</span>
                  <span className="text-sm text-gray-800 font-bold">Rs {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-3">
                  <span className="text-sm text-gray-500 font-semibold">Tax (10%)</span>
                  <span className="text-sm text-gray-800 font-bold">Rs {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-3">
                  <span className="text-base text-gray-800 font-bold">Total</span>
                  <span className="text-lg text-blue-600 font-black">Rs {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-semibold">
            Cancel
          </button>
          <button form="generateInvoiceForm" type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2">
            <Send className="w-4 h-4" /> {submitting ? "Generating..." : "Generate & Send Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
