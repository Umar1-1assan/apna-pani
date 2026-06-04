import React, { useState } from 'react';
import { Search, Filter, Plus, Edit2, Ban, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function CustomerManagement({ customers, riders, onAddCustomer, onUpdateCustomer, onDeleteCustomer }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(c => 
    c.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phoneNumber?.includes(searchTerm)
  );

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
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <Filter className="w-4 h-4 text-gray-500" /> {t('all_status')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
            <span className="w-3 h-3 rounded-full border-2 border-gray-400" /> {t('zone_a')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-700 transition-all">
            <Plus className="w-4 h-4" /> {t('add_filter')}
          </button>
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
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('customer_name')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('address')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('phone')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('assigned_rider')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('daily_bottles')}</th>
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
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-sm shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{c.userId?.fullName || "N/A"}</p>
                          <p className="text-xs text-gray-500 font-medium">ID: #CUS-{c._id.substring(c._id.length - 4)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 font-medium max-w-[200px] truncate" title={c.address}>{c.address}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 font-semibold">{c.phoneNumber || c.userId?.phone || "N/A"}</p>
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
                    <td className="px-6 py-4 text-center font-bold text-gray-900 text-base">
                      {c.monthlyBottles || 1}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                        {t('status_active')}
                      </span>
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
                          onClick={() => { if(window.confirm('Delete customer?')) onDeleteCustomer(c._id); }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Ban/Delete Customer"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
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
    </div>
  );
}
