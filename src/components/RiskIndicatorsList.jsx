import React from 'react';
import { Flag, AlertTriangle, Dot } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { RISK_LEVELS } from '../data/mockData';

/**
 * RiskIndicatorsList — shows which Layer 1 rules fired.
 * @param {{ indicators: Array<{id,severity,ruleName,explanation,weight}> }} props
 */
export function RiskIndicatorsList({ indicators }) {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Flag size={14} className="text-muted-dim shrink-0" />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-muted-dim">
            RISK INDICATORS // LAYER 1 RULES
          </h2>
        </div>
        <Badge className={`${RISK_LEVELS.critical.badgeClass}`}>
          {indicators.length} TRIGGERED
        </Badge>
      </div>

      {/* Indicator list */}
      <ul className="space-y-4" aria-label="Triggered risk rules">
        {indicators.map((item) => {
          const isCrit = item.severity === 'critical';
          return (
            <li key={item.id} className="flex items-start gap-3 min-w-0">
              {/* Severity icon */}
              {isCrit ? (
                <AlertTriangle
                  size={14}
                  className="text-crit shrink-0 mt-0.5"
                  aria-label="Critical"
                />
              ) : (
                <Dot
                  size={18}
                  className="text-warn shrink-0 mt-0.5"
                  aria-label="Warning"
                />
              )}

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-semibold text-[12px] text-ink">
                    {item.ruleName}
                  </span>
                  {/* Rule weight chip */}
                  <Badge
                    className={`text-[10px] py-0 ${isCrit ? 'bg-crit/15 text-crit border border-crit/30' : 'bg-warn/15 text-warn border border-warn/30'}`}
                  >
                    +{item.weight}
                  </Badge>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  {item.explanation}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
