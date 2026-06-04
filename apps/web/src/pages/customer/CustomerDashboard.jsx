import { Droplets, CreditCard, CalendarDays, CheckCircle, Plus, Receipt, AlertTriangle, MapPin, User, Phone, Package, Info, Check, Globe } from 'lucide-react';
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuthStore } from "../../store/authStore";

export function CustomerDashboard({ activeTab }) {
  const { t, language, toggleLanguage } = useTranslation();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    productType: '19L carboy',
    deliveryAddress: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    timeSlot: 'morning',
    paymentMethod: 'COD',
    notes: ''
  });

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    address: ''
  });

  async function loadData() {
    try {
      setLoading(true);
      setError("");
      
      const [profileRes, ordersRes, invoicesRes] = await Promise.all([
        api.get('/customers/me'),
        api.get('/customers/orders'),
        api.get('/customers/invoices')
      ]);

      setProfileData(profileRes.data.data);
      setOrders(ordersRes.data.data);
      setInvoices(invoicesRes.data.data);

      setOrderForm(prev => ({ ...prev, deliveryAddress: profileRes.data.data.customer?.address || '' }));
      setProfileForm({
        fullName: profileRes.data.data.customer?.userId?.fullName || '',
        phone: profileRes.data.data.customer?.userId?.phone || '',
        address: profileRes.data.data.customer?.address || ''
      });

    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/orders', { ...orderForm, quantity: parseInt(orderForm.quantity) });
      alert('Order Placed Successfully!');
      loadData();
      // Reset form quantity/notes
      setOrderForm(prev => ({ ...prev, quantity: 1, notes: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/confirm`);
      alert('Thank you! Receipt confirmed.');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/customers/me', profileForm);
      alert('Profile Updated Successfully!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-blue-600 font-medium animate-pulse">Loading Your Data...</div>;
  }

  const { customer, rider, dashboardStats } = profileData || {};

  // -- TAB VIEWS --

  const renderOverview = () => (
    <div className="space-y-4 animate-fadeIn max-w-5xl mx-auto">
      {/* Hero Welcome */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{t("welcome", { name: customer?.userId?.fullName?.split(' ')[0] || 'Customer' })}!</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" /> {customer?.address || t("no_address_set")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-bold text-xs shadow-sm">
          <CheckCircle className="w-3.5 h-3.5" /> {t("status_active")}
        </div>
      </div>

      {/* Delivery Status Banner */}
      {dashboardStats && (
        <div className="mb-4">
          {dashboardStats.deliveryToday ? (
            <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 sm:p-5 rounded-2xl shadow-md text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-base sm:text-lg font-black leading-tight">Delivery Today!</h4>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium mt-0.5">{dashboardStats.deliveryTodayDetails?.quantity || customer?.bottlesPerDelivery} bottles arriving.</p>
                </div>
              </div>
              <div className="bg-white text-blue-600 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-center shadow-sm shrink-0">
                <div className="text-[10px] text-gray-500 uppercase font-bold">Status</div>
                <div className="text-xs sm:text-sm font-black uppercase">{dashboardStats.deliveryTodayDetails?.status || 'Scheduled'}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 p-4 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-gray-800 leading-tight">No delivery today</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Next projected delivery: <span className="font-bold text-gray-700">{dashboardStats.nextDeliveryDate ? new Date(dashboardStats.nextDeliveryDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown'}</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Usage Progress */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-center col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 text-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
                <Droplets className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Usage</p>
            </div>
            <span className="text-xl sm:text-2xl font-black text-blue-600">{dashboardStats?.bottlesReceivedThisCycle || 0}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 sm:h-2 mb-1.5 sm:mb-2 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${Math.min(100, ((dashboardStats?.bottlesReceivedThisCycle || 0) / Math.max(1, (customer?.bottlesPerDelivery * 4) || 20)) * 100)}%` }}></div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Resets on {dashboardStats?.nextInvoiceDate ? new Date(dashboardStats.nextInvoiceDate).toLocaleDateString() : 'Next Cycle'}</p>
        </div>
        
        {/* Billing Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-50 text-indigo-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Billing</p>
          </div>
          <p className="text-base sm:text-xl font-black text-gray-900 capitalize leading-tight">{dashboardStats?.billingCycle || 'Monthly'}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1">Next: <span className="font-bold text-indigo-600">{dashboardStats?.nextInvoiceDate ? new Date(dashboardStats.nextInvoiceDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Pending'}</span></p>
        </div>

        {/* Pricing Info */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 text-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Price</p>
          </div>
          <p className="text-lg sm:text-2xl font-black text-gray-900 leading-tight">₨ {customer?.bottlePrice || 0} <span className="text-xs sm:text-sm font-bold text-gray-400">/ea</span></p>
        </div>
      </div>

      {/* Assigned Team */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 text-sm sm:text-base mb-3 flex items-center gap-2">
          <User className="text-blue-500 w-4 h-4 sm:w-5 sm:h-5" /> {t("assigned_team")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-xl flex items-center gap-3">
             <div className="w-10 h-10 bg-white rounded-full shadow-sm flex items-center justify-center font-bold text-blue-600">S</div>
             <div>
               <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mb-0.5">{t("water_supplier")}</p>
               <p className="font-bold text-gray-900 text-sm sm:text-base">{customer?.supplierId?.businessName || 'AquaFlow Hub'}</p>
               <p className="text-xs text-gray-500">{customer?.supplierId?.supportPhone || 'N/A'}</p>
             </div>
          </div>

          {rider ? (
            <div className="p-3 sm:p-4 bg-green-50/50 border border-green-100 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={`https://ui-avatars.com/api/?name=${rider.name}&background=16a34a&color=fff`} className="w-10 h-10 rounded-full shadow-sm" alt="Rider" />
                <div>
                  <p className="text-[10px] sm:text-xs text-green-600 font-bold uppercase tracking-wider mb-0.5">{t("assigned_rider")}</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{rider.name}</p>
                </div>
              </div>
              <a 
                href={`https://wa.me/${rider.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center shadow-sm transition-all shrink-0"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="p-3 sm:p-4 bg-gray-50 border border-gray-100 border-dashed rounded-xl flex items-center justify-center text-gray-400 text-sm font-medium">
              {t("no_rider_assigned")}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Mini-Table */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 sm:px-5 sm:py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 text-sm sm:text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> Recent Invoices
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.slice(0, 3).map(inv => (
              <div key={inv._id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{new Date(inv.createdAt || inv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium">{inv.totalBottles} bottles @ ₨{inv.bottlePrice}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm sm:text-base">₨ {inv.totalAmount}</p>
                  <div className={`inline-flex px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase mt-0.5 sm:mt-1 ${inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {inv.paymentStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderRequestDelivery = () => {
    const totalCalc = orderForm.quantity * (customer?.bottlePrice || 150);
    
    return (
      <div className="max-w-3xl mx-auto animate-fadeIn">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2">{t("request_delivery")}</h2>
              <p className="text-blue-100 font-medium">{t("request_delivery_desc")}</p>
            </div>
            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
              <Droplets size={200} />
            </div>
          </div>
          
          <form onSubmit={handleOrderSubmit} className="p-8">
            <div className="space-y-6">
              
              {/* Product Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">{t("product_selection")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{t("product_type")}</label>
                    <select value={orderForm.productType} onChange={e => setOrderForm(p => ({...p, productType: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
                      <option value="19L carboy">{t("19l_carboy")}</option>
                      <option value="12L carboy">{t("12l_carboy")}</option>
                      <option value="refill">{t("water_refill")}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{t("quantity")}</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                      <button type="button" onClick={() => setOrderForm(p => ({...p, quantity: Math.max(1, p.quantity - 1)}))} className="px-4 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold">-</button>
                      <input type="number" min="1" value={orderForm.quantity} onChange={e => setOrderForm(p => ({...p, quantity: parseInt(e.target.value) || 1}))} className="w-full text-center py-3 font-black text-gray-900 border-x border-gray-200 focus:outline-none" />
                      <button type="button" onClick={() => setOrderForm(p => ({...p, quantity: p.quantity + 1}))} className="px-4 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold">+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Timing */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 mt-8">{t("delivery_schedule")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{t("date")}</label>
                    <input type="date" value={orderForm.deliveryDate} onChange={e => setOrderForm(p => ({...p, deliveryDate: e.target.value}))} min={new Date().toISOString().split('T')[0]} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" required />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{t("time_slot")}</label>
                    <select value={orderForm.timeSlot} onChange={e => setOrderForm(p => ({...p, timeSlot: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl p-3 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium">
                      <option value="morning">{t("morning")}</option>
                      <option value="afternoon">{t("afternoon")}</option>
                      <option value="evening">{t("evening")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address & Instructions */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 mt-8">{t("address_and_notes")}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">{t("exact_delivery_address")}</label>
                    <textarea value={orderForm.deliveryAddress} onChange={e => setOrderForm(p => ({...p, deliveryAddress: e.target.value}))} rows="2" className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" required></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center justify-between">
                      {t("special_instructions")}
                    </label>
                    <input type="text" placeholder={t("special_instructions_placeholder")} value={orderForm.notes} onChange={e => setOrderForm(p => ({...p, notes: e.target.value}))} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 mt-8">{t("payment")}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-all ${orderForm.paymentMethod === 'COD' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="COD" checked={orderForm.paymentMethod === 'COD'} onChange={() => setOrderForm(p => ({...p, paymentMethod: 'COD'}))} className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-bold text-gray-900">{t("cod")}</p>
                      <p className="text-xs text-gray-500">{t("cod_desc")}</p>
                    </div>
                  </label>
                  
                  <label className={`cursor-pointer border-2 rounded-xl p-4 flex items-center gap-3 transition-all ${['Easypaisa', 'JazzCash'].includes(orderForm.paymentMethod) ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="payment" value="Easypaisa" checked={['Easypaisa', 'JazzCash'].includes(orderForm.paymentMethod)} onChange={() => setOrderForm(p => ({...p, paymentMethod: 'Easypaisa'}))} className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-bold text-gray-900">{t("online")}</p>
                      <p className="text-xs text-gray-500">{t("online_desc")}</p>
                    </div>
                  </label>
                </div>
                
                {['Easypaisa', 'JazzCash'].includes(orderForm.paymentMethod) && (
                  <div className="mt-3 bg-orange-50 border border-orange-100 p-3 rounded-xl text-orange-800 text-sm flex gap-2">
                    <Info className="w-5 h-5 shrink-0" />
                    <p>The rider will bring a QR code or provide the account number upon arrival for digital payment transfer.</p>
                  </div>
                )}
              </div>

            </div>

            {/* Total & Submit */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">{t("total_payable")}</p>
                <p className="text-3xl font-black text-blue-600">₨ {totalCalc}</p>
                <p className="text-xs text-gray-400 font-medium">({orderForm.quantity} x ₨{customer?.bottlePrice})</p>
              </div>
              <button type="submit" disabled={submitting} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                {submitting ? '...' : t("submit_order_request")} <Check className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderOrderHistory = () => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn max-w-5xl mx-auto">
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800">{t("order_registry")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("track_status")}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-white border-b border-gray-100">
            <tr>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t("date")}</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t("order_details")}</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t("amount")}</th>
              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">{t("status")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-8 py-16 text-center text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-base font-bold text-gray-600">{t("no_past_orders")}</p>
                  <p className="text-sm">{t("place_order_hint")}</p>
                </td>
              </tr>
            ) : (
              orders.map(order => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 whitespace-nowrap">
                    <p className="font-bold text-gray-900">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        {order.quantity}x
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{order.productType}</p>
                        <p className="text-xs text-gray-500 font-medium capitalize">{t("slot")}: {order.timeSlot}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <p className="font-bold text-gray-900">₨ {order.totalAmount}</p>
                    <p className="text-xs text-gray-500 font-medium uppercase">{order.paymentMethod}</p>
                  </td>
                  <td className="px-8 py-5 text-right whitespace-nowrap">
                    <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      order.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                      order.status === 'failed' ? 'bg-red-50 text-red-600 border border-red-100' :
                      'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {order.status}
                    </div>
                    {order.status === 'delivered' && (
                      <button 
                        onClick={() => handleConfirmReceipt(order._id)}
                        className="mt-2 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Confirm Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn max-w-5xl mx-auto">
      <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800">{t("billing_and_invoices")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("view_receipts")}</p>
      </div>
      <div className="p-8">
        {invoices.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
             <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-200" />
             <p className="font-bold text-gray-600">{t("no_invoices_found")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map(inv => (
              <div key={inv._id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${inv.paymentStatus === 'paid' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                <div className="flex justify-between items-start mb-4 pl-2">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("invoice_date")}</p>
                    <p className="font-bold text-gray-900">{new Date(inv.createdAt || inv.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {inv.paymentStatus}
                  </div>
                </div>
                <div className="pl-2">
                  <p className="text-sm text-gray-500">{t("amount_due_paid")}</p>
                  <p className="text-2xl font-black text-gray-900">₨ {inv.totalAmount}</p>
                  <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                    <p className="flex justify-between"><span>{t("bottles")}:</span> <span className="font-bold">{inv.totalBottles}</span></p>
                    <p className="flex justify-between mt-1"><span>{t("rate")}</span> <span className="font-bold">₨ {inv.bottlePrice}</span></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );



  return (
    <div className="p-4 md:p-8">
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600 flex items-center gap-2 max-w-5xl mx-auto">
          <AlertTriangle className="w-5 h-5 shrink-0" /> <p>{error}</p>
        </div>
      )}

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'request' && renderRequestDelivery()}
      {activeTab === 'orders' && renderOrderHistory()}
      {activeTab === 'billing' && renderBilling()}
    </div>
  );
}
