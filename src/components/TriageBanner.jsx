import React, { useState, useCallback, useEffect } from 'react';
import { RotateCcw, ShieldAlert, Copy, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RISK_LEVELS, SHOW_DEMO_STATS } from '../data/mockData';

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
  const risk = RISK_LEVELS[result.riskLevel] || RISK_LEVELS.suspicious;

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
    { label: 'RULES', value: SHOW_DEMO_STATS ? `${result.indicators.length}/42` : String(result.indicators.length) },
    { label: 'LINKS', value: String((result.payload.match(/https?:\/\//g) || []).length) },
    { label: 'TERMS', value: String(result.highlightTerms.length) },
    ...(SHOW_DEMO_STATS ? [{ label: 'LATENCY', value: '142ms' }] : []),
  ];
  const statusLabel = result.riskLevel === 'safe' && status.includes('REQUIRED')
    ? 'LOW RISK'
    : status;

  return (
    <Card
      className="risk-banner border-risk overflow-hidden animate-triage-glow motion-reduce:animate-none"
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
                stroke={risk.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - (result.score / 100) * ringProgress)}
                style={{ filter: `drop-shadow(0 0 10px ${risk.color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-mono text-5xl font-bold leading-none ${risk.colorClass}`}>
                {displayedScore}
              </span>
              <span className="mt-1 font-mono text-xs text-muted-dim">/100</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Badge className={`w-fit ${risk.badgeClass}`}>
              <ShieldAlert size={11} />
              {result.riskLevel === 'safe' ? 'LOW RISK' : risk.label}
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
            <div aria-live="polite" className={`inline-flex w-fit max-w-full items-center gap-2 rounded-full border px-3 py-1.5 ${risk.badgeClass}`}>
              <span className={`inline-block h-2 w-2 rounded-full animate-pulse motion-reduce:animate-none ${risk.dotClass}`} />
              <span className={`break-words font-mono text-xs uppercase tracking-widest ${risk.colorClass}`}>{statusLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className={risk.badgeClass}>{result.taxonomy.primary}</Badge>
            <Badge className={risk.badgeClass}>{result.taxonomy.secondary}</Badge>
            <a
              href={result.taxonomy.mitre.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-accent underline decoration-accent/40 underline-offset-2"
            >
              {result.taxonomy.mitre.id}
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 xl:w-[330px] xl:shrink-0">
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
