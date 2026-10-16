import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

/** Cycling status lines shown while analyzing */
const STATUS_LINES = [
  '> parsing payload...',
  '> evaluating Layer 1 rules...',
  '> inspecting links...',
  '> generating guidance...',
];

/**
 * ScanButton — primary CTA with loading state, status cycling, and indeterminate bar.
 * @param {{ isAnalyzing: boolean, onScan: () => void }} props
 */
export function ScanButton({ isAnalyzing, onScan }) {
  const [statusIdx, setStatusIdx] = useState(0);

  // Cycle status lines every 450 ms while analyzing
  useEffect(() => {
    if (!isAnalyzing) { setStatusIdx(0); return; }
    const id = setInterval(() => {
      setStatusIdx((i) => (i + 1) % STATUS_LINES.length);
    }, 450);
    return () => clearInterval(id);
  }, [isAnalyzing]);

  return (
    <div className="space-y-2">
      {/* ── Main button ── */}
      <button
        type="button"
        onClick={onScan}
        disabled={isAnalyzing}
        aria-busy={isAnalyzing}
        aria-label={isAnalyzing ? 'Analyzing message, please wait' : 'Run scan and triage'}
        className={`w-full sm:w-auto flex items-center justify-center gap-2
          px-8 py-3 rounded-lg font-mono font-bold text-[13px] tracking-widest
          min-h-[48px] transition-all duration-150
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink
          ${isAnalyzing
            ? 'bg-ink/60 text-obsidian cursor-not-allowed'
            : 'bg-ink text-obsidian hover:bg-white active:scale-[0.98]'
          }`}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
            ANALYZING...
          </>
        ) : (
          <>
            <ShieldAlert size={16} />
            RUN SCAN &amp; TRIAGE
          </>
        )}
      </button>

      {/* ── Loading state: indeterminate bar + cycling status ── */}
      {isAnalyzing && (
        <div className="space-y-2 animate-fade-in" aria-live="polite">
          {/* Indeterminate progress bar */}
          <div className="w-full h-[2px] bg-border-soc rounded-full overflow-hidden">
            <div className="h-full bg-crit/70 rounded-full animate-[progress_1.4s_ease-in-out_infinite]" />
          </div>
          {/* Cycling status line */}
          <p className="font-mono text-[11px] text-muted-dim tracking-widest transition-opacity duration-300">
            {STATUS_LINES[statusIdx]}
          </p>
        </div>
      )}

      <style>{`
        @keyframes progress {
          0%   { width: 0%;   margin-left: 0%; }
          50%  { width: 60%;  margin-left: 20%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>
    </div>
  );
}
