import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { RefreshCw, Zap, User, Calendar, Search, Filter, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from '../../contexts/LanguageContext';

export function BillingOverview({ loadInvoices }) {
  const { t } = useTranslation();
  const [billingData, setBillingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cycleFilter, setCycleFilter] = useState('all');

  useEffect(() => {
    fetchBillingOverview();
  }, []);

  async function fetchBillingOverview() {
    try {
      setLoading(true);
      const res = await api.get('/suppliers/billing-overview');
      setBillingData(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error(t('failed_load_billing_overview'));
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateEarly(customerId) {
    try {
      setGeneratingFor(customerId);
      const res = await api.post(`/invoices/generate-early/${customerId}`);
      toast.success(t('invoice_generate_success'));
      
      // Refresh the local data to show 0 unbilled bottles
      fetchBillingOverview();
      
      // Also refresh the invoices list in the parent
      if (loadInvoices) loadInvoices();
      
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || t('invoice_generate_failed'));
    } finally {
      setGeneratingFor(null);
    }
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-sm overflow-hidden animate-fadeIn">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{t('current_billing_cycles')}</h2>
          <p className="text-xs text-gray-500">{t('billing_overview_sub')}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-blue-500 transition-colors" />
            <select 
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="pl-9 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-700 font-bold cursor-pointer hover:bg-gray-50 appearance-none shadow-sm transition-all"
            >
              <option value="all">{t('filter_by_cycle')}</option>
              <option value="weekly">{t('weekly_cycle')}</option>
              <option value="fortnightly">{t('fortnightly_cycle')}</option>
              <option value="monthly">{t('monthly_cycle')}</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t('search_customers_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          <button 
            onClick={fetchBillingOverview} 
            disabled={loading}
            className="p-2 text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-lg shadow-sm transition-all"
            title={t('refresh_list')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8fafc] border-b border-[#e2e8f0]">
            <tr>
              <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('customer')}</th>
              <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('cycle_info')}</th>
              <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('unbilled_deliveries')}</th>
              <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs">{t('accrued_amount')}</th>
              <th className="px-6 py-4 font-bold text-[#64748b] uppercase tracking-wider text-xs text-right">{t('actions_col')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                  <RefreshCw className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
                  <p className="text-sm font-semibold">{t('loading_billing_data')}</p>
                </td>
              </tr>
            ) : billingData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-base font-bold text-gray-500">{t('no_active_customers')}</p>
                </td>
              </tr>
            ) : (
              billingData
                .filter(d => 
                  (cycleFilter === 'all' || d.billingCycle === cycleFilter) &&
                  (d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  d.phone.includes(searchTerm))
                )
                .map((data) => (
                <tr key={data._id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{data.customerName}</p>
                    <p className="text-xs text-gray-500 font-medium">{data.phone}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 uppercase border border-blue-100">
                        {data.billingCycle === 'weekly' ? t('weekly_cycle') : data.billingCycle === 'fortnightly' ? t('fortnightly_cycle') : data.billingCycle === 'monthly' ? t('monthly_cycle') : data.billingCycle}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {t('next_bill')}: {new Date(data.nextInvoiceDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-bold text-lg ${data.unbilledBottles > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {data.unbilledBottles} <span className="text-sm font-medium text-gray-500">{t('bottles_unit')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className={`font-black text-lg ${data.unbilledAmount > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                      ₨ {data.unbilledAmount.toLocaleString()}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleGenerateEarly(data._id)}
                      disabled={generatingFor === data._id || data.unbilledBottles === 0}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingFor === data._id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Zap className="w-3.5 h-3.5" />
                      )}
                      {t('bill_now')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
