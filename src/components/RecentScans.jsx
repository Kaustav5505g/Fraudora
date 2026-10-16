import React from 'react';
import { Clock } from 'lucide-react';
import { Card } from './ui/Card';
import { RECENT_SCANS, RISK_LEVELS } from '../data/mockData';

/**
 * RecentScans — right-column card showing the last 4 scan results.
 * Clicking any row loads the Forensic dashboard (with default mock data).
 *
 * @param {{ onOpenForensic: () => void }} props
 */
export function RecentScans({ onOpenForensic }) {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Clock size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          RECENT SCANS
        </h2>
      </div>

      {/* Scan rows */}
      <ul className="space-y-0 divide-y divide-border-soc" aria-label="Recent scan results">
        {RECENT_SCANS.map((scan) => {
          const rl = RISK_LEVELS[scan.riskLevel] ?? RISK_LEVELS.suspicious;
          const scoreStr = String(scan.score).padStart(2, '0');

          return (
            <li key={scan.id}>
              <button
                type="button"
                onClick={onOpenForensic}
                aria-label={`View scan: ${scan.sender}, score ${scan.score}, ${rl.label}`}
                className="relative w-full flex items-center justify-between gap-2 py-2.5 pl-3 text-left
                  hover:bg-white/5 transition-colors duration-150 rounded
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1
                  min-w-0 group"
              >
                <span aria-hidden="true" className={`absolute inset-y-2 left-0 w-[3px] rounded-full ${rl.dotClass}`} />
                {/* Time + sender */}
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-mono text-xs text-muted-dim tabular-nums shrink-0">
                    {scan.time}
                  </span>
                  <span className="font-mono text-[13px] text-muted truncate group-hover:text-ink transition-colors duration-150">
                    {scan.sender}
                  </span>
                </div>

                {/* Risk dot + score + label */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full ${rl.dotClass}`}
                    aria-hidden="true"
                  />
                  <span className={`font-mono text-[13px] font-semibold tabular-nums ${rl.colorClass}`}>
                    {scoreStr}
                  </span>
                  <span className="w-10 h-1.5 rounded-full bg-border-soc overflow-hidden" aria-hidden="true">
                    <span className={`block h-full rounded-full ${rl.dotClass}`} style={{ width: `${scan.score}%` }} />
                  </span>
                  <span className={`hidden sm:inline font-mono text-xs tracking-widest uppercase ${rl.colorClass}`}>
                    {rl.shortLabel}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <p className="text-[10px] font-mono text-muted-dim pt-1 border-t border-border-soc">
        Click any row to view full forensic report.
      </p>
    </Card>
  );
}
