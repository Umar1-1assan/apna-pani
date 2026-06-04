import React, { useState } from 'react';
import { CalendarDays, Download, Package, User, Clock, CheckCircle, XCircle, AlertCircle, Settings, Save, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { api } from '../../api/client';

export function DeliveriesLog({ orders, riders, supplierProfile, onUpdateSupplierProfile, onFilter, onAssign }) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState("predefined_today");

  const todayStr = new Date().toDateString();

  const filterTabs = [
    { id: "all", label: t('all_deliveries'), count: orders.length },
    { id: "predefined_today", label: "Predefined Deliveries (Today)", count: orders.filter(o => o.deliveryDate && new Date(o.deliveryDate).toDateString() === todayStr).length },
    { id: "pending", label: t('pending_deliveries'), count: orders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status)).length },
    { id: "delivered", label: t('awaiting_confirmation'), count: orders.filter(o => o.status === 'delivered').length },
    { id: "completed", label: t('completed'), count: orders.filter(o => o.status === 'completed').length },
    { id: "missed", label: t('missed'), count: orders.filter(o => o.status === 'failed').length }
  ];

  let filteredOrders = orders;
  if (activeFilter === "predefined_today") filteredOrders = orders.filter(o => o.deliveryDate && new Date(o.deliveryDate).toDateString() === todayStr);
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

  const [operatingDays, setOperatingDays] = useState(supplierProfile?.operatingDays || [1, 2, 3, 4, 5, 6]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [syncResultModal, setSyncResultModal] = useState(null);

  const handleToggleDay = (dayIndex) => {
    setOperatingDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex) 
        : [...prev, dayIndex]
    );
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await onUpdateSupplierProfile({ operatingDays });
    setSavingSettings(false);
  };

  const handleGenerateDeliveries = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/suppliers/deliveries/generate-today');
      
      const predefinedCount = orders.filter(o => o.deliveryDate && new Date(o.deliveryDate).toDateString() === todayStr).length;
      
      const generatedCount = res.data.data?.generatedCount || 0;
      
      setSyncResultModal({
        success: true,
        generated: generatedCount,
        totalToday: predefinedCount + generatedCount
      });
    } catch (err) {
      setSyncResultModal({
        success: false,
        message: err.response?.data?.message || "Failed to generate deliveries"
      });
    } finally {
      setGenerating(false);
    }
  };

  const daysOfWeek = [
    { label: "S", full: "Sunday", index: 0 },
    { label: "M", full: "Monday", index: 1 },
    { label: "T", full: "Tuesday", index: 2 },
    { label: "W", full: "Wednesday", index: 3 },
    { label: "T", full: "Thursday", index: 4 },
    { label: "F", full: "Friday", index: 5 },
    { label: "S", full: "Saturday", index: 6 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('deliveries_log')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('deliveries_log_sub')}</p>
        </div>
        
        {activeFilter !== "settings" && (
          <div className="flex flex-col gap-2 w-full md:w-auto items-end">
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleGenerateDeliveries}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 border border-[#0058bf] text-[#0058bf] bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                {generating ? 'Generating...' : 'Sync Today\'s Deliveries'}
              </button>

              <button 
                onClick={() => setActiveFilter("settings")}
                className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg text-sm font-bold transition-all shadow-sm ${
                  activeFilter === "settings" ? 'bg-[#0058bf] border-[#0058bf] text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
              activeFilter === tab.id 
                ? tab.id === "predefined_today" ? 'bg-orange-500 text-white shadow-md shadow-orange-200' : 'bg-[#0058bf] text-white shadow-md shadow-blue-200' 
                : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {tab.id === "settings" && <Settings className="w-4 h-4" />}
            {tab.label}
            {tab.count > 0 && tab.id !== "settings" && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeFilter === "settings" ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Delivery Operating Days</h2>
              <p className="text-sm text-gray-500">Configure which days of the week you perform automated deliveries.</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-100 mb-8">
            <p className="text-sm text-gray-600 font-medium mb-4 text-center">Click to toggle your delivery days</p>
            <div className="flex justify-center gap-2 sm:gap-4 flex-wrap">
              {daysOfWeek.map(day => {
                const isActive = operatingDays.includes(day.index);
                return (
                  <button 
                    key={day.index}
                    onClick={() => handleToggleDay(day.index)}
                    title={day.full}
                    className={`w-12 h-12 rounded-full font-black text-sm flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-[#0058bf] text-white shadow-md shadow-blue-200 scale-110' 
                        : 'bg-white text-gray-400 border-2 border-gray-200 hover:border-gray-300 hover:text-gray-600'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end border-t border-gray-100 pt-6">
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 px-8 py-3 bg-[#0058bf] hover:bg-[#004a9f] text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200/50 transition-transform active:scale-95 disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      ) : (
        /* Data Table */
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
                        <span className="text-gray-500 text-xs ml-1">btls</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-900">₨ {(o.totalAmount || 0)}</p>
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
      )}

      {/* Sync Result Modal */}
      {syncResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn border border-gray-100">
            <div className={`p-6 flex flex-col items-center text-center ${syncResultModal.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {syncResultModal.success ? (
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <XCircle className="w-8 h-8" />
                </div>
              )}
              
              <h3 className={`text-xl font-bold mb-2 ${syncResultModal.success ? 'text-emerald-900' : 'text-red-900'}`}>
                {syncResultModal.success ? 'Sync Complete!' : 'Sync Failed'}
              </h3>
              
              {syncResultModal.success ? (
                <div className="space-y-2 text-sm text-emerald-800">
                  <p><strong>{syncResultModal.generated}</strong> new deliveries were generated.</p>
                  <p>You now have a total of <strong>{syncResultModal.totalToday}</strong> automated deliveries scheduled for today.</p>
                </div>
              ) : (
                <p className="text-sm text-red-800">{syncResultModal.message}</p>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100">
              <button 
                onClick={() => setSyncResultModal(null)}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-sm"
              >
                Close & Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
