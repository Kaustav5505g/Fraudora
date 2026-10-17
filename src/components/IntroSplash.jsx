import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import DecryptedText from './react-bits/DecryptedText';

const GRID = {
  backgroundImage:
    'linear-gradient(rgba(129,140,248,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(129,140,248,0.10) 1px, transparent 1px)',
  backgroundSize: '44px 44px',
  maskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, black, transparent 80%)',
  WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 50% 50%, black, transparent 80%)',
};

const flag = (delay) => ({ animation: `fr-flag 0.4s ease ${delay}s forwards` });

export default function IntroSplash({ onDone }) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onDone();
      return;
    }
    const fade = setTimeout(() => setLeaving(true), 3400);
    const end = setTimeout(onDone, 3900);
    return () => {
      clearTimeout(fade);
      clearTimeout(end);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#0b0f19] transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <style>{`
        @keyframes fr-scan { from { transform: translateX(-10vw); } to { transform: translateX(110vw); } }
        @keyframes fr-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fr-flag {
          from { background: transparent; color: #9ca3af; }
          to { background: rgba(239,68,68,0.22); color: #fecaca; }
        }
      `}</style>

      <div aria-hidden="true" className="absolute inset-0" style={{ ...GRID, animation: 'fr-fade 0.6s ease both' }} />

      {/* scan line */}
      <div
        aria-hidden="true"
        className="absolute left-0 top-0 h-full w-px bg-indigo-400 shadow-[0_0_24px_6px_rgba(99,102,241,0.5)]"
        style={{ animation: 'fr-scan 2.2s cubic-bezier(0.4,0,0.2,1) 0.5s both' }}
      />

      <div className="relative flex flex-col items-center px-4 text-center">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-500 shadow-[0_0_24px_rgba(99,102,241,0.35)]">
            <ShieldCheck className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-[#f9fafb]">
            <DecryptedText
              text="Fraudora"
              speed={140}
              sequential
              revealDirection="start"
              animateOn="view"
              effect="fade"
              scrambleColor="#6366f1"
            />
          </h1>
        </div>

        <div
          className="space-y-1 font-mono text-xs text-[#9ca3af] sm:text-sm"
          style={{ animation: 'fr-fade 0.6s ease 0.3s both' }}
        >
          <p>
            Your account will be blocked, verify{' '}
            <span className="rounded px-1" style={flag(1.5)}>immediately</span>
          </p>
          <p>
            https://sbi-kyc-update.secure-
            <span className="rounded px-1" style={flag(1.7)}>l0gin</span>.in
          </p>
        </div>
      </div>

      <button
        onClick={onDone}
        className="absolute bottom-6 right-6 rounded-full border border-[#374151] px-4 py-2 text-sm text-[#9ca3af] transition hover:text-[#f9fafb]"
      >
        Skip
      </button>
    </div>
  );
}