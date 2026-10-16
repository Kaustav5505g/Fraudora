import React from 'react';
import { Network, ExternalLink, Fingerprint, Link2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

/**
 * TaxonomyBadgeGroup — threat classification badges.
 * @param {{ taxonomy: { primary, secondary, mitre: { id, label, url } } }} props
 */
export function TaxonomyBadgeGroup({ taxonomy }) {
  return (
    <Card className="p-4 sm:p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border-soc pb-3 mb-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-crit/15 text-crit">
          <Network size={15} aria-hidden="true" />
        </span>
        <h2 className="text-xs font-mono uppercase tracking-widest text-ink/80">
          THREAT TAXONOMY
        </h2>
      </div>

      {/* Taxonomy rows */}
      <dl className="space-y-3">
        {/* Primary */}
        <div className="flex items-center gap-3 flex-wrap">
          <dt className="text-xs font-mono uppercase tracking-widest text-muted-dim w-20 shrink-0">
            Primary
          </dt>
          <dd>
            <Badge className="bg-crit/15 text-crit border border-crit/30 px-3 py-1.5 text-[13px]">
              <Fingerprint size={13} aria-hidden="true" />
              {taxonomy.primary}
            </Badge>
          </dd>
        </div>

        {/* Secondary */}
        <div className="flex items-center gap-3 flex-wrap">
          <dt className="text-xs font-mono uppercase tracking-widest text-muted-dim w-20 shrink-0">
            Secondary
          </dt>
          <dd>
            <Badge className="bg-warn/15 text-warn border border-warn/30 px-3 py-1.5 text-[13px]">
              <Link2 size={13} aria-hidden="true" />
              {taxonomy.secondary}
            </Badge>
          </dd>
        </div>

        {/* MITRE ATT&CK */}
        <div className="flex items-center gap-3 flex-wrap">
          <dt className="text-xs font-mono uppercase tracking-widest text-muted-dim w-20 shrink-0">
            MITRE
          </dt>
          <dd>
            <a
              href={taxonomy.mitre.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`MITRE ATT&CK ${taxonomy.mitre.id}: ${taxonomy.mitre.label} (opens in new tab)`}
              className="inline-flex items-center gap-1 rounded text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              <Badge className="bg-surface border border-border-soc px-3 py-1.5 text-[13px] text-accent hover:border-accent/50 transition-colors duration-150">
                {taxonomy.mitre.id}
                <ExternalLink size={12} />
              </Badge>
            </a>
          </dd>
        </div>
      </dl>
    </Card>
  );
}
