import React from 'react';
import { Package, Banknote, CheckCircle, AlertTriangle, Map, PhoneCall, Truck, Clock, ChevronRight, User, Droplets, MapPin, Check, X } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function RiderOverview({ 
  user, riderProfile, eodSummary, 
  activeDeliveries, awaitingConfirmation, completedDeliveries, 
  onStartRoute, onMarkArrived, onOpenComplete, onOpenFailed, 
  updating 
}) {
  const { t } = useTranslation();
  const isOperatingDay = riderProfile?.supplierId?.operatingDays?.includes(new Date().getDay());

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Profile Card ── */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-white/5 rounded-full" />
        
        <div className="relative flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-black shrink-0 border border-white/10">
            {user?.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'R'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-black truncate">{user?.fullName || 'Rider'}</h2>
            <p className="text-blue-200 text-sm font-medium truncate mb-2">{user?.phone || ''}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-white/15 px-2.5 py-1 rounded-md font-bold backdrop-blur-sm">
                {riderProfile?.areaName || 'Area'}
              </span>
              <span className="text-xs bg-white/15 px-2.5 py-1 rounded-md font-bold backdrop-blur-sm">
                {riderProfile?.supplierId?.businessName || 'Supplier'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Operating Day Status ── */}
      {riderProfile?.supplierId && (
        <div className={`flex items-center gap-4 p-5 rounded-3xl border ${
          isOperatingDay 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isOperatingDay ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'
          }`}>
            {isOperatingDay ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>
          <div>
            <h4 className={`text-base font-bold ${isOperatingDay ? 'text-emerald-900' : 'text-gray-700'}`}>
              {isOperatingDay ? t('today_operating_day') : t('today_off_day')}
            </h4>
            <p className={`text-sm ${isOperatingDay ? 'text-emerald-600' : 'text-gray-500'}`}>
              {isOperatingDay ? t('deliveries_running') : t('no_deliveries_today')}
            </p>
          </div>
        </div>
      )}

      {/* ── Daily Stats Strip ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 leading-none">
            {completedDeliveries.length}<span className="text-gray-400 text-base font-bold">/{activeDeliveries.length + completedDeliveries.length + awaitingConfirmation.length}</span>
          </p>
          <p className="text-[11px] text-gray-500 font-bold mt-2 uppercase tracking-wider">{t('stat_done')}</p>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Banknote className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-gray-900 leading-none mt-1">₨ {eodSummary?.totalCashCollected || 0}</p>
          <p className="text-[11px] text-gray-500 font-bold mt-2 uppercase tracking-wider">{t('stat_cash')}</p>
        </div>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-center">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Droplets className="w-5 h-5 text-gray-600" />
          </div>
          <p className="text-3xl font-black text-gray-900 leading-none mt-1">{eodSummary?.totalEmptyCarboys || 0}</p>
          <p className="text-[11px] text-gray-500 font-bold mt-2 uppercase tracking-wider">{t('stat_empties')}</p>
        </div>
      </div>
    </div>
  );
}
