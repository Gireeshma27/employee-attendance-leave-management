/**
 * @description Flexible Card component for layout blocks.
 */
const Card = ({ children, className = "", noPadding = false }) => (
  <div
    className={`bg-white rounded-[24px] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md ${className}`}
  >
    <div className={noPadding ? "" : "p-6 md:p-8"}>{children}</div>
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`flex items-center justify-between mb-6 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "" }) => (
  <h3
    className={`text-lg font-bold text-slate-800 tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const CardFooter = ({ children, className = "" }) => (
  <div className={`mt-6 pt-6 border-t border-slate-50 ${className}`}>
    {children}
  </div>
);

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
export default Card;
