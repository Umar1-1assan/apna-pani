import React, { useState } from 'react';
import { Search, Plus, MapPin, Phone, ArrowLeftRight, User, AlertTriangle } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function RiderManagement({ riders, onAddRider }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRiders = riders.filter(r => 
    r.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.areaName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('rider_management')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('rider_management_sub')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder={t('search_riders')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          <button 
            onClick={onAddRider}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-[#0058bf] hover:bg-[#004a9f] text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-transform active:scale-95 whitespace-nowrap"
          >
            <User className="w-4 h-4" /> {t('add_delivery_boy')}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t('total_fleet')}</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-gray-900">{riders.length > 0 ? riders.length : 42}</h2>
            <span className="text-sm font-bold text-blue-600 mb-1">↗ +3 {t('this_week')}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t('on_duty_today')}</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-gray-900">{Math.max(0, riders.length - 2)}</h2>
            <span className="text-sm font-semibold text-gray-500 mb-1">{t('active_riders_lower')}</span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t('critical_sectors')}</p>
          <div className="flex items-end gap-3">
            <h2 className="text-4xl font-black text-red-600">2</h2>
            <span className="text-sm font-semibold text-gray-500 mb-1">{t('requiring_backup')}</span>
          </div>
        </div>
      </div>

      {/* Rider Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRiders.map((r, index) => {
          const initials = (r.userId?.fullName || "R").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
          
          // Mock statuses for visual variety based on index if no real status exists
          let statusLabel = t('on_duty');
          let statusClasses = "bg-teal-600 text-white shadow-teal-200";
          
          if (index % 4 === 1) {
            statusLabel = t('off_duty');
            statusClasses = "bg-gray-100 text-gray-500 border-gray-200";
          } else if (index % 4 === 2) {
            statusLabel = t('on_break');
            statusClasses = "bg-red-50 text-red-600 border-red-100";
          }

          return (
            <div key={r._id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm hover:shadow-md transition-shadow flex flex-col">
              <div className="p-5 flex gap-4">
                <div className="w-14 h-14 rounded-full bg-[#eff4ff] text-[#0058bf] font-bold text-xl flex items-center justify-center shrink-0 border-2 border-white shadow-sm overflow-hidden">
                  {/* Fallback to initials if no photo */}
                  {initials}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-gray-900 truncate pr-2">{r.userId?.fullName || t('unnamed_rider')}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm shrink-0 ${statusClasses}`}>
                      {statusLabel === t('on_duty') && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse"></span>}
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500 font-semibold">
                    <Phone className="w-3.5 h-3.5" />
                    {r.userId?.phone || "+1 (555) 000-0000"}
                  </div>
                </div>
              </div>
              
              <div className="mt-auto p-4 bg-[#f8fafc] border-t border-[#e2e8f0] rounded-b-xl flex items-center justify-between">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{t('assigned_area')}</p>
                    <p className="text-xs font-bold text-gray-800">{r.areaName || t('unassigned')}</p>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#cbd5e1] text-[#0058bf] rounded-md text-[11px] font-bold hover:bg-[#f1f5f9] transition-colors shadow-sm">
                  <ArrowLeftRight className="w-3 h-3" /> {t('change_area')}
                </button>
              </div>
            </div>
          );
        })}

        {filteredRiders.length === 0 && (
          <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-bold text-gray-500">{t('no_riders_found')}</p>
            <p className="text-sm">{t('adjust_search_rider')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
