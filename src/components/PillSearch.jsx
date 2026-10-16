import React, { useEffect, useRef } from 'react';
import { ArrowUp, Loader2, Search, X } from 'lucide-react';

export function PillSearch({ value, onChange, onSubmit, isAnalyzing, error }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="flex items-center gap-3 rounded-full bg-[#111827] border border-[#374151] px-6 py-4 text-lg shadow-[0_8px_40px_-12px_rgba(99,102,241,0.35)] transition-all duration-200 hover:border-[#4b5563] focus-within:border-indigo-500 focus-within:shadow-[0_8px_40px_-8px_rgba(99,102,241,0.5)]">
        <Search className="h-5 w-5 shrink-0 text-[#9ca3af]" aria-hidden="true" />
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={1600}
          spellCheck={false}
          placeholder="Let's expose scams..."
          aria-label="Message to scan"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'pill-search-error' : undefined}
          className="max-h-40 min-h-10 min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-lg leading-6 text-[#f9fafb] placeholder:text-[#9ca3af] outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#9ca3af] transition-colors hover:bg-white/5 hover:text-[#f9fafb] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isAnalyzing}
          aria-label={isAnalyzing ? 'Checking message' : 'Scan message'}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-500 text-white transition-colors hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isAnalyzing
            ? <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
            : <ArrowUp className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {error && (
        <p id="pill-search-error" role="alert" className="mt-2 text-center text-sm font-medium text-[#ef4444]">
          {error}
        </p>
      )}
    </div>
  );
}
