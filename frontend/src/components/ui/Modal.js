"use client";

import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  className = "",
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const handleBackdropClick = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
    >
      {/* Blurred Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black/10 transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        <div
          className={`relative bg-white rounded-2xl shadow-2xl shadow-slate-200/50 w-full max-w-2xl sm:max-w-lg transition-all duration-300 border border-slate-200/60 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          } ${className}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 md:px-6 py-4 border-b border-slate-100">
            <h2 className="text-base md:text-lg font-semibold text-slate-900 pr-4">
              {title}
            </h2>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 md:px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
