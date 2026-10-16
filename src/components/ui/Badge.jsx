import React from 'react';

/**
 * Badge — mono pill for taxonomy, severity labels, rule-weights, etc.
 * @param {{ children: React.ReactNode, className?: string }} props
 */
export function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium uppercase tracking-widest ${className}`}
    >
      {children}
    </span>
  );
}
