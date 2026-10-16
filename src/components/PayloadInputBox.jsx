import React from 'react';
import { AlertCircle, Eraser } from 'lucide-react';

const MAX_LEN = 1600;
const WARN_THRESHOLD = 0.9; // 90% of max

/**
 * PayloadInputBox — labeled textarea with validation, char counter, and clear button.
 * @param {{
 *   payload: string,
 *   onChange: (val: string) => void,
 *   error: string | null,
 *   onClear: () => void,
 * }} props
 */
export function PayloadInputBox({ payload, onChange, error, onClear }) {
  const len = payload.length;
  const isNearLimit = len >= MAX_LEN * WARN_THRESHOLD;
  const isAtLimit = len >= MAX_LEN;

  function handleChange(e) {
    onChange(e.target.value);
  }

  return (
    <div className="space-y-1.5">
      {/* ── Label row ── */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="payload-input"
          className="text-[11px] font-mono uppercase tracking-widest text-muted-dim"
        >
          INPUT PAYLOAD
        </label>
        <div className="flex items-center gap-3">
          {/* Clear button — visible only when payload is non-empty */}
          {payload.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Clear payload"
              className="flex items-center gap-1 text-[11px] font-mono text-muted-dim hover:text-muted transition-colors duration-150"
            >
              <Eraser size={12} />
              <span>CLEAR</span>
            </button>
          )}
          {/* Character counter */}
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

      {/* ── Textarea ── */}
      <textarea
        id="payload-input"
        value={payload}
        onChange={handleChange}
        maxLength={MAX_LEN}
        rows={8}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? 'payload-error' : undefined}
        placeholder="Paste an SMS, WhatsApp, or email message to analyze..."
        className={`w-full min-h-[200px] resize-y rounded-lg border bg-[#0B0D11] px-4 py-3
          font-mono text-[13px] text-ink placeholder:text-muted-dim
          transition-colors duration-150 outline-none
          focus:border-muted-dim focus:ring-1 focus:ring-muted-dim
          ${error ? 'border-crit/60' : 'border-border-soc hover:border-muted-dim'}`}
      />

      {/* ── Inline validation error ── */}
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
    </div>
  );
}
