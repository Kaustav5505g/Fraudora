import React, { useEffect, useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export function SOCHeader({ activeView, onViewChange }) {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  void activeView;
  void onViewChange;

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
          <a href="/" className="flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" aria-label="Fraudora home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
              <ShieldCheck size={23} aria-hidden="true" />
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-[#f9fafb]">Fraudora</span>
              <span className="hidden text-sm text-muted sm:inline">Scam checker</span>
            </span>
          </a>
          <button
            type="button"
            onClick={() => setIsHowItWorksOpen(true)}
            className="min-h-11 rounded-lg px-3 text-sm font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            How it works
          </button>
        </div>
      </header>

      {isHowItWorksOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
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
                className="flex h-11 w-11 items-center justify-center rounded-xl text-secondary hover:bg-[#374151] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X size={20} />
              </button>
            </div>
            <ol className="space-y-4">
              {[
                ['Paste', 'Add the text of a suspicious SMS or message.'],
                ['We check', 'Fraudora looks for risky language and suspicious links.'],
                ['You decide', 'Review the explanation and choose what to do next.'],
              ].map(([title, description], index) => (
                <li key={title} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{title}</h3>
                    <p className="text-sm leading-6 text-secondary">{description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
