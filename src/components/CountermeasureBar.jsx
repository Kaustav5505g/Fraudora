import React, { useState, useRef, useCallback } from 'react';
import { Archive, Ban, ShieldCheck, Siren } from 'lucide-react';
import { Card } from './ui/Card';

/**
 * CountermeasureBar — four analyst action buttons with confirm step for Mark Safe.
 * @param {{
 *   onAction: (action: string) => void,  // called with status string
 *   onToast: (message: string, tone: string) => void,
 * }} props
 */
export function CountermeasureBar({ onAction, onToast }) {
  const [applied, setApplied] = useState({});       // { actionId: true }
  const [confirmPending, setConfirmPending] = useState(false);
  const confirmTimerRef = useRef(null);

  const apply = useCallback((id, status, toastMsg, toastTone) => {
    setApplied((prev) => ({ ...prev, [id]: true }));
    onAction(status);
    onToast(toastMsg, toastTone);
  }, [onAction, onToast]);

  function handleQuarantine() {
    if (applied.quarantine) return;
    apply('quarantine', 'QUARANTINED', 'Message quarantined.', 'crit');
  }

  function handleBlock() {
    if (applied.block) return;
    apply('block', 'SENDER BLOCKED', 'Sender blocked.', 'crit');
  }

  function handleMarkSafe() {
    if (applied.markSafe) return;
    if (!confirmPending) {
      // First click: enter confirm mode for 3 s
      setConfirmPending(true);
      confirmTimerRef.current = setTimeout(() => setConfirmPending(false), 3000);
    } else {
      // Second click within 3 s: confirm
      clearTimeout(confirmTimerRef.current);
      setConfirmPending(false);
      apply('markSafe', 'MARKED SAFE', 'Message marked as safe.', 'success');
    }
  }

  function handleEscalate() {
    if (applied.escalate) return;
    apply('escalate', 'ESCALATED TO TIER-2', 'Escalated to Tier-2 analyst.', 'warn');
  }

  const actions = [
    {
      id: 'quarantine',
      label: applied.quarantine ? 'QUARANTINED' : 'Quarantine',
      Icon: Archive,
      handler: handleQuarantine,
      style: applied.quarantine
        ? 'border-crit/30 bg-crit/10 text-crit/60 cursor-not-allowed'
        : 'border-crit bg-crit text-white hover:bg-red-500',
    },
    {
      id: 'block',
      label: applied.block ? 'BLOCKED' : 'Block Sender',
      Icon: Ban,
      handler: handleBlock,
      style: applied.block
        ? 'border-crit/30 bg-crit/10 text-crit/60 cursor-not-allowed'
        : 'border-crit text-crit hover:bg-crit/10',
    },
    {
      id: 'markSafe',
      label: applied.markSafe ? 'SAFE' : confirmPending ? 'Confirm?' : 'Mark Safe',
      Icon: ShieldCheck,
      handler: handleMarkSafe,
      style: applied.markSafe
        ? 'border-safe/30 bg-safe/10 text-safe/60 cursor-not-allowed'
        : confirmPending
        ? 'border-safe/60 bg-safe/20 text-safe animate-pulse motion-reduce:animate-none'
        : 'border-safe/50 bg-transparent text-safe hover:bg-safe/10',
    },
    {
      id: 'escalate',
      label: applied.escalate ? 'ESCALATED' : 'Escalate',
      Icon: Siren,
      handler: handleEscalate,
      style: applied.escalate
        ? 'border-warn/30 bg-warn/10 text-warn/60 cursor-not-allowed'
        : 'border-warn bg-warn text-obsidian hover:bg-amber-300',
    },
  ];

  return (
    <Card className="sticky bottom-0 z-30 bg-obsidian/95 p-4 shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md sm:static sm:bg-transparent sm:shadow-none sm:backdrop-blur-none space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-warn/15 text-warn">
          <Siren size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          COUNTERMEASURES
        </h2>
      </div>

      {/* Action grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(({ id, label, Icon, handler, style }) => (
          <button
            key={id}
            type="button"
            onClick={handler}
            disabled={!!applied[id]}
            aria-disabled={!!applied[id]}
            aria-label={label}
            className={`flex h-12 flex-col items-center justify-center gap-1 rounded-lg border
              px-2 font-mono text-xs tracking-widest font-medium
              transition-all duration-150
              focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              ${style}`}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}
