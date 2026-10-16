import React from 'react';
import { LockKeyhole } from 'lucide-react';

export function HeroHeader() {
  return (
    <section className="space-y-3 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        Got a suspicious message?
      </h1>
      <p className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary">
        <LockKeyhole size={15} aria-hidden="true" />
        We don&apos;t store your messages.
      </p>
    </section>
  );
}
