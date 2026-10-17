import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Search, Landmark, ExternalLink, Loader2 } from 'lucide-react';
import { fetchRules } from '../services/api';

export function RulesModal({ isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    setLoading(true);
    fetchRules()
      .then((res) => {
        if (mounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || 'Could not load detection rules.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
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

  const rules = data?.rules || [];
  const brands = data?.brands_checked || [];
  const thresholds = data?.thresholds || { safe: [0, 24], suspicious: [25, 60], high_risk: [61, 100] };

  const categories = ['all', ...new Set(rules.map((r) => r.category).filter(Boolean))];

  const filteredRules = rules.filter((r) => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesSearch = !search ||
      r.label.toLowerCase().includes(search.toLowerCase()) ||
      r.why.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

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
        aria-labelledby="rules-modal-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-[#374151] bg-[#111827] shadow-2xl animate-fade-in overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#374151] bg-[#1f2937] px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <ShieldAlert size={22} aria-hidden="true" />
            </span>
            <div>
              <h2 id="rules-modal-title" className="text-xl font-bold text-ink">
                Detection Rules & Scoring Engine
              </h2>
              <p className="text-xs font-mono text-secondary">
                Live inspection of backend rules (/api/rules)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close rules modal"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-secondary hover:bg-[#374151] hover:text-ink transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-secondary">
              <Loader2 size={32} className="animate-spin text-accent" />
              <p className="font-mono text-sm">Fetching rules from /api/rules...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="font-semibold">Failed to fetch rules</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Scoring Logic & Thresholds */}
              <div className="rounded-xl border border-[#374151] bg-[#1f2937]/60 p-4 space-y-3">
                <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                  SCORING THRESHOLDS & METHODOLOGY
                </h3>
                <p className="text-sm text-secondary leading-relaxed">
                  {data?.how_it_works || 'Each rule that matches adds its points once. Points are accumulated and capped at 100.'}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <CheckCircle2 size={16} /> SAFE
                    </div>
                    <p className="text-lg font-bold text-ink mt-1">
                      {thresholds.safe[0]} – {thresholds.safe[1]} <span className="text-xs text-secondary font-normal">pts</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle size={16} /> SUSPICIOUS
                    </div>
                    <p className="text-lg font-bold text-ink mt-1">
                      {thresholds.suspicious[0]} – {thresholds.suspicious[1]} <span className="text-xs text-secondary font-normal">pts</span>
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                    <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider">
                      <ShieldAlert size={16} /> HIGH RISK
                    </div>
                    <p className="text-lg font-bold text-ink mt-1">
                      {thresholds.high_risk[0]} – {thresholds.high_risk[1]} <span className="text-xs text-secondary font-normal">pts</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Search & Category Filter */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-3 text-secondary" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search rules by name, description, or id..."
                    className="w-full rounded-xl border border-[#374151] bg-[#1f2937] py-2 pl-9 pr-4 text-sm text-ink placeholder:text-muted focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors ${
                        selectedCategory === cat
                          ? 'bg-accent text-white font-semibold'
                          : 'border border-[#374151] bg-[#1f2937] text-secondary hover:text-ink'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-secondary">
                  <span>SHOWING {filteredRules.length} OF {rules.length} RULES</span>
                  <span>MAX SCORE: {data?.max_score || 100} PTS</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredRules.map((rule) => {
                    const isHigh = rule.severity === 'high';
                    const isMed = rule.severity === 'medium';
                    const badgeColor = isHigh
                      ? 'border-red-500/40 bg-red-500/10 text-red-300'
                      : isMed
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                        : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';

                    return (
                      <div
                        key={rule.id}
                        className="rounded-xl border border-[#374151] bg-[#1f2937] p-4 flex flex-col justify-between hover:border-[#4b5563] transition-colors"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="font-semibold text-ink text-sm leading-snug">
                              {rule.label}
                            </span>
                            <span className="shrink-0 font-mono text-xs font-bold text-accent px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30">
                              +{rule.points} pts
                            </span>
                          </div>
                          <p className="text-xs text-secondary leading-relaxed mb-3">
                            {rule.why}
                          </p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#374151]/50 text-[11px] font-mono">
                          <span className={`px-2 py-0.5 rounded border uppercase ${badgeColor}`}>
                            {rule.severity}
                          </span>
                          <span className="text-muted truncate">
                            {rule.category} // {rule.id}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Brands Monitored */}
              {brands.length > 0 && (
                <div className="rounded-xl border border-[#374151] bg-[#1f2937]/40 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Landmark size={18} className="text-indigo-400" />
                    <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-400">
                      OFFICIAL BRANDS & DOMAINS MONITORED ({brands.length})
                    </h3>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                    {brands.map((b) => (
                      <div key={b.name} className="rounded-lg border border-[#374151] bg-[#111827] p-2.5 text-xs">
                        <div className="flex items-center justify-between font-semibold text-ink">
                          <span>{b.name}</span>
                          <span className="font-mono text-[10px] text-muted uppercase">{b.kind}</span>
                        </div>
                        <div className="mt-1 font-mono text-[11px] text-secondary truncate">
                          {b.official_domains?.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
