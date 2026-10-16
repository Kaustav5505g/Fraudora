import React, { useState, useCallback } from 'react';
import { RotateCcw, ShieldAlert, Copy, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RISK_LEVELS } from '../data/mockData';

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
  const risk = RISK_LEVELS[result.riskLevel];

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(result.messageId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result.messageId]);

  /** Resolve status dot color from the status string */
  function resolveStatusDot(s) {
    if (s.includes('SAFE')) return 'bg-safe';
    if (s.includes('BLOCK') || s.includes('QUARANTINE') || s.includes('REQUIRED')) return 'bg-crit';
    if (s.includes('ESCALAT')) return 'bg-warn';
    return 'bg-warn';
  }

  return (
    <Card
      glow="crit"
      className="border-crit/60 bg-crit/5 overflow-hidden animate-slide-up"
    >
      <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 sm:p-6">
        {/* Left accent bar */}
        <div className="hidden md:block w-1 self-stretch rounded-full bg-crit shrink-0" />

        {/* ── Score block ── */}
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {/* Badge + score */}
          <div className="flex flex-col items-start gap-2">
            <Badge className="bg-crit/20 text-crit border border-crit/40">
              <ShieldAlert size={11} />
              HIGH RISK
            </Badge>
            {/* Confidence score */}
            <div className="flex items-end gap-1">
              <span className="font-mono font-bold text-4xl text-crit leading-none">
                {result.score}
              </span>
              <span className="font-mono text-xl text-muted-dim leading-none mb-0.5">
                / 100
              </span>
            </div>
            {/* Gauge bar */}
            <div className="w-24 h-1 rounded-full bg-border-soc overflow-hidden">
              <div
                className="h-full rounded-full bg-crit transition-all duration-700"
                style={{ width: `${result.score}%` }}
                role="progressbar"
                aria-valuenow={result.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Confidence score ${result.score} out of 100`}
              />
            </div>
          </div>

          {/* Meta: ID + status */}
          <div className="flex flex-col gap-2 min-w-0">
            {/* Message ID */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[11px] font-mono text-muted-dim uppercase tracking-widest shrink-0">
                MSG ID
              </span>
              <span className="font-mono text-[12px] text-muted break-all min-w-0">
                {result.messageId}
              </span>
              <button
                type="button"
                onClick={copyId}
                aria-label="Copy message ID to clipboard"
                className="shrink-0 text-muted-dim hover:text-muted transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink rounded"
              >
                {copied ? <Check size={13} className="text-safe" /> : <Copy size={13} />}
              </button>
            </div>

            {/* Status */}
            <div
              aria-live="polite"
              className="flex items-center gap-2"
            >
              <span
                className={`inline-block h-2 w-2 rounded-full animate-pulse motion-reduce:animate-none shrink-0 ${resolveStatusDot(status)}`}
              />
              <span className="font-mono text-[12px] text-muted uppercase tracking-widest">
                {status}
              </span>
            </div>
          </div>
        </div>

        {/* ── New Scan button ── */}
        <button
          type="button"
          onClick={onNewScan}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border-soc text-muted-dim font-mono text-[12px] tracking-widest
            hover:border-muted-dim hover:text-muted transition-colors duration-150 shrink-0 min-h-[40px]
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink"
        >
          <RotateCcw size={13} />
          NEW SCAN
        </button>
      </div>
    </Card>
  );
}
