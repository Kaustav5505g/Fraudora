import React, { useMemo } from 'react';
import { ScanText, Link2 } from 'lucide-react';
import { Card } from './ui/Card';

/**
 * highlightPayload — pure helper that splits text by highlight terms and wraps
 * matches in <mark> with semi-transparent red styling.
 * Never uses dangerouslySetInnerHTML; builds React elements from string parts.
 *
 * @param {string} text - the raw message payload
 * @param {string[]} terms - case-insensitive terms to highlight
 * @returns {Array<string | JSX.Element>}
 */
export function highlightPayload(text, terms) {
  if (!terms || terms.length === 0) return [text];

  // Build a case-insensitive alternation regex from escaped terms
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

  const parts = text.split(regex);
  // After split with a capture group regex, even-indexed parts are text, odd-indexed are matches.
  // We verify with a fresh non-global regex to avoid lastIndex drift.
  const matchRegex = new RegExp(`^(?:${escaped.join('|')})$`, 'i');
  const reasons = {
    blocked: 'Threatens account access to create fear.',
    kyc: 'Uses a KYC pretext to request account details.',
    immediately: 'Pressures the reader to act before verifying the message.',
    refund: 'Uses an unexpected refund to lure the reader into a payment flow.',
    'upi pin': 'A legitimate refund does not require a UPI PIN.',
    'claim it now': 'Pressures the reader to act without verifying the refund.',
    'disconnected tonight': 'Uses a service-disconnection threat to create urgency.',
    'pay immediately': 'Pressures the recipient to pay without verifying the bill.',
    disconnection: 'Uses a service-disconnection threat to create urgency.',
    'held at customs': 'Uses a delivery problem to prompt an unexpected payment.',
    'pay rs 45': 'Requests a fee through an unverified message link.',
    today: 'Uses a deadline to discourage verification.',
    selected: 'An unexpected job selection may be a pretext for fees.',
    'rs 45,000': 'An unusually attractive offer can be used to lure applicants.',
    'registration fee': 'Legitimate employers should not charge a fee to secure a job.',
  };
  return parts.map((part, i) =>
    matchRegex.test(part) ? (
      <mark
        key={i}
        title={reasons[part.toLowerCase()] || `Flagged risk term: ${part}. Review for social-engineering cues.`}
        className="risk-highlight rounded-sm border-b px-0.5 not-italic"
      >
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * Splits message into text segments and defanged URL segments.
 * Returns array of { type: 'text' | 'url', content: string }.
 */
function parseSegments(text) {
  // Detect URLs (http/https)
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = [];
  let lastIdx = 0;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', content: text.slice(lastIdx, match.index) });
    }
    parts.push({ type: 'url', content: match[0] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIdx) });
  }
  return parts;
}

/**
 * PayloadForensicView — highlighted payload with defanged URL block.
 * @param {{ payload: string, highlightTerms: string[] }} props
 */
export function PayloadForensicView({ payload, highlightTerms }) {
  const segments = useMemo(() => parseSegments(payload), [payload]);

  return (
    <Card className="p-4 space-y-3">
      {/* Header with legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border-soc pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-risk-soft text-risk">
            <ScanText size={15} aria-hidden="true" />
          </span>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            PAYLOAD FORENSICS
          </h2>
        </div>
        {highlightTerms.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm border risk-highlight" />
            <span className="text-xs font-mono text-muted-dim uppercase tracking-widest">
              {highlightTerms.length} FLAGGED
            </span>
          </div>
        )}
      </div>

      {/* Payload inset */}
      <div className="rounded-md border border-border-soc bg-[#0B0D11] px-4 py-3">
        <p className="font-mono text-[15px] text-ink/90 leading-7 whitespace-pre-wrap break-words">
          {segments.map((seg, idx) => {
            if (seg.type === 'url') {
              return <DefangedUrl key={idx} url={seg.content} />;
            }
            // Apply highlight to text segments
            return <TextSegment key={idx} text={seg.content} terms={highlightTerms} />;
          })}
        </p>
        {highlightTerms.length === 0 && (
          <p className="mt-3 border-t border-border-soc pt-3 text-sm font-mono text-safe">
            No manipulation tactics detected
          </p>
        )}
      </div>
    </Card>
  );
}

/** Applies highlight marks to a text segment */
function TextSegment({ text, terms }) {
  const parts = useMemo(() => highlightPayload(text, terms), [text, terms]);
  return <>{parts}</>;
}

/** Non-clickable defanged URL with safety indicator */
function DefangedUrl({ url }) {
  return (
    <span
      title="Link disabled for safety"
      className="risk-highlight inline-flex items-center gap-1.5 my-0.5 mx-0.5 rounded border px-2 py-0.5 font-mono text-xs break-all"
      aria-label={`Defanged URL: ${url}`}
    >
      <Link2 size={11} className="shrink-0 text-risk" />
      <span className="break-all">{url}</span>
      <span className="ml-1 shrink-0 rounded border border-current px-1 text-[9px] font-mono uppercase tracking-widest text-risk">
        DEFANGED
      </span>
    </span>
  );
}
