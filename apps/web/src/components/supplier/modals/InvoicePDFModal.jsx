import React, { useRef } from 'react';
import { X, Printer, Download } from 'lucide-react';

export function InvoicePDFModal({ invoice, onClose, supplierProfile }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const customerName = invoice.customerId?.userId?.fullName || 'Walk-in Customer';
  const customerPhone = invoice.customerId?.userId?.phone || invoice.customerId?.phoneNumber || '';
  const customerAddress = invoice.customerId?.address || '';
  
  const suppName = supplierProfile?.businessName || 'AquaFlow Hub';
  const suppPhone = supplierProfile?.supportPhone || '';
  const suppEmail = supplierProfile?.supportEmail || '';

  const issueDate = new Date(invoice.createdAt).toLocaleDateString();
  const startDate = new Date(invoice.startDate || invoice.periodStart || invoice.createdAt).toLocaleDateString();
  const endDate = new Date(invoice.endDate || invoice.periodEnd || invoice.createdAt).toLocaleDateString();
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : new Date(new Date(invoice.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm print:bg-white print:backdrop-blur-none print:inset-0 print:absolute">
      
      {/* ── Screen UI wrapper (hidden when printing) ── */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden print:hidden">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-gray-800 text-lg">Invoice Document</h3>
          <div className="flex items-center gap-3">
            <button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full border border-gray-200">
              <X className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100">
          {/* The actual invoice document */}
          <div className="bg-white w-full max-w-3xl mx-auto p-12 min-h-[800px] shadow-sm border border-gray-200 rounded-lg">
            <InvoiceContent 
              invoice={invoice} 
              customerName={customerName} 
              customerPhone={customerPhone} 
              customerAddress={customerAddress}
              suppName={suppName}
              suppPhone={suppPhone}
              suppEmail={suppEmail}
              issueDate={issueDate}
              startDate={startDate}
              endDate={endDate}
              dueDate={dueDate}
            />
          </div>
        </div>
      </div>

      {/* ── Print UI wrapper (only shown when printing) ── */}
      <div className="hidden print:block w-full bg-white text-black print:m-0 print:p-0 absolute top-0 left-0 right-0">
        <InvoiceContent 
          invoice={invoice} 
          customerName={customerName} 
          customerPhone={customerPhone} 
          customerAddress={customerAddress}
          suppName={suppName}
          suppPhone={suppPhone}
          suppEmail={suppEmail}
          issueDate={issueDate}
          startDate={startDate}
          endDate={endDate}
          dueDate={dueDate}
        />
      </div>

      {/* Global Print Styles inside component to ensure they are injected */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          /* Hide scrollbars during print */
          ::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

function InvoiceContent({ invoice, customerName, customerPhone, customerAddress, suppName, suppPhone, suppEmail, issueDate, startDate, endDate, dueDate }) {
  return (
    <div className="w-full text-gray-800 font-sans leading-relaxed">
      {/* Brand & Header */}
      <div className="flex justify-between items-start border-b-2 border-blue-600 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black text-blue-700 tracking-tight uppercase">Invoice</h1>
          <p className="text-gray-500 font-medium tracking-widest text-sm mt-1">NO. {invoice._id.slice(-6).toUpperCase()}</p>
        </div>
        <div className="text-right">
          <h2 className="text-2xl font-black text-gray-900">{suppName}</h2>
          <p className="text-sm text-gray-600 mt-1">{suppPhone}</p>
          <p className="text-sm text-gray-600">{suppEmail}</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-12 mb-12">
        {/* Bill To */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</p>
          <h3 className="text-lg font-bold text-gray-900">{customerName}</h3>
          <p className="text-sm text-gray-600 mt-1">{customerAddress || 'No Address Provided'}</p>
          <p className="text-sm text-gray-600 mt-1">{customerPhone}</p>
        </div>

        {/* Details */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500">Date Issued:</span>
            <span className="text-sm font-bold text-gray-900">{issueDate}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-semibold text-gray-500">Billing Period:</span>
            <span className="text-sm font-bold text-gray-900">{startDate} - {endDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-semibold text-gray-500">Payment Due:</span>
            <span className="text-sm font-bold text-red-600">{dueDate}</span>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <table className="w-full text-left mb-12">
        <thead>
          <tr className="border-y-2 border-gray-200">
            <th className="py-4 text-sm font-bold text-gray-600 uppercase tracking-wider">Description</th>
            <th className="py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-center">Qty</th>
            <th className="py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Rate</th>
            <th className="py-4 text-sm font-bold text-gray-600 uppercase tracking-wider text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-100">
            <td className="py-6">
              <p className="font-bold text-gray-900">Purified Water Carboys</p>
              <p className="text-xs text-gray-500 mt-1">19L standard bottles delivered between {startDate} and {endDate}</p>
            </td>
            <td className="py-6 text-center font-bold text-gray-800">{invoice.totalBottles || 0}</td>
            <td className="py-6 text-right text-gray-800">₨ {invoice.bottlePrice || 0}</td>
            <td className="py-6 text-right font-bold text-gray-900">₨ {((invoice.totalBottles || 0) * (invoice.bottlePrice || 0)).toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      {/* Arrears Details Table (if any) */}
      {invoice.arrearsDetails && invoice.arrearsDetails.length > 0 && (
        <div className="mb-12">
          <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 border-b-2 border-gray-100 pb-2">Previous Unpaid Invoices</h4>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice No.</th>
                <th className="py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">Billing Period</th>
                <th className="py-3 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Outstanding Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.arrearsDetails.map((arrear, idx) => (
                <tr key={idx} className="border-b border-gray-50">
                  <td className="py-4 text-sm font-bold text-gray-800">#{arrear.invoiceStringId}</td>
                  <td className="py-4 text-sm text-gray-600 text-center">{arrear.period}</td>
                  <td className="py-4 text-sm font-bold text-red-600 text-right">₨ {arrear.amountDue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-600">Subtotal</span>
            <span className="text-sm font-bold text-gray-900">₨ {((invoice.totalBottles || 0) * (invoice.bottlePrice || 0)).toLocaleString()}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-600">Tax</span>
            <span className="text-sm font-bold text-gray-900">₨ 0</span>
          </div>
          
          {invoice.previousDues > 0 && (
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-sm font-bold text-red-500">Previous Dues</span>
              <span className="text-sm font-bold text-red-600">₨ {invoice.previousDues.toLocaleString()}</span>
            </div>
          )}

          <div className="flex justify-between py-4 bg-blue-50 px-4 rounded-lg mt-4 border border-blue-100">
            <span className="text-base font-black text-blue-900">Total Due</span>
            <span className="text-xl font-black text-blue-700">₨ {(invoice.totalAmount || invoice.amount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-16 pt-8 border-t border-gray-200">
        <p className="text-sm font-bold text-gray-800 mb-1">Payment Instructions</p>
        <p className="text-sm text-gray-500">Please pay the total due by {dueDate}. You can pay directly to our delivery rider via cash, or use our digital payment channels on the application. Thank you for your business!</p>
      </div>
    </div>
  );
}
