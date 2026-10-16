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
      className={`bg-surface border border-border-soc rounded-lg ${glowClass} ${className}`}
    >
      {children}
    </div>
  );
}
