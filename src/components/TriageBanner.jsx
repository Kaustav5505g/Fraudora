import React, { useState, useCallback } from 'react';
import { RotateCcw, ShieldAlert, Copy, Check } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RISK_LEVELS, SHOW_DEMO_STATS } from '../data/mockData';

const GLOW = {
  critical: 'bg-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.25)] animate-pulse motion-reduce:animate-none',
  suspicious: 'bg-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.25)]',
  safe: 'bg-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.25)]',
};

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
  const risk = RISK_LEVELS[result.riskLevel] || RISK_LEVELS.suspicious;

  const copyId = useCallback(() => {
    navigator.clipboard.writeText(result.messageId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [result.messageId]);

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
      className={`risk-banner border-risk overflow-hidden animate-triage-glow motion-reduce:animate-none ${
        result.riskLevel === 'critical' ? 'border-[#ef4444]/50' : ''
      }`}
    >
      <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className={`inline-flex items-center gap-3 rounded-full px-5 py-2 font-bold text-white ${GLOW[result.riskLevel] || GLOW.suspicious}`}>
            <span className="font-mono text-2xl tabular-nums">{result.score}</span>
            <span className="text-xs opacity-80">/100</span>
            <span className="text-sm tracking-wide">
              {result.riskLevel === 'critical' ? 'HIGH RISK' : result.riskLevel === 'suspicious' ? 'SUSPICIOUS' : 'LOW RISK'}
            </span>
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
