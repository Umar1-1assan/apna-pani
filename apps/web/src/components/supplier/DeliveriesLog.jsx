import React, { useState, useEffect } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Download, Package, User, Clock, CheckCircle, XCircle, AlertCircle, Settings, Save, RefreshCw, Truck } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { api } from '../../api/client';

export function DeliveriesLog({ riders, supplierProfile, onUpdateSupplierProfile, onAssign }) {
  const { t } = useTranslation();
  
  const getLocalYMD = (date = new Date()) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Date selection state
  const [selectedDate, setSelectedDate] = useState(getLocalYMD());
  
  // Data state
  const [dailyOrders, setDailyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [operatingDays, setOperatingDays] = useState(supplierProfile?.operatingDays || [1, 2, 3, 4, 5, 6]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [syncResultModal, setSyncResultModal] = useState(null);

  // Fetch orders when selected date changes
  useEffect(() => {
    async function fetchDailyOrders() {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/orders/supplier?date=${selectedDate}`);
        setDailyOrders(res.data.data || []);
      } catch (err) {
        setError("Failed to fetch deliveries for the selected date.");
      } finally {
        setLoading(false);
      }
    }
    fetchDailyOrders();
  }, [selectedDate]);

  // Date Navigation Helpers
  const changeDate = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    // When parsing YYYY-MM-DD, JS creates UTC midnight. Thus toISOString is safe to use here.
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const setToday = () => {
    setSelectedDate(getLocalYMD());
  };

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
    setShowSettings(false);
  };

  const handleGenerateDeliveries = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/suppliers/deliveries/generate-today');
      const generatedCount = res.data.data?.generatedCount || 0;
      
      // Always refresh the currently viewed date to show the "menu refresh" effect
      setLoading(true);
      const refreshRes = await api.get(`/orders/supplier?date=${selectedDate}`);
      setDailyOrders(refreshRes.data.data || []);
      setLoading(false);
      
      setSyncResultModal({
        success: true,
        generated: generatedCount
      });
    } catch (err) {
      setSyncResultModal({
        success: false,
        message: err.response?.data?.message || "Failed to generate deliveries"
      });
      setLoading(false);
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

  // Grouping orders by status
  const pendingOrders = dailyOrders.filter(o => ['pending', 'assigned', 'in_transit'].includes(o.status));
  const completedOrders = dailyOrders.filter(o => ['delivered', 'completed'].includes(o.status));
  const missedOrders = dailyOrders.filter(o => o.status === 'failed');

  const totalRevenue = completedOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

  const getStatusBadge = (status) => {
    if (['pending', 'assigned', 'in_transit'].includes(status)) {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200 uppercase tracking-wider">{t('pending')}</span>;
    }
    if (status === 'delivered') {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">{t('awaiting')}</span>;
    }
    if (status === 'completed') {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 uppercase tracking-wider">{t('completed')}</span>;
    }
    if (status === 'failed') {
      return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">{t('missed')}</span>;
    }
    return <span className="inline-flex px-3 py-1 rounded-full text-[11px] font-bold bg-gray-50 text-gray-500 border border-dashed border-gray-300 uppercase tracking-wider">{t('cancelled')}</span>;
  };

  const renderTable = (ordersToRender, emptyMessage) => {
    if (ordersToRender.length === 0) {
      return (
        <div className="py-12 text-center text-gray-400 bg-white border border-gray-200 rounded-xl">
          <Package className="w-10 h-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm font-bold text-gray-500">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs w-48">{t('time')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('customer')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('rider')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('qty')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('amount')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {ordersToRender.map((o) => {
                const dateObj = o.createdAt ? new Date(o.createdAt) : new Date();
                const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                
                const custName = o.customerId?.userId?.fullName || "Walk-in Customer";
                const custInitials = custName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
                
                const riderName = o.deliveryBoyId?.userId?.fullName || "Unassigned";
                const riderInitials = riderName === "Unassigned" ? "?" : riderName.split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();

                return (
                  <tr key={o._id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="font-bold text-gray-700">{timeStr}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-xs shrink-0">
                          {custInitials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{custName}</p>
                          <p className="text-[11px] text-gray-500 font-medium truncate max-w-[150px]" title={o.deliveryAddress}>{o.deliveryAddress}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {riderName === "Unassigned" ? (
                          <select 
                            className="text-xs border border-gray-300 rounded-md p-1.5 focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-[160px]"
                            onChange={(e) => {
                              if (e.target.value) onAssign(o._id, e.target.value);
                            }}
                            defaultValue=""
                          >
                            <option value="" disabled>{t('assign_rider')}</option>
                            {riders?.map(r => (
                              <option key={r._id} value={r._id}>{r.userId?.fullName || r.areaName}</option>
                            ))}
                          </select>
                        ) : (
                          <>
                            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-[10px]">
                              {riderInitials}
                            </div>
                            <span className="font-semibold text-gray-700 text-sm">{riderName}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                        <span className="font-bold text-gray-900 text-sm">{o.quantity}</span>
                        <Package className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">PKR {(o.totalAmount || 0)}</p>
                      {o.paymentMethod === 'Billed_Later' && (
                        <div className="mt-1">
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                            Billed Later
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(o.status)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" />
            {t('deliveries_log')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage and track your delivery records by date.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Date Navigator */}
          <div className="flex items-center bg-white border border-gray-300 rounded-xl shadow-sm p-1">
            <button 
              onClick={() => changeDate(-1)} 
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 font-bold text-sm text-gray-800 outline-none bg-transparent cursor-pointer text-center w-36"
            />
            <button 
              onClick={() => changeDate(1)} 
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button 
              onClick={setToday}
              className="ml-2 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              Today
            </button>
          </div>

          <button 
            onClick={handleGenerateDeliveries}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 border border-[#0058bf] text-[#0058bf] bg-blue-50 hover:bg-blue-100 font-bold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50 w-full sm:w-auto justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Today</span>
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-sm font-bold transition-all shadow-sm w-full sm:w-auto ${
              showSettings ? 'bg-gray-800 border-gray-800 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-4 h-4" /> 
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="bg-gray-800 rounded-2xl shadow-lg p-6 max-w-2xl text-white animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gray-700 text-blue-400 rounded-xl">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Delivery Operating Days</h2>
              <p className="text-sm text-gray-400">Configure which days of the week automated deliveries are created.</p>
            </div>
          </div>
          
          <div className="bg-gray-900/50 p-6 rounded-xl border border-gray-700 mb-6">
            <p className="text-sm text-gray-400 font-medium mb-4 text-center">Click to toggle your delivery days</p>
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
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-110' 
                        : 'bg-gray-800 text-gray-500 border-2 border-gray-700 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-900/20 transition-transform active:scale-95 disabled:opacity-70"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? "Saving..." : "Save Configuration"}
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!showSettings && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Deliveries</p>
            <h3 className="text-2xl font-black text-gray-900">{dailyOrders.length}</h3>
          </div>
          <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Completed</p>
            <h3 className="text-2xl font-black text-emerald-900">{completedOrders.length}</h3>
          </div>
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-sm">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Pending</p>
            <h3 className="text-2xl font-black text-amber-900">{pendingOrders.length}</h3>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Expected Revenue</p>
            <h3 className="text-2xl font-black text-blue-900">PKR {totalRevenue.toFixed(2)}</h3>
          </div>
        </div>
      )}

      {/* Main Ledger Content */}
      {!showSettings && (
        <div className="space-y-8">
          {loading ? (
            <div className="py-20 text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Fetching records for {selectedDate}...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center bg-red-50 border border-red-200 rounded-xl text-red-600 font-bold">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              {error}
            </div>
          ) : (
            <>
              {pendingOrders.length > 0 && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Pending & Ongoing
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{pendingOrders.length}</span>
                  </h3>
                  {renderTable(pendingOrders, "No pending orders")}
                </div>
              )}

              {completedOrders.length > 0 && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" /> Completed
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{completedOrders.length}</span>
                  </h3>
                  {renderTable(completedOrders, "No completed orders")}
                </div>
              )}

              {missedOrders.length > 0 && (
                <div className="animate-fadeIn">
                  <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" /> Missed / Failed
                    <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">{missedOrders.length}</span>
                  </h3>
                  {renderTable(missedOrders, "No missed orders")}
                </div>
              )}

              {dailyOrders.length === 0 && (
                <div className="py-20 text-center bg-gray-50 border border-gray-200 rounded-2xl shadow-inner">
                  <CalendarDays className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-800 mb-2">No Records Found</h2>
                  <p className="text-gray-500 max-w-sm mx-auto">There are no deliveries logged for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Sync Result Modal */}
      {syncResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn scale-100 transition-transform">
            <div className={`p-8 flex flex-col items-center text-center ${syncResultModal.success ? 'bg-gradient-to-b from-emerald-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'}`}>
              {syncResultModal.success ? (
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <CheckCircle className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
              
              <h3 className={`text-2xl font-black mb-3 ${syncResultModal.success ? 'text-emerald-900' : 'text-red-900'}`}>
                {syncResultModal.success ? 'Sync Complete!' : 'Sync Failed'}
              </h3>
              
              {syncResultModal.success ? (
                <div className="space-y-3 text-gray-600 font-medium">
                  <p><strong className="text-emerald-700 text-lg">{syncResultModal.generated}</strong> new deliveries were generated.</p>
                  <p className="text-sm">These have been successfully added to your ledger for today.</p>
                </div>
              ) : (
                <p className="text-sm font-medium text-red-800">{syncResultModal.message}</p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <button 
                onClick={() => setSyncResultModal(null)}
                className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-md"
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
