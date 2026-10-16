import React from 'react';

/**
 * HeroHeader — workspace landing copy.
 * Pure presentational; no props required.
 */
export function HeroHeader() {
  return (
    <div className="text-center space-y-4 animate-fade-in">
      {/* Eyebrow */}
      <p className="text-[11px] font-mono uppercase tracking-widest text-muted-dim">
        THREAT TRIAGE // INSTANT ANALYSIS
      </p>

      {/* H1 */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight">
        Stop scams{' '}
        <span className="relative inline-block">
          before users act.
          {/* Crit-tinted underline accent — decorative, not semantic */}
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-crit/40"
          />
        </span>
      </h1>

      {/* Subtitle */}
      <p className="max-w-xl mx-auto text-base text-muted leading-relaxed">
        Fraudora instantly analyzes any SMS or messaging payload, flags the
        manipulation tactics, inspects embedded links, and tells you{' '}
        <em className="not-italic text-ink">exactly why it&apos;s dangerous</em> — in
        plain English.
      </p>
    </div>
  );
}
