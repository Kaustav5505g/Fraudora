import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { Card } from './ui/Card';

/**
 * ActionableGuidanceBox — Layer 2 AI guidance: directive + explanation + countermeasures.
 * @param {{ guidance: { directive, explanation, countermeasures: string[] } }} props
 */
export function ActionableGuidanceBox({ guidance }) {
  const directiveParts = guidance.directive.split('1930');

  return (
    <Card className="border-risk risk-guidance risk-glow p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-risk-soft text-risk">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        <span className="text-xs font-mono uppercase tracking-widest text-ink/80">
          LAYER 2 // AI GUIDANCE
        </span>
      </div>

      {/* Directive */}
      <p className="font-mono text-3xl font-bold text-ink leading-tight md:text-4xl">
        {directiveParts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < directiveParts.length - 1 && (
              <span className="mx-1 inline-flex rounded-md bg-risk-soft px-2 py-0.5 text-risk ring-1 ring-current/40">
                1930
              </span>
            )}
          </React.Fragment>
        ))}
      </p>

      {/* Explanation */}
      <p className="text-[15px] text-ink/90 leading-relaxed">
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
            <span className="text-[15px] text-ink/90 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
