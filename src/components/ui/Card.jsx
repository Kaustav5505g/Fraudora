import React from 'react';

/**
 * Card — shared surface card primitive.
 * @param {{ className?: string, children: React.ReactNode, glow?: 'crit' | 'warn' | 'safe' }} props
 */
export function Card({ className = '', children, glow }) {
  return (
    <div
      data-glow={glow}
      className={`animate-fade-slide-in motion-reduce:animate-none rounded-2xl border border-[#374151] bg-[#1f2937] p-5 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.5)] sm:p-6 ${className}`}
    >
      {children}
    </div>
  );
}
