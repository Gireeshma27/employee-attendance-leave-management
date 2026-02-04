export function Input({
  label,
  type = "text",
  placeholder,
  required,
  error,
  helperText,
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-slate-700 mb-2 ml-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full ${Icon ? "pl-12" : "px-4"} py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all text-sm text-slate-800 placeholder:text-slate-400 ${
            error
              ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
              : ""
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 mt-1.5 ml-1">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-slate-400 mt-1.5 ml-1">{helperText}</p>
      )}
    </div>
  );
}
