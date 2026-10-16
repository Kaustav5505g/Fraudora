import React from 'react';
import { Activity, BarChart3 } from 'lucide-react';
import { Card } from './ui/Card';
import { SHOW_DEMO_STATS } from '../data/mockData';

const VOLUME_POINTS = [
  35, 31, 40, 30, 34, 22, 29, 19, 25, 17, 22, 12,
  20, 15, 28, 19, 31, 16, 25, 12, 18, 8, 15, 4,
];

const SPARKLINE_POINTS = VOLUME_POINTS.map((y, index) => ({
  x: (index / (VOLUME_POINTS.length - 1)) * 320,
  y,
}));
const SPARKLINE_PATH = SPARKLINE_POINTS
  .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${x},${y}`)
  .join(' ');
const SPARKLINE_AREA = `${SPARKLINE_PATH} L320,48 L0,48 Z`;

const STATS = [
  { label: 'SCANNED TODAY', value: '1,284' },
  { label: 'BLOCKED', value: '312' },
  { label: 'AVG SCORE', value: '41' },
];

export function ThreatPulse() {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
          <Activity size={15} aria-hidden="true" />
        </span>
        <div className="flex flex-1 items-center justify-between gap-2">
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            THREAT PULSE
          </h2>
          {SHOW_DEMO_STATS && <span className="rounded border border-warn/40 bg-warn/10 px-1.5 py-0.5 text-[10px] font-mono tracking-widest text-warn">DEMO DATA</span>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {STATS.map(({ label, value }) => (
          <div key={label} className="min-w-0 rounded-md border border-border-soc bg-obsidian/40 px-2 py-3 text-center">
            <p className="font-mono text-2xl tabular-nums text-ink">{value}</p>
            <p className="mt-1 text-xs font-mono text-muted-dim leading-tight">{label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={13} className="text-accent" aria-hidden="true" />
          <p className="text-xs font-mono tracking-widest text-muted-dim">
            SCAN VOLUME // 24H
          </p>
        </div>
        <svg
          viewBox="0 0 320 52"
          role="img"
          aria-label="Mock scan volume sparkline over 24 hours"
          className="h-14 w-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="threat-pulse-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={SPARKLINE_AREA} fill="url(#threat-pulse-fill)" />
          <path
            d={SPARKLINE_PATH}
            fill="none"
            stroke="#22D3EE"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </Card>
  );
}
