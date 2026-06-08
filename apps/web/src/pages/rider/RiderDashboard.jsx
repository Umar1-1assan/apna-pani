import { X, AlertTriangle, Check } from 'lucide-react';
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useTranslation } from "../../contexts/LanguageContext";
import { RiderOverview } from "../../components/rider/RiderOverview";
import { RiderRoute } from "../../components/rider/RiderRoute";
import { RiderDeliveryHistory } from "../../components/rider/RiderDeliveryHistory";
import { RiderCashCollection } from "../../components/rider/RiderCashCollection";

export function RiderDashboard({ user, activeTab }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [eodSummary, setEodSummary] = useState(null);
  const [riderProfile, setRiderProfile] = useState(null);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(null);

  // Modals state
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Forms state
  const [completeForm, setCompleteForm] = useState({
    paymentStatus: 'paid',
    emptyCarboysReturned: 0
  });
  const [failureReason, setFailureReason] = useState('Customer not home');

  async function load() {
    try {
      setLoading(true);
      const [ordersRes, eodRes, profileRes] = await Promise.all([
        api.get('/orders/rider'),
        api.get('/orders/rider/eod-summary'),
        api.get('/users/profile')
      ]);
      setDeliveries(ordersRes.data.data || []);
      setEodSummary(eodRes.data.data);
      setRiderProfile(profileRes.data.data?.roleProfile || profileRes.data.roleProfile);
    } catch (err) {
      setError("Could not connect to backend to fetch rider data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus, extraData = {}) => {
    try {
      setUpdating(orderId);
      const payload = { status: newStatus, ...extraData };
      await api.put(`/orders/${orderId}/status`, payload);
      
      // Close modals if open
      setShowCompleteModal(false);
      setShowFailedModal(false);
      setSelectedOrder(null);
      
      load();
    } catch (err) {
      alert("Failed to update status");
    } finally {
      setUpdating(null);
    }
  };

  // Derived data
  const activeDeliveries = deliveries.filter(d => !['delivered', 'completed', 'failed'].includes(d.status));
  const awaitingConfirmation = deliveries.filter(d => d.status === 'delivered');
  const completedDeliveries = deliveries.filter(d => ['completed', 'failed'].includes(d.status));

  if (loading && !deliveries.length) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">{t('loading_dashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-28 md:pb-8">
      {error && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> <p>{error}</p>
        </div>
      )}

      {/* ── TAB: Overview (Today) ── */}
      {activeTab === 'overview' && (
        <RiderOverview 
          user={user}
          riderProfile={riderProfile}
          eodSummary={eodSummary}
          activeDeliveries={activeDeliveries}
          awaitingConfirmation={awaitingConfirmation}
          completedDeliveries={completedDeliveries}
        />
      )}

      {/* ── TAB: Today's Route ── */}
      {activeTab === 'today_route' && (
        <RiderRoute 
          activeDeliveries={activeDeliveries}
          awaitingConfirmation={awaitingConfirmation}
          completedDeliveries={completedDeliveries}
          onStartRoute={(id) => handleUpdateStatus(id, 'in_transit')}
          onMarkArrived={(id) => handleUpdateStatus(id, 'arrived')}
          onOpenComplete={(order) => {
            setSelectedOrder(order);
            setCompleteForm({ 
              emptyCarboysReturned: order.quantity 
            });
            setShowCompleteModal(true);
          }}
          onOpenFailed={(order) => {
            setSelectedOrder(order);
            setShowFailedModal(true);
          }}
          updating={updating}
        />
      )}

      {/* ── TAB: History ── */}
      {activeTab === 'history' && (
        <RiderDeliveryHistory />
      )}

      {/* ── TAB: Cash Management ── */}
      {activeTab === 'cash_management' && (
        <RiderCashCollection 
          eodSummary={eodSummary} 
          completedDeliveries={completedDeliveries} 
        />
      )}

      {/* ── Complete Delivery Modal ── */}
      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Complete Delivery</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
                <p className="text-sm font-bold text-blue-800 mb-1">
                  Delivery Details
                </p>
                <p className="text-xs text-blue-600">
                  Bottles delivered: {selectedOrder.quantity}
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Empty bottles returned</label>
                <input 
                  type="number" 
                  min="0"
                  value={completeForm.emptyCarboysReturned}
                  onChange={(e) => setCompleteForm(p => ({...p, emptyCarboysReturned: parseInt(e.target.value) || 0}))}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-medium" 
                />
              </div>
              
              <button 
                onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered', completeForm)}
                disabled={updating === selectedOrder._id}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-200/50 transition-all active:scale-[0.98] disabled:opacity-70 text-sm flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Confirm Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Failed Delivery Modal ── */}
      {showFailedModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Mark Failed</h3>
              <button onClick={() => setShowFailedModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5"/>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Reason for failure</label>
                <select 
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-red-500 focus:outline-none text-sm font-medium"
                >
                  <option value="Customer not home">Customer not home</option>
                  <option value="Door locked">Door locked</option>
                  <option value="Customer refused">Customer refused</option>
                  <option value="Wrong address">Wrong address</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <button 
                onClick={() => handleUpdateStatus(selectedOrder._id, 'failed', { failureReason })}
                disabled={updating === selectedOrder._id}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200/50 transition-all active:scale-[0.98] disabled:opacity-70 text-sm flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" /> Submit Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
