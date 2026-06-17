import React, { useState, useEffect } from 'react';
import { Truck, Bike, MapPin, CheckCircle, X, CalendarDays, Plus, RefreshCw, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { api } from '../../api/client';

export function SupplierDispatchBoard({ riders, onAssignRider }) {
  const { t } = useTranslation();
  
  const getLocalYMD = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(getLocalYMD());
  
  // Filter state
  const [filterRider, setFilterRider] = useState('all');
  
  // Data state
  const [dailyOrders, setDailyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch orders when selected date changes
  useEffect(() => {
    async function fetchDailyOrders() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/orders/supplier?date=${selectedDate}`);
        setDailyOrders(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch dispatch orders for the selected date.");
      } finally {
        setLoading(false);
      }
    }
    fetchDailyOrders();
  }, [selectedDate]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    // When parsing YYYY-MM-DD, JS creates UTC midnight. Thus toISOString is safe to use here.
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(getLocalYMD());
  };

  const handleAssignRider = async (orderId, riderId) => {
    try {
      await onAssignRider(orderId, riderId);
      // Optimistically update the local state to show it assigned immediately
      setDailyOrders(prev => prev.map(o => {
        if (o._id === orderId) {
          const assignedRider = riders.find(r => r._id === riderId);
          return { ...o, status: 'assigned', deliveryBoyId: assignedRider };
        }
        return o;
      }));
    } catch (err) {
      console.error("Failed to assign rider", err);
    }
  };

  const activeStatuses = ['pending', 'assigned', 'in_transit', 'arrived', 'failed', 'delivered', 'completed'];
  const dispatchOrders = dailyOrders.filter(o => {
    if (!activeStatuses.includes(o.status)) return false;
    
    if (filterRider === 'all') return true;
    if (filterRider === 'pending') return o.status === 'pending';
    
    return o.deliveryBoyId?._id === filterRider || o.deliveryBoyId === filterRider;
  });

  const getStatusInfo = (status) => {
    switch(status) {
      case 'assigned': return { label: t('status_dispatched_to'), color: 'text-teal-700', bg: 'bg-teal-100', icon: <Bike className="w-4 h-4"/> };
      case 'in_transit': return { label: t('status_in_transit_by'), color: 'text-blue-700', bg: 'bg-blue-100', icon: <Truck className="w-4 h-4"/> };
      case 'arrived': return { label: t('status_arrived_by'), color: 'text-purple-700', bg: 'bg-purple-100', icon: <MapPin className="w-4 h-4"/> };
      case 'failed': return { label: t('status_failed_by'), color: 'text-red-700', bg: 'bg-red-100', icon: <X className="w-4 h-4"/> };
      case 'delivered': 
      case 'completed': return { label: t('status_completed_by'), color: 'text-emerald-700', bg: 'bg-emerald-100', icon: <CheckCircle className="w-4 h-4"/> };
      default: return { label: t('status_assigned_to'), color: 'text-gray-700', bg: 'bg-gray-100', icon: <Bike className="w-4 h-4"/> };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-fadeIn h-full flex flex-col">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white flex-wrap gap-4">
        <div>
          <h2 className="font-bold text-gray-800 text-lg">{t('dispatch_board') || 'Live Dispatch Board'}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t('dispatch_board_sub') || 'Monitor real-time information flow and rider delivery status.'}</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date Navigator */}
          <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm p-1">
            <button 
              onClick={() => changeDate(-1)} 
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1.5 font-bold text-sm text-gray-800 outline-none bg-transparent cursor-pointer text-center w-36"
            />
            <button 
              onClick={() => changeDate(1)} 
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={setToday}
              className="ml-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              {t('today_btn')}
            </button>
          </div>

          {/* Rider Filter */}
          <div className="relative">
            <select 
              value={filterRider}
              onChange={(e) => setFilterRider(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 outline-none hover:bg-gray-50 focus:border-blue-500 transition-colors appearance-none shadow-sm cursor-pointer"
            >
              <option value="all">{t('all_riders_and_pending')}</option>
              <option value="pending">{t('unassigned_only')}</option>
              <optgroup label={t('assigned_riders_group')}>
                {riders.map(r => (
                  <option key={r._id} value={r._id}>
                    {r.userId?.fullName || r.areaName}
                  </option>
                ))}
              </optgroup>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>

          <div className="flex gap-2">
             <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm">
                {dailyOrders.filter(o => o.status === 'pending').length} {t('pending')}
             </span>
             <span className="bg-teal-100 text-teal-700 text-xs px-3 py-1.5 rounded-lg font-bold shadow-sm">
                {dailyOrders.filter(o => ['assigned', 'in_transit', 'arrived'].includes(o.status)).length} {t('active_route')}
             </span>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm font-bold text-center border-b border-red-100">
            {error}
          </div>
        )}

        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('order_no')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('customer_and_destination')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('order_details')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('billing')}</th>
              <th className="px-6 py-4 uppercase tracking-wider text-[11px]">{t('real_time_status')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-700">
            {dispatchOrders.map((o) => (
              <tr key={o._id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-900 bg-gray-50/50">
                  {o.orderId || o._id.substring(o._id.length-6).toUpperCase()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{o.customerId?.userId?.fullName || t('walk_in_customer')}</p>
                      <p className="text-xs text-gray-500 font-medium max-w-[200px] truncate">{o.deliveryAddress}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{o.quantity}x</span>
                    <span className="text-sm font-semibold">{o.productType}</span>
                  </div>
                  <p className="text-xs text-orange-600 font-bold mt-1 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" /> {o.timeSlot.toUpperCase()}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-black text-gray-800 text-base">PKR {o.totalAmount || (o.quantity * 150)}</p>
                  <p className="text-[10px] uppercase font-bold text-gray-400 border border-gray-200 inline-block px-1.5 rounded mt-1">{o.paymentMethod}</p>
                </td>
                <td className="px-6 py-4">
                  {o.status === 'pending' ? (
                    <div className="relative">
                      <select 
                        className="w-full text-xs font-bold border-2 border-dashed border-blue-300 rounded-lg pl-3 pr-8 py-2.5 text-blue-700 bg-blue-50/50 hover:bg-blue-50 outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none cursor-pointer shadow-sm"
                        onChange={(e) => handleAssignRider(o._id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>{t('assign_rider_placeholder')}</option>
                        {riders.map(r => (
                          <option key={r._id} value={r._id}>{r.userId?.fullName || r.areaName}</option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500">
                        <Plus className="w-4 h-4" />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-inner ${getStatusInfo(o.status).bg} ${getStatusInfo(o.status).color}`}>
                        {getStatusInfo(o.status).icon}
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">{getStatusInfo(o.status).label}</span>
                        <span className={`font-bold text-sm ${getStatusInfo(o.status).color}`}>
                          {o.deliveryBoyId?.userId?.fullName || 'Rider'}
                        </span>
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {dispatchOrders.length === 0 && !loading && (
              <tr>
                <td colSpan="5" className="px-6 py-16 text-center text-gray-400">
                  <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-300" />
                  <p className="text-base font-bold text-gray-500">{t('dispatch_board_clear_title')}</p>
                  <p className="text-sm">{t('no_active_or_pending_orders')}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
