import React, { useState } from 'react';
import { AlertTriangle, Flag } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RISK_LEVELS } from '../data/mockData';

/**
 * RiskIndicatorsList — concise rule list with expandable explanations.
 * @param {{ indicators: Array<{id,severity,ruleName,explanation,weight}> }} props
 */
export function RiskIndicatorsList({ indicators }) {
  const [expandedRule, setExpandedRule] = useState(null);
  const totalWeight = indicators.reduce((sum, item) => sum + item.weight, 0);
  const overallRisk = indicators.some((item) => item.severity === 'critical')
    ? RISK_LEVELS.critical
    : indicators.length > 0
      ? RISK_LEVELS.suspicious
      : RISK_LEVELS.safe;

  return (
    <Card className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border-soc pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-risk-soft text-risk">
            <Flag size={15} aria-hidden="true" />
          </span>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            RISK INDICATORS
          </h2>
        </div>
        <Badge className={overallRisk.badgeClass}>
          {indicators.length} TRIGGERED
        </Badge>
      </div>

      {indicators.length > 0 ? (
        <>
          <div className="mb-3 space-y-1.5">
            <p className="text-xs font-mono tracking-widest text-muted-dim">
              RULE WEIGHT CONTRIBUTION
            </p>
            <div
              className="flex h-2 gap-0.5 overflow-hidden rounded-full"
              role="img"
              aria-label={`Rule weight contribution: ${indicators.map((item) => item.weight).join(', ')}`}
            >
              {indicators.map((item) => {
                const level = RISK_LEVELS[item.severity] || RISK_LEVELS.suspicious;
                return (
                  <span
                    key={item.id}
                    className="h-full"
                    style={{ flexBasis: `${(item.weight / totalWeight) * 100}%`, backgroundColor: level.color }}
                  />
                );
              })}
            </div>
          </div>

          <ul className="space-y-1" aria-label="Triggered risk rules">
            {indicators.map((item) => {
              const level = RISK_LEVELS[item.severity] || RISK_LEVELS.suspicious;
              const isExpanded = expandedRule === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedRule(isExpanded ? null : item.id)}
                    className="w-full rounded-md px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    <span className="flex items-start gap-2">
                      <AlertTriangle
                        size={14}
                        className={`${level.colorClass} mt-0.5 shrink-0`}
                        aria-hidden="true"
                      />
                      <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {item.ruleName}
                        </span>
                        <Badge className={`${level.badgeClass} shrink-0 text-xs`}>
                          +{item.weight}
                        </Badge>
                      </span>
                    </span>
                    <span className="ml-5 mt-2 block h-1 overflow-hidden rounded-full bg-border-soc">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${(item.weight / totalWeight) * 100}%`, backgroundColor: level.color }}
                      />
                    </span>
                    {isExpanded && (
                      <span className="ml-5 mt-2 block text-sm leading-5 text-ink/90">
                        {item.explanation}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <p className="text-sm text-safe">No risk rules triggered.</p>
      )}
    </Card>
  );
}
