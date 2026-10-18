import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SOCHeader } from './components/SOCHeader';
import { WorkspaceView } from './components/WorkspaceView';
import { ForensicDashboard } from './components/ForensicDashboard';
import { RulesModal } from './components/RulesModal';
import { HistoryModal } from './components/HistoryModal';
import { Toast } from './components/ui/Toast';
import IntroSplash from './components/IntroSplash';
import { scanMessage, fetchHistoryItem, adaptScanResponse } from './services/api';
import { SCAN_RESULT, analyzeMessage } from './data/mockData';

// Validation constants
const MIN_LEN = 5;

/** Initial banner status */
const DEFAULT_STATUS = 'REVIEW REQUIRED — Analyst Action Needed';

export default function App() {
  // ── Intro splash ──────────────────────────────────────────────────────────
  const [showIntro, setShowIntro] = useState(false);
  const endIntro = useCallback(() => setShowIntro(false), []);

  // ── Modals state ──────────────────────────────────────────────────────────
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // ── View toggle ───────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState('workspace');

  // ── Workspace state ───────────────────────────────────────────────────────
  const [payload, setPayload] = useState('');
  const [activeSampleId, setActiveSampleId] = useState(null);
  const [error, setError] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── Forensic state ────────────────────────────────────────────────────────
  const [isScanned, setIsScanned] = useState(false);
  const [scanResult, setScanResult] = useState(SCAN_RESULT);
  const [bannerStatus, setBannerStatus] = useState(DEFAULT_STATUS);

  // ── Toast state ───────────────────────────────────────────────────────────
  const [toast, setToast] = useState(null); // { message, tone }

  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Payload handlers ──────────────────────────────────────────────────────
  const handlePayloadChange = useCallback((val) => {
    setPayload(val);
    if (error) setError(null);
    if (activeSampleId) setActiveSampleId(null);
  }, [error, activeSampleId]);

  const handleSampleSelect = useCallback((samplePayload, id) => {
    setPayload(samplePayload);
    setActiveSampleId(id);
    setError(null);
  }, []);

  const handleClear = useCallback(() => {
    setPayload('');
    setActiveSampleId(null);
    setError(null);
  }, []);

  // ── Scan flow (Calls POST /api/scan) ───────────────────────────────────────
  const handleScan = useCallback(async () => {
    const trimmed = payload.trim();

    // Validation
    if (!trimmed) {
      setError('Please paste a message or link to check.');
      return;
    }
    if (trimmed.length < MIN_LEN) {
      setError('Please paste a message with at least 5 characters to check.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      // Real API Call to FastAPI backend: POST /api/scan
      const result = await scanMessage(trimmed);
      setScanResult(result);
      setBannerStatus(DEFAULT_STATUS);
      setIsScanned(true);
      setActiveView('forensic');
      showToast(`Scan complete: ${result.riskLevel.toUpperCase()} risk detected`, result.riskLevel === 'safe' ? 'success' : 'warn');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.warn('API scan failed, attempting fallback demo analysis:', err);
      // If server is completely unreachable, fallback to mock demo analyzer with a notification
      try {
        const fallback = await analyzeMessage(trimmed);
        setScanResult(fallback);
        setBannerStatus(DEFAULT_STATUS);
        setIsScanned(true);
        setActiveView('forensic');
        showToast(`Backend unavailable: ${err.message}. Showing local demo analysis.`, 'warn');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (fallbackErr) {
        setError(err.message || 'Scan failed. Please check your network or backend server.');
        showToast(err.message || 'Scan failed. Please check your network or backend server.', 'warn');
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [payload, showToast]);

  // ── Reset / New Scan ──────────────────────────────────────────────────────
  const handleNewScan = useCallback(() => {
    setIsScanned(false);
    setPayload('');
    setActiveSampleId(null);
    setError(null);
    setBannerStatus(DEFAULT_STATUS);
    setActiveView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = useCallback(() => {
    setActiveView('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Select past scan from History (GET /api/history/{id}) ─────────────────
  const handleSelectRecentScan = useCallback((scan) => {
    if (!scan) return;
    setScanResult(scan);
    setPayload(scan.payload || '');
    setIsScanned(true);
    setActiveView('forensic');
    setBannerStatus(DEFAULT_STATUS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Status update from CountermeasureBar ──────────────────────────────────
  const handleStatusChange = useCallback((status) => {
    setBannerStatus(status);
  }, []);

  const showForensic = activeView === 'forensic';

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-[#f9fafb]">
      {showIntro && <IntroSplash onDone={endIntro} />}

      {/* Persistent SOC Header across both views */}
      <SOCHeader
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenRules={() => setIsRulesOpen(true)}
        onHome={handleNewScan}
      />

      {showForensic ? (
        <ForensicDashboard
          result={scanResult}
          bannerStatus={bannerStatus}
          onStatusChange={handleStatusChange}
          onNewScan={handleNewScan}
          onBack={handleBack}
          onToast={showToast}
        />
      ) : (
        <WorkspaceView
          payload={payload}
          onPayloadChange={handlePayloadChange}
          error={error}
          isAnalyzing={isAnalyzing}
          activeSampleId={activeSampleId}
          onSampleSelect={handleSampleSelect}
          onScan={handleScan}
          onSelectRecentScan={handleSelectRecentScan}
          onOpenHistoryModal={() => setIsHistoryOpen(true)}
          onOpenRulesModal={() => setIsRulesOpen(true)}
          onToast={showToast}
        />
      )}

      {/* Rules and Scoring Modal (GET /api/rules) */}
      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* History Modal (GET/DELETE /api/history) */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectScan={handleSelectRecentScan}
        onToast={showToast}
      />

      {/* Global Toast */}
      {toast && (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
}