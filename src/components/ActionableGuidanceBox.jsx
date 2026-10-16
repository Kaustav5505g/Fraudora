import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';

/**
 * ActionableGuidanceBox — Layer 2 AI guidance: directive + explanation + countermeasures.
 * @param {{ guidance: { directive, explanation, countermeasures: string[] } }} props
 */
export function ActionableGuidanceBox({ guidance }) {
  return (
    <Card className="border-crit/50 bg-crit/5 p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-crit shrink-0" />
        <span className="text-[11px] font-mono uppercase tracking-widest text-crit">
          LAYER 2 // AI GUIDANCE
        </span>
      </div>

      {/* Directive */}
      <p className="font-mono font-bold text-xl text-ink leading-tight">
        {guidance.directive}
      </p>

      {/* Explanation */}
      <p className="text-[13px] text-muted leading-relaxed">
        {guidance.explanation}
      </p>

      {/* Countermeasure bullets */}
      <ul className="space-y-2" aria-label="Recommended countermeasures">
        {guidance.countermeasures.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 min-w-0">
            <CheckCircle2
              size={14}
              className="text-safe shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <span className="text-[13px] text-muted leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
