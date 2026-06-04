import { Package, X, Trash2, Save } from 'lucide-react';
import React, { useState } from 'react';
import { useTranslation } from '../../../contexts/LanguageContext';

export function UpdateProductModal({ product, onClose, onUpdate, onDelete, submitting, formError }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    name: product.name || "",
    description: product.description || "",
    price: product.price ? String(product.price) : "150",
    isAvailable: product.isAvailable !== undefined ? product.isAvailable : true
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(product._id, {
      ...form,
      price: parseFloat(form.price)
    });
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(product._id);
    } else {
      setConfirmDelete(true);
    }
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
              <h2 className="text-xl font-bold text-gray-800">{t("edit_product")}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
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

          {confirmDelete ? (
            <div className="bg-red-50 border border-red-200 text-red-800 p-5 rounded-xl flex flex-col gap-4">
              <div>
                <h4 className="font-bold text-base">Are you sure you want to delete this product?</h4>
                <p className="text-xs text-red-600 mt-1">This action cannot be undone and will permanently remove this item from your catalog.</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button 
                  onClick={() => setConfirmDelete(false)} 
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors text-sm"
                >
                  {t("cancel")}
                </button>
                <button 
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors text-sm flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" /> Yes, Delete Product
                </button>
              </div>
            </div>
          ) : null}

          <form id="updateProductForm" onSubmit={handleSubmit} className={`flex flex-col gap-5 ${confirmDelete ? 'opacity-40 pointer-events-none' : ''}`}>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("product_name")}</label>
              <input 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required 
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm font-medium" 
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
        <div className="p-6 border-t border-gray-100 flex justify-between gap-3 shrink-0 bg-gray-50 rounded-b-xl">
          {!confirmDelete ? (
            <button 
              onClick={() => setConfirmDelete(true)} 
              type="button" 
              className="px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-bold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" /> {t("delete_product")}
            </button>
          ) : (
            <div></div>
          )}
          <div className="flex gap-3">
            <button 
              onClick={onClose} 
              type="button" 
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors text-sm font-bold"
            >
              {t("cancel")}
            </button>
            <button 
              form="addProductForm" 
              onClick={handleSubmit}
              disabled={submitting || confirmDelete} 
              className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors text-sm shadow-sm flex items-center gap-2 disabled:opacity-55"
            >
              <Save className="w-4 h-4" /> {submitting ? "..." : t("save_product")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
