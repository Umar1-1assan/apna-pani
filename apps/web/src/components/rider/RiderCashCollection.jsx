import React, { useState, useEffect } from 'react';
import { Banknote, Receipt, CheckCircle, Wallet, ArrowDownRight, RefreshCw, XCircle } from 'lucide-react';
import { api } from '../../api/client';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../contexts/LanguageContext';

export function RiderCashCollection() {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState([]);
  const [cashInHand, setCashInHand] = useState(0);
  const [loading, setLoading] = useState(true);
  const [collectingId, setCollectingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, invoiceId: null });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices/rider/pending');
      const data = res.data.data;
      if (Array.isArray(data)) {
        // Fallback in case backend returns old format
        setInvoices(data);
      } else {
        setInvoices(data.invoices || []);
        setCashInHand(data.cashInHand || 0);
      }
    } catch (err) {
      toast.error(t('failed_load_pending_invoices'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCollect = async () => {
    const id = confirmModal.invoiceId;
    setConfirmModal({ isOpen: false, invoiceId: null });
    if (!id) return;

    try {
      setCollectingId(id);
      await api.put(`/invoices/${id}/rider-collect`);
      toast.success(t('cash_collected_success'));
      fetchInvoices();
    } catch (err) {
      toast.error(err.response?.data?.message || t('failed_collect_cash'));
    } finally {
      setCollectingId(null);
    }
  };

  const totalPending = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

  if (loading && invoices.length === 0) {
    return <div className="p-12 text-center text-gray-500 animate-pulse">{t('loading_assigned_invoices')}</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
      {/* ── Left Column ── */}
      <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24 h-max">
        <div className="bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full" />
          
          <div className="relative">
            <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">{t('total_pending_collection')}</p>
            <h2 className="text-4xl font-black leading-none mb-4">PKR {totalPending.toLocaleString()}</h2>
            
            <div className="bg-white/15 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] text-indigo-200 font-bold uppercase">{t('cash_collected_in_hand')}</p>
                <p className="text-xl font-black text-emerald-300">PKR {cashInHand.toLocaleString()}</p>
              </div>
              <Wallet className="w-8 h-8 text-emerald-300 opacity-80" />
            </div>

            <div className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] text-indigo-200 font-bold uppercase">{t('unpaid_invoices')}</p>
                <p className="text-xl font-black">{invoices.length}</p>
              </div>
              <Receipt className="w-8 h-8 text-indigo-200 opacity-80" />
            </div>
          </div>
        </div>

        <button 
          onClick={fetchInvoices} 
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('refresh_list')}
        </button>
      </div>

      {/* ── Right Column ── */}
      <div className="lg:col-span-8 space-y-5">
        <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
          <Banknote className="w-5 h-5 text-indigo-500" /> {t('pending_customer_invoices')}
        </h3>

        {invoices.length === 0 ? (
          <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
            <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-700">{t('all_caught_up_invoices')}</h3>
            <p className="text-sm text-gray-500 mt-1">{t('no_unpaid_invoices_assigned')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {invoices.map(inv => (
                <div key={inv._id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base">{inv.customerId?.userId?.fullName || 'Customer'}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium">{inv.customerId?.userId?.address || 'No address'}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 uppercase border border-amber-100">
                          {t('due')}: PKR {inv.totalAmount}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">{t('generated')}: {new Date(inv.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
                    <button
                      onClick={() => setConfirmModal({ isOpen: true, invoiceId: inv._id })}
                      disabled={collectingId === inv._id}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-all disabled:opacity-70 flex items-center gap-2"
                    >
                      {collectingId === inv._id ? t('processing') : t('collect_cash_button')} <ArrowDownRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-slideUp border border-gray-100">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Banknote className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">{t('collect_cash_q')}</h3>
            <p className="text-gray-500 text-center text-sm font-medium mb-8">
              {t('collect_cash_confirm')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, invoiceId: null })}
                className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCollect}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
