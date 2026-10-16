import React, { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, ShieldCheck } from 'lucide-react';

const CHECK_STEPS = [
  'Reading the message',
  'Checking the link',
  'Looking for pressure tactics',
];

export function ScanButton({ isAnalyzing, isDisabled, onScan }) {
  const [completedSteps, setCompletedSteps] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      const frameId = window.requestAnimationFrame(() => setCompletedSteps(0));
      return () => window.cancelAnimationFrame(frameId);
    }
    const intervalId = window.setInterval(() => {
      setCompletedSteps((count) => Math.min(count + 1, CHECK_STEPS.length));
    }, 500);
    return () => window.clearInterval(intervalId);
  }, [isAnalyzing]);

  const disabled = isDisabled || isAnalyzing;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onScan}
        disabled={disabled}
        title={isDisabled && !isAnalyzing ? 'Paste a message first' : undefined}
        aria-busy={isAnalyzing}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 text-base font-semibold text-white transition-colors hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isAnalyzing ? (
          <>
            <LoaderCircle size={19} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
            Checking...
          </>
        ) : (
          <>
            <ShieldCheck size={19} aria-hidden="true" />
            Check this message
          </>
        )}
      </button>
      {!isAnalyzing && (
        <p className="text-center text-xs text-slate-500">
          Press Ctrl+Enter to check
        </p>
      )}
      {isAnalyzing && (
        <ol aria-live="polite" aria-label="Checking message" className="space-y-1 rounded-xl bg-indigo-50/70 p-3">
          {CHECK_STEPS.map((step, index) => {
            const completed = index < completedSteps;
            const current = index === completedSteps && completedSteps < CHECK_STEPS.length;
            return (
              <li key={step} className={`flex items-center gap-2 text-sm ${completed ? 'text-accent' : current ? 'text-ink' : 'text-slate-400'}`}>
                <CheckCircle2 size={16} aria-hidden="true" className={completed ? 'text-accent' : 'text-slate-300'} />
                {step}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
