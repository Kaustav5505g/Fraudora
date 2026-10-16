import React from 'react';

/**
 * Card — shared surface card primitive.
 * @param {{ className?: string, children: React.ReactNode, glow?: 'crit' | 'warn' | 'safe' }} props
 */
export function Card({ className = '', children, glow }) {
  return (
    <div
      data-glow={glow}
      className={`animate-fade-slide-in motion-reduce:animate-none rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.08)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
