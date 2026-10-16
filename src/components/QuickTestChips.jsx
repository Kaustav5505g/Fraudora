import React from 'react';
import { Landmark, Package, GraduationCap, Users, ShieldCheck } from 'lucide-react';
import { SAMPLES, RISK_LEVELS } from '../data/mockData';

const ICON_MAP = { Landmark, Package, GraduationCap, Users, ShieldCheck };

/**
 * QuickTestChips — 2-column card grid of sample payloads.
 * Each card shows icon, label, truncated preview, and a right-aligned risk tag.
 *
 * @param {{
 *   activeSampleId: string | null,
 *   onSelect: (payload: string, id: string) => void,
 * }} props
 */
export function QuickTestChips({ activeSampleId, onSelect }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-dim">
        QUICK TEST SAMPLES
      </p>

      {/* 2-column card grid; 5 items = 2 rows + 1 solo card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SAMPLES.map(({ id, label, icon, payload, risk }) => {
          const Icon = ICON_MAP[icon] ?? Landmark;
          const rl = RISK_LEVELS[risk] ?? RISK_LEVELS.suspicious;
          const isActive = activeSampleId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(payload, id)}
              aria-pressed={isActive}
              className={`group flex items-start gap-3 p-3 rounded-lg border text-left
                transition-colors duration-150 min-h-[64px]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink
                ${isActive
                  ? 'border-ink/30 bg-white/5'
                  : 'border-border-soc bg-surface hover:border-[#525866] hover:bg-white/5'
                }`}
            >
              {/* Icon */}
              <div className={`shrink-0 mt-0.5 transition-colors duration-150
                ${isActive ? 'text-ink' : 'text-muted-dim group-hover:text-muted'}`}>
                <Icon size={14} />
              </div>

              {/* Text block */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-[12px] font-medium truncate transition-colors duration-150
                    ${isActive ? 'text-ink' : 'text-muted group-hover:text-ink'}`}>
                    {label}
                  </span>
                  {/* Risk tag — semantic traffic-light */}
                  <span className={`shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium tracking-widest ${rl.badgeClass}`}>
                    {rl.shortLabel}
                  </span>
                </div>
                {/* Truncated preview */}
                <p className="font-mono text-[10px] text-muted-dim leading-relaxed line-clamp-1 break-all">
                  {payload}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
