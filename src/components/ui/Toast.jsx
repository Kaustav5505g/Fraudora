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
    info:    'border-slate-200 bg-white text-ink',
    success: 'border-emerald-200 bg-emerald-50 text-safe',
    warn:    'border-amber-200 bg-amber-50 text-warn',
    crit:    'border-red-200 bg-red-50 text-crit',
  };

  const Icon = tone === 'success' ? CheckCircle : AlertCircle;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-4 z-50 flex min-h-12 min-w-[240px] items-center gap-3 rounded-xl border px-4 py-3 font-sans text-sm shadow-lg animate-slide-up motion-reduce:animate-none ${styles[tone]}`}
    >
      <Icon size={15} className="shrink-0" />
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg opacity-60 transition-opacity duration-150 hover:bg-black/5 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <X size={14} />
      </button>
    </div>
  );
}
