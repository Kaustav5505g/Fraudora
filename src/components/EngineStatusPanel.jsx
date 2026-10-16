import React, { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Card } from './ui/Card';

/** Generates a random 8-character uppercase session ID once per mount */
function genSessionId() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

/** Single dot indicator: green = online, red = degraded */
function StatusDot({ online = true }) {
  return (
    <span
      aria-label={online ? 'Online' : 'Offline'}
      className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${online ? 'bg-safe animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-crit'}`}
    />
  );
}

/**
 * EngineStatusPanel — right-column card showing Fraudora engine health.
 * All values are static mock; replace with a /api/status endpoint call.
 */
export function EngineStatusPanel() {
  // Stable per-mount session ID
  const sessionId = useMemo(() => genSessionId(), []);

  const rows = [
    { label: 'LAYER 1 // RULES', value: '42 loaded', online: true },
    { label: 'LAYER 2 // LLM GUIDANCE', value: 'ONLINE', online: true },
    { label: 'LINK INSPECTOR', value: 'ONLINE', online: true },
    { label: 'AVG LATENCY', value: '142 ms', online: null },
    { label: 'SESSION', value: sessionId, online: null },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-safe/15 text-safe">
          <Activity size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          ENGINE STATUS
        </h2>
      </div>

      {/* Status rows */}
      <dl className="space-y-0 divide-y divide-border-soc">
        {rows.map(({ label, value, online }) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2.5 min-w-0">
            <dt className="font-mono text-xs text-muted-dim tracking-widest uppercase shrink-0">
              {label}
            </dt>
            <dd className="flex items-center gap-1.5 font-mono text-[13px] text-ink tabular-nums">
              {online === true && <StatusDot online />}
              <span className={online === true ? 'text-safe' : 'text-ink'}>{value}</span>
            </dd>
          </div>
        ))}
      </dl>

      {/* Dotted fill between label and value is handled by the flex justify-between */}
    </Card>
  );
}
