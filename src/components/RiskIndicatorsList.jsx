import React from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RISK_LEVELS } from '../data/mockData';

/**
 * RiskIndicatorsList — shows which Layer 1 rules fired.
 * @param {{ indicators: Array<{id,severity,ruleName,explanation,weight}> }} props
 */
export function RiskIndicatorsList({ indicators }) {
  const totalWeight = indicators.reduce((sum, item) => sum + item.weight, 0);

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-border-soc pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-crit/15 text-crit">
            <Flag size={15} aria-hidden="true" />
          </span>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            RISK INDICATORS // LAYER 1 RULES
          </h2>
        </div>
        <Badge className={`${RISK_LEVELS.critical.badgeClass}`}>
          {indicators.length} TRIGGERED
        </Badge>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-mono tracking-widest text-muted-dim">
          RULE WEIGHT CONTRIBUTION
        </p>
        <div
          className="flex h-2 gap-0.5 overflow-hidden rounded-full"
          role="img"
          aria-label={`Rule weight contribution: ${indicators.map((item) => item.weight).join(', ')}`}
        >
          {indicators.map((item) => (
            <span
              key={item.id}
              className={`h-full ${item.severity === 'critical' ? 'bg-crit' : 'bg-warn'}`}
              style={{ flexBasis: `${(item.weight / totalWeight) * 100}%` }}
            />
          ))}
        </div>
      </div>

      {/* Indicator list */}
      <ul className="space-y-4" aria-label="Triggered risk rules">
        {indicators.map((item) => {
          const isCrit = item.severity === 'critical';
          return (
            <li key={item.id} className="flex items-start gap-3 min-w-0">
              {/* Severity icon */}
              <AlertTriangle
                size={15}
                className={`${isCrit ? 'text-crit' : 'text-warn'} shrink-0 mt-0.5`}
                aria-label={isCrit ? 'Critical' : 'Warning'}
              />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-[13px] text-ink">
                    {item.ruleName}
                  </span>
                  {/* Rule weight chip */}
                  <Badge
                    className={`text-[10px] py-0 ${isCrit ? 'bg-crit/15 text-crit border border-crit/30' : 'bg-warn/15 text-warn border border-warn/30'}`}
                  >
                    +{item.weight}
                  </Badge>
                </div>
                <p className="text-[15px] text-ink/90 leading-relaxed">
                  {item.explanation}
                </p>
                <div
                  className="h-1 overflow-hidden rounded-full bg-border-soc"
                  role="img"
                  aria-label={`Rule weight ${item.weight} of ${totalWeight}`}
                >
                  <span
                    className={`block h-full rounded-full ${isCrit ? 'bg-crit' : 'bg-warn'}`}
                    style={{ width: `${(item.weight / totalWeight) * 100}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
