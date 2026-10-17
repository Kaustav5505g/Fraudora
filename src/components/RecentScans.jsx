import React, { useEffect, useState } from 'react';
import { Clock, Trash2, ArrowUpRight, RotateCcw, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Card } from './ui/Card';
import { RISK_LEVELS } from '../data/mockData';
import { fetchHistory, deleteHistoryItem, fetchHistoryItem } from '../services/api';

/**
 * RecentScans — Card showing real recent scans from /api/history.
 * Clicking any row loads that specific scan report into Forensic Dashboard.
 */
export function RecentScans({ onSelectScan, onOpenHistoryModal, onToast }) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadScans() {
    setLoading(true);
    try {
      const res = await fetchHistory(5, 0);
      setScans(res.items || []);
    } catch {
      setScans([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadScans();
  }, []);

  async function handleSelect(scanId) {
    try {
      const full = await fetchHistoryItem(scanId);
      if (onSelectScan) onSelectScan(full);
    } catch (err) {
      if (onToast) onToast('Could not load scan details.', 'warn');
    }
  }

  async function handleDelete(e, scanId) {
    e.stopPropagation();
    try {
      await deleteHistoryItem(scanId);
      setScans((prev) => prev.filter((s) => s.id !== scanId));
      if (onToast) onToast('Scan deleted', 'info');
    } catch {
      if (onToast) onToast('Could not delete scan', 'warn');
    }
  }

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#374151] pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
            <Clock size={15} aria-hidden="true" />
          </span>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            RECENT SCANS
          </h2>
        </div>
        {scans.length > 0 && onOpenHistoryModal && (
          <button
            type="button"
            onClick={onOpenHistoryModal}
            className="text-[11px] font-mono text-accent hover:text-accent-hover transition-colors"
          >
            View all ({scans.length}) &rarr;
          </button>
        )}
      </div>

      {/* Scan rows */}
      {loading ? (
        <div className="py-6 text-center font-mono text-xs text-secondary">
          Loading scans...
        </div>
      ) : scans.length === 0 ? (
        <div className="py-6 text-center font-mono text-xs text-secondary">
          No recent scans. Paste a message above.
        </div>
      ) : (
        <ul className="space-y-0 divide-y divide-[#374151]/50" aria-label="Recent scan results">
          {scans.map((scan) => {
            const rl = RISK_LEVELS[scan.riskLevel] ?? RISK_LEVELS.suspicious;
            const scoreStr = String(scan.score).padStart(2, '0');

            return (
              <li key={scan.id}>
                <div
                  onClick={() => handleSelect(scan.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(scan.id)}
                  aria-label={`View scan: score ${scan.score}, ${rl.label}`}
                  className="relative w-full flex items-center justify-between gap-2 py-2.5 pl-3 text-left
                    hover:bg-white/5 transition-colors duration-150 rounded cursor-pointer
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent
                    min-w-0 group"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-2 left-0 w-[3px] rounded-full"
                    style={{ backgroundColor: rl.strong }}
                  />

                  {/* Time + preview */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-mono text-xs text-secondary tabular-nums shrink-0">
                      {scan.time}
                    </span>
                    <span className="font-mono text-[13px] text-muted truncate group-hover:text-ink transition-colors duration-150">
                      {scan.preview || scan.sender}
                    </span>
                  </div>

                  {/* Risk dot + score + action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="inline-block w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: rl.strong }}
                      aria-hidden="true"
                    />
                    <span className={`font-mono text-[13px] font-semibold tabular-nums ${rl.colorClass}`}>
                      {scoreStr}
                    </span>
                    <span className="hidden sm:inline font-mono text-xs tracking-widest uppercase text-secondary">
                      {rl.shortLabel}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, scan.id)}
                      aria-label="Delete scan"
                      className="opacity-0 group-hover:opacity-100 p-1 text-secondary hover:text-red-400 rounded transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {scans.length > 0 && (
        <p className="text-[10px] font-mono text-secondary pt-1 border-t border-[#374151]/50">
          Click any scan to open full forensic breakdown.
        </p>
      )}
    </Card>
  );
}
