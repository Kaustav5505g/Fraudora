import React from 'react';
import {
  AnatomyTimeline,
  LinkCard,
  TechnicalDetails,
  VerdictCard,
  WhatToDoNowCard,
  WhyWeThinkSoCard,
} from './ConsumerResultCards';

export function ForensicDashboard({
  result,
  bannerStatus,
  onStatusChange,
  onNewScan,
  onToast,
}) {
  void bannerStatus;
  void onStatusChange;

  return (
    <main
      role="main"
      aria-label="Message check result"
      className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 pb-8 pt-5 sm:px-6 sm:pt-8"
    >
      <VerdictCard result={result} onNewScan={onNewScan} />
      <WhatToDoNowCard result={result} onToast={onToast} />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <WhyWeThinkSoCard result={result} />
        <AnatomyTimeline result={result} />
        <LinkCard result={result} />
      </div>

      <TechnicalDetails result={result} />
      <p className="px-1 text-center text-sm leading-6 text-secondary">
        Fraudora uses rules to decide and AI to explain. Always verify with your bank using the number on your card.
      </p>
    </main>
  );
}
