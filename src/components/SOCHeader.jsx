import React from 'react';
import { LayoutDashboard, ScanSearch } from 'lucide-react';
import { useUtcClock } from '../hooks/useUtcClock';
import { SHOW_DEMO_STATS } from '../data/mockData';

/**
 * SOCHeader — sticky global header with status strip.
 * @param {{ activeView: 'workspace' | 'forensic', onViewChange: (view: string) => void }} props
 */
export function SOCHeader({ activeView, onViewChange }) {
  const clock = useUtcClock();

  return (
    <header className="sticky top-0 z-40 border-b border-border-soc bg-obsidian/90 backdrop-blur-sm" role="banner">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">

        {/* ── Main row ── */}
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left: status dot + title */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0 motion-reduce:animate-none">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crit opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crit animate-pulse motion-reduce:animate-none" />
            </span>
            <span className="hidden sm:block font-mono font-bold text-[13px] tracking-widest text-ink truncate">
              FRAUDORA // SENTINEL SMS SECURITY OPERATIONS
            </span>
            <span className="block sm:hidden font-mono font-bold text-[13px] tracking-widest text-ink">
              FRAUDORA // SENTINEL
            </span>
          </div>

          {/* Center metadata — desktop only; labels dim, values bright */}
          <div className="hidden md:flex items-center font-mono text-xs tracking-widest whitespace-nowrap divide-x divide-border-soc">
            <div className="flex items-center gap-1.5 px-4 first:pl-0">
              <span className="text-muted-dim">ENGINE:</span>
              <span className="text-ink">HYBRID-v3.2</span>
            </div>
            <div className="flex items-center gap-1.5 px-4">
              <span className="text-muted-dim">UTC</span>
              <span className="text-ink tabular-nums">{clock.replace('UTC ', '')}</span>
            </div>
          </div>

          {/* Right: view toggle */}
          <ViewToggle activeView={activeView} onViewChange={onViewChange} />
        </div>

        {/* ── Mobile second row: metadata ── */}
        <div className="flex md:hidden items-center gap-3 pb-2 font-mono text-xs tracking-widest divide-x divide-border-soc">
          <div className="flex items-center gap-1 pr-3">
            <span className="text-muted-dim">ENGINE:</span>
            <span className="text-ink">HYBRID-v3.2</span>
          </div>
          <div className="flex items-center gap-1 pl-3">
            <span className="text-muted-dim">UTC</span>
            <span className="text-ink tabular-nums">{clock.replace('UTC ', '')}</span>
          </div>
        </div>
      </div>

      {/* ── Global status strip (28px) ── */}
      <div className="border-t border-border-soc bg-obsidian">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-7 flex items-center gap-0 overflow-x-auto">
          {[
            ...(SHOW_DEMO_STATS ? [['RULES', '42']] : []),
            ['LAYER-1', 'ONLINE'],
            ['LAYER-2', 'ONLINE'],
            ['QUEUE', '0'],
          ].map(([label, value], i, arr) => (
            <React.Fragment key={label}>
              <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest whitespace-nowrap">
                <span className="text-muted-dim">{label}:</span>
                <span className={value === 'ONLINE' ? 'text-safe' : 'text-ink'}>{value}</span>
              </span>
              {i < arr.length - 1 && (
                <span className="mx-3 text-border-soc font-mono text-[10px] select-none">|</span>
              )}
            </React.Fragment>
          ))}
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium tracking-widest transition-colors duration-150
            min-h-[36px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent
            ${isActive ? 'bg-accent text-obsidian' : 'text-muted-dim hover:text-accent'}`}
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
