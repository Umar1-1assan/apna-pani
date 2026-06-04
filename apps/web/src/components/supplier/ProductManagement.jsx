import React, { useEffect, useState } from 'react';
import { Search, Plus, Trash2, Edit3, AlertTriangle, RefreshCw, Package, CheckCircle, Info, DollarSign } from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { api } from '../../api/client';
import { AddProductModal } from './modals/AddProductModal';
import { UpdateProductModal } from './modals/UpdateProductModal';

export function ProductManagement() {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get('/suppliers/products');
      setProducts(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddSubmit = async (formData) => {
    setSubmitting(true);
    setFormError("");
    try {
      await api.post('/suppliers/products', formData);
      setShowAddModal(false);
      loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (productId, formData) => {
    setSubmitting(true);
    setFormError("");
    try {
      await api.put(`/suppliers/products/${productId}`, formData);
      setShowUpdateModal(false);
      loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmit = async (productId) => {
    setSubmitting(true);
    setFormError("");
    try {
      await api.delete(`/suppliers/products/${productId}`);
      setShowUpdateModal(false);
      loadProducts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to delete product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailable = async (product) => {
    const originalState = product.isAvailable;
    
    // Optimistic UI update
    setProducts(prev => 
      prev.map(p => p._id === product._id ? { ...p, isAvailable: !originalState } : p)
    );

    try {
      await api.patch(`/suppliers/products/${product._id}/toggle`);
    } catch (err) {
      // Revert if API call fails
      setProducts(prev => 
        prev.map(p => p._id === product._id ? { ...p, isAvailable: originalState } : p)
      );
      alert("Failed to toggle product status. Reverting changes.");
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length;
  const availableProducts = products.filter(p => p.isAvailable).length;
  const unavailableProducts = totalProducts - availableProducts;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('product_mgmt')}</h1>
          <p className="text-sm text-gray-500 mt-1">Add, update, and manage the availability of products in your regional catalog.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
          
          <button 
            onClick={() => { setFormError(""); setShowAddModal(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-[#0058bf] hover:bg-[#004a9f] text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition-transform active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> {t('add_new_product')}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" /> {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('total_products')}</p>
            <h2 className="text-3xl font-black text-gray-900">{loading ? "..." : totalProducts}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('available_products')}</p>
            <h2 className="text-3xl font-black text-emerald-600">{loading ? "..." : availableProducts}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">{t('unavailable_products')}</p>
            <h2 className="text-3xl font-black text-red-600">{loading ? "..." : unavailableProducts}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="py-20 text-center text-gray-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-sm">Loading products catalog...</p>
        </div>
      )}

      {/* Product Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product._id} 
              className={`bg-white rounded-xl border transition-all duration-300 flex flex-col hover:translate-y-[-4px] ${
                product.isAvailable 
                  ? 'border-gray-200 shadow-sm hover:shadow-lg' 
                  : 'border-red-100 bg-red-50/10 shadow-sm opacity-90'
              }`}
            >
              <div className="p-5 flex-1 flex flex-col">
                {/* Product Header details */}
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-gray-900 leading-tight">{product.name}</h3>
                    <div className="flex items-center gap-1.5 mt-2 bg-blue-50 text-blue-800 font-black text-base px-2.5 py-1 rounded-lg border border-blue-100 shadow-sm w-fit">
                      <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>₨ {product.price}</span>
                    </div>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm shrink-0 ${
                    product.isAvailable 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                      : "bg-red-50 text-red-600 border-red-100"
                  }`}>
                    {product.isAvailable ? t("available") : t("unavailable")}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-500 font-semibold mt-2 flex-1 line-clamp-3">
                  {product.description || "No description provided."}
                </p>

                {/* Switch availability & buttons footer */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t("availability")}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={product.isAvailable} 
                        onChange={() => handleToggleAvailable(product)} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <button 
                    onClick={() => { setSelectedProduct(product); setFormError(""); setShowUpdateModal(true); }}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors border border-blue-100 shadow-sm"
                    title="Edit Product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
              <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-base font-bold text-gray-500">{t('no_products_found')}</p>
              <p className="text-sm">{t('adjust_search_product')}</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddProductModal 
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddSubmit}
          submitting={submitting}
          formError={formError}
        />
      )}

      {/* Update Modal */}
      {showUpdateModal && selectedProduct && (
        <UpdateProductModal 
          product={selectedProduct}
          onClose={() => setShowUpdateModal(false)}
          onUpdate={handleUpdateSubmit}
          onDelete={handleDeleteSubmit}
          submitting={submitting}
          formError={formError}
        />
      )}
    </div>
  );
}
