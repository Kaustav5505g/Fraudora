import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PillSearch } from './PillSearch';
import DecryptedText from './react-bits/DecryptedText';

const GRID_STYLE = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
  backgroundSize: '48px 48px',
  maskImage: 'radial-gradient(ellipse 60% 50% at 50% 45%, black, transparent 75%)',
  WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 45%, black, transparent 75%)',
};

export function WorkspaceView({
  payload,
  onPayloadChange,
  onScan,
  isAnalyzing,
  error,
}) {
  return (
    <main
      aria-label="Message checker"
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 pb-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={GRID_STYLE} />

      <div className="relative mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.35)]">
          <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-[#f9fafb]">
          <DecryptedText
            text="Fraudora"
            speed={60}
            maxIterations={14}
            sequential
            revealDirection="start"
            animateOn="view"
          />
        </h1>
      </div>

      <div className="relative w-full">
        <PillSearch
          value={payload}
          onChange={onPayloadChange}
          onSubmit={onScan}
          isAnalyzing={isAnalyzing}
          error={error}
        />
      </div>
    </main>
  );
}