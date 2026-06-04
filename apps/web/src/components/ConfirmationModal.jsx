import React from 'react';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';

export function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning", // 'warning', 'danger', 'info', 'success'
  loading = false
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger': return <AlertTriangle className="w-8 h-8 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-8 h-8 text-amber-600" />;
      case 'success': return <CheckCircle2 className="w-8 h-8 text-green-600" />;
      case 'info':
      default: return <Info className="w-8 h-8 text-blue-600" />;
    }
  };

  const getIconBg = () => {
    switch (type) {
      case 'danger': return "bg-red-50 border-red-100";
      case 'warning': return "bg-amber-50 border-amber-100";
      case 'success': return "bg-green-50 border-green-100";
      case 'info':
      default: return "bg-blue-50 border-blue-100";
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger': return "bg-red-600 hover:bg-red-700 focus:ring-red-500 shadow-red-200";
      case 'warning': return "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-amber-200";
      case 'success': return "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-green-200";
      case 'info':
      default: return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 shadow-blue-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-[28px] border-2 ${getIconBg()} flex items-center justify-center mb-6 shadow-inner`}>
              {getIcon()}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
              {title}
            </h3>
            
            <p className="text-sm text-gray-500 leading-relaxed mb-8 px-2">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3.5 bg-white border-2 border-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200 disabled:opacity-50"
              >
                {cancelText}
              </button>
              
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 px-4 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${getConfirmButtonClass()}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
