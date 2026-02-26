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
        className={`relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 transform ${
          isVisible ? "scale-100 translate-y-0" : "scale-90 translate-y-12"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
        >
          <X size={20} />
        </button>

        <div className="pt-12 pb-10 px-8 text-center">
          {/* Animated Success Icon container */}
          <div className="relative mb-8 flex justify-center">
            <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping scale-150 opacity-20" />
            <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner">
              <CheckCircle2
                size={48}
                strokeWidth={2.5}
                className="animate-in zoom-in duration-500"
              />
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            {title || "Success!"}
          </h3>
          <p className="text-slate-500 font-medium leading-relaxed mb-6">
            {message}
          </p>

          {time && (
            <div className="bg-slate-50 rounded-2xl py-4 px-6 mb-8 inline-block">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {" "}
                Recorded Time{" "}
              </p>
              <p className="text-2xl font-black text-blue-600 tracking-tighter">
                {" "}
                {time}{" "}
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-4 bg-[#0F172A] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
          >
            Got it, thanks!
          </button>
        </div>

        {/* Bottom Decorative Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600" />
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
