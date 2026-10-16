import React from 'react';
import { LayoutDashboard, ScanSearch } from 'lucide-react';
import { useUtcClock } from '../hooks/useUtcClock';

/**
 * SOCHeader — sticky global header.
 * @param {{ activeView: 'workspace' | 'forensic', onViewChange: (view: string) => void }} props
 */
export function SOCHeader({ activeView, onViewChange }) {
  const clock = useUtcClock();

  return (
    <header
      className="sticky top-0 z-40 border-b border-border-soc bg-obsidian/90 backdrop-blur-sm"
      role="banner"
    >
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        {/* ── Main row ── */}
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left: Status dot + title */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Blinking red status dot with ping halo */}
            <span className="relative flex h-2.5 w-2.5 shrink-0 motion-reduce:animate-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crit opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crit animate-pulse motion-reduce:animate-none" />
            </span>

            {/* Full title hidden on xs, shown from sm */}
            <span className="hidden sm:block font-mono font-bold text-[13px] tracking-widest text-ink truncate">
              FRAUDORA // SENTINEL SMS SECURITY OPERATIONS
            </span>
            {/* Truncated title on xs */}
            <span className="block sm:hidden font-mono font-bold text-[13px] tracking-widest text-ink">
              FRAUDORA // SENTINEL
            </span>
          </div>

          {/* Center metadata — hidden on mobile (shown in second row) */}
          <div className="hidden md:flex items-center gap-6 font-mono text-[11px] text-muted-dim tracking-widest whitespace-nowrap">
            <span>ENGINE: HYBRID-v3.2</span>
            <span className="text-muted">{clock}</span>
          </div>

          {/* Right: View toggle segmented control */}
          <ViewToggle activeView={activeView} onViewChange={onViewChange} />
        </div>

        {/* ── Mobile second row: metadata ── */}
        <div className="flex md:hidden items-center gap-4 pb-2 font-mono text-[10px] text-muted-dim tracking-widest">
          <span>ENGINE: HYBRID-v3.2</span>
          <span className="text-muted">{clock}</span>
        </div>
      </div>
    </header>
  );
}

/** Segmented toggle between Workspace and Forensic views */
function ViewToggle({ activeView, onViewChange }) {
  const views = [
    { id: 'workspace', label: 'Workspace', shortLabel: 'WS', Icon: LayoutDashboard },
    { id: 'forensic', label: 'Forensic View', shortLabel: 'FV', Icon: ScanSearch },
  ];

  return (
    <div
      role="group"
      aria-label="Switch view"
      className="flex items-center rounded-md border border-border-soc bg-obsidian p-0.5 gap-0.5 shrink-0"
    >
      {views.map(({ id, label, shortLabel, Icon }) => {
        const isActive = activeView === id;
        return (
          <button
            key={id}
            onClick={() => onViewChange(id)}
            aria-pressed={isActive}
            aria-label={label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-mono font-medium tracking-widest transition-colors duration-150
              min-h-[36px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ink
              ${isActive
                ? 'bg-surface text-ink'
                : 'text-muted-dim hover:text-muted'
              }`}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
            <span className="inline sm:hidden">{shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
