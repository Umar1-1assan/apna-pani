import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Download, Send } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function InvoicesManagement({ customers, invoices = [], onGenerateInvoice }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

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

  if (filterStartDate || filterEndDate) {
    filteredInvoices = filteredInvoices.filter(inv => {
      // Find original invoice to get proper dates
      const originalInv = invoices.find(i => i._id === inv.id);
      if (!originalInv) return true;
      
      const invDate = new Date(originalInv.periodStart || originalInv.createdAt);
      let match = true;
      
      if (filterStartDate) {
        match = match && invDate >= new Date(filterStartDate);
      }
      if (filterEndDate) {
        const endDate = new Date(filterEndDate);
        endDate.setHours(23, 59, 59, 999);
        match = match && invDate <= endDate;
      }
      return match;
    });
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('invoices_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('invoices_sub')}</p>
        </div>
        
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 sm:mt-0">
            {/* Date Range Picker */}
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 hover:border-gray-300 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 shadow-sm shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
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

            <div className="relative w-full sm:w-64 shrink-0">
              <input 
                type="text" 
                placeholder={t('search_customers')} 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            
            <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 shadow-inner shrink-0">
              <button 
                onClick={() => setFilter("all")}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t('all')}
              </button>
              <button 
                onClick={() => setFilter("paid")}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === "paid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t('paid')}
              </button>
              <button 
                onClick={() => setFilter("unpaid")}
                className={`px-5 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === "unpaid" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
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
