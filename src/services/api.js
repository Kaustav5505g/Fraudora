/**
 * Fraudora API Client
 * Connects frontend to all FastAPI endpoints in scam-spotter-api/app/main.py:
 * - GET    /                  (root metadata)
 * - GET    /health            (health check & integration status)
 * - POST   /api/scan          (message scanner with X-Client-Id)
 * - GET    /api/rules         (rules, thresholds, brands)
 * - GET    /api/history       (scan history list)
 * - GET    /api/history/{id}  (individual scan report)
 * - DELETE /api/history/{id}  (delete individual scan)
 * - DELETE /api/history       (clear all history)
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const LOCAL_STORAGE_CLIENT_ID_KEY = 'fraudora_client_id';
const LOCAL_STORAGE_HISTORY_KEY = 'fraudora_local_history';

/**
 * Get or generate persistent client ID for browser session.
 * Must match backend regex: ^[A-Za-z0-9_-]{16,64}$
 */
export function getClientId() {
  try {
    let cid = localStorage.getItem(LOCAL_STORAGE_CLIENT_ID_KEY);
    if (!cid || !/^[A-Za-z0-9_-]{16,64}$/.test(cid)) {
      cid = 'fraudora_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem(LOCAL_STORAGE_CLIENT_ID_KEY, cid);
    }
    return cid;
  } catch {
    return 'fraudora_default_client_session_id';
  }
}

/**
 * Generic fetch wrapper with timeout and standardized error handling
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    'X-Client-Id': getClientId(),
    ...(options.headers || {}),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 25000);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errorMsg = data?.error?.message || data?.detail || `HTTP ${res.status}: ${res.statusText}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out. Please try again.');
      timeoutErr.status = 408;
      throw timeoutErr;
    }
    throw err;
  }
}

// ── Local history storage fallback (for when Supabase is not configured) ─────
function getLocalHistory() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalHistoryItem(adaptedScan) {
  try {
    const history = getLocalHistory();
    const filtered = history.filter((item) => item.id !== adaptedScan.id);
    const updated = [
      {
        id: adaptedScan.id,
        created_at: adaptedScan.created_at || new Date().toISOString(),
        score: adaptedScan.score,
        level: adaptedScan.raw?.level || (adaptedScan.riskLevel === 'critical' ? 'high_risk' : adaptedScan.riskLevel),
        riskLevel: adaptedScan.riskLevel,
        preview: (adaptedScan.payload || '').slice(0, 80),
        sender: adaptedScan.overview?.source || 'Message Scan',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        full: adaptedScan,
      },
      ...filtered,
    ].slice(0, 50); // keep last 50
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save to local history', e);
  }
}

function removeLocalHistoryItem(scanId) {
  try {
    const history = getLocalHistory().filter((item) => item.id !== scanId);
    localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    return true;
  } catch {
    return false;
  }
}

function clearLocalHistoryStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_HISTORY_KEY);
    return true;
  } catch {
    return false;
  }
}

// ── Response adapter: FastAPI ScanResponse -> UI Model ────────────────────────
export function adaptScanResponse(raw) {
  if (!raw) return null;

  const riskLevel = raw.level === 'high_risk' ? 'critical' : (raw.level === 'suspicious' ? 'suspicious' : 'safe');
  const source = raw.links?.[0]?.host || 'Direct Message';
  const highlightTerms = (raw.findings || [])
    .flatMap((f) => (f.matches || []).map((m) => m.text))
    .filter(Boolean);

  const indicators = (raw.findings || []).map((f) => ({
    id: f.rule_id,
    severity: f.severity === 'high' ? 'critical' : f.severity === 'medium' ? 'suspicious' : 'safe',
    ruleName: f.label,
    explanation: f.why,
    weight: f.points,
    advice: f.advice,
    details: f.details || [],
  }));

  const links = (raw.links || []).map((l) => ({
    url: l.url,
    actualDomain: l.host,
    expectedDomain: l.reputation?.expected_brand || (raw.report?.brand?.name ? raw.report.brand.name : 'Official service domain'),
    registeredDays: l.reputation?.domain_age_days ?? null,
    status: l.status,
  }));

  // Build dynamic attack anatomy from findings
  const anatomy = (raw.findings || []).slice(0, 4).map((f, i) => {
    let icon = 'AlertTriangle';
    if (f.category === 'brand_spoof' || f.rule_id.includes('brand')) icon = 'Landmark';
    else if (f.category === 'urgency' || f.rule_id.includes('urgency') || f.rule_id.includes('threat')) icon = 'Timer';
    else if (f.category === 'link' || f.rule_id.includes('link') || f.rule_id.includes('domain')) icon = 'Link2';
    else if (f.category === 'payment' || f.rule_id.includes('upi') || f.rule_id.includes('refund')) icon = 'IndianRupee';
    else if (f.category === 'employment' || f.rule_id.includes('job')) icon = 'Briefcase';
    else if (f.category === 'utility' || f.rule_id.includes('bill')) icon = 'Zap';
    return {
      step: String(i + 1).padStart(2, '0'),
      title: f.label,
      description: f.why,
      icon,
      severity: f.severity === 'high' ? 'critical' : f.severity === 'medium' ? 'suspicious' : 'safe',
    };
  });

  const directive = raw.headline || (riskLevel === 'safe'
    ? 'Looks safe. Never share private OTPs or passwords.'
    : 'Do not click the link or send money.');

  const steps = (raw.next_steps && raw.next_steps.length > 0)
    ? raw.next_steps
    : [
        'Do not click the link or share your credentials.',
        'Verify the sender through their official website or phone number.',
        'Report suspected fraud at cybercrime.gov.in or call 1930.',
      ];

  return {
    id: raw.id,
    messageId: `SCAN_${(raw.id || '').slice(0, 8).toUpperCase()}`,
    score: raw.score ?? 0,
    rawScore: raw.raw_score ?? raw.score ?? 0,
    riskLevel,
    payload: raw.message,
    created_at: raw.created_at,
    overview: {
      encoding: 'UTF-8',
      segments: `${raw.segments?.length || 1} / 1`,
      language: 'en-IN',
      carrier: 'Auto-detected',
      direction: 'Inbound',
      source,
      saved: raw.saved ? 'Saved to history' : 'Session scan',
      engine: raw.engine?.ai_used ? 'Rules + Gemini AI' : 'Rules-first engine',
    },
    indicators,
    taxonomy: {
      primary: raw.findings?.some((f) => f.category === 'brand_spoof')
        ? 'Social Engineering'
        : raw.findings?.some((f) => f.category === 'payment')
          ? 'Payment Fraud'
          : riskLevel === 'safe'
            ? 'Benign Notification'
            : 'Phishing Threat',
      secondary: raw.label || (riskLevel === 'safe' ? 'Legitimate Message' : 'Potential Scam'),
      mitre: {
        id: riskLevel === 'safe' ? 'T1036' : 'T1566.002',
        label: riskLevel === 'safe' ? 'Masquerading' : 'Phishing: Spearphishing Link',
        url: riskLevel === 'safe' ? 'https://attack.mitre.org/techniques/T1036/' : 'https://attack.mitre.org/techniques/T1566/002/',
      },
    },
    linkAnalysis: {
      normalizedDomain: raw.links?.[0]?.host || 'No link detected',
      reputation: raw.links?.[0]?.status ? `Status: ${raw.links[0].status}` : 'No embedded link',
      domainAge: raw.links?.[0]?.reputation?.domain_age_days != null
        ? `${raw.links[0].reputation.domain_age_days} days old`
        : (raw.links?.length ? 'Unverified age' : 'Not applicable'),
      registrar: raw.links?.[0]?.reputation?.registrar || 'Not applicable',
    },
    links,
    anatomy,
    guidance: {
      directive,
      explanation: raw.ai_summary || raw.summary || directive,
      countermeasures: steps,
      steps,
    },
    highlightTerms,
    engine: raw.engine || { ai_used: false, reputation_checked: [] },
    saved: Boolean(raw.saved),
    raw,
  };
}

// ── API Operations ────────────────────────────────────────────────────────────

/**
 * 1. GET / - Root metadata
 */
