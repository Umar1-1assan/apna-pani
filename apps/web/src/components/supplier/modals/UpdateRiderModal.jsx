import { Bike, X, Key, User, Briefcase, Camera, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

export function UpdateRiderModal({ rider, onClose, onUpdate, submitting, formError }) {
  const [form, setForm] = useState({
    fullName: rider.userId?.fullName || "",
    phone: rider.userId?.phone || "",
    email: rider.userId?.email || "",
    username: rider.userId?.username || "",
    password: "",
    shiftTiming: rider.shiftTiming || "Morning (06:00 - 14:00)",
    assignedVehicle: rider.assignedVehicle || "",
    licenseNumber: rider.licenseNumber || ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pass = "";
    for (let i = 0; i < 8; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(prev => ({ ...prev, password: pass }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(rider._id, form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
              <Bike className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Update Rider</h2>
              <p className="text-sm text-gray-500 mt-0.5">Modify details for {form.fullName}</p>
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

          <form id="updateRiderForm" onSubmit={handleSubmit} className="flex flex-col gap-8">
            
            {/* Section 1: Personal Details */}
            <section>
              <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4" /> Personal Details
              </h3>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Photo Upload Circle */}
                <div className="flex flex-col items-center justify-center shrink-0 gap-2">
                  <div className="w-24 h-24 rounded-full bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-sky-500 hover:text-sky-600 transition-colors cursor-pointer">
                    <Camera className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-semibold text-sky-600 cursor-pointer hover:underline">Update Photo</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-gray-600">Full Name</label>
                    <input name="fullName" value={form.fullName} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm" placeholder="e.g. John Doe" type="text" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Contact Number</label>
                    <input name="phone" value={form.phone} onChange={handleChange} required className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm" placeholder="+1 (555) 000-0000" type="tel" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600">Email Address</label>
                    <input name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm" placeholder="john@example.com" type="email" />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Login Credentials */}
            <section>
              <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Key className="w-4 h-4" /> Login Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-sky-50/30 p-5 rounded-xl border border-sky-100">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Username</label>
                  <input name="username" value={form.username} disabled className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed outline-none text-sm shadow-sm" type="text" />
                  <span className="text-[11px] text-gray-500">Username cannot be changed.</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">New Password</label>
                  <div className="flex gap-2">
                    <input name="password" value={form.password} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm shadow-sm flex-1" type="text" placeholder="Leave blank to keep current" />
                    <button type="button" onClick={generatePassword} className="px-4 py-2.5 rounded-lg border border-sky-200 text-sky-600 hover:bg-sky-100 bg-white transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm">
                      <RefreshCw className="w-4 h-4" /> Generate
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3: Operational Details */}
            <section>
              <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Operational Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Shift Timing</label>
                  <div className="relative">
                    <select name="shiftTiming" value={form.shiftTiming} onChange={handleChange} className="w-full pl-4 pr-10 py-2.5 appearance-none rounded-lg border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm bg-white">
                      <option value="Morning (06:00 - 14:00)">Morning (06:00 - 14:00)</option>
                      <option value="Evening (14:00 - 22:00)">Evening (14:00 - 22:00)</option>
                      <option value="Night (22:00 - 06:00)">Night (22:00 - 06:00)</option>
                    </select>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">Assigned Vehicle</label>
                  <input name="assignedVehicle" value={form.assignedVehicle} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm" placeholder="e.g. Van AF-205" type="text" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600">License Number</label>
                  <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all text-sm" placeholder="Driver License No." type="text" />
                </div>
              </div>
            </section>
            
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-semibold">
            Cancel
          </button>
          <button form="updateRiderForm" type="submit" disabled={submitting} className="px-6 py-2.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors text-sm font-semibold shadow-sm flex items-center gap-2">
            <Bike className="w-4 h-4" /> {submitting ? "Updating..." : "Update Rider"}
          </button>
        </div>
      </div>
    </div>
  );
}
