import { Package, MapPin, Banknote, CheckCircle, Map, Camera, AlertTriangle, PhoneCall, ChevronRight, X, DollarSign } from 'lucide-react';
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { StatCard } from "../../components/StatCard";
import { useTranslation } from "../../contexts/LanguageContext";

export function RiderDashboard({ user, activeTab }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [deliveries, setDeliveries] = useState([]);
  const [eodSummary, setEodSummary] = useState(null);
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
      const [ordersRes, eodRes] = await Promise.all([
        api.get('/orders/rider'),
        api.get('/orders/rider/eod-summary')
      ]);
      setDeliveries(ordersRes.data.data || []);
      setEodSummary(eodRes.data.data);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'assigned': return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold uppercase">Assigned</span>;
      case 'in_transit': return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold uppercase">In Transit</span>;
      case 'arrived': return <span className="px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold uppercase">Arrived</span>;
      case 'delivered': return <span className="px-2.5 py-1 bg-green-100 text-green-800 rounded-lg text-xs font-bold uppercase">Delivered</span>;
      case 'failed': return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-lg text-xs font-bold uppercase">Failed</span>;
      default: return null;
    }
  };

  if (loading && !deliveries.length) {
    return <div className="p-8 text-center text-blue-600">Loading Route...</div>;
  }

  const activeDeliveries = deliveries.filter(d => !['delivered', 'completed', 'failed'].includes(d.status));
  const awaitingConfirmation = deliveries.filter(d => d.status === 'delivered');
  const completedDeliveries = deliveries.filter(d => ['completed', 'failed'].includes(d.status));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> <p>{error}</p>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">{t("driver_dashboard")}</h1>
        <p className="text-gray-500 font-medium">{t("hello_user", { name: user.fullName })}</p>
      </div>

      {activeTab === 'overview' && (
        <>
          {/* Quick EOD Summary Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <StatCard 
              label={t("cash_collected")} 
              value={`₨ ${eodSummary?.totalCashCollected || 0}`} 
              icon={<Banknote className="text-emerald-600 w-5 h-5" />} 
              sub="COD" 
            />
            <StatCard 
              label={t("online_verified")} 
              value={`₨ ${eodSummary?.totalOnlineCollected || 0}`} 
              icon={<DollarSign className="text-blue-600 w-5 h-5" />} 
              sub="Verified" 
            />
            <StatCard 
              label={t("empties_returned")} 
              value={eodSummary?.totalEmptyCarboys || 0} 
              icon={<Package className="text-gray-600 w-5 h-5" />} 
              sub="Returned" 
            />
          </div>

          {/* Pending Deliveries */}
          <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/40 border border-gray-100 overflow-hidden mb-8">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{t("todays_route")}</h2>
                <p className="text-xs text-gray-400 mt-1 font-medium tracking-wide">{t("manage_drops")}</p>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{activeDeliveries.length} {t("pending")}</span>
            </div>

            {activeDeliveries.length === 0 ? (
              <div className="px-6 py-16 text-center text-gray-400">
                <div className="flex justify-center mb-4"><CheckCircle className="w-16 h-16 text-green-400" /></div>
                <p className="font-bold text-gray-600 text-lg">{t("no_pending")}</p>
                <p className="text-sm mt-1">{t("all_caught_up")}</p>
              </div>
            ) : (
          <div className="divide-y divide-gray-100">
            {activeDeliveries.map((order, idx) => (
              <div key={order._id} className="p-6 hover:bg-gray-50/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Order Details */}
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-lg shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-800 text-lg">{order.customerId?.userId?.fullName || 'Customer'}</h3>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{order.deliveryAddress}</p>
                      {order.notes && (
                        <div className="mb-3 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs font-medium text-yellow-800">
                          <span className="font-bold">Notes:</span> {order.notes}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-600">
                        <span className="bg-gray-100 px-2 py-1 rounded-md">📦 {order.quantity}x {order.productType}</span>
                        <span className="bg-gray-100 px-2 py-1 rounded-md uppercase">🕒 {order.timeSlot}</span>
                        <span className={`px-2 py-1 rounded-md ${order.paymentMethod === 'COD' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                          💵 ₨ {order.totalAmount} ({order.paymentMethod})
                        </span>
                      </div>
                      
                      <div className="flex gap-2 mt-3">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                        >
                          <Map className="w-3.5 h-3.5" /> {t("navigate")}
                        </a>
                        {order.customerId?.userId?.phone && (
                          <a 
                            href={`tel:${order.customerId.userId.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors"
                          >
                            <PhoneCall className="w-3.5 h-3.5" /> {t("call")}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 min-w-[160px] mt-4 md:mt-0">
                    {order.status === 'assigned' && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'in_transit')}
                        disabled={updating === order._id}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
                      >
                        {t("start_route")}
                      </button>
                    )}
                    {order.status === 'in_transit' && (
                      <button 
                        onClick={() => handleUpdateStatus(order._id, 'arrived')}
                        disabled={updating === order._id}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md transition-all"
                      >
                        {t("mark_arrived")}
                      </button>
                    )}
                    {order.status === 'arrived' && (
                      <>
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setCompleteForm({ paymentStatus: order.paymentMethod === 'COD' ? 'paid' : 'unpaid', emptyCarboysReturned: order.quantity });
                            setShowCompleteModal(true);
                          }}
                          className="w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-bold rounded-xl shadow-md transition-all"
                        >
                          {t("complete_delivery")}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowFailedModal(true);
                          }}
                          className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-all"
                        >
                          {t("mark_failed")}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* Awaiting Confirmation */}
      {activeTab === 'overview' && awaitingConfirmation.length > 0 && (
        <div className="bg-white rounded-3xl shadow-lg shadow-gray-200/40 border border-gray-100 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 bg-blue-50/30 flex justify-between items-center">
            <h2 className="font-bold text-blue-900">{t("awaiting_customer_confirmation")}</h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{awaitingConfirmation.length}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {awaitingConfirmation.map(order => (
              <div key={order._id} className="p-4 px-6 flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">{order.customerId?.userId?.fullName || 'Customer'}</p>
                  <p className="text-xs text-gray-500">{order.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">{t("pending")}</span>
                  <p className="text-xs font-bold mt-1 text-gray-600">₨ {order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Deliveries Log (History Tab) */}
      {(activeTab === 'history' || activeTab === 'overview') && completedDeliveries.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <h2 className="font-bold text-gray-800">{t("finalized_today")}</h2>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{completedDeliveries.length}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {completedDeliveries.map(order => (
              <div key={order._id} className="p-4 px-6 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                <div>
                  <p className="font-bold text-gray-800">{order.customerId?.userId?.fullName || 'Customer'}</p>
                  <p className="text-xs text-gray-500">{order.deliveryAddress}</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-xs font-bold mt-1 text-gray-600">₨ {order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Tab Placeholder */}
      {activeTab === 'performance' && (
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden p-8 text-center text-gray-500">
          <Banknote className="w-16 h-16 mx-auto mb-4 text-emerald-200" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t("performance")}</h2>
          <p>Detailed earnings and metrics tracking coming soon.</p>
        </div>
      )}

      {/* Complete Delivery Modal */}
      {showCompleteModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">{t("complete_delivery")}</h3>
              <button onClick={() => setShowCompleteModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              
              <div className={`p-3 rounded-xl border ${selectedOrder.paymentMethod === 'COD' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                <p className={`text-sm font-bold mb-1 ${selectedOrder.paymentMethod === 'COD' ? 'text-emerald-800' : 'text-blue-800'}`}>
                  {selectedOrder.paymentMethod === 'COD' ? `${t("collect_cash")}: ₨ ${selectedOrder.totalAmount}` : `${t("verify_online_transfer")}: ₨ ${selectedOrder.totalAmount}`}
                </p>
                <p className={`text-xs ${selectedOrder.paymentMethod === 'COD' ? 'text-emerald-600' : 'text-blue-600'}`}>
                  Method: {selectedOrder.paymentMethod}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("payment_received_q")}</label>
                <select 
                  value={completeForm.paymentStatus}
                  onChange={(e) => setCompleteForm(p => ({...p, paymentStatus: e.target.value}))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {selectedOrder.paymentMethod === 'COD' ? (
                    <>
                      <option value="paid">{t("yes_collected_cash")}</option>
                      <option value="unpaid">{t("no_customer_didnt_pay")}</option>
                    </>
                  ) : (
                    <>
                      <option value="paid">{t("yes_verified_digital")}</option>
                      <option value="unpaid">{t("no_transfer_not_received")}</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t("empty_carboys_returned")}</label>
                <input 
                  type="number" 
                  min="0"
                  value={completeForm.emptyCarboysReturned}
                  onChange={(e) => setCompleteForm(p => ({...p, emptyCarboysReturned: parseInt(e.target.value)}))}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none" 
                />
              </div>
              
              <div className="pt-4">
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'delivered', completeForm)}
                  disabled={updating === selectedOrder._id}
                  className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl disabled:opacity-70"
                >
                  {t("confirm_delivery")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Failed Delivery Modal */}
      {showFailedModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-fadeIn">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800 text-lg">Mark Failed</h3>
              <button onClick={() => setShowFailedModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for failure</label>
                <select 
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-red-500 focus:outline-none"
                >
                  <option value="Customer not home">Customer not home</option>
                  <option value="Door locked">Door locked</option>
                  <option value="Customer refused">Customer refused</option>
                  <option value="Wrong address">Wrong address</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="pt-4">
                <button 
                  onClick={() => handleUpdateStatus(selectedOrder._id, 'failed', { failureReason })}
                  disabled={updating === selectedOrder._id}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-70"
                >
                  Submit Failure
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
