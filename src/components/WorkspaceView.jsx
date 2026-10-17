import React, { useRef } from 'react';
import { ShieldCheck } from 'lucide-react';
import { PillSearch } from './PillSearch';
import DecryptedText from './react-bits/DecryptedText';

const gridImage = (color) =>
  `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;

const BASE_GRID = {
  backgroundImage: gridImage('rgba(255,255,255,0.035)'),
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent 80%)',
  WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent 80%)',
};

const SPOTLIGHT_GRID = {
  backgroundImage: gridImage('rgba(129,140,248,0.55)'),
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(circle 200px at var(--mx, 50%) var(--my, 45%), black, transparent)',
  WebkitMaskImage: 'radial-gradient(circle 200px at var(--mx, 50%) var(--my, 45%), black, transparent)',
};

export function WorkspaceView({
  payload,
  onPayloadChange,
  onScan,
  isAnalyzing,
  error,
}) {
  const rootRef = useRef(null);

  const handlePointerMove = (e) => {
    const node = rootRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    node.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <main
      ref={rootRef}
      onPointerMove={handlePointerMove}
      aria-label="Message checker"
      className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 pb-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={BASE_GRID} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0" style={SPOTLIGHT_GRID} />

      <div className="relative mb-8 flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.35)]">
          <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-5xl font-bold tracking-tight text-[#f9fafb]">
          <DecryptedText
            text="Fraudora"
            speed={200}
            sequential
            revealDirection="start"
            animateOn="view"
            effect="fade"
            scrambleColor="#6366f1"
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