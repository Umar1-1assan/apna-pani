import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle, XCircle, Package, Clock, Truck, Check, X } from 'lucide-react';
import { api } from '../../api/client';

const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function RiderDeliveryHistory() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // Default to yesterday
    return getLocalDateString(d);
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        const res = await api.get(`/orders/rider?date=${selectedDate}`);
        setOrders(res.data.data || []);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [selectedDate]);

  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const completedOrders = orders.filter(o => ['delivered', 'completed'].includes(o.status));
  const failedOrders = orders.filter(o => o.status === 'failed');
  const totalBottles = completedOrders.reduce((acc, o) => acc + (o.quantity || 0), 0);

  const dateFormatted = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* Date Navigator */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1 flex items-center justify-between">
        <button 
          onClick={() => changeDate(-1)} 
          className="p-3 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col items-center justify-center">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="font-bold text-sm text-gray-800 outline-none bg-transparent cursor-pointer text-center w-36"
          />
          <p className="text-[11px] text-gray-500 font-medium -mt-0.5">{dateFormatted}</p>
        </div>
        <button 
          onClick={() => changeDate(1)} 
          className="p-3 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Summary */}
      <div className="grid grid-cols-3 gap-3">
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Delivered</p>
            <h3 className="text-2xl font-black text-emerald-900">{completedOrders.length}</h3>
          </div>
          
          <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Bottles Distributed</p>
            <h3 className="text-2xl font-black text-blue-900">{totalBottles}</h3>
          </div>
          
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100 shadow-sm flex flex-col justify-center">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Failed</p>
            <h3 className="text-2xl font-black text-red-900">{failedOrders.length}</h3>
          </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center">
          <Truck className="w-8 h-8 animate-pulse text-blue-400 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">Loading records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-gray-50 rounded-2xl border border-gray-200">
          <CalendarDays className="w-14 h-14 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-700">No Records</h3>
          <p className="text-sm text-gray-500 mt-1">No deliveries found for this date.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Completed */}
          {completedOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Completed
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{completedOrders.length}</span>
              </h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                {completedOrders.map(order => (
                  <div key={order._id} className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 truncate text-sm">{order.customerId?.userId?.fullName || 'Customer'}</p>
                      <p className="text-[11px] text-gray-500 truncate">{order.deliveryAddress}</p>
                      <div className="flex gap-1.5 mt-1.5">
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{order.quantity}× bottles</span>
                        <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          order.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                        }`}>
                          {order.paymentStatus === 'paid' ? <><Check className="w-3 h-3"/> Paid</> : <><X className="w-3 h-3"/> Unpaid</>}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="font-bold text-gray-900 text-sm">PKR {order.totalAmount}</p>
                      <p className="text-[10px] text-gray-500 font-medium">{order.paymentMethod}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Failed */}
          {failedOrders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" /> Failed
                <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold">{failedOrders.length}</span>
              </h3>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
                {failedOrders.map(order => (
                  <div key={order._id} className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-800 truncate text-sm">{order.customerId?.userId?.fullName || 'Customer'}</p>
                      <p className="text-[11px] text-red-500 truncate">{order.failureReason || 'No reason provided'}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">Failed</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
