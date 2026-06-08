import React, { useState } from 'react';
import { CreditCard, Receipt, Banknote } from 'lucide-react';
import { InvoicesManagement } from './InvoicesManagement';
import { BillingOverview } from './BillingOverview';
import { RiderCashManagement } from './RiderCashManagement';
import { useTranslation } from '../../contexts/LanguageContext';

export function SupplierPayments({ customers, riders, invoices, loadInvoices, supplierProfile }) {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('billing'); // 'billing' or 'invoices'

  return (
    <div className="space-y-6">
      {/* ── Page Header & Navigation ── */}
      <div className="bg-white px-6 py-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{t('payments_and_billing')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('manage_current_billing_cycles')}</p>
        
        <div className="flex gap-6 mt-6">
          <button
            onClick={() => setActiveSubTab('billing')}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'billing' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            {t('customers_billing')}
          </button>
          <button
            onClick={() => setActiveSubTab('invoices')}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'invoices' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            {t('generated_invoices')}
          </button>
          <button
            onClick={() => setActiveSubTab('cash')}
            className={`flex items-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all ${
              activeSubTab === 'cash' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Banknote className="w-4 h-4" />
            {t('rider_cash')}
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="px-6">
        {activeSubTab === 'billing' && (
          <BillingOverview loadInvoices={loadInvoices} />
        )}
        
        {activeSubTab === 'invoices' && (
          <InvoicesManagement 
            customers={customers} 
            invoices={invoices} 
            loadInvoices={loadInvoices}
            onGenerateInvoice={() => {}} // Can be removed if ad-hoc isn't needed anymore
            supplierProfile={supplierProfile}
          />
        )}
        
        {activeSubTab === 'cash' && (
          <RiderCashManagement 
            riders={riders}
            onCashReceived={loadInvoices} // Reload parent state if needed
          />
        )}
      </div>
    </div>
  );
}
