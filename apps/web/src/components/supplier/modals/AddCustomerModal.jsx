import { UserPlus, X, Key, User, Truck, Droplets, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

export function AddCustomerModal({ onClose, onSubmit, riders, submitting, formError }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    bottlesPerDelivery: "4",
    deliveryFrequency: "1",
    bottlePrice: "150",
    deliveryCharges: "0",
    preferredDeliveryTime: "any",
    billingCycle: "monthly",
    deliveryBoyId: "",
    isActive: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(prev => ({ ...prev, password: pass }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Add New Customer</h2>
              <p className="text-sm text-gray-500 mt-0.5">Enter details to register a new water delivery client.</p>
            </div>
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

          <form id="addCustomerForm" onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Section 1: Login Credentials */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" /> Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-5 rounded-xl border border-gray-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Username</label>
                  <input name="username" value={form.username} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" placeholder="e.g. john_doe_waters" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Password</label>
                  <div className="flex gap-2">
                    <input name="password" value={form.password} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm flex-1" type="text" placeholder="Enter or generate..." />
                    <button type="button" onClick={generatePassword} className="px-4 py-2.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors text-sm font-semibold flex items-center gap-2">
                      <RefreshCw className="w-4 h-4" /> Generate
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Customer Details */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Customer Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Full Name / Company Name</label>
                  <input name="fullName" value={form.fullName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" placeholder="Enter full name" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Email Address (Optional)</label>
                  <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" placeholder="contact@example.com" type="email" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Contact Number</label>
                  <input name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" placeholder="+92 300 0000000" type="tel" />
                </div>
              </div>
            </section>

            {/* Section 3: Delivery Information */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Truck className="w-4 h-4" /> Delivery Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Delivery Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm resize-none" placeholder="Full street address..." rows="2"></textarea>
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-600">Address Notes (Optional)</label>
                  <input name="notes" value={form.notes} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" placeholder="e.g. Leave by the back door" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Delivery Volume (Bottles)</label>
                  <div className="relative">
                    <input name="bottlesPerDelivery" value={form.bottlesPerDelivery} onChange={handleChange} min="1" type="number" required className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                    <Droplets className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
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
                  <label className="text-xs font-semibold text-gray-600">Assigned Rider (Optional)</label>
                  <div className="relative">
                    <select name="deliveryBoyId" value={form.deliveryBoyId} onChange={handleChange} className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm bg-white">
                      <option value="">Select a rider...</option>
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
              </div>
            </section>

            {/* Section 4: Billing Preferences */}
            <section>
              <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" /> Billing Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Price per Bottle (PKR )</label>
                  <input name="bottlePrice" value={form.bottlePrice} onChange={handleChange} required min="1" type="number" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Delivery Charges (PKR )</label>
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

            {/* Section 4: Status */}
            <section className="bg-gray-50 p-5 rounded-xl flex items-center justify-between border border-gray-100">
              <div>
                <h4 className="text-sm font-semibold text-gray-800">Account Status</h4>
                <p className="text-xs text-gray-500 mt-1">Set whether this customer is immediately active for deliveries.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-semibold text-gray-800">Active</span>
              </label>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-semibold">
            Cancel
          </button>
          <button form="addCustomerForm" type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> {submitting ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </div>
    </div>
  );
}
