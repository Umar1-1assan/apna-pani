import { User, X, Key, Truck, Trash2, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';
import { ConfirmationModal } from '../../ConfirmationModal';

export function UpdateCustomerModal({ customer, onClose, onUpdate, onDelete, riders, submitting, formError }) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({
    username: customer.userId?.username || "",
    password: "", // Only sent if changed
    fullName: customer.userId?.fullName || "",
    email: customer.userId?.email || "",
    phone: customer.userId?.phone || customer.phoneNumber || "",
    address: customer.address || "",
    notes: customer.notes || "",
    bottlesPerDelivery: customer.bottlesPerDelivery || "4",
    deliveryFrequency: customer.deliveryFrequency || "1",
    bottlePrice: customer.bottlePrice || "150",
    deliveryCharges: customer.deliveryCharges || "0",
    preferredDeliveryTime: customer.preferredDeliveryTime || "any",
    billingCycle: customer.billingCycle || "monthly",
    deliveryBoyId: customer.deliveryBoyId || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    onUpdate(customer._id, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Update Customer</h2>
            <p className="text-sm text-gray-500 mt-0.5">Modify details for {form.fullName}</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          {formError && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg border border-red-100">
              {formError}
            </div>
          )}

          <form id="updateCustomerForm" onSubmit={handleUpdate} className="flex flex-col gap-8">
            
            {/* Section 1: Credentials */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" /> Account Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Username</label>
                  <input name="username" value={form.username} disabled className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none text-sm" type="text" />
                  <span className="text-[11px] text-gray-500">Username cannot be changed.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Password</label>
                  <input name="password" value={form.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" type="password" placeholder="Leave blank to keep unchanged" />
                </div>
              </div>
            </section>

            {/* Section 2: Personal & Contact */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal & Contact Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Full Name</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Email Address</label>
                  <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" type="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Contact Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" type="tel" />
                </div>
              </div>
            </section>

            {/* Section 3: Delivery Operations */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Delivery Operations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Delivery Address</label>
                  <input name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Delivery Volume (Bottles)</label>
                  <input name="bottlesPerDelivery" value={form.bottlesPerDelivery} onChange={handleChange} min="1" type="number" required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Delivery Frequency</label>
                  <div className="relative">
                    <select name="deliveryFrequency" value={form.deliveryFrequency} onChange={handleChange} className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm bg-white">
                      <option value="1">Daily</option>
                      <option value="2">Every 2 Days</option>
                      <option value="3">Every 3 Days</option>
                      <option value="4">Every 4 Days</option>
                      <option value="5">Every 5 Days</option>
                      <option value="6">Every 6 Days</option>
                      <option value="7">Weekly</option>
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Assigned Rider</label>
                  <div className="relative">
                    <select name="deliveryBoyId" value={form.deliveryBoyId} onChange={handleChange} className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm bg-white">
                      <option value="">Unassigned</option>
                      {riders.map(r => (
                        <option key={r._id} value={r._id}>{r.userId?.fullName || r.areaName}</option>
                      ))}
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Preferred Delivery Time</label>
                  <div className="relative">
                    <select name="preferredDeliveryTime" value={form.preferredDeliveryTime} onChange={handleChange} className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm bg-white">
                      <option value="any">Any Time</option>
                      <option value="morning">Morning (8 AM - 12 PM)</option>
                      <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                      <option value="evening">Evening (4 PM - 8 PM)</option>
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Delivery Notes</label>
                  <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm resize-none" rows="2"></textarea>
                </div>
              </div>
            </section>

            {/* Section 4: Billing Preferences */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Billing Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Price per Bottle (₨)</label>
                  <input name="bottlePrice" value={form.bottlePrice} onChange={handleChange} required min="1" type="number" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Delivery Charges (₨)</label>
                  <input name="deliveryCharges" value={form.deliveryCharges} onChange={handleChange} required min="0" type="number" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Billing Cycle</label>
                  <div className="relative">
                    <select name="billingCycle" value={form.billingCycle} onChange={handleChange} className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm bg-white">
                      <option value="weekly">Weekly</option>
                      <option value="fortnightly">Fortnightly (15 Days)</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </section>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-between items-center shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={() => setShowDeleteConfirm(true)} type="button" className="px-4 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-sm font-semibold flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Delete Customer
          </button>
          
          <div className="flex gap-3">
            <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-semibold">
              Cancel
            </button>
            <button form="updateCustomerForm" type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2">
              {submitting ? "Updating..." : "Update Customer"}
            </button>
          </div>
        </div>
      </div>

      <ConfirmationModal 
        isOpen={showDeleteConfirm} 
        onClose={() => setShowDeleteConfirm(false)} 
        onConfirm={() => {
          onDelete(customer._id);
          setShowDeleteConfirm(false);
        }} 
        title="Delete Customer" 
        message={`Are you sure you want to delete ${customer.userId?.fullName}? This action cannot be undone.`}
        type="danger"
        confirmText="Delete Customer"
      />
    </div>
  );
}
