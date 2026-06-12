import React, { useState, useEffect } from 'react';
import { Store, Banknote, Workflow, Save, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useTranslation } from '../../contexts/LanguageContext';

export function SupplierConfiguration({ profileData, onSave }) {
  const { t } = useTranslation();
  const [profile, setProfile] = useState({
    name: "Aqua Pure Distributors",
    contactPerson: "Sarah Jenkins",
    address: "1450 Waterway Blvd, Suite 200, Metro City",
    email: "support@aquapure.net",
    phone: "+1 (555) 019-8234"
  });

  const [pricing, setPricing] = useState("6.50");
  
  const [apiConfig, setApiConfig] = useState({
    whatsappKey: "••••••••••••••••••••••••••••••••",
    status: "connected" // or 'disconnected'
  });
  
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profileData) {
      setProfile({
        name: profileData.businessName || "Aqua Pure Distributors",
        contactPerson: profileData.userId?.fullName || "Sarah Jenkins",
        address: "1450 Waterway Blvd, Suite 200", // Not in Supplier schema yet, keep static or add
        email: profileData.supportEmail || profileData.userId?.email || "support@aquapure.net",
        phone: profileData.supportPhone || profileData.userId?.phone || "+1 (555) 019-8234"
      });
      if (profileData.pricing && profileData.pricing.length > 0) {
        setPricing(profileData.pricing[0].defaultPrice.toString());
      }
    }
  }, [profileData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/suppliers/me', {
        businessName: profile.name,
        supportEmail: profile.email,
        supportPhone: profile.phone,
        pricing: parseFloat(pricing)
      });
      alert(t('config_saved_success'));
      if (onSave) onSave();
    } catch (err) {
      alert(t('config_save_failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('config_title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('config_sub')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Profile & API */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Settings */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-gradient-to-r from-gray-50/50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#0058bf]">
                <Store className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">Profile Settings</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('supplier_name')}</label>
                  <input type="text" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('contact_person')}</label>
                  <input type="text" value={profile.contactPerson} onChange={e => setProfile({...profile, contactPerson: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('business_address')}</label>
                  <input type="text" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('support_email')}</label>
                  <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('phone_number')}</label>
                  <input type="tel" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium text-gray-800 bg-gray-50 focus:bg-white" />
                </div>
              </div>
            </div>
          </div>

          {/* API Integration */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-gradient-to-r from-gray-50/50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Workflow className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{t('api_integration')}</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-5 leading-relaxed">
                {t('api_integration_sub')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1 flex flex-col gap-1.5 w-full">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t('whatsapp_api_key')}</label>
                  <div className="relative">
                    <svg className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                    <input type="text" value={apiConfig.whatsappKey} onChange={e => setApiConfig({...apiConfig, whatsappKey: e.target.value})} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-mono tracking-widest text-gray-600 bg-gray-50 focus:bg-white" />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#0058bf] hover:bg-[#004a9f] disabled:bg-gray-400 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-transform active:scale-95 flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <Save className="w-4 h-4" /> {saving ? t('saving') : t('save_configuration')}
                  </button>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-teal-600">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {t('status_connected')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden h-full">
            <div className="px-6 py-4 border-b border-[#e2e8f0] bg-gradient-to-r from-gray-50/50 to-white flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                <Banknote className="w-4 h-4" />
              </div>
              <h2 className="font-bold text-gray-800 text-lg">{t('pricing_title')}</h2>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <div className="w-full p-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl mb-6">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{t('default_price')}</p>
                <div className="flex items-center justify-center text-5xl font-black text-gray-900">
                  <span className="text-3xl text-gray-400 mr-1">Rs</span>
                  <input 
                    type="number" 
                    value={pricing} 
                    onChange={e => setPricing(e.target.value)}
                    className="w-32 bg-transparent outline-none text-center"
                    step="0.10"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">
                {t('pricing_sub')}
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
