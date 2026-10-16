import React from 'react';
import { FileText, ArrowDownLeft } from 'lucide-react';
import { Card } from './ui/Card';

/** Shared field label style */
const FieldLabel = ({ children }) => (
  <dt className="text-xs font-mono uppercase tracking-widest text-muted-dim">
    {children}
  </dt>
);

/** Shared field value style */
const FieldValue = ({ children, className = '' }) => (
  <dd className={`font-mono text-[15px] text-ink/90 mt-0.5 min-w-0 break-words ${className}`}>
    {children}
  </dd>
);

/**
 * MessageOverviewCard — key/value grid of message metadata.
 * @param {{ overview: object }} props
 */
export function MessageOverviewCard({ overview }) {
  const fields = [
    { label: 'Encoding', value: overview.encoding },
    { label: 'Segments', value: overview.segments },
    { label: 'Language', value: overview.language },
    { label: 'Carrier', value: overview.carrier },
    {
      label: 'Direction',
      value: (
        <span className="flex items-center gap-1">
          <ArrowDownLeft size={12} className="text-muted-dim" />
          {overview.direction}
        </span>
      ),
    },
    { label: 'Source', value: overview.source },
  ];

  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/15 text-accent">
          <FileText size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          MESSAGE OVERVIEW
        </h2>
      </div>

      {/* Grid */}
      <dl className="grid grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-4">
        {fields.map(({ label, value }) => (
          <div key={label} className="min-w-0">
            <FieldLabel>{label}</FieldLabel>
            <FieldValue>{value}</FieldValue>
          </div>
        ))}
      </dl>
    </Card>
  );
}
