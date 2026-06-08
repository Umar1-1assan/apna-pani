import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit2, Ban, ChevronLeft, ChevronRight, User, Trash2, Users, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { ConfirmationModal } from '../ConfirmationModal';
import { useTranslation } from '../../contexts/LanguageContext';

export function RiderManagement({ riders, customers, onAddRider, onUpdateRider, onDeleteRider, onViewCustomers, onUpdateStatus }) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteRiderId, setDeleteRiderId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredRiders = riders.filter(r => {
    const matchesSearch = r.userId?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.areaName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.userId?.phone?.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || (statusFilter === 'active' && r.isActive !== false) || (statusFilter === 'inactive' && r.isActive === false);
    return matchesSearch && matchesStatus;
  });

  const itemsPerPage = 5;
  const totalPages = Math.ceil(filteredRiders.length / itemsPerPage) || 1;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const paginatedRiders = filteredRiders.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('rider_management')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('rider_management_sub')}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <input 
            type="text" 
            placeholder={t('search_riders')} 
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
              <option value="inactive">Inactive</option>
            </select>
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
          </div>
        </div>
        
        <button 
          onClick={onAddRider}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0058bf] hover:bg-[#004a9f] text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-transform active:scale-95 whitespace-nowrap"
        >
          <User className="w-4 h-4" /> {t('add_delivery_boy')}
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <tr>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Rider Name</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Area / Route</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">Contact Info</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">Customers Assigned</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-center">{t('status')}</th>
                <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {paginatedRiders.map((r, index) => {
                const initials = (r.userId?.fullName || "R").split(" ").map(n => n[0]).join("").substring(0,2).toUpperCase();
                const assignedCount = customers?.filter(c => c.deliveryBoyId === r._id).length || 0;
                const isActive = r.isActive !== false;

                return (
                  <tr key={r._id} className="hover:bg-[#f8fafc] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#e0e7ff] text-[#4338ca] font-bold flex items-center justify-center text-sm shrink-0 shadow-sm border border-indigo-100">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{r.userId?.fullName || t('unnamed_rider')}</p>
                          <p className="text-xs text-gray-500 font-medium">ID: #{r._id.substring(r._id.length - 4)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-semibold text-gray-700">{r.areaName || "Not assigned"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-700">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm font-medium">{r.userId?.phone || "N/A"}</span>
                        </div>
                        {r.userId?.email && (
                          <div className="text-[11px] text-gray-500 flex items-center gap-2">
                             <span className="truncate max-w-[150px]">{r.userId.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-bold px-3 py-1 rounded-full text-xs">
                        <Users className="w-3.5 h-3.5 mr-1" /> {assignedCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={isActive ? "true" : "false"}
                        onChange={(e) => onUpdateStatus && onUpdateStatus(r._id, e.target.value === "true")}
                        className={`appearance-none text-center inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border outline-none cursor-pointer hover:shadow-sm transition-all ${
                          isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        <option value="true">ACTIVE</option>
                        <option value="false">BLOCKED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button 
                          onClick={() => onViewCustomers(r)}
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors"
                          title="View Assigned Customers"
                        >
                          <Users className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onUpdateRider(r)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit Rider"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteRiderId(r._id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Rider"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRiders.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
                    <User className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-base font-bold text-gray-500">{t('no_riders_found')}</p>
                    <p className="text-sm">{t('adjust_search_rider')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-between items-center text-sm">
          <span className="text-gray-500 font-medium">
            Showing {filteredRiders.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + itemsPerPage, filteredRiders.length)} of {filteredRiders.length} entries
          </span>
          {totalPages > 1 && (
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={validCurrentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors bg-white"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-sm transition-colors ${
                    validCurrentPage === i + 1 
                      ? "bg-[#0058bf] text-white font-bold shadow-sm" 
                      : "border border-gray-200 text-gray-600 hover:bg-gray-100 bg-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={validCurrentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent transition-colors bg-white"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
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
