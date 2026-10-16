import React from 'react';
import { Landmark, Package, GraduationCap, Users } from 'lucide-react';
import { SAMPLES } from '../data/mockData';

/** Map icon string names to Lucide components */
const ICON_MAP = { Landmark, Package, GraduationCap, Users };

/**
 * QuickTestChips — one-click sample loader pills.
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
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map(({ id, label, icon, payload }) => {
          const Icon = ICON_MAP[icon] ?? Landmark;
          const isActive = activeSampleId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(payload, id)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-mono tracking-wide
                transition-colors duration-150 min-h-[36px]
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink
                ${isActive
                  ? 'border-ink/40 bg-ink/10 text-ink'
                  : 'border-border-soc bg-surface text-muted-dim hover:border-muted-dim hover:text-muted'
                }`}
            >
              <Icon size={12} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
