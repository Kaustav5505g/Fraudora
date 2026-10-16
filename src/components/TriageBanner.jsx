import React, { useState, useCallback, useEffect } from 'react';
import { RotateCcw, ShieldAlert, Copy, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

/**
 * TriageBanner — full-width risk summary: score, message ID, status, new-scan.
 * @param {{
 *   result: import('../data/mockData').SCAN_RESULT,
 *   status: string,
 *   onNewScan: () => void,
 * }} props
 */
export function TriageBanner({ result, status, onNewScan }) {
  const [copied, setCopied] = useState(false);
  const [ringProgress, setRingProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const frameId = requestAnimationFrame(() => setRingProgress(1));
      return () => cancelAnimationFrame(frameId);
    }
    let frameId;
    const startedAt = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - startedAt) / 900, 1);
      setRingProgress(progress);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [result.score]);

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(result.messageId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result.messageId]);

  const circumference = 2 * Math.PI * 48;
  const displayedScore = Math.round(result.score * ringProgress);
  const statChips = [
    { label: 'RULES', value: `${result.indicators.length}/42` },
    { label: 'LINKS', value: String((result.payload.match(/https?:\/\//g) || []).length) },
    { label: 'TERMS', value: String(result.highlightTerms.length) },
    { label: 'LATENCY', value: '142ms' },
  ];

  return (
    <Card
      className="overflow-hidden border-crit/50 bg-gradient-to-r from-crit/15 via-crit/5 to-transparent animate-triage-glow motion-reduce:animate-none"
    >
      <div className="flex flex-col gap-4 p-4 sm:p-6 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div
            className="relative h-[120px] w-[120px] shrink-0"
            role="progressbar"
            aria-valuenow={displayedScore}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Confidence score ${displayedScore} out of 100`}
          >
            <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90 overflow-visible">
              <circle cx="60" cy="60" r="48" fill="none" stroke="#2F3441" strokeWidth="6" />
              <circle
                cx="60"
                cy="60"
                r="48"
                fill="none"
                stroke="#EF4444"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - (result.score / 100) * ringProgress)}
                className="drop-shadow-[0_0_10px_#EF4444]"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-5xl font-bold leading-none text-crit">
                {displayedScore}
              </span>
              <span className="mt-1 font-mono text-xs text-muted-dim">/100</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Badge className="w-fit bg-crit/20 text-crit border border-crit/40">
              <ShieldAlert size={11} />
              HIGH RISK
            </Badge>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-muted-dim uppercase tracking-widest shrink-0">
                MSG ID
              </span>
              <span className="font-mono text-[13px] text-muted break-all min-w-0">
                {result.messageId}
              </span>
              <button
                type="button"
                onClick={copyId}
                aria-label="Copy message ID to clipboard"
                className="shrink-0 text-muted-dim hover:text-accent transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent rounded"
              >
                {copied ? <Check size={13} className="text-safe" /> : <Copy size={13} />}
              </button>
            </div>
            <div aria-live="polite" className="inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-warn/40 bg-warn/15 px-3 py-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-warn animate-pulse motion-reduce:animate-none" />
              <span className="break-words font-mono text-xs text-warn uppercase tracking-widest">{status}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[440px] xl:shrink-0">
          {statChips.map(({ label, value }) => (
            <div key={label} className="rounded-md border border-border-soc bg-obsidian/40 px-3 py-2">
              <p className="font-mono text-xs tracking-widest text-muted-dim">{label}</p>
              <p className="mt-1 font-mono text-base tabular-nums text-ink">{value}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onNewScan}
          className="flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-lg border border-border-soc px-4 py-2.5 font-mono text-xs tracking-widest text-muted-dim transition-colors duration-150 hover:border-accent/50 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent xl:ml-auto"
        >
          <RotateCcw size={13} />
          NEW SCAN
        </button>
      </div>
    </Card>
  );
}
