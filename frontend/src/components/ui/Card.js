export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`px-4 md:px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={`text-base md:text-lg font-semibold text-gray-900 ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`px-4 md:px-6 py-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg ${className}`}>
      {children}
    </div>
  );
}
