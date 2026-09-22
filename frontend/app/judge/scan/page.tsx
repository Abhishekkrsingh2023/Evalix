'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button, Card, Input } from '@/components/ui';
import { teamsApi } from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Keyboard, ArrowRight, Camera, CameraOff, Loader2, CheckCircle2 } from 'lucide-react';

/**
 * Extracts team ID from various QR payload formats:
 * 1. JSON payload: '{"event":"INNOV8","edition":"3.0 Edition","year":2026,"slot":28,"slotId":"IN8-2026-SLOT28","type":"PHYSICAL_ID_BADGE"}'
 * 2. URL format: 'https://evalix.app/team/INNOV8-001' or '/judge/team/IN8-2026-SLOT28' or '?slotId=...'
 * 3. Plain ID string: 'INNOV8-001' or 'IN8-2026-SLOT28'
 */
export function extractTeamIdFromQr(decodedText: string): string {
  if (!decodedText) return '';
  let clean = decodedText.trim();

  // Strip wrapping quotes if any
  if (
    (clean.startsWith('"') && clean.endsWith('"')) ||
    (clean.startsWith("'") && clean.endsWith("'"))
  ) {
    clean = clean.slice(1, -1).trim();
  }

  // 1. Try parsing as JSON object
  try {
    const parsed = JSON.parse(clean);
    if (parsed && typeof parsed === 'object') {
      const candidate =
        parsed.slotId ??
        parsed.slotID ??
        parsed.slot_id ??
        parsed.teamId ??
        parsed.teamID ??
        parsed.team_id ??
        parsed.team ??
        parsed.id;
      if (candidate !== undefined && candidate !== null) {
        return String(candidate).trim().toUpperCase();
      }
    }
  } catch {
    // Not valid JSON, continue with URL and string matching
  }

  // 2. Try parsing as URL
  try {
    const url = new URL(clean);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const teamIdx = pathParts.findIndex((p) => p.toLowerCase() === 'team');
    if (teamIdx !== -1 && pathParts[teamIdx + 1]) {
      return decodeURIComponent(pathParts[teamIdx + 1]).trim().toUpperCase();
    }
    const queryParam =
      url.searchParams.get('slotId') ||
      url.searchParams.get('slotID') ||
      url.searchParams.get('teamId') ||
      url.searchParams.get('team_id') ||
      url.searchParams.get('id');
    if (queryParam) {
      return queryParam.trim().toUpperCase();
    }
  } catch {
    // Not a full URL, fallback to regex for URL fragments like /team/ID or /judge/team/ID
    const urlMatch = clean.match(/(?:\/team\/|\/judge\/team\/)([A-Za-z0-9\-_]+)/i);
    if (urlMatch) {
      return urlMatch[1].trim().toUpperCase();
    }
  }

  // 3. Fallback: plain string
  return clean.toUpperCase();
}

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManualMode = searchParams.get('mode') === 'manual';

  const [mode, setMode] = useState<'scan' | 'manual'>(isManualMode ? 'manual' : 'scan');
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannedTeamId, setScannedTeamId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<unknown>(null);
  // Synchronous lock ref to prevent processing multiple scan events concurrently
  const isProcessingRef = useRef(false);

  const pauseScanner = useCallback(() => {
    if (html5QrcodeRef.current) {
      try {
        const scanner = html5QrcodeRef.current as {
          getState?: () => number;
          pause?: (shouldPauseVideo?: boolean) => void;
        };
        // State 2 = SCANNING
        if (typeof scanner.getState === 'function' && scanner.getState() === 2) {
          scanner.pause?.(true);
        }
      } catch (e) {
        console.debug('Failed to pause scanner', e);
      }
    }
  }, []);

  const resumeScanner = useCallback(() => {
    if (html5QrcodeRef.current) {
      try {
        const scanner = html5QrcodeRef.current as {
          getState?: () => number;
          resume?: () => void;
        };
        // State 3 = PAUSED
        if (typeof scanner.getState === 'function' && scanner.getState() === 3) {
          scanner.resume?.();
        }
      } catch (e) {
        console.debug('Failed to resume scanner', e);
      }
    }
  }, []);

  const processTeamNavigation = useCallback(
    async (rawInput: string, isFromScanner = false) => {
      const teamId = extractTeamIdFromQr(rawInput);
      if (!teamId) {
        toast.error('Could not identify team ID from scan');
        if (isFromScanner) {
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 1500);
        } else {
          isProcessingRef.current = false;
        }
        return;
      }

      if (isFromScanner) {
        pauseScanner();
      }

      setScannedTeamId(teamId);
      setLoading(true);
      setStatusMessage('QR Code detected! Loading team details...');

      try {
        const res = await teamsApi.get(teamId);
        const teamName = res.data?.team_name || teamId;
        setStatusMessage(`Team found: ${teamName}. Redirecting...`);
        toast.success(`Team found: ${teamName}`);
        // Keep loading=true and isProcessingRef.current=true during route transition
        // to prevent duplicate scans while Next.js finishes navigation
        router.push(`/judge/team/${encodeURIComponent(teamId)}`);
      } catch (err) {
        toast.error(getApiError(err));
        setLoading(false);
        setScannedTeamId(null);
        setStatusMessage('');

        if (isFromScanner) {
          resumeScanner();
          // 2s cooldown so judge can point away from an invalid code without spamming
          setTimeout(() => {
            isProcessingRef.current = false;
          }, 2000);
        } else {
          isProcessingRef.current = false;
        }
      }
    },
    [router, pauseScanner, resumeScanner]
  );

  const processTeamNavigationRef = useRef(processTeamNavigation);
  useEffect(() => {
    processTeamNavigationRef.current = processTeamNavigation;
  }, [processTeamNavigation]);

  useEffect(() => {
    if (mode !== 'scan') return;

    let scanner: unknown = null;
    let active = true;

    const initScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!active || !scannerRef.current) return;

        scanner = new Html5Qrcode('qr-reader');
        html5QrcodeRef.current = scanner;

        await (
          scanner as {
            start: (
              s: { facingMode: string },
              config: { fps: number; qrbox: { width: number; height: number } },
              cb: (text: string) => void
            ) => Promise<void>;
          }
        ).start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            // Immediate synchronous guard against repeated frame callbacks
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;
            processTeamNavigationRef.current(decodedText, true);
          }
        );

        if (active) {
          setScannerReady(true);
        }
      } catch {
        if (active) {
          setCameraError('Camera access denied or not available. Use manual entry below.');
          setMode('manual');
        }
      }
    };

    initScanner();

    return () => {
      active = false;
      if (html5QrcodeRef.current) {
        const s = html5QrcodeRef.current as {
          getState?: () => number;
          stop: () => Promise<void>;
        };
        try {
          if (typeof s.getState === 'function') {
            const state = s.getState();
            // Stop if SCANNING (2) or PAUSED (3)
            if (state === 2 || state === 3) {
              s.stop().catch(() => {});
            }
          } else {
            s.stop().catch(() => {});
          }
        } catch {
          // ignore cleanup errors on unmount
        }
      }
    };
  }, [mode]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    await processTeamNavigation(manualId, false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Find Team</h1>
        <p className="text-slate-400 mt-1">Scan a QR code or enter the team ID manually</p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        <button
          onClick={() => {
            if (!loading) setMode('scan');
          }}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'scan' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Camera className="w-4 h-4" /> Scan QR
        </button>
        <button
          onClick={() => {
            if (!loading) setMode('manual');
          }}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Keyboard className="w-4 h-4" /> Manual Entry
        </button>
      </div>

      {/* QR Scanner */}
      {mode === 'scan' && (
        <Card className="relative overflow-hidden">
          {cameraError && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
              <CameraOff className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{cameraError}</p>
            </div>
          )}

          <div className="relative">
            <div
              id="qr-reader"
              ref={scannerRef}
              className="w-full rounded-xl overflow-hidden bg-slate-900"
              style={{ minHeight: '300px' }}
            />

            {/* Camera initializing indicator */}
            {!scannerReady && !cameraError && !loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-xl">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Initializing camera...</p>
                </div>
              </div>
            )}

            {/* QR Scan Loading Screen Overlay */}
            {loading && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md rounded-xl p-6 text-center animate-in fade-in duration-200">
                <div className="relative mb-5">
                  <div className="absolute -inset-4 bg-violet-600/30 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>

                {scannedTeamId && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-xs font-semibold uppercase tracking-wider mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ID: {scannedTeamId}</span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-slate-100">
                  QR Code Detected!
                </h3>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">
                  {statusMessage || 'Loading team details...'}
                </p>

                <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-4">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <p className="text-slate-500 text-xs text-center mt-3">
            Point camera at team QR code · Camera permission required
          </p>
        </Card>
      )}

      {/* Manual entry */}
      {mode === 'manual' && (
        <Card>
          <h2 className="font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-violet-400" />
            Enter Team ID
          </h2>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <Input
              label="Team ID or Badge Data"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="e.g. INNOV8-001 or IN8-2026-SLOT28"
              disabled={loading}
              autoFocus
            />

            {loading && statusMessage && (
              <div className="flex items-center gap-2 text-violet-300 text-xs bg-violet-500/10 border border-violet-500/20 px-3 py-2 rounded-lg">
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full" size="lg">
              <ArrowRight className="w-4 h-4" />
              Find Team
            </Button>
          </form>
        </Card>
      )}

      {/* Fallback hint */}
      {mode === 'scan' && (
        <p className="text-center text-slate-500 text-sm">
          Camera not working?{' '}
          <button
            onClick={() => !loading && setMode('manual')}
            disabled={loading}
            className="text-violet-400 hover:text-violet-300 underline disabled:opacity-50"
          >
            Use manual entry
          </button>
        </p>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  );
}
