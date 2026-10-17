import React, { useEffect, useState } from 'react';
import { Activity, RefreshCw, ShieldCheck, Database, Sparkles, Globe } from 'lucide-react';
import { Card } from './ui/Card';
import { fetchHealth, fetchRules, getClientId } from '../services/api';

/** Single dot indicator: green = online, red = offline/degraded */
function StatusDot({ online = true }) {
  return (
    <span
      aria-label={online ? 'Online' : 'Offline'}
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${
        online ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]' : 'bg-red-400'
      }`}
    />
  );
}

/**
 * EngineStatusPanel — Displays real-time telemetry from FastAPI backend:
 * - GET /health
 * - GET /api/rules
 */
export function EngineStatusPanel({ onOpenRules }) {
  const [health, setHealth] = useState(null);
  const [rules, setRules] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  async function loadTelemetry() {
    setIsLoading(true);
    const start = performance.now();
    try {
      const [h, r] = await Promise.all([
        fetchHealth(),
        fetchRules().catch(() => null),
      ]);
      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealth(h);
      setRules(r);
    } catch {
      setHealth({ status: 'offline' });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadTelemetry();
    const interval = setInterval(loadTelemetry, 30000);
    return () => clearInterval(interval);
  }, []);

  const isApiOnline = health && health.status === 'ok';
  const rulesCount = rules?.rules?.length || 15;
  const brandsCount = rules?.brands_checked?.length || 14;

  const rows = [
    {
      label: 'API BACKEND',
      value: isApiOnline ? 'CONNECTED' : (isLoading ? 'CONNECTING...' : 'OFFLINE'),
      online: isApiOnline,
    },
    {
      label: 'LAYER 1 // RULES ENGINE',
      value: isApiOnline ? `${rulesCount} rules / ${brandsCount} brands` : 'STANDALONE',
      online: isApiOnline,
      onClick: onOpenRules,
      clickable: Boolean(onOpenRules),
    },
    {
      label: 'LAYER 2 // GEMINI AI',
      value: health?.ai_explanations ? 'ACTIVE' : 'STANDALONE (RULES)',
      online: health?.ai_explanations ? true : null,
    },
    {
      label: 'REPUTATION / VT / GSB',
      value: (health?.google_safe_browsing || health?.virustotal) ? 'ENABLED' : 'PASS-THROUGH',
      online: (health?.google_safe_browsing || health?.virustotal) ? true : null,
    },
    {
      label: 'HISTORY STORAGE',
      value: health?.history ? 'SUPABASE CLOUD' : 'BROWSER STORAGE',
      online: health?.history ? true : null,
    },
    {
      label: 'LATENCY',
      value: latency != null ? `${latency} ms` : '—',
      online: null,
    },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
            <Activity size={15} aria-hidden="true" />
          </span>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            ENGINE TELEMETRY
          </h2>
        </div>
        <button
          type="button"
          onClick={loadTelemetry}
          disabled={isLoading}
          aria-label="Refresh telemetry"
          className="flex h-7 w-7 items-center justify-center rounded-md text-secondary hover:text-ink hover:bg-white/5 transition-colors disabled:opacity-40"
        >
          <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Status rows */}
      <dl className="space-y-0 divide-y divide-[#374151]/50">
        {rows.map(({ label, value, online, onClick, clickable }) => (
          <div
            key={label}
            onClick={onClick}
            className={`flex items-center justify-between gap-3 py-2.5 min-w-0 ${
              clickable ? 'cursor-pointer hover:bg-white/5 px-1 -mx-1 rounded' : ''
            }`}
          >
            <dt className="font-mono text-xs text-secondary tracking-widest uppercase shrink-0">
              {label}
            </dt>
            <dd className="flex items-center gap-1.5 font-mono text-[13px] text-ink tabular-nums">
              {online != null && <StatusDot online={online} />}
              <span className={online ? 'text-emerald-400' : 'text-ink'}>{value}</span>
            </dd>
          </div>
        ))}
      </dl>

      {onOpenRules && (
        <button
          type="button"
          onClick={onOpenRules}
          className="w-full text-center text-[11px] font-mono text-accent hover:text-accent-hover pt-1 border-t border-[#374151]/50 block"
        >
          Inspect all {rulesCount} detection rules &rarr;
        </button>
      )}
    </Card>
  );
}
