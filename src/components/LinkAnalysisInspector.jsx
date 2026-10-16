import React from 'react';
import { Check, Globe, X } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

function HighlightedLabel({ label }) {
  const parts = label.split(/(l0gin)/gi);
  return parts.map((part, index) => {
    if (/^l0gin$/i.test(part)) {
      return (
        <span key={index}>
          {part[0]}
          <span className="text-crit underline decoration-wavy">{part[1]}</span>
          {part.slice(2)}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function DomainSegments({ domain }) {
  const labels = domain.split('.');
  const suffixSize = labels.slice(-2).join('.').toLowerCase() === 'co.uk' ? 2 : 1;
  const domainIndex = Math.max(0, labels.length - suffixSize - 1);
  const subdomain = labels.slice(0, domainIndex).join('.');
  const registrableLabel = labels[domainIndex];
  const suffix = labels.slice(domainIndex + 1).join('.');

  return (
    <span className="break-all">
      {subdomain && <span className="text-warn">{subdomain}.</span>}
      <span className="text-crit"><HighlightedLabel label={registrableLabel} /></span>
      {suffix && <span className="text-ink">.{suffix}</span>}
    </span>
  );
}

/**
 * LinkAnalysisInspector — static domain analysis readout.
 * @param {{ linkAnalysis: { normalizedDomain, reputation, domainAge, registrar } }} props
 */
export function LinkAnalysisInspector({ linkAnalysis }) {
  const ageDays = Number.parseInt(linkAnalysis.domainAge, 10) || 0;

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-crit/15 text-crit">
          <Globe size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          LINK ANALYSIS
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="min-w-0 rounded-md border border-safe/30 bg-safe/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-safe">
            <Check size={13} aria-hidden="true" />
            EXPECTED
          </p>
          <p className="mt-1 break-all font-mono text-[13px] text-safe">natwest.co.uk</p>
        </div>
        <div className="min-w-0 rounded-md border border-crit/30 bg-crit/5 p-3">
          <p className="flex items-center gap-1.5 text-xs font-mono tracking-widest text-crit">
            <X size={13} aria-hidden="true" />
            ACTUAL
          </p>
          <p className="mt-1 break-all font-mono text-[13px] text-crit">
            <DomainSegments domain={linkAnalysis.normalizedDomain} />
          </p>
        </div>
      </div>

      <dl className="space-y-3">
        <Row label="Normalized Domain">
          <span className="font-mono text-[13px] text-ink">
            <DomainSegments domain={linkAnalysis.normalizedDomain} />
          </span>
        </Row>

        <Row label="Reputation">
          <Badge className="bg-crit/15 text-crit border border-crit/30">
            {linkAnalysis.reputation}
          </Badge>
        </Row>

        <Row label="Domain Age">
          <div className="w-full max-w-sm space-y-2">
            <span className="font-mono text-[13px] tabular-nums text-warn">
              {linkAnalysis.domainAge}
            </span>
            <div className="relative pt-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-border-soc">
                <span
                  className="block h-full rounded-full bg-warn"
                  style={{ width: `${Math.min((ageDays / 30) * 100, 100)}%` }}
                />
              </div>
              <span
                aria-hidden="true"
                className="absolute right-0 top-0 h-3 border-l border-dashed border-muted"
              />
              <span className="absolute right-0 top-3 font-mono text-[10px] text-muted-dim">
                30d established
              </span>
            </div>
          </div>
        </Row>

        <Row label="Registrar">
          <span className="font-mono text-[13px] text-ink">{linkAnalysis.registrar}</span>
        </Row>
      </dl>

      <p className="border-t border-border-soc pt-3 text-xs font-mono text-muted-dim">
        Link not visited. Static analysis only.
      </p>
    </Card>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex min-w-0 flex-wrap items-start gap-3">
      <dt className="w-36 shrink-0 pt-0.5 font-mono text-xs uppercase tracking-widest text-muted-dim">
        {label}
      </dt>
      <dd className="min-w-0 flex-1">{children}</dd>
    </div>
  );
}
