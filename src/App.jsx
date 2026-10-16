import React, { useState, useCallback, useRef, useEffect } from 'react';
import { SOCHeader } from './components/SOCHeader';
import { WorkspaceView } from './components/WorkspaceView';
import { ForensicDashboard } from './components/ForensicDashboard';
import { Toast } from './components/ui/Toast';
import { analyzeMessage, SCAN_RESULT } from './data/mockData';

// ─── Validation constants ─────────────────────────────────────────────────────
const MIN_LEN = 10;

/** Initial banner status */
const DEFAULT_STATUS = 'REVIEW REQUIRED — Analyst Action Needed';

export default function App() {
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

  // Timer refs for cleanup
  const analyzeTimerRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) clearTimeout(analyzeTimerRef.current);
    };
  }, []);

  // ── Payload handlers ──────────────────────────────────────────────────────
  const handlePayloadChange = useCallback((val) => {
    setPayload(val);
    if (error) setError(null);    // clear error on edit
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

  // ── Scan flow ─────────────────────────────────────────────────────────────
  const handleScan = useCallback(async () => {
    const trimmed = payload.trim();

    // Validation
    if (!trimmed) {
      setError('Payload is empty. Paste a message to analyze.');
      return;
    }
    if (trimmed.length < MIN_LEN) {
      setError('Payload too short to analyze.');
      return;
    }

    setError(null);
    setIsAnalyzing(true);

    try {
      const result = await analyzeMessage(trimmed);
      setScanResult(result);
      setBannerStatus(DEFAULT_STATUS);
      setIsScanned(true);
      setActiveView('forensic');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsAnalyzing(false);
    }
  }, [payload]);

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

  // ── View toggle (header control) ──────────────────────────────────────────
  const handleViewChange = useCallback((view) => {
    setActiveView(view);
    // If user jumps to forensic view without scanning, show default mock
    if (view === 'forensic' && !isScanned) {
      setScanResult(SCAN_RESULT);
      setBannerStatus(DEFAULT_STATUS);
    }
  }, [isScanned]);

  // ── Toast ─────────────────────────────────────────────────────────────────
  const showToast = useCallback((message, tone = 'info') => {
    setToast({ message, tone });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  // ── Status update from CountermeasureBar ──────────────────────────────────
  const handleStatusChange = useCallback((status) => {
    setBannerStatus(status);
  }, []);

  // ── Determine which view renders ──────────────────────────────────────────
  const showForensic = activeView === 'forensic';

  return (
    <div className="min-h-screen flex flex-col">
      <SOCHeader activeView={activeView} onViewChange={handleViewChange} />

      {showForensic ? (
        <ForensicDashboard
          result={scanResult}
          bannerStatus={bannerStatus}
          onStatusChange={handleStatusChange}
          onNewScan={handleNewScan}
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
          onClear={handleClear}
          onScan={handleScan}
          onShowForensic={() => handleViewChange('forensic')}
        />
      )}

      {/* Global toast */}
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
