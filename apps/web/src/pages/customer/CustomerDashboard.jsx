import { Droplets, CreditCard, CalendarDays, CheckCircle, Plus, Receipt, AlertTriangle, MapPin, User, Phone, Package, Info, Check, Globe } from 'lucide-react';
import { useEffect, useState } from "react";
import { api } from "../../api/client";
import { useTranslation } from "../../contexts/LanguageContext";
import { useAuthStore } from "../../store/authStore";
import { toast } from 'react-hot-toast';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CustomerDashboard({ activeTab }) {
  const { t, language, toggleLanguage } = useTranslation();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileData, setProfileData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());
  const [invoices, setInvoices] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    deliveryDate: getLocalDateString(),
    timeSlot: 'morning',
    productType: '19L carboy',
    notes: '',
    deliveryAddress: ''
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
      toast.success('Order Placed Successfully!');
      loadData();
      // Reset form quantity/notes
      setOrderForm(prev => ({ ...prev, quantity: 1, notes: '' }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReceipt = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/confirm`);
      toast.success('Thank you! Receipt confirmed.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm receipt');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/customers/me', profileForm);
      toast.success('Profile Updated Successfully!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifyPaid = async (invoiceId) => {
    try {
      await api.put(`/customers/invoices/${invoiceId}/pay`);
      toast.success('Supplier notified of your payment!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to notify payment');
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
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">{t("welcome", { name: customer?.userId?.fullName?.split(' ')[0] || 'Customer' })}!</h2>
          <p className="text-gray-500 mt-1 text-sm font-medium flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-blue-500" /> {customer?.address || t("no_address_set")}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl font-bold text-xs shadow-sm border border-emerald-100/50">
          <CheckCircle className="w-4 h-4" /> {t("status_active")}
        </div>
      </div>

      {/* Delivery Status Banner */}
      {dashboardStats && (
        <div className="mb-4">
          {dashboardStats.deliveryToday ? (
            <div className="relative overflow-hidden flex items-center justify-between gap-3 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-5 sm:p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white">
              <div className="absolute -right-6 -top-6 opacity-10">
                <Package className="w-32 h-32" />
              </div>
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                  <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md" />
                </div>
                <div>
                  <h4 className="text-lg sm:text-xl font-black leading-tight drop-shadow-sm">Delivery Today!</h4>
                  <p className="text-blue-100 text-sm font-medium mt-0.5">{dashboardStats.deliveryTodayDetails?.quantity || customer?.bottlesPerDelivery} bottles arriving.</p>
                </div>
              </div>
              <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-2xl text-center shadow-lg shrink-0">
                <div className="text-[10px] text-blue-200 uppercase font-bold tracking-wider mb-0.5">Status</div>
                <div className="text-xs sm:text-sm font-black uppercase drop-shadow-sm">{dashboardStats.deliveryTodayDetails?.status || 'Scheduled'}</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-white/60 backdrop-blur-md border border-gray-100 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 border border-gray-200">
                <CalendarDays className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-gray-800 leading-tight">No delivery today</h4>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Next projected delivery: <span className="font-bold text-gray-700">{dashboardStats.nextDeliveryDate ? new Date(dashboardStats.nextDeliveryDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Unknown'}</span></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Usage Progress */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center col-span-2 md:col-span-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50/50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100/50">
                <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Usage</p>
            </div>
            <span className="text-2xl sm:text-3xl font-black text-blue-600 drop-shadow-sm">{dashboardStats?.bottlesReceivedThisCycle || 0}</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 sm:h-2.5 mb-2 overflow-hidden shadow-inner">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((dashboardStats?.bottlesReceivedThisCycle || 0) / Math.max(1, (customer?.bottlesPerDelivery * 4) || 20)) * 100)}%` }}></div>
          </div>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium">Resets on <span className="font-bold text-gray-500">{dashboardStats?.nextInvoiceDate ? new Date(dashboardStats.nextInvoiceDate).toLocaleDateString() : 'Next Cycle'}</span></p>
        </div>
        
        {/* Outstanding Dues */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border ${customer?.outstandingDues > 0 ? 'bg-red-50/50 text-red-600 border-red-100/50' : 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50'}`}>
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Outstanding</p>
          </div>
          <p className={`text-xl sm:text-3xl font-black leading-tight drop-shadow-sm ${customer?.outstandingDues > 0 ? 'text-red-600' : 'text-emerald-600'}`}>PKR {customer?.outstandingDues || 0}</p>
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-1">
            {customer?.outstandingDues > 0 ? 'Please clear your dues' : 'All clear! No pending payments.'}
          </p>
        </div>

        {/* Pricing Info */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-50/50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100/50">
              <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-bold uppercase tracking-wider">Rate</p>
          </div>
          <p className="text-xl sm:text-3xl font-black text-gray-900 leading-tight drop-shadow-sm">PKR {customer?.bottlePrice || 0} <span className="text-sm font-bold text-gray-400">/ea</span></p>
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium mt-1">Your locked-in unit price.</p>
        </div>
      </div>

      {/* Assigned Team */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-4 flex items-center gap-2">
          <User className="text-blue-500 w-5 h-5" /> {t("assigned_team")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 sm:p-5 bg-gray-50/50 border border-gray-100 rounded-2xl flex items-center gap-4 hover:shadow-sm transition-shadow">
             <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center font-black text-blue-600 text-lg">
               {(customer?.supplierId?.businessName || 'S').charAt(0).toUpperCase()}
             </div>
             <div>
               <p className="text-[10px] sm:text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">{t("water_supplier")}</p>
               <p className="font-black text-gray-900 text-sm sm:text-base">{customer?.supplierId?.businessName || 'AquaFlow Hub'}</p>
               <p className="text-xs text-gray-500 font-medium">{customer?.supplierId?.supportPhone || 'N/A'}</p>
             </div>
          </div>

          {rider ? (
            <div className="p-4 sm:p-5 bg-emerald-50/30 border border-emerald-100 rounded-2xl flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <img src={`https://ui-avatars.com/api/?name=${rider.name}&background=10b981&color=fff&rounded=true&bold=true`} className="w-12 h-12 rounded-2xl shadow-sm border border-emerald-100" alt="Rider" />
                <div>
                  <p className="text-[10px] sm:text-xs text-emerald-600 font-bold uppercase tracking-wider mb-0.5">{t("assigned_rider")}</p>
                  <p className="font-black text-gray-900 text-sm sm:text-base">{rider.name}</p>
                </div>
              </div>
              <a 
                href={`https://wa.me/${rider.phone.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-12 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/20 transition-all shrink-0 hover:scale-105 active:scale-95"
              >
                <Phone className="w-5 h-5" />
              </a>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-gray-50 border border-gray-100 border-dashed rounded-2xl flex items-center justify-center text-gray-400 text-sm font-medium">
              {t("no_rider_assigned")}
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices Mini-Table */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-500" /> Recent Generated Invoices
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {invoices.slice(0, 3).map(inv => (
              <div key={inv._id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{new Date(inv.createdAt || inv.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 font-medium mt-0.5">{inv.totalBottles} bottles @ PKR {inv.bottlePrice}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-gray-900 text-sm sm:text-base drop-shadow-sm">PKR {inv.totalAmount}</p>
                  <div className={`inline-flex px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 border ${inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
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
            
            {(customer?.outstandingDues > 500) && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800 text-sm">Action Required: Outstanding Dues</h4>
                  <p className="text-red-600 text-xs mt-1">Your outstanding balance has exceeded PKR 500. Please clear your dues from the Billing tab to continue requesting new deliveries.</p>
                </div>
              </div>
            )}

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
                    <input type="date" value={orderForm.deliveryDate} onChange={e => setOrderForm(p => ({...p, deliveryDate: e.target.value}))} min={getLocalDateString()} className="w-full border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium" required />
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
            </div>

            {/* Total & Submit */}
            <div className="mt-10 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-gray-500 uppercase">{t("total_payable")}</p>
                <p className="text-3xl font-black text-blue-600">PKR {totalCalc}</p>
                <p className="text-xs text-gray-400 font-medium">({orderForm.quantity} x PKR {customer?.bottlePrice})</p>
              </div>
              <button type="submit" disabled={submitting || (customer?.outstandingDues > 500)} className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-70 disabled:bg-gray-400 disabled:shadow-none flex items-center justify-center gap-2">
                {submitting ? '...' : t("submit_order_request")} <Check className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderOrderHistory = () => {
    // Generate unique years
    const uniqueYears = [...new Set(orders.map(o => new Date(o.createdAt).getFullYear()))].sort().reverse();
    
    // Generate months (0-11)
    const months = Array.from({ length: 12 }).map((_, i) => ({
      value: i.toString(),
      label: new Date(2000, i, 1).toLocaleString(language === 'ur' ? 'ur-PK' : 'en-US', { month: 'long' })
    }));

    const filteredOrders = orders.filter(o => {
      const d = new Date(o.createdAt);
      const matchYear = filterYear === 'all' || d.getFullYear().toString() === filterYear;
      const matchMonth = filterMonth === 'all' || d.getMonth().toString() === filterMonth;
      return matchYear && matchMonth;
    });

    return (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn max-w-5xl mx-auto">
        <div className="px-5 py-5 sm:px-8 sm:py-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{t("order_registry")}</h2>
            <p className="text-sm text-gray-500 mt-1">{t("track_status")}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {uniqueYears.length > 0 && (
              <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="w-full sm:w-auto border-2 border-gray-200 rounded-xl px-4 py-2 sm:py-2.5 bg-white text-sm font-bold text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
              >
                <option value="all">All Years</option>
                {uniqueYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
            <select 
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full sm:w-auto border-2 border-gray-200 rounded-xl px-4 py-2 sm:py-2.5 bg-white text-sm font-bold text-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
            >
              <option value="all">All Months</option>
              {months.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {filteredOrders.length === 0 ? (
            <div className="px-8 py-16 text-center text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-base font-bold text-gray-600">No orders found for this selection.</p>
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id} className="p-5 sm:p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              {/* Header: Date & Status (Mobile) */}
              <div className="flex justify-between items-start sm:w-1/4">
                <div>
                  <p className="font-bold text-gray-900 text-sm sm:text-base">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  <p className="text-xs text-gray-500 font-medium">{new Date(order.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                
                {/* Mobile Status */}
                <div className="sm:hidden">
                  <div className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    order.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    order.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>

              {/* Middle: Details */}
              <div className="flex items-center gap-3 sm:w-1/3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shadow-sm border border-blue-100/50 shrink-0">
                  {order.quantity}x
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm sm:text-base">{order.productType}</p>
                  <p className="text-xs text-gray-500 font-medium capitalize">{t("slot")}: {order.timeSlot}</p>
                </div>
              </div>

              {/* Bottom/Right: Amount & Status Desktop */}
              <div className="flex justify-between items-center sm:w-1/3 sm:justify-end gap-6 border-t border-gray-100 sm:border-t-0 pt-4 sm:pt-0 mt-2 sm:mt-0">
                <div className="sm:text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-0.5 sm:hidden">{t("amount")}</p>
                  <p className="font-black text-gray-900 text-lg sm:text-base">PKR {order.totalAmount}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{order.paymentMethod}</p>
                </div>
                
                {/* Desktop Status */}
                <div className="hidden sm:block text-right">
                  <div className={`inline-flex px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                    order.status === 'completed' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    order.status === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    order.status === 'failed' ? 'bg-red-50 text-red-600 border-red-100' :
                    'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    {order.status}
                  </div>
                </div>
              </div>

              {/* Action */}
              {order.status === 'delivered' && (
                <div className="w-full sm:w-auto mt-2 sm:mt-0">
                  <button 
                    onClick={() => handleConfirmReceipt(order._id)}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
                  >
                    Confirm Receipt
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
  };

  const renderBilling = () => {
    // 1. Calculate Unpaid Invoices Total (Arrears)
    const unpaidTotal = invoices
      .filter(inv => inv.paymentStatus !== 'paid')
      .reduce((sum, inv) => sum + (inv.totalAmount - (inv.paidAmount || 0)), 0);

    // 2. Calculate Current Unbilled Deliveries (Accrued Amount)
    const unbilledOrders = orders.filter(
      o => (o.status === 'completed' || o.status === 'delivered') && !o.isBilled
    );
    const unbilledBottles = unbilledOrders.reduce((sum, o) => sum + o.quantity, 0);
    const unbilledAmount = unbilledBottles * (customer?.bottlePrice || 150);

    return (
      <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
        {/* Current Situation Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Current Payment Situation</h2>
              <p className="text-sm text-gray-500 mt-1">Overview of your ongoing cycle and pending dues.</p>
            </div>
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
              <CalendarDays className="w-4 h-4" /> 
              {customer?.billingCycle ? customer.billingCycle.charAt(0).toUpperCase() + customer.billingCycle.slice(1) : 'Monthly'} Cycle
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Arrears / Unpaid Box */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-red-600 tracking-wider uppercase mb-2 relative z-10">Outstanding Arrears</h3>
              <p className="text-4xl font-black text-red-700 relative z-10">PKR {unpaidTotal.toLocaleString()}</p>
              <p className="text-sm text-red-600/80 mt-2 font-medium relative z-10">From previously generated unpaid invoices.</p>
            </div>

            {/* Current Accrual Box */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Package className="w-24 h-24 text-emerald-600" />
              </div>
              <h3 className="text-sm font-bold text-emerald-600 tracking-wider uppercase mb-2 relative z-10">Current Cycle Accrued</h3>
              <p className="text-4xl font-black text-emerald-700 relative z-10">PKR {unbilledAmount.toLocaleString()}</p>
              <p className="text-sm text-emerald-600/80 mt-2 font-medium relative z-10">
                {unbilledBottles} bottles delivered so far this cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Payment History / Invoices Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-xl font-bold text-gray-800">Payment History & Invoices</h2>
            <p className="text-sm text-gray-500 mt-1">All your formally generated bills.</p>
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
                    <div className={`absolute top-0 left-0 w-1.5 h-full ${inv.paymentStatus === 'paid' ? 'bg-emerald-500' : inv.paymentStatus === 'pending_confirmation' ? 'bg-blue-500' : 'bg-red-500'}`}></div>
                    <div className="flex justify-between items-start mb-4 pl-2">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t("invoice_date")}</p>
                        <p className="font-bold text-gray-900">{new Date(inv.createdAt || inv.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${inv.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : inv.paymentStatus === 'pending_confirmation' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                        {inv.paymentStatus === 'pending_confirmation' ? 'Pending Confirm' : inv.paymentStatus}
                      </div>
                    </div>
                    <div className="pl-2">
                      <p className="text-sm text-gray-500">{t("amount_due_paid")}</p>
                      <p className="text-2xl font-black text-gray-900">PKR {inv.totalAmount}</p>
                      <div className="mt-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="flex justify-between"><span>{t("bottles")}:</span> <span className="font-bold">{inv.totalBottles}</span></p>
                        <p className="flex justify-between mt-1"><span>{t("rate")}</span> <span className="font-bold">PKR {inv.bottlePrice}</span></p>
                      </div>
                      
                      {inv.paymentStatus !== 'paid' && inv.paymentStatus !== 'pending_confirmation' && (
                        <button
                          onClick={() => handleNotifyPaid(inv._id)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                          Notify Paid
                        </button>
                      )}
                      
                      {inv.paymentStatus === 'pending_confirmation' && (
                        <div className="w-full py-2 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl text-center text-xs font-bold shadow-sm">
                          Waiting for Supplier
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };



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
