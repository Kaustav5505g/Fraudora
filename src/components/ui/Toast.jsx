import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Toast — lightweight ephemeral notification, auto-dismisses after 3 s.
 * @param {{ message: string, tone: 'info' | 'success' | 'warn' | 'crit', onDismiss: () => void }} props
 */
export function Toast({ message, tone = 'info', onDismiss }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 3000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  const styles = {
    info:    'border-border-soc bg-surface text-ink',
    success: 'border-safe/40 bg-safe/10 text-safe',
    warn:    'border-warn/40 bg-warn/10 text-warn',
    crit:    'border-crit/40 bg-crit/10 text-crit',
  };

  const Icon = tone === 'success' ? CheckCircle : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-4 z-50 flex items-center gap-3 min-w-[240px] max-w-xs px-4 py-3 rounded-lg border font-mono text-[13px] shadow-lg animate-slide-up ${styles[tone]}`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity duration-150"
      >
        <X size={14} />
      </button>
    </div>
  );
}
