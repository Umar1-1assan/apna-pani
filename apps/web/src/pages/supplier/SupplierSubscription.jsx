import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../contexts/LanguageContext';
import { CreditCard, CheckCircle2, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Users, Bike, Infinity, CalendarDays, ReceiptText } from 'lucide-react';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export function SupplierSubscription({ user }) {
  const { t } = useTranslation();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    plan: null,
    type: null // 'upgrade' | 'downgrade'
  });
  const [processing, setProcessing] = useState(false);
  
  // Payment Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    invoice: null,
    notes: ''
  });

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get('/supplier/subscription');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPlan = async () => {
    setProcessing(true);
    try {
      await api.post('/supplier/subscription/request', { requestedPlan: confirmModal.plan });
      setConfirmModal({ isOpen: false, plan: null, type: null });
      loadSubscription(); // Reload to show pending status
    } catch (err) {
      alert('Failed to request plan change: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.put(`/supplier/invoices/${paymentModal.invoice._id}/pay`, { paymentNotes: paymentModal.notes });
      setPaymentModal({ isOpen: false, invoice: null, notes: '' });
      loadSubscription(); // Reload to show updated invoice status
    } catch (err) {
      alert('Failed to submit payment details: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const { currentPlan, planStartsAt, planExpiresAt, totalRiders, pendingRequest, invoices } = data;

  const packages = [
    {
      id: 'basic',
      name: t('basic_plan'),
      desc: t('basic_desc'),
      price: 'Free',
      limits: { riders: 3 },
      color: 'blue'
    },
    {
      id: 'standard',
      name: t('standard_plan'),
      desc: t('standard_desc'),
      price: '₨ 2,500/mo',
      limits: { riders: 10 },
      color: 'indigo'
    },
    {
      id: 'enterprise',
      name: t('enterprise_plan'),
      desc: t('enterprise_desc'),
      price: '₨ 5,000/mo',
      limits: { riders: 'unlimited' },
      color: 'violet'
    }
  ];

  const getPackageLevel = (planId) => {
    return packages.findIndex(p => p.id === planId);
  };

  const currentLevel = getPackageLevel(currentPlan);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Pending Request Banner */}
      {pendingRequest && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start sm:items-center gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">{t('request_pending')}: {pendingRequest.requestedPlan.toUpperCase()}</h3>
            <p className="text-sm text-amber-700 mt-0.5">{t('request_pending_desc')}</p>
          </div>
        </div>
      )}

      {/* Current Subscription Card */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl shadow-blue-900/5 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-60"></div>
        
        <div className="relative z-10">
          <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> {t('my_subscription')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{t('current_plan')}</p>
              <h3 className="text-3xl font-black text-gray-900 capitalize">{currentPlan}</h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100 mt-3">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Active
              </span>
            </div>

            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{t('plan_starts')}</p>
              <p className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-500" />
                {formatDate(planStartsAt)}
              </p>
              
              <div className="w-full h-px bg-gray-100 my-4"></div>
              
              <p className="text-gray-500 text-sm font-medium mb-1">{t('plan_expires')}</p>
              <p className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-amber-500" />
                {formatDate(planExpiresAt)}
              </p>
            </div>

            <div>
              <p className="text-gray-500 text-sm font-medium mb-1">{t('riders_used')}</p>
              <div className="flex items-end gap-2">
                <h3 className="text-3xl font-black text-gray-900">{totalRiders}</h3>
                <span className="text-gray-400 font-semibold mb-1">
                  / {currentPlan === 'enterprise' ? <Infinity className="inline w-5 h-5" /> : packages[currentLevel].limits.riders}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Packages */}
      <h2 className="text-xl font-bold text-gray-900 mt-8 mb-4">{t('available_packages')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, index) => {
          const isCurrent = currentPlan === pkg.id;
          const isPending = pendingRequest?.requestedPlan === pkg.id;
          const isUpgrade = index > currentLevel;
          const isDowngrade = index < currentLevel;

          return (
            <div 
              key={pkg.id} 
              className={`bg-white rounded-3xl p-8 border-2 transition-all duration-300 flex flex-col h-full ${
                isCurrent 
                  ? 'border-blue-500 shadow-lg shadow-blue-500/10 scale-[1.02] z-10' 
                  : 'border-gray-100 hover:border-gray-300 hover:shadow-xl'
              }`}
            >
              {isCurrent && (
                <div className="bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full self-start mb-4 shadow-sm">
                  {t('current')}
                </div>
              )}
              {isPending && (
                <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full self-start mb-4 shadow-sm">
                  {t('request_pending')}
                </div>
              )}

              <h3 className="text-2xl font-black text-gray-900 mb-2">{pkg.name}</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1">{pkg.desc}</p>
              
              <div className="mb-8">
                <span className="text-3xl font-black text-gray-900">{pkg.price}</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">
                    {pkg.limits.riders === 'unlimited' ? t('unlimited_riders') : t('up_to_' + pkg.limits.riders + '_riders')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="text-sm font-semibold text-gray-700">{t('unlimited_customers')}</span>
                </div>
              </div>

              {!isCurrent && !pendingRequest && (
                <button
                  onClick={() => setConfirmModal({ isOpen: true, plan: pkg.id, type: isUpgrade ? 'upgrade' : 'downgrade' })}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all ${
                    isUpgrade 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                      : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isUpgrade ? <ArrowUpCircle className="w-4 h-4" /> : <ArrowDownCircle className="w-4 h-4" />}
                    {isUpgrade ? t('upgrade') : t('downgrade')}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Billing History Section */}
      <h2 className="text-xl font-bold text-gray-900 mt-12 mb-4 flex items-center gap-2">
        <ReceiptText className="w-5 h-5 text-gray-400" /> Platform Billing History
      </h2>
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Invoice No.</th>
                <th className="px-6 py-4 font-semibold">Billing Period</th>
                <th className="px-6 py-4 font-semibold text-right">Amount (PKR)</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices && invoices.length > 0 ? (
                invoices.map(inv => (
                  <tr key={inv._id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-5 font-bold text-gray-900">{inv.invoiceNumber}</td>
                    <td className="px-6 py-5 text-gray-600">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <span>{formatDate(inv.billingPeriodStart)} - {formatDate(inv.billingPeriodEnd)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-gray-900 text-base">
                      Rs {inv.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        {inv.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Paid
                          </span>
                        ) : inv.status === 'pending_verification' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            Verifying
                          </span>
                        ) : inv.status === 'unpaid' ? (
                          <div className="flex flex-col sm:flex-row items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Unpaid
                            </span>
                            <button 
                              onClick={() => setPaymentModal({ isOpen: true, invoice: inv, notes: '' })}
                              className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all whitespace-nowrap"
                            >
                              Submit Payment
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                    No billing history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, plan: null, type: null })}
        onConfirm={handleRequestPlan}
        title={`Confirm ${confirmModal.type === 'upgrade' ? 'Upgrade' : 'Downgrade'}`}
        message={`Are you sure you want to request a change to the ${confirmModal.plan?.toUpperCase()} plan? This request will be sent to the administrator for approval.`}
        confirmText="Yes, Submit Request"
        cancelText="Cancel"
        type={confirmModal.type === 'upgrade' ? 'info' : 'warning'}
        loading={processing}
      />

      {/* Payment Submit Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp">
            
            <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <h3 className="text-lg font-black mb-1">Submit Payment Details</h3>
              <p className="text-blue-100 text-xs">
                Invoice {paymentModal.invoice?.invoiceNumber}
              </p>
            </div>

            <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Transaction ID / Notes</label>
                <textarea 
                  required
                  rows="3"
                  placeholder="Enter your bank transaction ID or payment reference..."
                  value={paymentModal.notes}
                  onChange={e => setPaymentModal(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <p className="text-[11px] text-blue-700 font-medium">
                  Once submitted, the admin will verify the transaction and mark the invoice as paid.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                >
                  {processing ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
