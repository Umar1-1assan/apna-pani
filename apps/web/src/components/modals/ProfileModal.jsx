import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../contexts/LanguageContext';
import { User, Building2, MapPin, Phone, Mail, Lock, Loader2, KeyRound, Globe, LogOut } from 'lucide-react';
import { api } from '../../api/client';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose, onLogout }) {
  const { t, language, toggleLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('personal'); // personal, business, settings
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    businessName: '',
    address: '',
    areaName: '',
    bottlesPerDelivery: 1,
    deliveryFrequency: 1
  });

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    } else {
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        businessName: '',
        address: '',
        areaName: '',
        bottlesPerDelivery: 1,
        deliveryFrequency: 1
      });
      setActiveTab('personal');
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users/profile');
      const { user, roleProfile } = res.data.data;
      
      setProfile({ user, roleProfile });
      
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        password: '', // never populate password
        businessName: roleProfile?.businessName || '',
        address: roleProfile?.address || '',
        areaName: roleProfile?.areaName || '',
        bottlesPerDelivery: roleProfile?.bottlesPerDelivery || 1,
        deliveryFrequency: roleProfile?.deliveryFrequency || 1
      });
    } catch (error) {
      toast.error(error.response?.data?.message || t('error_fetching_profile') || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      
      const payload = { ...formData };
      if (!payload.password) delete payload.password; // Don't send empty password

      await api.put('/users/profile', payload);
      toast.success(t('profile_updated') || 'Profile updated successfully');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || t('error_updating_profile') || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50/50 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('profile_settings') || 'Profile Settings'}</h2>
              <p className="text-sm text-gray-500">{t('manage_your_account') || 'Manage your account details'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : profile && (
          <>
            {/* Tabs */}
            <div className="flex px-6 pt-4 border-b border-gray-100 gap-6">
              <button
                onClick={() => setActiveTab('personal')}
                className={`pb-3 text-sm font-medium transition-colors relative capitalize ${
                  activeTab === 'personal' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('personal_details') || 'Personal'}
                {activeTab === 'personal' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
              
              <button
                onClick={() => setActiveTab('business')}
                className={`pb-3 text-sm font-medium transition-colors relative capitalize ${
                  activeTab === 'business' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {profile.user.role === 'supplier' 
                  ? (t('business_details') || 'Business')
                  : profile.user.role === 'delivery_boy'
                    ? (t('route_details') || 'Route')
                    : (t('address_details') || 'Address')
                }
                {activeTab === 'business' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`pb-3 text-sm font-medium transition-colors relative capitalize ${
                  activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {t('settings') || 'Settings'}
                {activeTab === 'settings' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {activeTab === 'personal' && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('full_name')}</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('email') || 'Email (Optional)'}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Password Update Section */}
                  <div className="pt-4 mt-2 border-t border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-gray-500" />
                      {t('update_password') || 'Update Password'}
                    </h3>
                    <div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder={t('leave_blank_to_keep_current') || 'Leave blank to keep current password'}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'business' && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
                  
                  {profile.user.role === 'supplier' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('business_name') || 'Business Name'}</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {profile.user.role === 'customer' && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery_address') || 'Delivery Address'}</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                          <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery_volume') || 'Delivery Volume (Bottles)'}</label>
                          <input
                            type="number"
                            min="1"
                            name="bottlesPerDelivery"
                            value={formData.bottlesPerDelivery}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">{t('delivery_frequency') || 'Delivery Frequency'}</label>
                          <div className="relative">
                            <select
                              name="deliveryFrequency"
                              value={formData.deliveryFrequency}
                              onChange={handleChange}
                              className="w-full pl-4 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                            >
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
                      </div>
                    </div>
                  )}

                  {profile.user.role === 'delivery_boy' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('area_name') || 'Assigned Area'}</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="areaName"
                          value={formData.areaName}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                          required
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-5 animate-in slide-in-from-right-4 duration-200">
                  <div className="p-5 bg-gray-50 border border-gray-100 rounded-xl flex flex-col gap-4">
                    <h3 className="text-sm font-semibold text-gray-900">{t('app_settings') || 'App Settings'}</h3>
                    
                    <button type="button" onClick={toggleLanguage} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-300 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-sm text-gray-800">{language === 'en' ? t('switch_to_urdu') : t('switch_to_english')}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">{language === 'en' ? 'EN' : 'UR'}</span>
                    </button>

                    <button type="button" onClick={onLogout} className="w-full flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors text-red-600">
                      <div className="w-8 h-8 rounded-full bg-white text-red-600 flex items-center justify-center shadow-sm">
                        <LogOut className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-sm">{t('logout') || 'Logout'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {activeTab !== 'settings' && (
                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50"
                  >
                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('save_changes') || 'Save Changes'}
                  </button>
                </div>
              )}

            </form>
          </>
        )}
      </div>
    </div>
  );
}
