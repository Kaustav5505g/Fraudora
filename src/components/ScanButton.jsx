import React, { useState, useEffect } from 'react';
import { ShieldAlert, Loader2 } from 'lucide-react';

const STATUS_LINES = [
  '> parsing payload...',
  '> evaluating Layer 1 rules...',
  '> inspecting links...',
  '> generating guidance...',
];

/**
 * ScanButton — full-width primary CTA with Ctrl/Cmd+Enter hint.
 * Disabled when payload is empty (not just during analyzing).
 *
 * @param {{
 *   isAnalyzing: boolean,
 *   isDisabled: boolean,   // true when payload is empty
 *   onScan: () => void,
 * }} props
 */
export function ScanButton({ isAnalyzing, isDisabled, onScan }) {
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      const frameId = requestAnimationFrame(() => setStatusIdx(0));
      return () => cancelAnimationFrame(frameId);
    }
    const id = setInterval(() => setStatusIdx((i) => Math.min(i + 1, STATUS_LINES.length - 1)), 400);
    return () => clearInterval(id);
  }, [isAnalyzing]);

  const effectivelyDisabled = isDisabled || isAnalyzing;

  return (
    <div className="space-y-2">
      {/* ── Full-width button with kbd hint ── */}
      <button
        type="button"
        onClick={onScan}
        disabled={effectivelyDisabled}
        title={isDisabled && !isAnalyzing ? 'Paste a message first' : undefined}
        aria-busy={isAnalyzing}
        aria-label={isAnalyzing ? 'Analyzing message, please wait' : 'Run scan and triage'}
        className={`w-full flex items-center justify-between gap-3
          px-5 py-3 rounded-lg font-mono font-bold text-[13px] tracking-widest
          min-h-[52px] transition-all duration-150
          focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
          ${effectivelyDisabled
            ? 'bg-accent text-obsidian cursor-not-allowed opacity-60 shadow-none'
            : 'bg-accent text-obsidian font-bold hover:bg-cyan-300 shadow-[0_0_28px_-6px_#22D3EE] active:scale-[0.99]'
          }`}
      >
        {/* Left: icon + label */}
        <span className="flex items-center gap-2">
          {isAnalyzing ? (
            <Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
          ) : (
            <ShieldAlert size={16} />
          )}
          {isAnalyzing ? 'ANALYZING...' : 'RUN SCAN & TRIAGE'}
        </span>

        {/* Right: keyboard hint */}
        {!isAnalyzing && (
          <span className="flex items-center gap-1 opacity-60 shrink-0">
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-obsidian/20 bg-obsidian/15 font-mono text-[10px] font-normal">
              Ctrl
            </kbd>
            <span className="font-mono text-[10px] font-normal">+</span>
            <kbd className="inline-flex items-center px-1.5 py-0.5 rounded border border-obsidian/20 bg-obsidian/15 font-mono text-[10px] font-normal">
              Enter
            </kbd>
          </span>
        )}
      </button>

      {/* ── Loading: cycling status log ── */}
      {isAnalyzing && (
        <div className="rounded-md border border-border-soc bg-[#0B0D11] px-3 py-2 space-y-1.5 animate-fade-in" aria-live="polite">
          {/* Indeterminate bar */}
          <div className="w-full h-[2px] bg-border-soc rounded-full overflow-hidden">
            <div className="h-full bg-crit/70 rounded-full animate-[progress_1.4s_ease-in-out_infinite]" />
          </div>
          <div className="space-y-1" aria-live="polite">
            {STATUS_LINES.slice(0, statusIdx + 1).map((line) => (
              <p key={line} className="font-mono text-xs text-muted-dim tracking-widest">
                {line}
              </p>
            ))}
          </div>
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
