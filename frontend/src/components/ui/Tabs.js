'use client';

import { useState } from 'react';

export function Tabs({ defaultValue, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className}>
      {Array.isArray(children) &&
        children.map((child) =>
          child?.type?.name === 'TabsList'
            ? {
                ...child,
                props: { ...child.props, activeTab, setActiveTab },
              }
            : child
        )}
      {Array.isArray(children) &&
        children.map((child) =>
          child?.type?.name === 'TabsContent'
            ? {
                ...child,
                props: { ...child.props, activeTab },
              }
            : child
        )}
    </div>
  );
}

export function TabsList({ children, activeTab, setActiveTab, className = '' }) {
  return (
    <div className={`flex border-b border-slate-200 ${className}`}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, setActiveTab })
      )}
    </div>
  );
}

export function TabsTrigger({ value, children, activeTab, setActiveTab, className = '' }) {
  const isActive = activeTab === value;
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
        isActive
          ? 'border-blue-600 text-blue-600'
          : 'border-transparent text-slate-600 hover:text-slate-900'
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, activeTab, className = '' }) {
  if (activeTab !== value) return null;
  return <div className={className}>{children}</div>;
}

const React = require('react');
