import React from 'react';
import { AlertCircle, Eraser } from 'lucide-react';

const MAX_LEN = 1600;

export function PayloadInputBox({ payload, onChange, error, onClear, isAnalyzing }) {
  const length = payload.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-accent hover:text-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            >
              <Eraser size={15} aria-hidden="true" />
              Clear
            </button>
          )}
          <span
            className="text-sm tabular-nums text-secondary"
            aria-live="polite"
            aria-label={`${length} of ${MAX_LEN} characters`}
          >
            {length} / {MAX_LEN}
          </span>
        </div>
      </div>
      <textarea
        id="payload-input"
        aria-label="Your message"
        value={payload}
        onChange={(event) => onChange(event.target.value)}
        maxLength={MAX_LEN}
        spellCheck
        autoComplete="off"
        aria-busy={isAnalyzing}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'payload-error' : undefined}
        placeholder="Paste the SMS or WhatsApp message here..."
        className="min-h-40 w-full resize-y rounded-2xl border border-[#374151] bg-[#1f2937] px-4 py-3 font-mono text-base leading-6 text-ink placeholder:font-sans placeholder:text-[#9ca3af] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
      />
      {error && (
        <p id="payload-error" role="alert" className="flex items-center gap-2 text-sm font-medium text-crit">
          <AlertCircle size={17} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
