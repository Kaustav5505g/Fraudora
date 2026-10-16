import React, { useRef, useEffect, useMemo } from 'react';
import { AlertCircle, Eraser } from 'lucide-react';

const MAX_LEN = 1600;
const WARN_THRESHOLD = 0.9;
const URL_REGEX = /https?:\/\/[^\s]+/g;

/**
 * Compute the number of 160-char GSM segments for a message.
 * >160 chars splits into 153-char parts (UDH overhead).
 */
function calcSegments(len) {
  if (len === 0) return 1;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
}

/** Extract all URLs from a string */
function extractUrls(text) {
  return [...text.matchAll(URL_REGEX)].map((m) => m[0]);
}

/**
 * PayloadInputBox — terminal-console styled input with:
 *  - Title bar (dots + filename + encoding)
 *  - Line-number gutter (synced scroll)
 *  - Blinking prompt overlay when empty+unfocused
 *  - 4 corner bracket decorations
 *  - Live readout strip
 *  - Sweep animation while analyzing
 *
 * @param {{
 *   payload: string,
 *   onChange: (val: string) => void,
 *   error: string | null,
 *   onClear: () => void,
 *   isAnalyzing: boolean,
 * }} props
 */
export function PayloadInputBox({ payload, onChange, error, onClear, isAnalyzing }) {
  const textareaRef = useRef(null);
  const gutterRef = useRef(null);
  const [focused, setFocused] = React.useState(false);

  const len = payload.length;
  const isNearLimit = len >= MAX_LEN * WARN_THRESHOLD;
  const isAtLimit = len >= MAX_LEN;

  // Sync gutter scroll to textarea scroll
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const sync = () => {
      if (gutterRef.current) gutterRef.current.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('scroll', sync);
    return () => ta.removeEventListener('scroll', sync);
  }, []);

  // Line numbers — count newlines in payload, minimum 12 lines shown
  const lineNumbers = useMemo(() => {
    const count = Math.max(payload.split('\n').length, 12);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [payload]);

  // Live readout
  const urls = useMemo(() => extractUrls(payload), [payload]);
  const segments = calcSegments(len);

  function handleChange(e) {
    onChange(e.target.value);
  }

  // Defang a URL for the readout chip (truncate at 30 chars)
  function defang(url) {
    const short = url.length > 32 ? url.slice(0, 30) + '…' : url;
    return short.replace('://', '[://]');
  }

  const showPrompt = !focused && payload.length === 0;

  return (
    <div className="space-y-1.5">
      {/* ── Label row ── */}
      <div className="flex items-center justify-between">
        <label htmlFor="payload-input" className="text-[11px] font-mono uppercase tracking-widest text-muted-dim">
          INPUT PAYLOAD
        </label>
        <div className="flex items-center gap-3">
          {payload.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear payload"
              className="flex items-center gap-1 text-[11px] font-mono text-muted-dim hover:text-muted transition-colors duration-150"
            >
              <Eraser size={12} />
              CLEAR
            </button>
          )}
          <span
            className={`text-[11px] font-mono tabular-nums transition-colors duration-150
              ${isAtLimit ? 'text-crit' : isNearLimit ? 'text-warn' : 'text-muted-dim'}`}
            aria-live="polite"
            aria-label={`${len} of ${MAX_LEN} characters`}
          >
            {len} / {MAX_LEN}
          </span>
        </div>
      </div>

      {/* ── Terminal console container ── */}
      <div className="relative">
        {/* Corner brackets — purely decorative, L-shaped 12px borders */}
        {[
          'top-0 left-0 border-t border-l',
          'top-0 right-0 border-t border-r',
          'bottom-0 left-0 border-b border-l',
          'bottom-0 right-0 border-b border-r',
        ].map((pos, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`absolute w-3 h-3 border-muted-dim/50 pointer-events-none z-10 ${pos}`}
          />
        ))}

        <div
          className={`rounded-lg border overflow-hidden transition-colors duration-150
            ${error ? 'border-crit/60' : isAnalyzing ? 'border-muted-dim/60' : 'border-border-soc hover:border-muted-dim/60'}
            ${focused ? 'ring-1 ring-muted-dim/60' : ''}`}
        >
          {/* ── Title bar ── */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0B0D11] border-b border-border-soc">
            {/* Traffic-light dots */}
            <div className="flex items-center gap-1.5">
              {['bg-[#3A3A3A]', 'bg-[#3A3A3A]', 'bg-[#3A3A3A]'].map((c, i) => (
                <span key={i} aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${c}`} />
              ))}
              <span className="ml-2 font-mono text-[11px] text-muted-dim tracking-widest">
                payload.txt
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-dim tracking-widest">UTF-8</span>
          </div>

          {/* ── Editor row: gutter + textarea ── */}
          <div className="relative flex bg-[#0B0D11]">
            {/* Line-number gutter */}
            <div
              ref={gutterRef}
              aria-hidden="true"
              className="select-none overflow-hidden flex-shrink-0 w-10 pt-3 pb-3 text-right pr-2 border-r border-border-soc bg-[#0B0D11]"
              style={{ fontFamily: 'inherit', fontSize: '13px', lineHeight: '1.625rem' }}
            >
              {lineNumbers.map((n) => (
                <div key={n} className="font-mono text-[11px] text-muted-dim/50 leading-[1.625rem]">
                  {n}
                </div>
              ))}
            </div>

            {/* Sweep animation overlay */}
            {isAnalyzing && (
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none overflow-hidden z-10 rounded-none"
              >
                <div className="sweep-animate absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-crit/10 to-transparent" />
              </div>
            )}

            {/* Blinking prompt overlay — visible when empty + not focused */}
            {showPrompt && (
              <div
                aria-hidden="true"
                className="absolute left-12 top-3 font-mono text-[13px] text-muted-dim/50 pointer-events-none select-none leading-[1.625rem] flex items-start gap-1"
              >
                <span className="text-crit/60">{'>'}</span>
                <span>Paste a message to analyze</span>
                <span className="inline-block w-[7px] h-[14px] bg-muted-dim/40 animate-[blink_1s_step-end_infinite] motion-reduce:animate-none self-start mt-[5px]" />
              </div>
            )}

            <textarea
              ref={textareaRef}
              id="payload-input"
              value={payload}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={MAX_LEN}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'payload-error' : 'payload-readout'}
              className="flex-1 min-h-[200px] resize-y bg-transparent px-3 py-3
                font-mono text-[13px] text-ink leading-[1.625rem]
                placeholder:text-transparent outline-none border-none
                min-w-0"
              style={{ tabSize: 2 }}
            />
          </div>
        </div>
      </div>

      {/* ── Validation error ── */}
      {error && (
        <div
          id="payload-error"
          role="alert"
          className="flex items-start gap-2 text-[12px] font-mono text-crit animate-fade-in"
        >
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Live readout strip ── */}
      <div
        id="payload-readout"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 px-2 py-1.5 rounded border border-border-soc bg-[#0B0D11]"
        aria-live="polite"
        aria-label="Message statistics"
      >
        <ReadoutItem label="CHARS" value={`${len}/${MAX_LEN}`} warn={isNearLimit} crit={isAtLimit} />
        <ReadoutDivider />
        <ReadoutItem label="SEGMENTS" value={`${segments} (160/seg)`} />
        <ReadoutDivider />
        <ReadoutItem label="URLS" value={`${urls.length}`} crit={urls.length > 0} />
        <ReadoutDivider />
        <ReadoutItem label="LANG" value="en-GB" />

        {/* Defanged URL chips */}
        {urls.map((url, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-crit/40 bg-crit/10 font-mono text-[10px] text-red-300 break-all max-w-[200px]"
            title={`Defanged URL: ${url}`}
          >
            <span className="truncate">{defang(url)}</span>
            <span className="shrink-0 border border-crit/30 text-crit/60 text-[9px] px-0.5 rounded tracking-widest">DEFANGED</span>
          </span>
        ))}
      </div>

      {/* Blink keyframe */}
      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}

function ReadoutItem({ label, value, warn, crit }) {
  const valClass = crit ? 'text-crit' : warn ? 'text-warn' : 'text-ink';
  return (
    <span className="flex items-center gap-1 font-mono text-[10px] tracking-widest whitespace-nowrap">
      <span className="text-muted-dim">{label}</span>
      <span className={valClass}>{value}</span>
    </span>
  );
}

function ReadoutDivider() {
  return <span aria-hidden="true" className="text-border-soc font-mono text-[10px] select-none">·</span>;
}
