import React, { useEffect, useCallback } from 'react';
import { HeroHeader } from './HeroHeader';
import { PayloadInputBox } from './PayloadInputBox';
import { QuickTestChips } from './QuickTestChips';
import { ScanButton } from './ScanButton';

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
  void onShowForensic;
  const handleKeyDown = useCallback((event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      onScan();
    }
  }, [onScan]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <main
      role="main"
      aria-label="Message checker"
      className="mx-auto w-full max-w-2xl flex-1 px-4 pb-8 pt-6 sm:px-6 sm:pt-8 motion-safe:animate-fade-in motion-reduce:animate-none"
    >
      <div className="space-y-5">
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
          isDisabled={!payload.trim()}
          onScan={onScan}
        />
      </div>
    </main>
  );
}
