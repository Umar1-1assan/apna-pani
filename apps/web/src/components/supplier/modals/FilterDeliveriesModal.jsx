import { X, Filter, RotateCcw } from 'lucide-react';
import React, { useState } from 'react';

export function FilterDeliveriesModal({ onClose, onApply }) {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    customer: "",
    rider: "",
    status: {
      delivered: false,
      pending: false,
      missed: false,
      cancelled: false
    },
    bottleMin: "",
    bottleMax: ""
  });

  const handleStatusToggle = (statusName) => {
    setFilters(prev => ({
      ...prev,
      status: {
        ...prev.status,
        [statusName]: !prev.status[statusName]
      }
    }));
  };

  const handleReset = () => {
    setFilters({
      startDate: "",
      endDate: "",
      customer: "",
      rider: "",
      status: {
        delivered: false,
        pending: false,
        missed: false,
        cancelled: false
      },
      bottleMin: "",
      bottleMax: ""
    });
  };

  const handleApply = () => {
    onApply(filters);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Filter Deliveries</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          
          {/* Section: Date Range */}
          <section>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4">Date Range</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500">Start Date</label>
                <input type="date" value={filters.startDate} onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-gray-500">End Date</label>
                <input type="date" value={filters.endDate} onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
              </div>
            </div>
          </section>

          {/* Section: Search */}
          <section className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Customer</h3>
              <div className="relative">
                <input type="text" placeholder="Search customers..." value={filters.customer} onChange={e => setFilters(prev => ({ ...prev, customer: e.target.value }))} className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Rider</h3>
              <div className="relative">
                <input type="text" placeholder="Search riders..." value={filters.rider} onChange={e => setFilters(prev => ({ ...prev, rider: e.target.value }))} className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
            </div>
          </section>

          {/* Section: Status */}
          <section>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4">Delivery Status</h3>
            <div className="flex flex-wrap gap-3">
              {['delivered', 'pending', 'missed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => handleStatusToggle(status)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold capitalize border transition-all ${
                    filters.status[status] 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </section>

          {/* Section: Bottle Count Range */}
          <section>
            <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4">Bottle Count Range</h3>
            <div className="flex items-center gap-4">
              <input type="number" placeholder="Min" value={filters.bottleMin} onChange={e => setFilters(prev => ({ ...prev, bottleMin: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm text-center" />
              <span className="text-gray-400 font-bold">—</span>
              <input type="number" placeholder="Max" value={filters.bottleMax} onChange={e => setFilters(prev => ({ ...prev, bottleMax: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm text-center" />
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={handleReset} type="button" className="text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center gap-1.5 transition-colors">
            <RotateCcw className="w-4 h-4" /> Reset Filters
          </button>
          
          <div className="flex gap-3">
            <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button onClick={handleApply} type="button" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2">
              <Filter className="w-4 h-4" /> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
