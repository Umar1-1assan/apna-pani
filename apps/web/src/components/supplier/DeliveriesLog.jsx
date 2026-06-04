import React, { useState } from 'react';
import { CalendarDays, Download, Package, User, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function DeliveriesLog({ orders, riders, onFilter, onAssign }) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("all");

  const filterTabs = [
    { id: "all", label: t('all_deliveries'), count: orders.length },
    { id: "pending", label: t('pending_deliveries'), count: orders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status)).length },
    { id: "delivered", label: t('awaiting_confirmation'), count: orders.filter(o => o.status === 'delivered').length },
    { id: "completed", label: t('completed'), count: orders.filter(o => o.status === 'completed').length },
    { id: "missed", label: t('missed'), count: orders.filter(o => o.status === 'failed').length }
  ];

  let filteredOrders = orders;
  if (activeFilter === "pending") filteredOrders = orders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status));
  if (activeFilter === "delivered") filteredOrders = orders.filter(o => o.status === 'delivered');
  if (activeFilter === "completed") filteredOrders = orders.filter(o => o.status === 'completed');
  if (activeFilter === "missed") filteredOrders = orders.filter(o => o.status === 'failed');

  const getStatusBadge = (status) => {
    if (['pending', 'assigned', 'in_transit'].includes(status)) {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600 border border-gray-200">{t('pending_deliveries')}</span>;
    }
    if (status === 'delivered') {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200">{t('awaiting_confirmation')}</span>;
    }
    if (status === 'completed') {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">{t('completed')}</span>;
    }
    if (status === 'failed') {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200">{t('missed')}</span>;
    }
    return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-gray-50 text-gray-500 border border-dashed border-gray-300">{t('cancelled')}</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('deliveries_log')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('deliveries_log_sub')}</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={onFilter}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all"
          >
            <CalendarDays className="w-4 h-4 text-gray-500" />
            Oct 12 - Oct 19, 2023
            <svg className="w-4 h-4 ml-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-lg text-sm font-bold text-[#0058bf] hover:bg-blue-50 shadow-sm transition-all">
            <Download className="w-4 h-4" /> {t('export')}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeFilter === tab.id 
                ? 'bg-[#0058bf] text-white shadow-md shadow-blue-200' 
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('date_down')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('customer')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('rider')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('bottle_count')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('amount')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredOrders.map((o) => {
                const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
                const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                const custName = o.customerId?.userId?.fullName || "Walk-in Customer";
                const custInitials = custName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
                
                const riderName = o.deliveryBoyId?.userId?.fullName || "Unassigned";
                const riderInitials = riderName === "Unassigned" ? "?" : riderName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
                const isMissed = o.status === 'failed';

                return (
                  <tr key={o._id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4">
                      <p className={`font-bold ${isMissed ? 'text-red-600' : 'text-gray-900'}`}>{dateStr}</p>
                      <p className={`text-xs font-semibold ${isMissed ? 'text-red-500' : 'text-gray-500'}`}>{timeStr} {isMissed && `(${t('late')})`}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-xs shrink-0">
                          {custInitials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{custName}</p>
                          <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]" title={o.deliveryAddress}>{o.deliveryAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {riderName === "Unassigned" ? (
                          <div className="flex items-center gap-2 w-full max-w-[200px]">
                            <select 
                              className="text-xs border border-gray-300 rounded p-1"
                              onChange={(e) => {
                                if (e.target.value) onAssign(o._id, e.target.value);
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>{t('assign_rider')}</option>
                              {riders?.map(r => (
                                <option key={r._id} value={r._id}>{r.userId?.fullName}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-[10px]">
                              {riderInitials}
                            </div>
                            <span className="font-semibold text-gray-700">{riderName}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-900">{o.quantity}</span> 
                      <span className="text-gray-500 text-xs ml-1">x 5 Gal</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">${(o.totalAmount || 0).toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(o.status)}
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-base font-bold text-gray-500">{t('no_deliveries_found')}</p>
                    <p className="text-sm">{t('no_orders_match_filter')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
