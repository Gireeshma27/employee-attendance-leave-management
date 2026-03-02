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
    danger: "bg-red-600 hover:bg-red-700 shadow-red-600/20",
    primary: "bg-blue-600 hover:bg-blue-700 shadow-blue-600/20",
  };

  const iconStyles = {
    danger: "text-red-600 bg-red-50",
    primary: "text-blue-700 bg-blue-50",
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden border border-slate-200/60">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-2.5 rounded-xl ${iconStyles[variant]}`}>
              <AlertCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 leading-none">
                {title}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">
                Confirmation Required
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="px-6 py-4 bg-slate-50/50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-600 bg-white hover:bg-slate-100 transition-all border border-slate-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-lg transition-all active:scale-[0.98] ${variantStyles[variant]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
