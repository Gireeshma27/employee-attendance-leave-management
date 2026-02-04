/**
 * @description Standard Badge component for status and labels.
 */
const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    danger: "bg-rose-50 text-rose-700 border-rose-100",
    info: "bg-sky-50 text-sky-700 border-sky-100",
    present: "bg-emerald-50 text-emerald-700 border-emerald-100",
    absent: "bg-rose-50 text-rose-700 border-rose-100",
    "half-day": "bg-amber-50 text-amber-700 border-amber-100",
    "work-from-home": "bg-indigo-50 text-indigo-700 border-indigo-100",
    secondary: "bg-slate-50 text-slate-600 border-slate-100",
  };

  return (
    <span
      className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${variants[variant] || variants.default} ${className}`}
    >
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
