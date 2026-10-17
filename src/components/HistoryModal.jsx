import React, { useEffect, useState } from 'react';
import { X, Clock, Trash2, ArrowUpRight, ShieldAlert, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { fetchHistory, fetchHistoryItem, deleteHistoryItem, clearAllHistory } from '../services/api';
import { RISK_LEVELS } from '../data/mockData';

export function HistoryModal({ isOpen, onClose, onSelectScan, onToast }) {
  const [historyData, setHistoryData] = useState({ items: [], source: 'server' });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetchHistory(50, 0);
      setHistoryData(res);
    } catch (err) {
      if (onToast) onToast(err.message || 'Could not load history', 'warn');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleOpenItem(scanId) {
    setActionLoadingId(scanId);
    try {
      const fullScan = await fetchHistoryItem(scanId);
      onSelectScan(fullScan);
      onClose();
      if (onToast) onToast('Loaded scan from history', 'info');
    } catch (err) {
      if (onToast) onToast(err.message || 'Could not load scan details', 'warn');
    } finally {
      setActionLoadingId(null);
    }
  }

  async function handleDeleteItem(e, scanId) {
    e.stopPropagation();
    try {
      await deleteHistoryItem(scanId);
      setHistoryData((prev) => ({
        ...prev,
        items: prev.items.filter((i) => i.id !== scanId),
      }));
      if (onToast) onToast('Scan removed from history', 'info');
    } catch (err) {
      if (onToast) onToast(err.message || 'Could not delete item', 'warn');
    }
  }

  async function handleClearAll() {
    if (!window.confirm('Are you sure you want to clear your entire scan history?')) return;
    try {
      await clearAllHistory();
      setHistoryData({ items: [], source: historyData.source });
      if (onToast) onToast('All history cleared', 'info');
    } catch (err) {
      if (onToast) onToast(err.message || 'Could not clear history', 'warn');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl border border-[#374151] bg-[#111827] shadow-2xl animate-fade-in overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#374151] bg-[#1f2937] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Clock size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 id="history-modal-title" className="text-xl font-bold text-ink">
                Scan History
              </h2>
              <p className="text-xs font-mono text-secondary">
                {historyData.source === 'server' ? 'Synced with server (/api/history)' : 'Stored in private browser cache'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {historyData.items.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-mono text-red-300 hover:bg-red-500/20 transition-colors"
              >
                <Trash2 size={14} /> Clear all
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close history modal"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary hover:bg-[#374151] hover:text-ink transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {historyData.notice && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-xs text-indigo-300 font-mono">
              ℹ️ {historyData.notice}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-secondary">
              <Loader2 size={30} className="animate-spin text-accent" />
              <p className="font-mono text-sm">Loading your scans...</p>
            </div>
          ) : historyData.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-secondary space-y-3">
              <Clock size={40} className="text-muted opacity-50" />
              <p className="text-base font-semibold text-ink">No scans yet</p>
              <p className="text-sm max-w-sm">
                Paste a suspicious message or link on the home screen to perform your first scan.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[#374151]/50 border border-[#374151] rounded-xl overflow-hidden bg-[#1f2937]/50">
              {historyData.items.map((scan) => {
                const rl = RISK_LEVELS[scan.riskLevel] || RISK_LEVELS.suspicious;
                const Icon = scan.riskLevel === 'safe'
                  ? ShieldCheck
                  : scan.riskLevel === 'critical'
                    ? ShieldAlert
                    : AlertTriangle;
                const isLoadingItem = actionLoadingId === scan.id;

                return (
                  <li key={scan.id}>
                    <div
                      onClick={() => handleOpenItem(scan.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleOpenItem(scan.id)}
                      className="flex items-center justify-between gap-4 p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${rl.strong}20`, color: rl.strong }}
                        >
                          <Icon size={18} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-secondary">{scan.time}</span>
                            <span
                              className="font-mono text-[11px] font-bold px-1.5 py-0.2 rounded uppercase"
                              style={{ color: rl.strong, backgroundColor: `${rl.strong}15` }}
                            >
                              Score {scan.score} // {rl.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-ink truncate mt-0.5 group-hover:text-accent transition-colors">
                            {scan.preview || scan.sender || 'Scanned message'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isLoadingItem ? (
                          <Loader2 size={16} className="animate-spin text-accent" />
                        ) : (
                          <span className="text-xs text-secondary flex items-center gap-1 group-hover:text-ink">
                            View <ArrowUpRight size={14} />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(e, scan.id)}
                          aria-label="Delete scan"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-red-500/20 hover:text-red-400 transition-colors ml-1"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
