import React, { useEffect, useState } from 'react';
import { ShieldCheck, X, Clock, ShieldAlert, Activity } from 'lucide-react';
import { fetchHealth } from '../services/api';

export function SOCHeader({ onOpenHistory, onOpenRules, onHome }) {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(null);

  useEffect(() => {
    fetchHealth()
      .then((h) => setIsOnline(h.status === 'ok'))
      .catch(() => setIsOnline(false));
  }, []);

  useEffect(() => {
    if (!isHowItWorksOpen) return undefined;
    function handleEscape(event) {
      if (event.key === 'Escape') setIsHowItWorksOpen(false);
    }
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isHowItWorksOpen]);

  return (
    <>
      <header className="h-16 shrink-0 border-b border-[#374151] bg-[#1f2937]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <button
            type="button"
            onClick={onHome}
            className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent text-left"
            aria-label="Fraudora home"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
              <ShieldCheck size={23} aria-hidden="true" />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#f9fafb]">Fraudora</span>
              <span className="hidden text-xs font-mono text-secondary sm:inline">
                API connected
              </span>
            </span>
          </button>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Health pill */}
            <div
              className="hidden md:flex items-center gap-1.5 rounded-full border border-[#374151] bg-[#111827] px-2.5 py-1 text-xs font-mono text-secondary"
              title={isOnline ? 'FastAPI Backend Online' : 'FastAPI Backend Connecting/Offline'}
            >
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_#10B981]'
                    : isOnline === false
                      ? 'bg-red-400'
                      : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span>{isOnline ? 'ENGINE READY' : isOnline === false ? 'LOCAL MODE' : 'CHECKING...'}</span>
            </div>

            {/* History button */}
            {onOpenHistory && (
              <button
                type="button"
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 min-h-10 rounded-lg border border-[#374151] bg-[#111827] px-3 text-xs font-semibold text-secondary hover:text-ink hover:border-[#4b5563] transition-colors"
              >
                <Clock size={14} className="text-accent" />
                <span>History</span>
              </button>
            )}

            {/* Rules button */}
            {onOpenRules && (
              <button
                type="button"
                onClick={onOpenRules}
                className="flex items-center gap-1.5 min-h-10 rounded-lg border border-[#374151] bg-[#111827] px-3 text-xs font-semibold text-secondary hover:text-ink hover:border-[#4b5563] transition-colors"
              >
                <ShieldAlert size={14} className="text-indigo-400" />
                <span className="hidden sm:inline">Rules &amp; Brands</span>
                <span className="sm:hidden">Rules</span>
              </button>
            )}

            {/* How it works button */}
            <button
              type="button"
              onClick={() => setIsHowItWorksOpen(true)}
              className="min-h-10 rounded-lg px-2.5 sm:px-3 text-xs sm:text-sm font-semibold text-accent transition-colors hover:text-accent-hover"
            >
              How it works
            </button>
          </div>
        </div>
      </header>

      {/* How it works modal */}
      {isHowItWorksOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsHowItWorksOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="how-it-works-title"
            className="w-full max-w-md rounded-2xl border border-[#374151] bg-[#1f2937] p-6 shadow-xl animate-fade-in"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="how-it-works-title" className="text-xl font-bold text-ink">How it works</h2>
              <button
                type="button"
                onClick={() => setIsHowItWorksOpen(false)}
                aria-label="Close"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary hover:bg-[#374151] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X size={20} />
              </button>
            </div>
            <ol className="space-y-4">
              {[
                ['1. Deterministic Rule Engine', 'Over 15 battle-tested pattern checks for brand impersonation, urgent threats, fake refunds, unverified links, and UPI PIN requests.'],
                ['2. Domain & Reputation Defense', 'Scrutinizes suspicious and lookalike URLs against verified banking/government brand lists and external threat registries.'],
                ['3. Transparent Scoring & AI Guidance', 'Matches add weighted points up to 100. Gemini AI (optional) crafts human-friendly next steps and safe actions.'],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink text-sm">{title}</h3>
                    <p className="text-xs leading-5 text-secondary mt-0.5">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
            {onOpenRules && (
              <button
                type="button"
                onClick={() => {
                  setIsHowItWorksOpen(false);
                  onOpenRules();
                }}
                className="mt-5 w-full rounded-xl bg-accent py-2.5 text-center text-xs font-semibold text-white hover:bg-accent-hover transition-colors"
              >
                View all live detection rules &rarr;
              </button>
            )}
          </section>
        </div>
      )}
    </>
  );
}
