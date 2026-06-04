import React, { useState } from 'react';
import { Search, Plus, MapPin, Phone, ArrowLeftRight, User, AlertTriangle, Edit2, Trash2, Users, ArrowUpRight } from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';
import { useTranslation } from '../../contexts/LanguageContext';

export function RiderManagement({ riders, customers, onAddRider, onUpdateRider, onDeleteRider, onViewCustomers }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteRiderId, setDeleteRiderId] = useState(null);

  const filteredRiders = riders.filter(r => 
    r.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.areaName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('rider_management')}</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">{t('rider_management_sub')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          <div className="relative w-full sm:w-80 group">
            <input 
              type="text" 
              placeholder={t('search_riders')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm group-hover:shadow-md"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 transition-colors group-hover:text-blue-500" />
          </div>
          
          <button 
            onClick={onAddRider}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
          >
            <User className="w-4 h-4" /> {t('add_delivery_boy')}
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-200/50 flex flex-col justify-between text-white relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-xs font-bold text-blue-100 uppercase tracking-wider mb-2 relative z-10">{t('total_fleet')}</p>
          <div className="flex items-end gap-3 relative z-10">
            <h2 className="text-5xl font-black">{riders.length > 0 ? riders.length : 0}</h2>
            <span className="text-sm font-bold text-blue-200 mb-1.5 flex items-center gap-1"><ArrowUpRight className="w-4 h-4"/> Active</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow group">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t('on_duty_today')}</p>
          <div className="flex items-end gap-3">
            <h2 className="text-5xl font-black text-gray-900">{Math.max(0, riders.length)}</h2>
            <span className="text-sm font-semibold text-gray-500 mb-1.5">{t('active_riders_lower')}</span>
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

          let statusStripClass = "bg-teal-500";
          if (index % 4 === 1) statusStripClass = "bg-gray-300";
          if (index % 4 === 2) statusStripClass = "bg-red-500";

          return (
            <div key={r._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col group overflow-hidden">
              {/* Top colored strip based on status */}
              <div className={`h-1.5 w-full ${statusStripClass}`}></div>
              
              <div className="p-6 flex gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 font-black text-2xl flex items-center justify-center shrink-0 border border-blue-100 shadow-inner group-hover:scale-105 transition-transform">
                  {/* Fallback to initials if no photo */}
                  {initials}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-xl font-extrabold text-gray-900 truncate tracking-tight pr-2">{r.userId?.fullName || t('unnamed_rider')}</h3>
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm shrink-0 ${statusClasses}`}>
                      {statusLabel === t('on_duty') && <span className="w-1.5 h-1.5 rounded-full bg-white opacity-80 animate-pulse"></span>}
                      {statusLabel}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shadow-sm">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      {r.userId?.phone || "+1 (555) 000-0000"}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 font-medium bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100 shadow-sm">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-bold text-gray-900">{customers?.filter(c => c.deliveryBoyId === r._id).length || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-auto px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                  ID: #{r._id.substring(r._id.length - 6)}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => onViewCustomers(r)} className="p-2 text-gray-400 hover:text-teal-600 hover:bg-white hover:shadow-sm rounded-lg transition-all flex items-center justify-center" title="View Customers">
                    <Users className="w-4 h-4" />
                  </button>
                  <button onClick={() => onUpdateRider(r)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-lg transition-all flex items-center justify-center" title="Edit Rider">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1"></div>
                  <button onClick={() => setDeleteRiderId(r._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white hover:shadow-sm rounded-lg transition-all flex items-center justify-center" title="Delete Rider">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
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

      <ConfirmationModal 
        isOpen={!!deleteRiderId} 
        onClose={() => setDeleteRiderId(null)} 
        onConfirm={() => {
          onDeleteRider(deleteRiderId);
          setDeleteRiderId(null);
        }} 
        title="Delete Rider" 
        message="Are you sure you want to delete this rider? Any assigned customers will become unassigned."
        type="danger"
        confirmText="Delete Rider"
      />
    </div>
  );
}
