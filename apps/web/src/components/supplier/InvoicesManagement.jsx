import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Download, Send } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function InvoicesManagement({ customers, invoices = [], onGenerateInvoice }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  const formattedInvoices = invoices.map(inv => ({
    id: inv._id,
    name: inv.customerId?.userId?.fullName || "Walk-in Customer",
    period: `${new Date(inv.periodStart).toLocaleDateString()} - ${new Date(inv.periodEnd).toLocaleDateString()}`,
    amount: inv.amount,
    status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1), // 'paid', 'unpaid', etc.
    stringId: inv._id.substring(inv._id.length - 6).toUpperCase()
  }));

  let filteredInvoices = formattedInvoices.filter(inv => inv.name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (filter === "paid") filteredInvoices = filteredInvoices.filter(i => i.status === "Paid");
  if (filter === "unpaid") filteredInvoices = filteredInvoices.filter(i => i.status === "Unpaid");

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('invoices_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('invoices_sub')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder={t('search_customers')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm shrink-0">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === "all" ? "bg-gray-100 text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('all')}
            </button>
            <button 
              onClick={() => setFilter("paid")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === "paid" ? "bg-gray-100 text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('paid')}
            </button>
            <button 
              onClick={() => setFilter("unpaid")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === "unpaid" ? "bg-gray-100 text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('unpaid')}
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('customer_name')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('billing_period')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('amount')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('status')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{inv.name}</p>
                    <p className="text-xs text-gray-500 font-medium">ID: {inv.stringId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700 font-medium">{inv.period}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">${inv.amount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === "Paid" && (
                      <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-[#0058bf] text-white shadow-sm">{t('paid')}</span>
                    )}
                    {inv.status === "Unpaid" && (
                      <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-red-100 text-red-700 shadow-sm">{t('unpaid')}</span>
                    )}
                    {inv.status === "Partial" && (
                      <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 shadow-sm border border-gray-200">{t('partial')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={t('download_pdf')}>
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title={t('send_email')}>
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-base font-bold text-gray-500">{t('no_invoices_found')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">
            {t('showing_entries', { filtered: filteredInvoices.length, total: invoices.length })}
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50" disabled>
              {t('prev')}
            </button>
            <button className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50 transition-colors bg-white shadow-sm">
              {t('next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
