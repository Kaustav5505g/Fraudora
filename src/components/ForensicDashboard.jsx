import React from 'react';
import { TriageBanner } from './TriageBanner';
import { MessageOverviewCard } from './MessageOverviewCard';
import { RiskIndicatorsList } from './RiskIndicatorsList';
import { TaxonomyBadgeGroup } from './TaxonomyBadgeGroup';
import { PayloadForensicView } from './PayloadForensicView';
import { LinkAnalysisInspector } from './LinkAnalysisInspector';
import { ActionableGuidanceBox } from './ActionableGuidanceBox';
import { CountermeasureBar } from './CountermeasureBar';
import { AttackAnatomy } from './AttackAnatomy';

/**
 * ForensicDashboard — full 2-column analyst view.
 * @param {{
 *   result: object,           // SCAN_RESULT shape
 *   bannerStatus: string,
 *   onStatusChange: (s: string) => void,
 *   onNewScan: () => void,
 *   onToast: (msg: string, tone: string) => void,
 * }} props
 */
export function ForensicDashboard({
  result,
  bannerStatus,
  onStatusChange,
  onNewScan,
  onToast,
}) {
  return (
    <main
      role="main"
      aria-label="Forensic dashboard"
      className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-slide-up motion-reduce:animate-none"
    >
      {/* ── Full-width triage banner ── */}
      <TriageBanner result={result} status={bannerStatus} onNewScan={onNewScan} />
      <AttackAnatomy />

      {/* ── Two-column forensic grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* LEFT COLUMN */}
        <section className="space-y-6 stagger-children" aria-label="Metadata and rules">
          <MessageOverviewCard overview={result.overview} />
          <RiskIndicatorsList indicators={result.indicators} />
          <TaxonomyBadgeGroup taxonomy={result.taxonomy} />
        </section>

        {/* RIGHT COLUMN */}
        <section className="space-y-6 stagger-children" aria-label="Forensics and countermeasures">
          <PayloadForensicView
            payload={result.payload}
            highlightTerms={result.highlightTerms}
          />
          <LinkAnalysisInspector linkAnalysis={result.linkAnalysis} />
          <ActionableGuidanceBox guidance={result.guidance} />
          <CountermeasureBar
            onAction={onStatusChange}
            onToast={onToast}
          />
        </section>
      </div>
    </main>
  );
}
