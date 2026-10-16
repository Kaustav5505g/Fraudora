/**
 * mockData.js — Fraudora static mock data.
 *
 * Expected SCAN_RESULT shape (mirrors future API response):
 * {
 *   messageId: string,
 *   score: number (0–100),
 *   riskLevel: 'safe' | 'suspicious' | 'critical',
 *   overview: { encoding, segments, language, carrier, direction, source },
 *   indicators: Array<{ id, severity, ruleName, explanation, weight }>,
 *   taxonomy: { primary, secondary, mitre: { id, label, url } },
 *   linkAnalysis: { normalizedDomain, reputation, domainAge, registrar },
 *   guidance: { directive, explanation, countermeasures: string[] },
 *   highlightTerms: string[],
 * }
 *
 * SAMPLES shape: { id, label, icon, payload, risk: 'critical'|'suspicious'|'safe' }
 * RECENT_SCANS shape: { id, time, sender, score, riskLevel }
 */

/** Traffic-light risk level map — single source of truth for colors/icons/labels */
export const RISK_LEVELS = {
  safe: {
    label: 'SAFE',
    shortLabel: 'LOW',
    colorClass: 'text-safe',
    bgClass: 'bg-safe/10',
    borderClass: 'border-safe/40',
    dotClass: 'bg-safe',
    badgeClass: 'bg-safe/15 text-safe border border-safe/30',
  },
  suspicious: {
    label: 'SUSPICIOUS',
    shortLabel: 'MED',
    colorClass: 'text-warn',
    bgClass: 'bg-warn/10',
    borderClass: 'border-warn/40',
    dotClass: 'bg-warn',
    badgeClass: 'bg-warn/15 text-warn border border-warn/30',
  },
  critical: {
    label: 'HIGH RISK',
    shortLabel: 'HIGH',
    colorClass: 'text-crit',
    bgClass: 'bg-crit/10',
    borderClass: 'border-crit/40',
    dotClass: 'bg-crit',
    badgeClass: 'bg-crit/15 text-crit border border-crit/30',
  },
};

export const ATTACK_ANATOMY = [
  {
    step: '01',
    title: 'IMPERSONATE',
    description: 'Pretends to be NatWest',
    icon: 'Landmark',
    severity: 'critical',
  },
  {
    step: '02',
    title: 'PANIC',
    description: 'Claims account is suspended',
    icon: 'AlertTriangle',
    severity: 'critical',
  },
  {
    step: '03',
    title: 'URGENCY',
    description: 'Demands action immediately',
    icon: 'Timer',
    severity: 'suspicious',
  },
  {
    step: '04',
    title: 'TRAP',
    description: 'Fake link harvests login',
    icon: 'Link2',
    severity: 'critical',
  },
];

/** Quick-test sample payloads — 5 entries covering the full traffic-light range */
export const SAMPLES = [
  {
    id: 'natwest',
    label: 'NatWest Bank Scam',
    icon: 'Landmark',
    risk: 'critical',
    payload:
      'NatWest Alert: Your account has been suspended due to unusual activity. Verify your identity immediately to restore access: https://natwest-verify.secure-l0gin.co.uk/login',
  },
  {
    id: 'parcel',
    label: 'Parcel Delivery Fee',
    icon: 'Package',
    risk: 'critical',
    payload:
      'Royal Mail: We attempted delivery of your parcel but require a £2.99 redelivery fee. Pay now to avoid return: http://royalmail-redelivery.uk-parcel-fee.com/pay',
  },
  {
    id: 'student-loan',
    label: 'Student Loan Refund',
    icon: 'GraduationCap',
    risk: 'suspicious',
    payload:
      'Student Finance England: You are owed a £347.50 refund. Claim within 24 hours or funds will be forfeited: https://studentfinance-refund.gov-secure.info/claim',
  },
  {
    id: 'hi-mum',
    label: 'Family "Hi Mum" Impersonation',
    icon: 'Users',
    risk: 'suspicious',
    payload:
      "Hi Mum, it's me. I've lost my phone and I'm using a friend's number. I'm in a bit of trouble and need you to send £500 urgently. I'll explain later. Please don't call this number.",
  },
  {
    id: 'genuine-otp',
    label: 'Genuine Bank OTP',
    icon: 'ShieldCheck',
    risk: 'safe',
    payload:
      'Your NatWest security code is 847291. Do not share this code with anyone. NatWest will never call you to ask for this code. Valid for 10 minutes.',
  },
];

