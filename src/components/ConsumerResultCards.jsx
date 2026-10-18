import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  ExternalLink,
  IndianRupee,
  Landmark,
  Link2,
  Package,
  ShieldAlert,
  ShieldCheck,
  Timer,
  XCircle,
  Zap,
} from 'lucide-react';
import { Card } from './ui/Card';
import { RISK_LEVELS } from '../data/mockData';

const ANATOMY_ICONS = {
  AlertTriangle,
  Briefcase,
  IndianRupee,
  Landmark,
  Link2,
  Package,
  Timer,
  Zap,
};

const VERDICT_COPY = {
  critical: { title: 'This looks like a scam', label: 'High' },
  suspicious: { title: 'Be careful with this message', label: 'Medium' },
  safe: { title: 'This looks safe', label: 'Low' },
};

function getRisk(result) {
  return RISK_LEVELS[result.riskLevel] || RISK_LEVELS.suspicious;
}

function ResultCard({ title, icon: Icon, children, className = '' }) {
  return (
    <Card className={className}>
      <div className="mb-4 flex items-center gap-3 border-b border-[#374151] pb-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-300">
          <Icon size={17} aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      </div>
      {children}
    </Card>
  );
}

export function VerdictCard({ result, onBack }) {
  const risk = getRisk(result);
  const verdict = VERDICT_COPY[result.riskLevel] || VERDICT_COPY.suspicious;
  const Icon = result.riskLevel === 'safe'
    ? ShieldCheck
    : result.riskLevel === 'critical'
      ? ShieldAlert
      : AlertTriangle;

  return (
    <Card
      className="border-2 p-5 sm:p-6"
      style={{ backgroundColor: `${risk.strong}1A`, borderColor: `${risk.strong}80` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0b0f19]"
            style={{ color: risk.strong }}
          >
            <Icon size={30} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold" style={{ color: risk.strong }}>
              {result.riskLevel === 'safe' ? 'Low risk' : result.riskLevel === 'critical' ? 'High risk' : 'Review carefully'}
            </p>
            <h1 className="text-xl font-bold text-ink sm:text-2xl">
              {verdict.title}
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex min-h-11 items-center justify-center rounded-xl border border-[#374151] bg-[#1f2937] px-4 text-sm font-semibold text-secondary transition-colors hover:bg-[#374151] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Check another message
        </button>
      </div>

      <div className="mt-5 rounded-xl bg-[#0b0f19]/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-secondary">Scam risk</span>
          <span className="text-sm font-semibold tabular-nums text-ink">
            {result.score} / 100 <span className="font-normal text-secondary">({verdict.label})</span>
          </span>
        </div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-[#374151]"
          role="progressbar"
          aria-label="Scam risk score"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={result.score}
        >
          <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${result.score}%`, backgroundColor: risk.strong }} />
        </div>
      </div>
      <p className="mt-4 text-xl font-bold leading-8 text-ink sm:text-2xl">
        {result.guidance.directive}
      </p>
    </Card>
  );
}

export function WhatToDoNowCard({ result, onToast }) {
  const [confirmPending, setConfirmPending] = useState(false);
  const [markedSafe, setMarkedSafe] = useState(false);
  const confirmTimer = useRef(null);
  const verdict = VERDICT_COPY[result.riskLevel] || VERDICT_COPY.suspicious;
  const warning = `${verdict.title}. ${result.guidance.directive}`;
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(warning)}`;
  const steps = result.guidance.steps || result.guidance.countermeasures || [];

  useEffect(() => () => window.clearTimeout(confirmTimer.current), []);

  function handleMarkSafe() {
    if (markedSafe) return;
    if (!confirmPending) {
      setConfirmPending(true);
      confirmTimer.current = window.setTimeout(() => setConfirmPending(false), 3000);
      return;
    }
    window.clearTimeout(confirmTimer.current);
    setConfirmPending(false);
    setMarkedSafe(true);
    onToast('Message marked as safe.', 'success');
  }

  function handleShare() {
    if (!navigator.clipboard?.writeText) {
      onToast('Sharing is ready. Copy the warning from your browser if needed.', 'info');
      return;
    }
    navigator.clipboard.writeText(warning)
      .then(() => onToast('Warning copied', 'success'))
      .catch(() => onToast('Could not copy the warning. You can still share it in WhatsApp.', 'warn'));
  }

  return (
    <ResultCard title="What to do now" icon={CheckCircle2}>
      <ol className="space-y-3">
        {steps.map((step, index) => (
          <li key={`${index}-${step}`} className="flex gap-3 text-base leading-7 text-secondary">
            <span             className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-sm font-bold text-indigo-300">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <a
          href="https://cybercrime.gov.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-center text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Report on cybercrime.gov.in <ExternalLink size={15} aria-hidden="true" />
        </a>
        <a
          href="tel:1930"
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#374151] bg-[#1f2937] px-3 text-sm font-semibold text-ink hover:bg-[#374151] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Call 1930
        </a>
        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleShare}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#374151] bg-[#1f2937] px-3 text-center text-sm font-semibold text-ink hover:bg-[#374151] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Share warning with family <ExternalLink size={15} aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={handleMarkSafe}
          disabled={markedSafe}
          className="min-h-12 rounded-xl px-3 text-sm font-medium text-secondary underline decoration-slate-300 underline-offset-4 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:no-underline disabled:opacity-60"
        >
          {markedSafe ? 'Marked as safe' : confirmPending ? 'Confirm mark as safe' : 'Mark as safe'}
        </button>
      </div>
    </ResultCard>
  );
}

function highlightMessage(message, terms, risk) {
  if (!terms?.length) return message;
  const escaped = terms
    .filter(Boolean)
    .sort((first, second) => second.length - first.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return message;
  const expression = new RegExp(`(${escaped.join('|')})`, 'gi');
  const markClass = risk === 'critical'
    ? 'rounded bg-[#ef4444]/15 px-1 text-red-200'
    : 'rounded bg-[#f59e0b]/15 px-1 text-amber-200';
  return message.split(expression).map((part, index) => (
    terms.some((term) => part.toLowerCase() === term.toLowerCase())
      ? <mark key={`${index}-${part}`} className={markClass}>{part}</mark>
      : part
  ));
}

export function WhyWeThinkSoCard({ result }) {
  const Icon = result.riskLevel === 'safe' ? CheckCircle2 : AlertCircle;
  return (
    <ResultCard title="Why we think so" icon={CircleHelp}>
      <div className="break-words rounded-xl bg-[#0b0f19] p-4 font-mono text-base leading-7 text-ink">
        {result.riskLevel === 'safe'
          ? result.payload
          : highlightMessage(result.payload, result.highlightTerms, result.riskLevel)}
      </div>
      <ul className="mt-4 space-y-3">
        {result.riskLevel === 'safe' ? (
          <li className="flex gap-2 text-base leading-6 text-secondary">
            <CheckCircle2 size={19} className="mt-0.5 shrink-0 text-safe" aria-hidden="true" />
            <span><strong className="font-semibold text-ink">No manipulation tactics detected.</strong> {result.explanation}</span>
          </li>
        ) : result.indicators.slice(0, 4).map((indicator) => (
          <li key={indicator.id} className="flex gap-2 text-base leading-6 text-secondary">
            <Icon size={19} className="mt-0.5 shrink-0" style={{ color: getRisk(result).strong }} aria-hidden="true" />
            <span>
              <strong className="font-semibold text-ink">{indicator.ruleName}.</strong> {indicator.explanation}
            </span>
          </li>
        ))}
      </ul>
    </ResultCard>
  );
}

export function AnatomyTimeline({ result }) {
  if (result.riskLevel === 'safe' || !result.anatomy?.length) return null;
  return (
    <ResultCard title="How this scam works" icon={AlertTriangle}>
      <ol className="space-y-4">
        {result.anatomy.map((item, index) => {
          const Icon = ANATOMY_ICONS[item.icon] || AlertTriangle;
          return (
            <li key={`${item.step}-${item.title}`} className="relative flex gap-3">
              {index < result.anatomy.length - 1 && (
                <span aria-hidden="true" className="absolute left-[17px] top-9 h-[calc(100%+4px)] w-px bg-slate-200" />
              )}
              <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-300">
                <Icon size={17} aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-accent">STEP {item.step}</p>
                <h3 className="font-semibold leading-6 text-ink">{item.title}</h3>
                <p className="text-sm leading-6 text-secondary">{item.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </ResultCard>
  );
}

function defangUrl(url) {
  return url.replace(/^https?:\/\//i, (scheme) => scheme.replace('://', '[://]'));
}

function DomainLabel({ domain }) {
  const parts = domain.split('.');
  if (parts.length < 2) return <span className="break-all">{domain}</span>;
  const subdomain = parts.slice(0, -2).join('.');
  const domainName = parts.at(-2);
  const tld = parts.at(-1);
  return (
    <span className="break-all">
      {subdomain && <span className="text-amber-700">{subdomain}.</span>}
      <span className="text-red-700">
        {domainName.split(/(l0gin)/i).map((part, index) => (
          part.toLowerCase() === 'l0gin'
            ? <span key={`${index}-${part}`} className="underline decoration-wavy">{part}</span>
            : part
        ))}
      </span>
      <span className="text-slate-800">.{tld}</span>
    </span>
  );
}

export function LinkCard({ result }) {
  const link = result.links?.[0];
  if (!link) return null;
  const days = link.registeredDays;

  return (
    <ResultCard title="Check the link" icon={Link2}>
      <p className="text-sm font-medium text-secondary">Message link (not clickable)</p>
      <p className="mt-1 break-all rounded-xl bg-[#ef4444]/10 px-3 py-2 text-sm leading-6 text-red-200">
        {defangUrl(link.url)}
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[#10b981]/10 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
            <CheckCircle2 size={16} aria-hidden="true" /> Expected
          </p>
          <p className="mt-1 break-words text-sm text-emerald-200">{link.expectedDomain}</p>
        </div>
        <div className="rounded-xl bg-[#ef4444]/10 p-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-300">
            <XCircle size={16} aria-hidden="true" /> Actual
          </p>
          <p className="mt-1 text-sm leading-6"><DomainLabel domain={link.actualDomain} /></p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-secondary">
        <Clock3 size={16} aria-hidden="true" />
        {days != null ? `Registered ${days} ${days === 1 ? 'day' : 'days'} ago` : result.linkAnalysis.domainAge}
      </p>
    </ResultCard>
  );
}

export function TechnicalDetails({ result }) {
  return (
    <details className="overflow-hidden rounded-2xl border border-[#374151] bg-[#1f2937] shadow-[0_4px_20px_-6px_rgba(0,0,0,0.5)]">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent sm:px-6">
        <span>
          <span className="block font-semibold text-ink">Technical details</span>
          <span className="text-sm text-secondary">Rule scores, message details, threat type</span>
        </span>
        <ChevronDown size={20} className="technical-chevron shrink-0 text-secondary transition-transform" aria-hidden="true" />
      </summary>
      <div className="space-y-5 border-t border-[#374151] px-5 py-4 font-mono text-sm sm:px-6">
        <section>
          <h3 className="mb-3 font-sans font-semibold text-ink">Rule scores</h3>
          <ul className="space-y-3">
            {result.indicators.map((indicator) => (
              <li key={indicator.id}>
                <div className="mb-1 flex justify-between gap-3 text-secondary">
                  <span>{indicator.ruleName}</span><span>{indicator.weight}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#0b0f19]">
                  <div className="h-full rounded-full" style={{ width: `${indicator.weight}%`, backgroundColor: getRisk(result).strong }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        {result.mitre && (
          <a
            href={result.mitre.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-indigo-400/40 bg-indigo-500/15 px-3 text-sm font-medium text-indigo-300 hover:bg-indigo-500/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            {result.mitre.id}: {result.mitre.label}
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
        <section>
          <h3 className="mb-2 font-sans font-semibold text-ink">Threat type</h3>
          <div className="flex flex-wrap gap-2">
            {[result.taxonomy.primary, result.taxonomy.secondary].filter(Boolean).map((tag) => (
              <span key={tag} className="rounded-full bg-[#0b0f19] px-3 py-1.5 text-xs text-secondary">{tag}</span>
            ))}
          </div>
        </section>
        <section>
          <h3 className="mb-2 font-sans font-semibold text-ink">Message details</h3>
          <dl className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
            {Object.entries(result.overview).map(([field, value]) => (
              <div key={field} className="min-w-0">
                <dt className="capitalize text-[#9ca3af]">{field}</dt>
                <dd className="break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </details>
  );
}
