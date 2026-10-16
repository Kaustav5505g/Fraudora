/**
 * Fraudora demonstration data. Results and telemetry in this module are static.
 */

export const SHOW_DEMO_STATS = false;

export const RISK_LEVELS = {
  safe: {
    label: 'SAFE',
    shortLabel: 'LOW',
    tint: '#ECFDF5',
    border: '#A7F3D0',
    strong: '#059669',
    color: '#059669',
    colorClass: 'text-safe',
    bgClass: 'bg-[#ECFDF5]',
    borderClass: 'border-[#A7F3D0]',
    dotClass: 'bg-safe',
    badgeClass: 'bg-[#ECFDF5] text-safe border border-[#A7F3D0]',
  },
  suspicious: {
    label: 'SUSPICIOUS',
    shortLabel: 'MED',
    tint: '#FFFBEB',
    border: '#FDE68A',
    strong: '#D97706',
    color: '#D97706',
    colorClass: 'text-warn',
    bgClass: 'bg-[#FFFBEB]',
    borderClass: 'border-[#FDE68A]',
    dotClass: 'bg-warn',
    badgeClass: 'bg-[#FFFBEB] text-warn border border-[#FDE68A]',
  },
  critical: {
    label: 'HIGH RISK',
    shortLabel: 'HIGH',
    tint: '#FEF2F2',
    border: '#FECACA',
    strong: '#DC2626',
    color: '#DC2626',
    colorClass: 'text-crit',
    bgClass: 'bg-[#FEF2F2]',
    borderClass: 'border-[#FECACA]',
    dotClass: 'bg-crit',
    badgeClass: 'bg-[#FEF2F2] text-crit border border-[#FECACA]',
  },
};

export const ATTACK_ANATOMY = [
  {
    step: '01',
    title: 'IMPERSONATE',
    description: 'Poses as SBI',
    icon: 'Landmark',
    severity: 'critical',
  },
  {
    step: '02',
    title: 'PANIC',
    description: 'Claims your account will be blocked',
    icon: 'AlertTriangle',
    severity: 'critical',
  },
  {
    step: '03',
    title: 'URGENCY',
    description: 'Pushes for immediate verification',
    icon: 'Timer',
    severity: 'suspicious',
  },
  {
    step: '04',
    title: 'TRAP',
    description: 'Fake link captures banking details',
    icon: 'Link2',
    severity: 'critical',
  },
];

export const SAMPLES = [
  {
    id: 'sbi_kyc',
    label: 'SBI KYC Block',
    icon: 'Landmark',
    risk: 'critical',
    payload:
      'VK-SBIINB: Your SBI account will be blocked today due to incomplete KYC. Verify immediately to keep your account active: https://sbi-kyc-update.secure-l0gin.in/verify',
  },
  {
    id: 'upi_refund',
    label: 'UPI Refund Link',
    icon: 'IndianRupee',
    risk: 'critical',
    payload:
      'UPI REFUND: Your payment refund of Rs 4,999 is pending. Claim it now by verifying your UPI PIN: https://upi-refund.claim-secure.in/receive',
  },
  {
    id: 'electricity',
    label: 'Electricity Disconnection',
    icon: 'Zap',
    risk: 'critical',
    payload:
      'URGENT: Your electricity connection will be disconnected tonight due to an unpaid bill. Pay immediately to avoid disconnection: https://electricity-bill.pay-now-india.in',
  },
  {
    id: 'courier_fee',
    label: 'Courier Customs Fee',
    icon: 'Package',
    risk: 'suspicious',
    payload:
      'DELIVERY ALERT: Your parcel is held at customs. Pay Rs 45 clearance fee today to avoid return: https://parcel-customs-fee.track-delivery.in/pay',
  },
  {
    id: 'fake_job',
    label: 'Fake Job Offer',
    icon: 'Briefcase',
    risk: 'suspicious',
    payload:
      'Congratulations! You are selected for a work-from-home job with salary Rs 45,000/month. Pay a refundable Rs 999 registration fee now to confirm your position.',
  },
  {
    id: 'genuine_otp',
    label: 'Real OTP',
    icon: 'ShieldCheck',
    risk: 'safe',
    payload:
      'VK-SBIINB: Your SBI OTP is 847291. Do not share this OTP with anyone, including bank staff. Valid for 10 minutes.',
  },
];

