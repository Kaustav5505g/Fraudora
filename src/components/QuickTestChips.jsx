import React from 'react';
import {
  Briefcase,
  Landmark,
  Package,
  ShieldCheck,
  Zap,
  IndianRupee,
} from 'lucide-react';
import { SAMPLES } from '../data/mockData';

const ICON_MAP = { Landmark, IndianRupee, Zap, Package, Briefcase, ShieldCheck };
const SAMPLE_NAMES = {
  sbi_kyc: 'Bank KYC',
  upi_refund: 'UPI refund',
  electricity: 'Electricity bill',
  courier_fee: 'Courier fee',
  fake_job: 'Job offer',
  genuine_otp: 'Real OTP',
};

export function QuickTestChips({ activeSampleId, onSelect }) {
  return (
    <section aria-labelledby="sample-heading" className="space-y-2">
      <h2 id="sample-heading" className="text-sm font-medium text-secondary">
        Or try an example
      </h2>
      <div className="flex flex-wrap gap-2">
        {SAMPLES.map(({ id, label, icon, payload }) => {
          const Icon = ICON_MAP[icon] ?? ShieldCheck;
          const selected = activeSampleId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(payload, id)}
              aria-label={`Try example: ${label}`}
              aria-pressed={selected}
              className={`flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected
                  ? 'border-indigo-200 bg-indigo-50 text-accent'
                  : 'border-slate-300 bg-white text-secondary hover:border-indigo-300 hover:bg-indigo-50/60'
              }`}
            >
              <Icon size={16} aria-hidden="true" />
              {SAMPLE_NAMES[id] || label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
