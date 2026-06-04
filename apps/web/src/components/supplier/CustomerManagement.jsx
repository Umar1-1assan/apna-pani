import React, { useState } from 'react';
import { Search, Filter, Plus, Edit2, Ban, ChevronLeft, ChevronRight, User, Trash2 } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { ConfirmationModal } from '../ConfirmationModal';

export function CustomerManagement({ customers, riders, onAddCustomer, onUpdateCustomer, onDeleteCustomer, onUpdateStatus }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteCustomerId, setDeleteCustomerId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [riderFilter, setRiderFilter] = useState("all");
  const [viewCustomer, setViewCustomer] = useState(null);

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || c.phoneNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesRider = riderFilter === "all" || (riderFilter === "unassigned" ? !c.deliveryBoyId : c.deliveryBoyId === riderFilter);
    return matchesSearch && matchesStatus && matchesRider;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('customer_management')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('customer_management_sub')}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder={t('search_customers')} 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all cursor-pointer"
            >
              <option value="all">{t('all_status')}</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="blocked">Blocked</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>

          <div className="relative">
            <select 
              value={riderFilter}
              onChange={(e) => setRiderFilter(e.target.value)}
              className="appearance-none pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all cursor-pointer"
            >
              <option value="all">All Riders</option>
              <option value="unassigned">Unassigned</option>
              {riders.map(r => (
                <option key={r._id} value={r._id}>{r.userId?.fullName || r.areaName}</option>
              ))}
            </select>
            <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-400 pointer-events-none" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        
        <button 
          onClick={onAddCustomer}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0058bf] hover:bg-[#004a9f] text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-transform active:scale-95 whitespace-nowrap"
        >
          <User className="w-4 h-4" /> {t('add_new_customer')}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Customer Name</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('address')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('assigned_rider')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">Volume & Freq</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">Billing Info</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('status')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredCustomers.map((c) => {
                const initials = (c.userId?.fullName || "A B").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
                const rider = riders.find(r => r._id === c.deliveryBoyId) || null;
                const riderInitials = rider ? (rider.userId?.fullName || "R").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase() : "";

                return (
                  <tr key={c._id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4">
                      <div 
                        className="flex items-center gap-3 cursor-pointer group-hover:opacity-80 transition-opacity"
                        onClick={() => setViewCustomer(c)}
                        title="Click to view personal info"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border border-indigo-100">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{c.userId?.fullName || "N/A"}</p>
                          <p className="text-xs text-gray-500 font-medium hover:underline">View Personal Info</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 font-medium max-w-[200px] truncate" title={c.address}>{c.address}</p>
                    </td>

                    <td className="px-6 py-4">
                      {rider ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-full bg-white shadow-sm">
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 font-bold text-[10px] flex items-center justify-center">
                            {riderInitials}
                          </div>
                          <span className="text-xs font-bold text-gray-700">{rider.userId?.fullName?.split(" ")[0]}</span>
                        </div>
                      ) : (
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-full bg-gray-50 text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors text-xs font-bold">
                          <Plus className="w-3 h-3" /> {t('assign')}
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-base">{c.bottlesPerDelivery || 1} btls</span>
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded mt-1">
                          {c.deliveryFrequency === 1 ? 'Daily' : c.deliveryFrequency === 7 ? 'Weekly' : `Every ${c.deliveryFrequency || 1} Days`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-gray-900 text-sm">₨ {c.bottlePrice} <span className="text-[10px] text-gray-500 font-normal">/btl</span></span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded mt-1">
                          {c.billingCycle || 'monthly'}
                        </span>
                        {c.walletBalance !== 0 && (
                          <span className={`text-[10px] font-bold mt-1 ${c.walletBalance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            Bal: ₨ {c.walletBalance}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={c.status || 'active'}
                        onChange={(e) => onUpdateStatus && onUpdateStatus(c._id, e.target.value)}
                        className={`appearance-none text-center inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border outline-none cursor-pointer hover:shadow-sm transition-all ${
                          (c.status || 'active') === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                          c.status === 'paused' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        <option value="active">ACTIVE</option>
                        <option value="paused">PAUSED</option>
                        <option value="blocked">BLOCKED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => onUpdateCustomer(c)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteCustomerId(c._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-base font-bold text-gray-500">{t('no_customers_found')}</p>
                    <p className="text-sm">{t('try_adjusting_filters')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">
            {t('showing_entries', { filtered: filteredCustomers.length, total: customers.length })}
          </span>
          <div className="flex gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-400 hover:bg-white transition-colors" disabled>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md bg-[#0058bf] text-white font-bold shadow-sm transition-colors">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-white transition-colors bg-transparent">
              2
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-white transition-colors bg-transparent">
              3
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={!!deleteCustomerId} 
        onClose={() => setDeleteCustomerId(null)} 
        onConfirm={() => {
          onDeleteCustomer(deleteCustomerId);
          setDeleteCustomerId(null);
        }} 
        title="Delete Customer" 
        message="Are you sure you want to delete this customer? This action cannot be undone."
        type="danger"
        confirmText="Delete Customer"
      />

      {/* Personal Info Modal / Card */}
      {viewCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden scale-100 transition-transform flex flex-col relative">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center">
              <button onClick={() => setViewCustomer(null)} className="absolute top-4 right-4 p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
              <div className="w-20 h-20 mx-auto bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 shadow-inner mb-3">
                {(viewCustomer.userId?.fullName || "A").substring(0, 1).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-white">{viewCustomer.userId?.fullName}</h3>
              <p className="text-blue-100 text-sm mt-1">Customer ID: #CUS-{viewCustomer._id.substring(viewCustomer._id.length - 4)}</p>
            </div>
            <div className="p-6 flex flex-col gap-4 bg-gray-50">
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</p>
                  <p className="font-bold text-gray-800">{viewCustomer.phoneNumber || viewCustomer.userId?.phone || "N/A"}</p>
                </div>
              </div>
              
              {viewCustomer.userId?.email && (
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email Address</p>
                    <p className="font-bold text-gray-800">{viewCustomer.userId?.email}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</p>
                  <p className="font-bold text-gray-800">{viewCustomer.userId?.username}</p>
                </div>
              </div>

              {viewCustomer.notes && (
                <div className="mt-2 text-sm text-gray-600 bg-white p-4 rounded-xl border border-gray-100 italic">
                  "{viewCustomer.notes}"
                </div>
              )}
            </div>
            <div className="p-4 bg-white border-t border-gray-100">
              <button 
                onClick={() => setViewCustomer(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