export const RECENT_SCANS = [
  { id: 'rs-001', time: '01:44:12', sender: 'VK-SBIINB', score: 88, riskLevel: 'critical' },
  { id: 'rs-002', time: '01:31:07', sender: '+91 98765 43210', score: 54, riskLevel: 'suspicious' },
  { id: 'rs-003', time: '01:18:55', sender: 'UPI-REFUND', score: 79, riskLevel: 'critical' },
  { id: 'rs-004', time: '01:02:33', sender: 'AD-AIRTEL', score: 7, riskLevel: 'safe' },
];

const SAMPLE_BY_ID = Object.fromEntries(SAMPLES.map((sample) => [sample.id, sample]));

function createResult({
  sampleId,
  score,
  riskLevel,
  carrier,
  source,
  indicators,
  highlightTerms,
  normalizedDomain,
  reputation,
  domainAge,
  registrar,
  directive,
  explanation,
  countermeasures,
  primary,
  secondary,
  steps,
  anatomy = [],
  expectedDomain,
  mitre,
}) {
  const payload = SAMPLE_BY_ID[sampleId].payload;
  const links = [...payload.matchAll(/https?:\/\/[^\s]+/g)].map(([url]) => ({
    url,
    actualDomain: normalizedDomain,
    expectedDomain: expectedDomain || 'Official service website',
    registeredDays: Number.parseInt(domainAge, 10) || null,
  }));
  const result = {
    messageId: `msg_${sampleId.toUpperCase()}_DEMO`,
    score,
    riskLevel,
    payload,
    overview: {
      encoding: 'UTF-8',
      segments: '1 / 1',
      language: 'en-IN',
      carrier,
      direction: 'Inbound',
      source,
    },
    indicators,
    taxonomy: {
      primary,
      secondary,
      mitre: {
        id: riskLevel === 'safe' ? 'T1036' : 'T1566.002',
        label: riskLevel === 'safe' ? 'Masquerading' : 'Phishing: Spearphishing Link',
        url: riskLevel === 'safe'
          ? 'https://attack.mitre.org/techniques/T1036/'
          : 'https://attack.mitre.org/techniques/T1566/002/',
      },
    },
    linkAnalysis: {
      normalizedDomain,
      reputation,
      domainAge,
      registrar,
    },
    links,
    anatomy,
    guidance: {
      directive,
      explanation,
      countermeasures,
      steps: steps || countermeasures,
    },
    highlightTerms,
  };
  if (mitre) result.mitre = mitre;
  return result;
}

const SBI_RESULT = createResult({
  sampleId: 'sbi_kyc',
  score: 88,
  riskLevel: 'critical',
  carrier: 'Jio',
  source: 'VK-SBIINB',
  indicators: [
    { id: 'domain-age', severity: 'critical', ruleName: 'Newly registered domain', explanation: 'A new domain can be disposable phishing infrastructure.', weight: 25 },
    { id: 'brand-spoof', severity: 'critical', ruleName: 'Bank brand impersonation', explanation: 'The sender claims to represent SBI but the link is not an official SBI domain.', weight: 22 },
    { id: 'credential-request', severity: 'critical', ruleName: 'Credential-harvesting link', explanation: 'The message directs the recipient to a lookalike sign-in page.', weight: 20 },
    { id: 'urgency', severity: 'suspicious', ruleName: 'Manufactured urgency', explanation: 'Threats of account blocking pressure the recipient to act without checking.', weight: 21 },
  ],
  highlightTerms: ['blocked', 'KYC', 'immediately'],
  normalizedDomain: 'sbi-kyc-update.secure-l0gin.in',
  reputation: 'Typosquatting / Brand impersonation',
  domainAge: '4 days old',
  registrar: 'Mock domain record',
  directive: 'Do not click the link. Call 1930.',
  explanation: 'This message impersonates SBI and threatens an account block to rush you into a fake KYC page. Do not share account details or OTPs. Report the incident at cybercrime.gov.in or call 1930.',
  countermeasures: [
    'Do not tap the link or share an OTP, PIN, or password.',
    'Contact SBI using the number on your card or its official app.',
    'Report the message at cybercrime.gov.in or call 1930.',
  ],
  steps: [
    'Do not open the link or share your OTP, PIN, or password.',
    'Contact SBI through its official app or the number on your card.',
    'Report the message at cybercrime.gov.in or call 1930.',
  ],
  anatomy: [
    { step: '01', title: 'Poses as SBI', description: 'Uses a bank sender name to appear trustworthy.', icon: 'Landmark' },
    { step: '02', title: 'Creates fear', description: 'Threatens to block your account over KYC.', icon: 'AlertTriangle' },
    { step: '03', title: 'Adds pressure', description: 'Demands that you verify immediately.', icon: 'Timer' },
    { step: '04', title: 'Steals details', description: 'A lookalike page asks for banking information.', icon: 'Link2' },
  ],
  expectedDomain: 'sbi.co.in',
  mitre: { id: 'T1566.002', label: 'Phishing: Spearphishing Link', url: 'https://attack.mitre.org/techniques/T1566/002/' },
  primary: 'Social Engineering',
  secondary: 'Potential Phishing',
});

