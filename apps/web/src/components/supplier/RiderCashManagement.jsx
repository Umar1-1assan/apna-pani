import React, { useState } from 'react';
import { api } from '../../api/client';
import { toast } from 'react-hot-toast';
import { Banknote, CheckCircle, Bike, MapPin } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export function RiderCashManagement({ riders = [], onCashReceived }) {
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, riderId: null });

  const handleReceiveCash = async () => {
    const riderId = confirmModal.riderId;
    setConfirmModal({ isOpen: false, riderId: null });
    if (!riderId) return;
    
    setLoadingId(riderId);
    try {
      await api.put(`/suppliers/riders/${riderId}/receive-cash`);
      toast.success(t('cash_received_success'));
      if (onCashReceived) {
        onCashReceived();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('failed_clear_rider_cash'));
    } finally {
      setLoadingId(null);
    }
  };

  const totalCashHeldByRiders = riders.reduce((sum, r) => sum + (r.cashInHand || 0), 0);
  const ridersWithCash = riders.filter(r => r.cashInHand && r.cashInHand > 0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      {/* Overview Stat Box */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Banknote className="w-32 h-32" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-100 mb-2 relative z-10">{t('total_cash_pending_collection')}</h2>
        <p className="text-5xl font-black relative z-10">₨ {totalCashHeldByRiders.toLocaleString()}</p>
        <p className="text-sm text-indigo-100 font-medium mt-3 relative z-10">
          {t('currently_held_by_riders', { count: ridersWithCash.length })}
        </p>
      </div>

      {/* Riders Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-gray-800">{t('rider_cash_remittance')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('settle_accounts_riders')}</p>
        </div>
        
        {riders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Bike className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-bold text-gray-600">{t('no_riders_found')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('rider_details')}</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('lifetime_remitted')}</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest">{t('current_cash_in_hand')}</th>
                  <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">{t('action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {riders.map(rider => (
                  <tr key={rider._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={`https://ui-avatars.com/api/?name=${rider.userId?.fullName || 'Rider'}&background=16a34a&color=fff`} className="w-10 h-10 rounded-xl shadow-sm" alt="Rider" />
                        <div>
                          <p className="font-bold text-gray-900">{rider.userId?.fullName || 'N/A'}</p>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {rider.areaName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-gray-600">₨ {(rider.totalCashRemitted || 0).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        {rider.cashInHand > 0 ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <p className="font-black text-xl text-red-600">₨ {rider.cashInHand.toLocaleString()}</p>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <p className="font-bold text-gray-400">₨ 0</p>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {rider.cashInHand > 0 ? (
                        <button
                          onClick={() => setConfirmModal({ isOpen: true, riderId: rider._id })}
                          disabled={loadingId === rider._id}
                          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all text-sm flex items-center justify-center gap-2 ml-auto"
                        >
                          {loadingId === rider._id ? t('processing') : (
                            <>{t('receive_cash')} <CheckCircle className="w-4 h-4" /></>
                          )}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1 w-max ml-auto">
                          <CheckCircle className="w-3.5 h-3.5" /> {t('cleared')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl animate-slideUp border border-gray-100">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
              <Banknote className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 text-center mb-2">{t('receive_cash_q')}</h3>
            <p className="text-gray-500 text-center text-sm font-medium mb-8">
              {t('receive_cash_confirm')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ isOpen: false, riderId: null })}
                className="flex-1 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition-colors border border-gray-200"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleReceiveCash}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
