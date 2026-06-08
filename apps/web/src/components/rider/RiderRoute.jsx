import React from 'react';
import { Package, Banknote, Clock, Truck, MapPin, Check, X, Map, PhoneCall, CheckCircle, CalendarDays } from 'lucide-react';

export function RiderRoute({ 
  activeDeliveries, awaitingConfirmation, completedDeliveries, 
  onStartRoute, onMarkArrived, onOpenComplete, onOpenFailed, 
  updating 
}) {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* ── Active Deliveries (Cards) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" /> Today's Route
          </h3>
          {activeDeliveries.length > 0 && (
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
              {activeDeliveries.length} pending
            </span>
          )}
        </div>

        {activeDeliveries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <CheckCircle className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <p className="font-bold text-gray-700 text-xl">All caught up!</p>
            <p className="text-sm text-gray-400 mt-2">No pending deliveries right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeDeliveries.map((order, idx) => {
              const custName = order.customerId?.userId?.fullName || 'Customer';
              const custPhone = order.customerId?.userId?.phone;

              return (
                <div key={order._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="p-5 pb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black text-lg shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-bold text-gray-900 text-lg truncate">{custName}</h4>
                          <StatusPill status={order.status} />
                        </div>
                        <p className="text-sm text-gray-500 truncate">{order.deliveryAddress}</p>
                        
                        {order.notes && (
                          <div className="mt-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-medium text-amber-800">
                            <span className="font-bold">Note:</span> {order.notes}
                          </div>
                        )}

                        {/* Order Details */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg">
                            <Package className="w-3.5 h-3.5" /> {order.quantity}× {order.productType}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1.5 rounded-lg uppercase">
                            <Clock className="w-3.5 h-3.5" /> {order.timeSlot}
                          </span>
                          {order.paymentMethod === 'Billed_Later' ? (
                            <span className="flex items-center gap-1.5 text-xs font-bold bg-purple-50 text-purple-700 px-2.5 py-1.5 rounded-lg border border-purple-200">
                              <CalendarDays className="w-3.5 h-3.5" /> Billed Later
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg ${
                              order.paymentMethod === 'COD' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              <Banknote className="w-3.5 h-3.5" /> ₨ {order.totalAmount} ({order.paymentMethod})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions Bar */}
                  <div className="flex border-t border-gray-100 bg-gray-50/50">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 py-3 text-blue-600 text-sm font-bold hover:bg-blue-50 transition-colors border-r border-gray-100"
                    >
                      <Map className="w-4 h-4" /> Navigate
                    </a>
                    {custPhone && (
                      <a 
                        href={`tel:${custPhone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-gray-600 text-sm font-bold hover:bg-gray-100 transition-colors border-r border-gray-100"
                      >
                        <PhoneCall className="w-4 h-4" /> Call
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 pt-0 bg-gray-50/50">
                    {order.status === 'assigned' && (
                      <button 
                        onClick={() => onStartRoute(order._id)}
                        disabled={updating === order._id}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200/50 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <Truck className="w-5 h-5" /> Start Route
                      </button>
                    )}
                    {order.status === 'in_transit' && (
                      <button 
                        onClick={() => onMarkArrived(order._id)}
                        disabled={updating === order._id}
                        className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md shadow-purple-200/50 transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-5 h-5" /> I've Arrived
                      </button>
                    )}
                    {order.status === 'arrived' && (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => onOpenComplete(order)}
                          className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-md shadow-emerald-200/50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <Check className="w-5 h-5" /> Complete
                        </button>
                        <button 
                          onClick={() => onOpenFailed(order)}
                          className="py-3.5 px-6 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-sm font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <X className="w-5 h-5" /> Failed
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Awaiting Confirmation ── */}
      {awaitingConfirmation.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" /> Awaiting Customer Confirmation
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">{awaitingConfirmation.length}</span>
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {awaitingConfirmation.map(order => (
              <div key={order._id} className="p-5 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-base truncate">{order.customerId?.userId?.fullName || 'Customer'}</p>
                  <p className="text-sm text-gray-500 truncate">{order.deliveryAddress}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200">Pending</span>
                  <p className="text-sm font-bold mt-2 text-gray-600">₨ {order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Completed Today ── */}
      {completedDeliveries.length > 0 && (
        <div className="mt-8">
          <h3 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" /> Completed Today
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-200">{completedDeliveries.length}</span>
          </h3>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100">
            {completedDeliveries.map(order => (
              <div key={order._id} className="p-5 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                <div className="min-w-0">
                  <p className="font-bold text-gray-800 text-base truncate">{order.customerId?.userId?.fullName || 'Customer'}</p>
                  <p className="text-sm text-gray-500 truncate">{order.deliveryAddress}</p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <StatusPill status={order.status} />
                  <p className="text-sm font-bold mt-2 text-gray-600">₨ {order.totalAmount}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    assigned: 'bg-amber-100 text-amber-800 border-amber-200',
    in_transit: 'bg-blue-100 text-blue-800 border-blue-200',
    arrived: 'bg-purple-100 text-purple-800 border-purple-200',
    delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
  };
  const labels = {
    assigned: 'Assigned',
    in_transit: 'In Transit',
    arrived: 'Arrived',
    delivered: 'Delivered',
    completed: 'Completed',
    failed: 'Failed',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${styles[status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {labels[status] || status}
    </span>
  );
}
