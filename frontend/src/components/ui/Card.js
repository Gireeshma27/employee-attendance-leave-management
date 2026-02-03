export function Card({ children, className = "", noPadding = false }) {
  return (
    <div
      className={`bg-white rounded-[24px] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
    >
      <div className={noPadding ? "" : "p-6 md:p-8"}>{children}</div>
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3
      className={`text-lg font-bold text-slate-800 tracking-tight ${className}`}
    >
      {children}
    </h3>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`mt-6 pt-6 border-t border-slate-50 ${className}`}>
      {children}
    </div>
  );
}
