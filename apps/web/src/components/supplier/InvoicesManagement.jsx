import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Download, Send, Check, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { InvoicePDFModal } from './modals/InvoicePDFModal';
import { api } from '../../api/client';
import { toast } from 'react-hot-toast';

const getCurrentMonth = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export function InvoicesManagement({ customers, invoices = [], loadInvoices, onGenerateInvoice, supplierProfile }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [filterMonth, setFilterMonth] = useState(getCurrentMonth());
  const [selectedInvoiceForPdf, setSelectedInvoiceForPdf] = useState(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, filterMonth]);

  const formattedInvoices = invoices.map(inv => {
    const statusStr = inv.paymentStatus || inv.status || 'unpaid';
    return {
      id: inv._id,
      name: inv.customerId?.userId?.fullName || "Walk-in Customer",
      period: `${new Date(inv.startDate || inv.periodStart || inv.createdAt).toLocaleDateString()} - ${new Date(inv.endDate || inv.periodEnd || inv.createdAt).toLocaleDateString()}`,
      amount: inv.totalAmount || inv.amount || 0,
      status: statusStr === 'pending_confirmation' ? 'Pending Confirmation' : statusStr.charAt(0).toUpperCase() + statusStr.slice(1), // 'paid', 'unpaid', etc.
      stringId: inv._id.substring(inv._id.length - 6).toUpperCase(),
      originalInvoice: inv
    };
  });

  let filteredInvoices = formattedInvoices.filter(inv => inv.name.toLowerCase().includes(searchTerm.toLowerCase()));
  if (filter === "paid") filteredInvoices = filteredInvoices.filter(i => i.status === "Paid");
  if (filter === "unpaid") filteredInvoices = filteredInvoices.filter(i => i.status === "Unpaid");
  if (filter === "pending_confirmation") filteredInvoices = filteredInvoices.filter(i => i.status === "Pending Confirmation");

  const handleConfirmPayment = async (id) => {
    try {
      await api.put(`/invoices/${id}/confirm-payment`);
      toast.success(t('payment_confirmed_success'));
      if (loadInvoices) loadInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || t('payment_confirm_failed'));
    }
  };

  if (filterMonth) {
    filteredInvoices = filteredInvoices.filter(inv => {
      const originalInv = invoices.find(i => i._id === inv.id);
      if (!originalInv) return true;
      const invDate = new Date(originalInv.startDate || originalInv.periodStart || originalInv.createdAt);
      const invYear = invDate.getFullYear();
      const invMonthStr = String(invDate.getMonth() + 1).padStart(2, '0');
      const invMonthVal = `${invYear}-${invMonthStr}`;
      return invMonthVal === filterMonth;
    });
  }

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('invoices_title')}</h1>
            <p className="text-sm text-gray-500 mt-1">{t('invoices_sub')}</p>
          </div>
          <button 
            onClick={() => loadInvoices && loadInvoices()}
            className="flex items-center justify-center p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-500 hover:text-blue-600 transition-colors" />
          </button>
        </div>
        
        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm w-full">
          {/* Month/Year Picker */}
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-300 transition-colors focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 shrink-0">
            <input 
              type="month" 
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              className="text-sm font-semibold text-gray-700 bg-transparent border-none focus:outline-none focus:ring-0 cursor-pointer w-[140px]"
              title="Filter by Month"
            />
          </div>

          <div className="relative flex-1 min-w-[200px]">
            <input 
              type="text" 
              placeholder={t('search_customers')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-400"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          <div className="flex bg-gray-100 rounded-xl p-1 border border-gray-200 shadow-inner shrink-0 overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setFilter("all")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filter === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('all')}
            </button>
            <button 
              onClick={() => setFilter("paid")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filter === "paid" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('paid')}
            </button>
            <button 
              onClick={() => setFilter("unpaid")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filter === "unpaid" ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('unpaid')}
            </button>
            <button 
              onClick={() => setFilter("pending_confirmation")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${filter === "pending_confirmation" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              {t('pending')}
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
              {paginatedInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{inv.name}</p>
                    <p className="text-xs text-gray-500 font-medium">ID: {inv.stringId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-700 font-medium">{inv.period}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">PKR {inv.amount.toLocaleString()}</p>
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
                    {inv.status === "Pending Confirmation" && (
                      <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700 shadow-sm">{t('pending')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      {inv.status === "Pending Confirmation" && (
                        <button 
                          onClick={() => handleConfirmPayment(inv.id)}
                          className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors shadow-sm" title={t('confirm_payment_title')}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          const originalInv = invoices.find(i => i._id === inv.id);
                          setSelectedInvoiceForPdf(originalInv);
                        }}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={t('download_invoice_title')}
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title={t('send_invoice_title')}>
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
            {t('showing_entries', { filtered: `${filteredInvoices.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - ${Math.min(currentPage * itemsPerPage, filteredInvoices.length)}`, total: filteredInvoices.length })}
          </span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-500 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('prev')}
            </button>
            <button 
              disabled={currentPage >= totalPages || totalPages === 0}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50 transition-colors bg-white shadow-sm disabled:opacity-50"
            >
              {t('next')}
            </button>
          </div>
        </div>
      </div>
      

      {selectedInvoiceForPdf && (
        <InvoicePDFModal
          invoice={selectedInvoiceForPdf}
          onClose={() => setSelectedInvoiceForPdf(null)}
          supplierProfile={supplierProfile}
        />
      )}
    </div>
  );
}
