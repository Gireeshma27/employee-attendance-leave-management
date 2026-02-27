'use client';

import { X } from 'lucide-react';
import { useState } from 'react';

export function Alert({ title, description, type = 'info', dismissible = true, className = '' }) {
  const [isVisible, setIsVisible] = useState(true);

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    success: 'bg-green-50 border-green-200 text-green-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    error: 'bg-red-50 border-red-200/60 text-red-900',
  };

  if (!isVisible) return null;

  return (
    <div className={`border rounded-lg p-4 flex items-start justify-between ${typeStyles[type]} ${className}`}>
      <div>
        {title && <h3 className="font-semibold">{title}</h3>}
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>
      {dismissible && (
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 flex-shrink-0 hover:opacity-75 transition-opacity"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
