import React, { useEffect, useCallback } from 'react';
import { HeroHeader } from './HeroHeader';
import { PayloadInputBox } from './PayloadInputBox';
import { QuickTestChips } from './QuickTestChips';
import { ScanButton } from './ScanButton';
import { ThreatPulse } from './ThreatPulse';
import { EngineStatusPanel } from './EngineStatusPanel';
import { RecentScans } from './RecentScans';
import { SHOW_DEMO_STATS } from '../data/mockData';

/**
 * WorkspaceView — 12-col grid layout on lg+, stacked on mobile.
 * Left  (col-span-7): HeroHeader + PayloadInputBox + QuickTestChips + ScanButton
 * Right (col-span-5): EngineStatusPanel + RecentScans
 *
 * @param {{
 *   payload: string,
 *   onPayloadChange: (val: string) => void,
 *   error: string | null,
 *   isAnalyzing: boolean,
 *   activeSampleId: string | null,
 *   onSampleSelect: (payload: string, id: string) => void,
 *   onClear: () => void,
 *   onScan: () => void,
 *   onShowForensic: () => void,
 * }} props
 */
export function WorkspaceView({
  payload,
  onPayloadChange,
  error,
  isAnalyzing,
  activeSampleId,
  onSampleSelect,
  onClear,
  onScan,
  onShowForensic,
}) {
  // Ctrl/Cmd+Enter keyboard shortcut
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        onScan();
      }
    },
    [onScan]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isScanDisabled = !payload.trim() || isAnalyzing;

  return (
    <>
      <main
        role="main"
        aria-label="Payload workspace"
        /* pb-7 clears the fixed 28px bottom status bar */
        className="flex-1 px-4 sm:px-6 lg:px-8 pt-8 pb-14 animate-fade-in max-w-[1600px] mx-auto w-full"
      >
        {/* ── 12-column grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">

          {/* ── LEFT COLUMN (col-span-7) ── */}
          <section className={`${SHOW_DEMO_STATS ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-6 stagger-children`} aria-label="Message input">
            <HeroHeader />
            <PayloadInputBox
              payload={payload}
              onChange={onPayloadChange}
              error={error}
              onClear={onClear}
              isAnalyzing={isAnalyzing}
            />
            <QuickTestChips activeSampleId={activeSampleId} onSelect={onSampleSelect} />
            <ScanButton
              isAnalyzing={isAnalyzing}
              isDisabled={isScanDisabled}
              onScan={onScan}
            />
          </section>

          {/* ── RIGHT COLUMN (col-span-5) ── */}
          {SHOW_DEMO_STATS && (
            <aside className="lg:col-span-5 space-y-4 lg:sticky lg:top-24 stagger-children" aria-label="Demo engine statistics and recent scans">
              <ThreatPulse />
              <EngineStatusPanel />
              <RecentScans onOpenForensic={onShowForensic} />
            </aside>
          )}
        </div>
      </main>

      {/* ── Fixed bottom status bar (28px) ── */}
      <div
        aria-label="Application status"
        className="fixed bottom-0 inset-x-0 z-30 h-7 border-t border-border-soc bg-obsidian/95 backdrop-blur-sm"
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <span className="font-mono text-[10px] text-muted-dim tracking-widest">
            FRAUDORA v0.1 // CORE2DUO
          </span>
          <span className="font-mono text-[10px] text-muted-dim tracking-widest">
            MESSAGES ARE NOT STORED
          </span>
        </div>
      </div>
    </>
  );
}
