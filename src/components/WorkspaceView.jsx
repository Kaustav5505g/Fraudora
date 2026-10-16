import React from 'react';
import { HeroHeader } from './HeroHeader';
import { PillSearch } from './PillSearch';
import { QuickTestChips } from './QuickTestChips';

export function WorkspaceView({
  payload,
  onPayloadChange,
  error,
  isAnalyzing,
  activeSampleId,
  onSampleSelect,
  onScan,
  onShowForensic,
}) {
  void onShowForensic;

  return (
    <main
      role="main"
      aria-label="Message checker"
      className="mx-auto w-full max-w-2xl flex-1 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 motion-safe:animate-fade-in motion-reduce:animate-none"
    >
      <div className="space-y-5">
        <HeroHeader />
        <PillSearch
          value={payload}
          onChange={onPayloadChange}
          onSubmit={onScan}
          isAnalyzing={isAnalyzing}
          error={error}
        />
        <QuickTestChips activeSampleId={activeSampleId} onSelect={onSampleSelect} />
      </div>
    </main>
  );
}