export const MOCK_RESULTS = {
  sbi_kyc: SBI_RESULT,
  upi_refund: createResult({
    sampleId: 'upi_refund',
    score: 84,
    riskLevel: 'critical',
    carrier: 'Airtel',
    source: 'UPI-REFUND',
    indicators: [
      { id: 'upi-pin', severity: 'critical', ruleName: 'UPI PIN solicitation', explanation: 'A refund never requires sharing a UPI PIN.', weight: 30 },
      { id: 'fake-refund', severity: 'critical', ruleName: 'Unsolicited refund claim', explanation: 'The unexpected refund offer is used to lure recipients into a payment flow.', weight: 25 },
      { id: 'lookalike-link', severity: 'critical', ruleName: 'Unverified payment domain', explanation: 'The claim link is not an official bank or payment-service domain.', weight: 29 },
    ],
    highlightTerms: ['refund', 'UPI PIN', 'Claim it now'],
    normalizedDomain: 'upi-refund.claim-secure.in',
    reputation: 'Unverified payment domain',
    domainAge: '12 days old',
    registrar: 'Mock domain record',
    directive: 'DO NOT CLICK LINK. Call 1930.',
    explanation: 'This message offers an unsolicited UPI refund and asks for a PIN. Never enter a UPI PIN to receive money. Report suspicious financial messages at cybercrime.gov.in or call 1930.',
    countermeasures: ['Do not open the link or share your UPI PIN.', 'Check transactions in your official UPI app.', 'Report the message at cybercrime.gov.in or call 1930.'],
    primary: 'Payment Fraud',
    secondary: 'UPI Refund Scam',
  }),
  electricity: createResult({
    sampleId: 'electricity',
    score: 79,
    riskLevel: 'critical',
    carrier: 'Vi',
    source: 'AD-POWERBILL',
    indicators: [
      { id: 'disconnection-threat', severity: 'critical', ruleName: 'Disconnection threat', explanation: 'A same-day cutoff threat creates pressure to pay quickly.', weight: 27 },
      { id: 'urgent-payment', severity: 'critical', ruleName: 'Urgent payment demand', explanation: 'The recipient is pushed to pay through an unverified page.', weight: 26 },
      { id: 'unknown-domain', severity: 'critical', ruleName: 'Unverified utility domain', explanation: 'The destination is not verified as the utility provider’s official site.', weight: 26 },
    ],
    highlightTerms: ['disconnected tonight', 'Pay immediately', 'disconnection'],
    normalizedDomain: 'electricity-bill.pay-now-india.in',
    reputation: 'Unverified utility payment domain',
    domainAge: '9 days old',
    registrar: 'Mock domain record',
    directive: 'DO NOT CLICK LINK. Call 1930.',
    explanation: 'The message uses a threatened electricity cutoff to rush payment to an unverified website. Confirm bills only through your electricity provider’s official channels. Report suspected fraud at cybercrime.gov.in or call 1930.',
    countermeasures: ['Do not pay through the message link.', 'Verify the bill with your electricity provider.', 'Report the message at cybercrime.gov.in or call 1930.'],
    primary: 'Social Engineering',
    secondary: 'Utility Payment Scam',
  }),
  courier_fee: createResult({
    sampleId: 'courier_fee',
    score: 63,
    riskLevel: 'suspicious',
    carrier: 'Airtel',
    source: '+91 91234 56780',
    indicators: [
      { id: 'unexpected-fee', severity: 'suspicious', ruleName: 'Unexpected customs fee', explanation: 'A small fee can be used to collect card or UPI details.', weight: 28 },
      { id: 'delivery-pressure', severity: 'suspicious', ruleName: 'Delivery urgency', explanation: 'The deadline encourages a quick payment without verifying shipment status.', weight: 22 },
    ],
    highlightTerms: ['held at customs', 'Pay Rs 45', 'today'],
    normalizedDomain: 'parcel-customs-fee.track-delivery.in',
    reputation: 'Unverified courier domain',
    domainAge: '18 days old',
    registrar: 'Mock domain record',
    directive: 'VERIFY THE COURIER FIRST.',
    explanation: 'Unexpected customs or delivery fees can be used to steal payment details. Check the shipment using the courier’s official website or app before paying.',
    countermeasures: ['Do not pay through the message link.', 'Check the tracking number through the courier’s official channel.', 'Report suspected fraud at cybercrime.gov.in or call 1930.'],
    primary: 'Social Engineering',
    secondary: 'Courier Fee Scam',
  }),
  fake_job: createResult({
    sampleId: 'fake_job',
    score: 58,
    riskLevel: 'suspicious',
    carrier: 'Jio',
    source: '+91 99876 54321',
    indicators: [
      { id: 'upfront-fee', severity: 'suspicious', ruleName: 'Upfront job fee', explanation: 'Legitimate employers do not require a refundable fee to secure a job.', weight: 31 },
      { id: 'unverified-offer', severity: 'suspicious', ruleName: 'Unverified employment offer', explanation: 'A high salary and instant selection are offered without a verifiable hiring process.', weight: 27 },
    ],
    highlightTerms: ['selected', 'Rs 45,000', 'registration fee'],
    normalizedDomain: 'No link detected',
    reputation: 'No embedded link',
    domainAge: 'Not applicable',
    registrar: 'Not applicable',
    directive: 'DO NOT PAY AN UPFRONT FEE.',
    explanation: 'The message promises a job and asks for a registration fee. Verify openings directly with the employer and never pay to secure an offer.',
    countermeasures: ['Do not send money or identity documents.', 'Verify the employer through its official careers page.', 'Report suspected fraud at cybercrime.gov.in or call 1930.'],
    primary: 'Employment Fraud',
    secondary: 'Job Fee Scam',
  }),
  genuine_otp: createResult({
    sampleId: 'genuine_otp',
    score: 4,
    riskLevel: 'safe',
    carrier: 'Jio',
    source: 'VK-SBIINB',
    indicators: [],
    highlightTerms: [],
    normalizedDomain: 'No link detected',
    reputation: 'No embedded link',
    domainAge: 'Not applicable',
    registrar: 'Not applicable',
    directive: 'Looks legitimate. Never share this OTP with anyone.',
    explanation: 'This sample is an informational one-time password message and explicitly warns against sharing the code. Verify unexpected activity through the official SBI app or number.',
    countermeasures: ['Never share an OTP with anyone.', 'Use the code only for an action you initiated.', 'Contact SBI through official channels if you did not request it.'],
    primary: 'Bank Notification',
    secondary: 'One-Time Password',
  }),
};

/** Default forensic result shown before a sample scan. */
export const SCAN_RESULT = MOCK_RESULTS.sbi_kyc;

/**
 * MOCK, replace with API call.
 * Match an exact built-in sample payload; unknown messages use the SBI demo result.
 */
export async function analyzeMessage(payload) {
  const sample = SAMPLES.find((item) => item.payload === payload);
  const result = sample ? MOCK_RESULTS[sample.id] : MOCK_RESULTS.sbi_kyc;
  return new Promise((resolve) => setTimeout(() => resolve(result), 1800));
}
