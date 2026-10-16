import React from 'react';
import { AlertTriangle, ArrowRight, Landmark, Link2, Timer } from 'lucide-react';
import { ATTACK_ANATOMY } from '../data/mockData';
import { Card } from './ui/Card';

const ICONS = { Landmark, AlertTriangle, Timer, Link2 };

export function AttackAnatomy() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-crit/15 text-crit">
          <AlertTriangle size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          ATTACK ANATOMY // HOW THIS SCAM WORKS
        </h2>
      </div>

      <ol className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-7">
        {ATTACK_ANATOMY.map((node, index) => {
          const Icon = ICONS[node.icon];
          const tone = node.severity === 'suspicious' ? 'warn' : 'crit';
          const toneClass = tone === 'warn' ? 'text-warn bg-warn/15 shadow-[0_0_18px_-7px_#F59E0B]' : 'text-crit bg-crit/15 shadow-[0_0_18px_-7px_#EF4444]';

          return (
            <li key={node.step} className="relative flex items-center gap-3 lg:flex-col lg:items-start">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ring-1 ring-current/40 ${toneClass}`}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className={`font-mono text-xs tracking-widest ${tone === 'warn' ? 'text-warn' : 'text-crit'}`}>
                  <span className="text-muted-dim">{node.step}</span> {node.title}
                </p>
                <p className="mt-1 text-[15px] leading-5 text-ink/90">{node.description}</p>
              </div>
              {index < ATTACK_ANATOMY.length - 1 && (
                <span aria-hidden="true" className="absolute left-6 top-12 h-4 border-l border-dashed border-border-soc lg:hidden" />
              )}
              {index < ATTACK_ANATOMY.length - 1 && (
                <span aria-hidden="true" className="absolute right-[-1.8rem] top-5 hidden items-center gap-1 lg:flex">
                  <span className="w-4 border-t border-dashed border-border-soc" />
                  <ArrowRight size={13} className="text-muted-dim" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
