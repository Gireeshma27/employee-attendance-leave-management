/**
 * @description Standard Badge component for status and labels.
 */
const Badge = ({ children, variant = "default", className = "", dot = false }) => {
  const variants = {
    default: "bg-slate-100 text-slate-600 border-slate-200/60",
    success: "bg-green-50 text-green-700 border-green-200/60",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200/60",
    danger: "bg-red-50 text-red-700 border-red-200/60",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
    present: "bg-green-50 text-green-700 border-green-200/60",
    absent: "bg-red-50 text-red-700 border-red-200/60",
    "half-day": "bg-yellow-50 text-yellow-700 border-yellow-200/60",
    "work-from-home": "bg-blue-50 text-blue-700 border-blue-200/60",
    secondary: "bg-slate-50 text-slate-600 border-slate-200/60",
  };

  const dotColors = {
    default: "bg-slate-400",
    success: "bg-green-500",
    warning: "bg-yellow-500",
    danger: "bg-red-500",
    info: "bg-blue-500",
    present: "bg-green-500",
    absent: "bg-red-500",
    "half-day": "bg-yellow-500",
    "work-from-home": "bg-blue-500",
    secondary: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${variants[variant] || variants.default} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />}
      {children}
    </span>
  );
};

export { Badge };
export default Badge;
