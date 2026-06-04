import { X, Users, MapPin } from 'lucide-react';
import React from 'react';

export function RiderCustomersModal({ rider, customers, onClose }) {
  const riderCustomers = customers.filter(c => c.deliveryBoyId === rider._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Assigned Customers</h2>
              <p className="text-sm text-gray-500 mt-0.5">Customers assigned to {rider.userId?.fullName}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0] sticky top-0">
              <tr>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Customer Name</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Address</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Phone Number</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">Daily Bottles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {riderCustomers.map((c) => {
                const initials = (c.userId?.fullName || "A B").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
                return (
                  <tr key={c._id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{c.userId?.fullName || "N/A"}</p>
                          <p className="text-xs text-gray-500 font-medium">ID: #CUS-{c._id.substring(c._id.length - 4)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <p className="text-gray-600 font-medium max-w-[200px] truncate" title={c.address}>{c.address}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 font-semibold">{c.phoneNumber || c.userId?.phone || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 text-base">
                      {c.bottlesPerDelivery || 1}
                    </td>
                  </tr>
                );
              })}

              {riderCustomers.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-base font-bold text-gray-500">No customers assigned</p>
                    <p className="text-sm">This rider currently has no deliveries assigned to them.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50 rounded-b-xl">
          <span className="text-sm font-semibold text-gray-500">
            Total assigned: {riderCustomers.length} customers
          </span>
          <button onClick={onClose} type="button" className="px-6 py-2 rounded-lg bg-gray-800 text-white hover:bg-gray-900 transition-colors text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
