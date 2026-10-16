import React from 'react';
import { Globe } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

/**
 * Highlights the '0' (zero) in 'l0gin' with crit color.
 * Pure React — no dangerouslySetInnerHTML.
 */
function HighlightedDomain({ domain }) {
  // Split on 'l0gin' to highlight the zero
  const parts = domain.split(/(l0gin)/gi);
  return (
    <>
      {parts.map((part, i) => {
        if (/^l0gin$/i.test(part)) {
          // Wrap the zero specifically
          const [l, zero, gin] = [part[0], part[1], part.slice(2)];
          return (
            <span key={i}>
              {l}
              <span className="text-crit font-bold">{zero}</span>
              {gin}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

/**
 * LinkAnalysisInspector — static domain analysis readout.
 * @param {{ linkAnalysis: { normalizedDomain, reputation, domainAge, registrar } }} props
 */
export function LinkAnalysisInspector({ linkAnalysis }) {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-muted-dim shrink-0" />
        <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-dim">
          LINK ANALYSIS
        </h2>
      </div>

      {/* Key/value rows */}
      <dl className="space-y-3">
        <Row label="Normalized Domain">
          <span className="font-mono text-[12px] text-ink break-all">
            <HighlightedDomain domain={linkAnalysis.normalizedDomain} />
          </span>
        </Row>

        <Row label="Reputation">
          <Badge className="bg-crit/15 text-crit border border-crit/30">
            {linkAnalysis.reputation}
          </Badge>
        </Row>

        <Row label="Domain Age">
          <span className="font-mono text-[12px] text-warn">
            {linkAnalysis.domainAge}
          </span>
        </Row>

        <Row label="Registrar">
          {/* Note: mock registrar value — not real data */}
          <span className="font-mono text-[12px] text-ink">
            {linkAnalysis.registrar}
          </span>
        </Row>
      </dl>

      {/* Safety footer */}
      <p className="text-[11px] font-mono text-muted-dim border-t border-border-soc pt-3">
        ⚠ Link not visited. Static analysis only.
      </p>
    </Card>
  );
}

/** Helper row layout */
function Row({ label, children }) {
  return (
    <div className="flex items-start gap-3 flex-wrap min-w-0">
      <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-dim w-36 shrink-0 pt-0.5">
        {label}
      </dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
