import React from 'react';

/**
 * Card — shared surface card primitive.
 * @param {{ className?: string, children: React.ReactNode, glow?: 'crit' | 'warn' | 'safe' }} props
 */
export function Card({ className = '', children, glow }) {
  const glowMap = {
    crit: 'shadow-[0_0_24px_-8px_#EF4444]',
    warn: 'shadow-[0_0_24px_-8px_#F59E0B]',
    safe: 'shadow-[0_0_24px_-8px_#10B981]',
  };
  const glowClass = glow ? glowMap[glow] : '';
  return (
    <div
      className={`stagger-fade-in motion-reduce:animate-none bg-gradient-to-b from-[#1E222B] to-[#171A21] border border-[#2F3441] rounded-lg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_8px_24px_-12px_rgba(0,0,0,0.6)] hover:border-[#3B4150] transition ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}