export async function fetchRoot() {
  return request('/');
}

/**
 * 2. GET /health - Engine health and services status
 */
export async function fetchHealth() {
  try {
    return await request('/health');
  } catch (err) {
    return {
      status: 'offline',
      history: false,
      ai_explanations: false,
      google_safe_browsing: false,
      virustotal: false,
      error: err.message,
    };
  }
}

/**
 * 3. GET /api/rules - All detection rules and thresholds
 */
export async function fetchRules() {
  return request('/api/rules');
}

/**
 * 4. POST /api/scan - Scan message or link
 * @param {string} message
 */
export async function scanMessage(message) {
  const raw = await request('/api/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  const adapted = adaptScanResponse(raw);
  // Cache to local history fallback
  saveLocalHistoryItem(adapted);
  return adapted;
}

/**
 * 5. GET /api/history - Retrieve scan history for client
 * Falls back to local storage if Supabase history is not configured (503)
 */
export async function fetchHistory(limit = 20, offset = 0) {
  try {
    const res = await request(`/api/history?limit=${limit}&offset=${offset}`);
    return {
      items: (res.items || []).map((item) => ({
        id: item.id,
        score: item.score,
        level: item.level,
        riskLevel: item.level === 'high_risk' ? 'critical' : item.level,
        preview: item.preview,
        time: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
        sender: item.sender || 'Scan',
      })),
      limit: res.limit,
      offset: res.offset,
      source: 'server',
    };
  } catch (err) {
    // Graceful fallback to local history if server history is unavailable or returns 503
    const local = getLocalHistory();
    return {
      items: local.slice(offset, offset + limit),
      limit,
      offset,
      source: 'local',
      notice: err.status === 503 ? 'Server history not configured; using browser storage.' : undefined,
    };
  }
}

/**
 * 6. GET /api/history/{scan_id} - Fetch full scan report
 */
export async function fetchHistoryItem(scanId) {
  try {
    const raw = await request(`/api/history/${encodeURIComponent(scanId)}`);
    return adaptScanResponse(raw);
  } catch (err) {
    // Check local fallback
    const local = getLocalHistory().find((i) => i.id === scanId);
    if (local && local.full) {
      return local.full;
    }
    throw err;
  }
}

/**
 * 7. DELETE /api/history/{scan_id} - Remove single scan
 */
export async function deleteHistoryItem(scanId) {
  removeLocalHistoryItem(scanId);
  try {
    return await request(`/api/history/${encodeURIComponent(scanId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    // If server history is not configured, local removal is sufficient
    return { deleted: 1, source: 'local' };
  }
}

/**
 * 8. DELETE /api/history - Clear all scan history
 */
export async function clearAllHistory() {
  clearLocalHistoryStorage();
  try {
    return await request('/api/history', {
      method: 'DELETE',
    });
  } catch (err) {
    return { deleted: 1, source: 'local' };
  }
}
