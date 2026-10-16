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
    suspended: 'Creates fear about losing account access.',
    immediately: 'Pressures the reader to act before verifying the message.',
    'unusual activity': 'Uses a vague security threat to trigger panic.',
  };
  return parts.map((part, i) =>
    matchRegex.test(part) ? (
      <mark
        key={i}
        title={reasons[part.toLowerCase()] || `Flagged risk term: ${part}. Review for social-engineering cues.`}
        className="bg-crit/20 text-red-200 border-b border-crit/60 rounded-sm px-0.5 not-italic shadow-[0_0_12px_-2px_#EF4444]"
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
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header with legend */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-border-soc pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-crit/15 text-crit">
            <ScanText size={15} aria-hidden="true" />
          </span>
          <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
            PAYLOAD FORENSICS
          </h2>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block w-3 h-3 rounded-sm bg-crit/20 border border-crit/40"
          />
          <span className="text-xs font-mono text-muted-dim uppercase tracking-widest">
            {highlightTerms.length} FLAGGED
          </span>
        </div>
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
      className="inline-flex items-center gap-1.5 my-0.5 mx-0.5 px-2 py-0.5 rounded border border-crit/50 bg-crit/10 font-mono text-[12px] text-red-300 break-all"
      aria-label={`Defanged URL: ${url}`}
    >
      <Link2 size={11} className="shrink-0 text-crit/70" />
      <span className="break-all">{url}</span>
      <span className="ml-1 shrink-0 text-[9px] font-mono uppercase tracking-widest border border-crit/30 text-crit/70 px-1 rounded">
        DEFANGED
      </span>
    </span>
  );
}
