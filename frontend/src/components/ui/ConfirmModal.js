"use client";

import { X, AlertCircle } from "lucide-react";

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' or 'primary'
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: "bg-red-600 hover:bg-red-700 shadow-red-100",
    primary: "bg-blue-600 hover:bg-blue-700 shadow-blue-100",
  };

  const iconStyles = {
    danger: "text-red-600 bg-red-50",
    primary: "text-blue-600 bg-blue-50",
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${iconStyles[variant]}`}>
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Confirmation Required
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-500 font-medium leading-relaxed px-1">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 bg-gray-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-xs text-gray-500 bg-white hover:bg-gray-100 transition-all border border-gray-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-lg transition-all active:scale-95 ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
