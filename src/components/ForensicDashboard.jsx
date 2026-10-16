import React from 'react';
import { TriageBanner } from './TriageBanner';
import { MessageOverviewCard } from './MessageOverviewCard';
import { RiskIndicatorsList } from './RiskIndicatorsList';
import { PayloadForensicView } from './PayloadForensicView';
import { LinkAnalysisInspector } from './LinkAnalysisInspector';
import { ActionableGuidanceBox } from './ActionableGuidanceBox';
import { CountermeasureBar } from './CountermeasureBar';
import { AttackAnatomy } from './AttackAnatomy';
import { RISK_LEVELS } from '../data/mockData';

/**
 * ForensicDashboard — compact 7/5 analyst layout with a full-width action row.
 */
export function ForensicDashboard({
  result,
  bannerStatus,
  onStatusChange,
  onNewScan,
  onToast,
}) {
  const risk = RISK_LEVELS[result.riskLevel] || RISK_LEVELS.suspicious;
  const riskRgb = risk.color === '#10B981'
    ? '16 185 129'
    : risk.color === '#F59E0B'
      ? '245 158 11'
      : '239 68 68';

  return (
    <main
      role="main"
      aria-label="Forensic dashboard"
      style={{ '--risk-color': risk.color, '--risk-color-rgb': riskRgb }}
      className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col space-y-4 px-4 pb-4 pt-4 sm:px-6 lg:px-8"
    >
      <TriageBanner result={result} status={bannerStatus} onNewScan={onNewScan} />
      <MessageOverviewCard overview={result.overview} />

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12">
        <section className="space-y-4 lg:col-span-7 stagger-children" aria-label="Message forensics">
          <PayloadForensicView
            payload={result.payload}
            highlightTerms={result.highlightTerms}
          />
          {result.riskLevel !== 'safe' && <AttackAnatomy />}
        </section>

        <section className="space-y-4 lg:col-span-5 stagger-children" aria-label="Link analysis and risk rules">
          <LinkAnalysisInspector linkAnalysis={result.linkAnalysis} />
          <RiskIndicatorsList indicators={result.indicators} />
        </section>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <ActionableGuidanceBox guidance={result.guidance} />
        <CountermeasureBar
          onAction={onStatusChange}
          onToast={onToast}
        />
      </div>
    </main>
  );
}
