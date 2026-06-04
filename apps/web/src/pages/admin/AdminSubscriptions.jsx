import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { useTranslation } from '../../contexts/LanguageContext';
import { CheckCircle2, AlertTriangle, ArrowRight, UserCheck, XCircle, FileText, CalendarDays, DollarSign } from 'lucide-react';
import { ConfirmationModal } from '../../components/ConfirmationModal';

export function AdminSubscriptions() {
  const { t } = useTranslation();
  const [data, setData] = useState({ requests: [], suppliers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Custom modal state for approvals
  const [approveModal, setApproveModal] = useState({
    isOpen: false,
    request: null,
    amount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
  });

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    request: null
  });

  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/subscriptions');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveClick = (req) => {
    const planValues = { basic: 1, standard: 2, enterprise: 3 };
    const currentVal = planValues[req.currentPlan] || 0;
    const requestedVal = planValues[req.requestedPlan] || 0;
    const isDowngrade = requestedVal < currentVal;

    // Pre-fill amount based on requested plan, unless it's a downgrade
    let amt = 0;
    if (!isDowngrade) {
      if (req.requestedPlan === 'standard') amt = 2500;
      if (req.requestedPlan === 'enterprise') amt = 5000;
    }

    setApproveModal({
      isOpen: true,
      request: req,
      isDowngrade,
      amount: amt,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
    });
  };

  const handleProcessApprove = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await api.put(`/admin/subscriptions/request/${approveModal.request._id}`, { 
        status: 'approved',
        adminNotes: `Approved and Invoiced`,
        amount: approveModal.amount,
        billingPeriodStart: approveModal.startDate,
        billingPeriodEnd: approveModal.endDate
      });
      setApproveModal(prev => ({ ...prev, isOpen: false }));
      loadSubscriptions();
    } catch (err) {
      alert('Failed to approve request: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const handleProcessReject = async () => {
    setProcessing(true);
    try {
      await api.put(`/admin/subscriptions/request/${rejectModal.request._id}`, { 
        status: 'rejected',
        adminNotes: `Rejected by Admin`
      });
      setRejectModal(prev => ({ ...prev, isOpen: false }));
      loadSubscriptions();
    } catch (err) {
      alert('Failed to reject request: ' + (err.response?.data?.message || err.message));
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading && data.requests.length === 0) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  const pendingRequests = data.requests.filter(r => r.status === 'pending');

  const processedSuppliers = data.suppliers.map(sup => {
    const isBasic = sup.plan === 'basic';
    let daysDiff = 0;
    let health = 'healthy'; // healthy, expiring_soon, expired, lifetime
    
    if (isBasic) {
      health = 'lifetime';
    } else if (sup.planExpiresAt) {
      const msDiff = new Date(sup.planExpiresAt).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
      daysDiff = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 0) {
        health = 'expired';
      } else if (daysDiff <= 7) {
        health = 'expiring_soon';
      }
    }
    
    return { ...sup, health, daysDiff };
  }).sort((a, b) => {
    const healthRank = { 'expired': 1, 'expiring_soon': 2, 'healthy': 3, 'lifetime': 4 };
    if (healthRank[a.health] !== healthRank[b.health]) {
      return healthRank[a.health] - healthRank[b.health];
    }
    return a.daysDiff - b.daysDiff;
  });

  const expiringCount = processedSuppliers.filter(s => s.health === 'expiring_soon').length;
  const expiredCount = processedSuppliers.filter(s => s.health === 'expired').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Platform Subscriptions & Billing
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage supplier upgrades, generate platform invoices, and monitor billing cycles.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-center w-full md:w-auto">
          <div className="bg-amber-50/50 px-4 py-2 rounded-2xl border border-amber-100 flex-1 min-w-[120px]">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pending Upgrades</p>
            <p className="text-xl font-black text-amber-700 mt-0.5">{pendingRequests.length}</p>
          </div>
          <div className="bg-red-50/50 px-4 py-2 rounded-2xl border border-red-100 flex-1 min-w-[120px]">
            <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Expired Plans</p>
            <p className="text-xl font-black text-red-700 mt-0.5">{expiredCount}</p>
          </div>
          <div className="bg-orange-50/50 px-4 py-2 rounded-2xl border border-orange-100 flex-1 min-w-[120px]">
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Expiring Soon</p>
            <p className="text-xl font-black text-orange-700 mt-0.5">{expiringCount}</p>
          </div>
          <div className="bg-blue-50/50 px-4 py-2 rounded-2xl border border-blue-100 flex-1 min-w-[120px]">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Active Tenants</p>
            <p className="text-xl font-black text-blue-700 mt-0.5">{processedSuppliers.length}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Pending Requests Section */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" /> 
          Action Required: Subscription Requests
        </h2>
        
        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center text-gray-500">
            <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
            No pending subscription requests at the moment. You're all caught up!
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {pendingRequests.map(req => (
              <div key={req._id} className="bg-white rounded-3xl p-6 border-l-4 border-l-amber-500 border-y border-r border-gray-100 shadow-sm flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:shadow-md transition-all duration-300">
                
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-950 mb-1">
                    {req.supplierId?.businessName || 'Unknown Supplier'}
                  </h3>
                  <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" /> Requested on {formatDate(req.createdAt)}
                  </p>

                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-xs font-semibold uppercase tracking-wider">{req.currentPlan}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                    <span className="px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-xs font-bold uppercase tracking-wider">{req.requestedPlan}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-2 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                  <button
                    onClick={() => handleApproveClick(req)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" /> Approve & Invoice
                  </button>
                  <button
                    onClick={() => setRejectModal({ isOpen: true, request: req })}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Subscriptions Overview */}
      <section>
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" /> 
          Subscription Health & Overview
        </h2>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-md shadow-gray-100/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Business Name</th>
                  <th className="px-6 py-4 font-semibold">Health Status</th>
                  <th className="px-6 py-4 font-semibold">Current Package</th>
                  <th className="px-6 py-4 font-semibold">Billing Timeline</th>
                  <th className="px-6 py-4 font-semibold text-right">Riders Used</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {processedSuppliers.map(sup => (
                  <tr key={sup._id} className="hover:bg-blue-50/10 transition-colors">
                    <td className="px-6 py-5">
                      <p className="font-bold text-gray-900">{sup.businessName}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">ID: {sup._id.substring(sup._id.length - 6).toUpperCase()}</p>
                    </td>
                    <td className="px-6 py-5">
                      {sup.health === 'lifetime' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-600 border border-gray-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          LIFETIME
                        </span>
                      )}
                      {sup.health === 'healthy' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          HEALTHY
                        </span>
                      )}
                      {sup.health === 'expiring_soon' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                          EXPIRING SOON
                        </span>
                      )}
                      {sup.health === 'expired' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          EXPIRED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-blue-50 text-blue-700 border border-blue-100">
                        {sup.plan}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      {sup.health === 'lifetime' ? (
                        <div>
                          <p className="text-gray-900 font-bold">Free Tier</p>
                          <p className="text-[10px] text-gray-400">No Expiration Date</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-gray-900 font-semibold">{formatDate(sup.planStartsAt)} - {formatDate(sup.planExpiresAt)}</p>
                          <p className={`text-[11px] font-bold mt-0.5 ${
                            sup.health === 'expired' ? 'text-red-500' :
                            sup.health === 'expiring_soon' ? 'text-orange-500' :
                            'text-green-500'
                          }`}>
                            {sup.health === 'expired' 
                              ? `Expired ${Math.abs(sup.daysDiff)} days ago` 
                              : `Renews in ${sup.daysDiff} days`}
                          </p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-gray-700">
                      {sup.totalRiders}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Custom Invoice Generation Modal for Approval */}
      {approveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-slideUp">
            
            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <h3 className="text-xl font-black mb-1">Approve & Generate Invoice</h3>
              <p className="text-blue-100 text-sm">
                Upgrading {approveModal.request?.supplierId?.businessName} to {approveModal.request?.requestedPlan.toUpperCase()}
              </p>
            </div>

            <form onSubmit={handleProcessApprove} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Invoice Amount (PKR)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="number"
                    required
                    value={approveModal.amount}
                    onChange={e => setApproveModal(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Billing Start</label>
                  <input 
                    type="date"
                    required
                    value={approveModal.startDate}
                    onChange={e => setApproveModal(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Billing End</label>
                  <input 
                    type="date"
                    required
                    value={approveModal.endDate}
                    onChange={e => setApproveModal(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
                {approveModal.isDowngrade ? (
                  <p className="text-xs text-blue-700 font-medium">
                    <span className="font-bold">Note: This is a downgrade.</span> The amount has defaulted to 0. A $0 invoice will be ignored, but the supplier's plan limits will update instantly.
                  </p>
                ) : (
                  <p className="text-xs text-blue-700 font-medium">
                    This will immediately change the supplier's active plan limits and post a new unpaid invoice to their dashboard.
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setApproveModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm & Invoice'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Reject Modal */}
      <ConfirmationModal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal({ isOpen: false, request: null })}
        onConfirm={handleProcessReject}
        title="Reject Upgrade Request"
        message={`Are you sure you want to reject the upgrade request from ${rejectModal.request?.supplierId?.businessName}? They will remain on their current plan.`}
        confirmText="Yes, Reject Request"
        cancelText="Cancel"
        type="danger"
        loading={processing}
      />

    </div>
  );
}
