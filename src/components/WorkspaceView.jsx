import React from 'react';
import { HeroHeader } from './HeroHeader';
import { PayloadInputBox } from './PayloadInputBox';
import { QuickTestChips } from './QuickTestChips';
import { ScanButton } from './ScanButton';

/**
 * WorkspaceView — Payload input, sample chips, and scan CTA.
 * @param {{
 *   payload: string,
 *   onPayloadChange: (val: string) => void,
 *   error: string | null,
 *   isAnalyzing: boolean,
 *   activeSampleId: string | null,
 *   onSampleSelect: (payload: string, id: string) => void,
 *   onClear: () => void,
 *   onScan: () => void,
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
}) {
  return (
    <main
      className="flex-1 flex flex-col items-center px-4 sm:px-6 py-12 sm:py-16 animate-fade-in"
      role="main"
      aria-label="Payload workspace"
    >
      <div className="w-full max-w-3xl space-y-8">
        <HeroHeader />

        <section aria-label="Message input" className="space-y-4">
          <PayloadInputBox
            payload={payload}
            onChange={onPayloadChange}
            error={error}
            onClear={onClear}
          />
          <QuickTestChips activeSampleId={activeSampleId} onSelect={onSampleSelect} />
          <ScanButton isAnalyzing={isAnalyzing} onScan={onScan} />
        </section>

        {/* Footer attribution */}
        <p className="text-center text-[11px] font-mono text-muted-dim tracking-widest pt-4 border-t border-border-soc">
          FRAUDORA // CORE2DUO — KAUSTAV PAUL &amp; SHREYANSH TIWARI
        </p>
      </div>
    </main>
  );
}
