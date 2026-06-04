import { Package, X, Plus } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

export function AddProductModal({ onClose, onSubmit, submitting, formError }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "150",
    isAvailable: true
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      price: parseFloat(form.price)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-gray-900/40 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh] scale-100 transition-transform">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{t("add_new_product")}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{t("adjust_search_product")}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors self-start">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {formError && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-lg border border-red-100">
              {formError}
            </div>
          )}

          <form id="addProductForm" onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("product_name")}</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
                placeholder="e.g. 19L Premium Carboy" 
                type="text" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("product_price")}</label>
              <input 
                name="price" 
                value={form.price} 
                onChange={handleChange} 
                required 
                min="0" 
                type="number" 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-black text-gray-900" 
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("product_desc")}</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleChange} 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm resize-none font-medium" 
                placeholder="Brief description of the product..." 
                rows="3"
              ></textarea>
            </div>

            {/* Status toggle */}
            <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100 mt-2">
              <div>
                <h4 className="text-sm font-bold text-gray-800">{t("availability")}</h4>
                <p className="text-xs text-gray-500 mt-0.5">{form.isAvailable ? t("available") : t("unavailable")}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  name="isAvailable" 
                  checked={form.isAvailable} 
                  onChange={handleChange} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} type="button" className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-bold">
            {t("cancel")}
          </button>
          <button 
            form="addProductForm" 
            type="submit" 
            disabled={submitting} 
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors text-sm shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> {submitting ? "..." : t("add_new_product")}
          </button>
        </div>
      </div>
    </div>
  );
}