/** Mock recent scan history rows (used by RecentScans panel) */
export const RECENT_SCANS = [
  {
    id: 'rs-001',
    time: '01:44:12',
    sender: '+44 7700 900123',
    score: 88,
    riskLevel: 'critical',
  },
  {
    id: 'rs-002',
    time: '01:31:07',
    sender: '+44 7911 123456',
    score: 54,
    riskLevel: 'suspicious',
  },
  {
    id: 'rs-003',
    time: '01:18:55',
    sender: 'ROYAL-MAIL',
    score: 79,
    riskLevel: 'critical',
  },
  {
    id: 'rs-004',
    time: '01:02:33',
    sender: 'NATWEST',
    score: 7,
    riskLevel: 'safe',
  },
];

/** Full forensic scan result (mirrors API shape) — used when no real scan is available */
export const SCAN_RESULT = {
  messageId: 'msg_01HV2Z6JQX9K7F3R2M8C',
  score: 88,
  riskLevel: 'critical',
  payload:
    'NatWest Alert: Your account has been suspended due to unusual activity. Verify your identity immediately to restore access: https://natwest-verify.secure-l0gin.co.uk/login',

  overview: {
    encoding: 'UTF-8',
    segments: '1 / 1',
    language: 'en-GB',
    carrier: 'O2 UK',
    direction: 'Inbound',
    source: '+44 7700 900123',
  },

  indicators: [
    {
      id: 'domain-age',
      severity: 'critical',
      ruleName: 'Domain age ≤ 7 days',
      explanation:
        'Newly registered domains are a hallmark of throwaway phishing infrastructure designed to evade blocklists.',
      weight: 25,
    },
    {
      id: 'tld-spoof',
      severity: 'critical',
      ruleName: 'Uncommon TLD / brand spoof',
      explanation:
        'The link imitates a trusted bank using a lookalike subdomain structure — a classic typosquatting pattern.',
      weight: 22,
    },
    {
      id: 'no-reputation',
      severity: 'critical',
      ruleName: 'No historical reputation',
      explanation:
        'Domain has no prior trust signals, DMARC record, or reputation history in any major threat-intel feed.',
      weight: 20,
    },
    {
      id: 'urgency-tone',
      severity: 'suspicious',
      ruleName: 'Manufactured urgency tone',
      explanation:
        'Language engineered to trigger panic ("suspended", "immediately") and bypass careful thinking — a core social-engineering technique.',
      weight: 21,
    },
  ],

  taxonomy: {
    primary: 'Social Engineering',
    secondary: 'Potential Phishing',
    mitre: {
      id: 'T1566.002',
      label: 'Phishing: Spearphishing Link',
      url: 'https://attack.mitre.org/techniques/T1566/002/',
    },
  },

  linkAnalysis: {
    // l0gin uses a zero instead of 'o' — highlight in UI
    normalizedDomain: 'natwest-verify.secure-l0gin.co.uk',
    reputation: 'Typosquatting / Homoglyph',
    domainAge: '4 days old',
    // Mock registrar — not real data
    registrar: 'NameSilo, LLC',
  },

  guidance: {
    directive: 'DO NOT CLICK LINK. Call 1930.',
    explanation:
      "This message impersonates NatWest Bank, manufactures panic about a \"suspended\" account, and pushes you to act \"immediately\" on a link registered just 4 days ago. The domain is not NatWest's real domain. Calling 1930 (the National Cyber Helpline for India) or your bank's official number on the back of your card is the safest response.",
    countermeasures: [
      "Don't tap the link or reply to this message.",
      'Report and delete the SMS immediately.',
      'If you already entered details, contact your bank using the number on your card right away.',
      'Warn family and friends — this scam circulates widely.',
    ],
  },

  highlightTerms: ['suspended', 'immediately', 'unusual activity'],
};
