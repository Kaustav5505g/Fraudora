import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PillSearch } from './PillSearch';

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
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 pb-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[40%] h-72 w-[min(36rem,100vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-3xl"
      />

      <div className="relative mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.35)]">
          <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-[#f9fafb]">Fraudora</h1>
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
