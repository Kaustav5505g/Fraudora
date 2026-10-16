import React from 'react';

/**
 * HeroHeader — left-aligned workspace landing copy.
 * Pure presentational; no props required.
 */
export function HeroHeader() {
  return (
    <div className="space-y-4 animate-fade-in text-left">
      {/* Mono eyebrow with prompt prefix */}
      <p className="text-xs font-mono uppercase tracking-widest text-muted-dim">
        <span className="text-crit/70 mr-1 select-none">{'>'}</span>
        THREAT_TRIAGE // INSTANT_ANALYSIS
      </p>

      {/* H1 — left-aligned, reduced size */}
      <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ink leading-tight">
        Stop scams{' '}
        {/*
         * "before users act." is wrapped in a forensic-highlight style block
         * matching the PayloadForensicView mark style — same visual language.
         */}
        <span className="relative z-0 inline bg-crit/15 text-red-200 px-2 rounded-sm whitespace-nowrap before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-crit/20 before:blur-3xl before:content-['']">
          before users act.
        </span>
      </h1>

      {/* Subtitle — one sentence, left-aligned */}
      <p className="max-w-xl text-[15px] text-ink/90 leading-relaxed">
        Paste any SMS or message payload to instantly surface hidden manipulation
        tactics, inspect embedded links, and understand{' '}
        <span className="text-ink">exactly why it&apos;s dangerous</span>.
      </p>
    </div>
  );
}
