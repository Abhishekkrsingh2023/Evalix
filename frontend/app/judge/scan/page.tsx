'use client';

import { useCallback, useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button, Card, Input } from '@/components/ui';
import { teamsApi } from '@/lib/api';
import { getApiError } from '@/lib/utils';
import { Keyboard, ArrowRight, Camera, CameraOff } from 'lucide-react';

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isManualMode = searchParams.get('mode') === 'manual';

  const [mode, setMode] = useState<'scan' | 'manual'>(isManualMode ? 'manual' : 'scan');
  const [manualId, setManualId] = useState('');
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrcodeRef = useRef<unknown>(null);
  const navigateToTeam = useCallback(async (rawTeamId: string) => {
    // Extract team_id from either "INNOV8-001" or URL "https://.../team/INNOV8-001"
    let teamId = rawTeamId.trim().toUpperCase();
    const urlMatch = rawTeamId.match(/\/team\/([A-Z0-9\-_]+)/i);
    if (urlMatch) teamId = urlMatch[1].toUpperCase();

    setLoading(true);
    try {
      await teamsApi.get(teamId);
      router.push(`/judge/team/${teamId}`);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadingRef = useRef(loading);
  const navigateToTeamRef = useRef(navigateToTeam);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    navigateToTeamRef.current = navigateToTeam;
  }, [navigateToTeam]);

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

        await (scanner as { start: (s: { facingMode: string }, config: { fps: number; qrbox: { width: number; height: number } }, cb: (text: string) => void) => Promise<void> }).start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            if (!loadingRef.current) {
              toast.success('QR Code scanned!');
              navigateToTeamRef.current(decodedText);
            }
          }
        );
        setScannerReady(true);
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
        (html5QrcodeRef.current as { stop: () => Promise<void> }).stop().catch(() => {});
      }
    };
  }, [mode]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    await navigateToTeam(manualId);
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
          onClick={() => setMode('scan')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'scan' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Camera className="w-4 h-4" /> Scan QR
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'manual' ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Keyboard className="w-4 h-4" /> Manual Entry
        </button>
      </div>

      {/* QR Scanner */}
      {mode === 'scan' && (
        <Card>
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
            {!scannerReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900 rounded-xl">
                <div className="text-center">
                  <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400 text-sm">Initializing camera...</p>
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
              label="Team ID"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.toUpperCase())}
              placeholder="e.g. INNOV8-001"
              autoFocus
            />
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
          <button onClick={() => setMode('manual')} className="text-violet-400 hover:text-violet-300 underline">
            Use manual entry
          </button>
        </p>
      )}
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" /></div>}>
      <ScanContent />
    </Suspense>
  );
}
