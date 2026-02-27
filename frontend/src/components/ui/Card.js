/**
 * @description Flexible Card component for layout blocks.
 */
const Card = ({ children, className = "", noPadding = false }) => (
  <div
    className={`bg-white rounded-2xl border border-slate-200/60 shadow-sm transition-all duration-300 ${className}`}
  >
    <div className={noPadding ? "" : "p-5 md:p-6"}>{children}</div>
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex items-center justify-between mb-5 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-base font-semibold text-slate-800 tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className = "" }) => (
  <div className={`mt-5 pt-5 border-t border-slate-100 ${className}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
export default Card;
