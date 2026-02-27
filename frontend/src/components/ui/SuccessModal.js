"use client";

import { CheckCircle2, X } from "lucide-react";
import { useEffect, useState } from "react";

export function SuccessModal({ isOpen, onClose, title, message, time }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ease-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div
        className={`relative bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 transform ${
          isVisible ? "scale-100 translate-y-0" : "scale-90 translate-y-12"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X size={18} />
        </button>

        <div className="pt-10 pb-8 px-8 text-center">
          {/* Animated Success Icon container */}
          <div className="relative mb-6 flex justify-center">
            <div className="absolute inset-0 bg-green-500/10 rounded-full animate-ping scale-150 opacity-20" />
            <div className="relative w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <CheckCircle2
                size={40}
                strokeWidth={2}
              />
            </div>
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {title || "Success!"}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            {message}
          </p>

          {time && (
            <div className="bg-slate-50 rounded-xl py-3 px-5 mb-6 inline-block">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Recorded Time
              </p>
              <p className="text-xl font-semibold text-green-600">
                {time}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-slate-800 active:scale-[0.98] transition-all"
          >
            Done
          </button>
        </div>

        {/* Bottom accent */}
        <div className="h-1 bg-gradient-to-r from-green-400 via-green-500 to-green-600" />
      </div>

      <style jsx>{`
        @keyframes ping {
          75%,
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animate-ping {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
