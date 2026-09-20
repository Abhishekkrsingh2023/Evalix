'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { Team } from '@/types';
import { Button, Badge } from '@/components/ui';
import { Download, Maximize2, Minimize2, Printer, X, Zap } from 'lucide-react';

interface QrModalProps {
  team: Team;
  isOpen?: boolean;
  onClose: () => void;
}

export function QrModal({ team, isOpen = true, onClose }: QrModalProps) {
  const [qrUrl, setQrUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const generate = async () => {
      try {
        // High-resolution QR code
        const rawQr = await QRCode.toDataURL(team.team_id, {
          width: 800,
          margin: 2,
          color: { dark: '#0f172a', light: '#ffffff' },
        });

        if (isCancelled) return;
        setQrUrl(rawQr);

        // Generate labeled canvas for download with team name and ID below QR
        const img = new window.Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (isCancelled) return;
          const canvas = document.createElement('canvas');
          const qrSize = 800;
          const labelHeight = 120;
          canvas.width = qrSize;
          canvas.height = qrSize + labelHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          // White background
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw QR code centered
          ctx.drawImage(img, 0, 0, qrSize, qrSize);

          // Divider subtle line
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(40, qrSize);
          ctx.lineTo(qrSize - 40, qrSize);
          ctx.stroke();

          // Text label: Team Name - Team ID
          const labelText = `${team.team_name} - ${team.team_id}`;
          let fontSize = 34;
          ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

          // Dynamically scale down font if text is long
          const maxTextWidth = qrSize - 60;
          while (ctx.measureText(labelText).width > maxTextWidth && fontSize > 18) {
            fontSize -= 2;
            ctx.font = `bold ${fontSize}px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
          }

          ctx.fillStyle = '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, qrSize / 2, qrSize + labelHeight / 2 - 5);

          setDownloadUrl(canvas.toDataURL('image/png'));
        };
        img.src = rawQr;
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };

    generate();

    return () => {
      isCancelled = true;
    };
  }, [team.team_id, team.team_name]);

  const download = useCallback(() => {
    const url = downloadUrl || qrUrl;
    if (!url) return;
    const safeName = team.team_name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${team.team_id}-${safeName}-qr.png`;
    link.click();
  }, [downloadUrl, qrUrl, team.team_id, team.team_name]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullScreen) {
          setIsFullScreen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onClose]);

  if (!isOpen) return null;

  const teamIdentifierLabel = `${team.team_name} - ${team.team_id}`;

  // Full Screen Presentation View
  if (isFullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto animate-in fade-in duration-200">
        {/* Top bar */}
        <div className="w-full max-w-4xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-100 text-base sm:text-lg">INNOV8 3.0</p>
              <p className="text-slate-400 text-xs">Hackathon Team QR</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handlePrint} className="hidden sm:inline-flex">
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button variant="secondary" size="sm" onClick={download}>
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button variant="secondary" size="sm" onClick={toggleFullScreen} title="Exit Full Screen">
              <Minimize2 className="w-4 h-4" />
              Exit Full Screen
            </Button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors ml-1"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center QR Content */}
        <div className="flex-1 flex flex-col items-center justify-center my-4 sm:my-6 text-center max-w-xl w-full">
          <div className="mb-2">
            <Badge variant="info" className="text-sm sm:text-base px-3.5 py-1 font-mono">
              {team.team_id}
            </Badge>
          </div>

          {/* Responsive QR Box with Team Name - ID embedded at bottom */}
          <div className="w-full max-w-[300px] sm:max-w-[400px] md:max-w-[460px] bg-white p-5 sm:p-7 rounded-3xl shadow-2xl shadow-violet-500/20 border-4 border-violet-500/30 my-3 flex flex-col items-center justify-center transition-all">
            <div className="w-full aspect-square flex items-center justify-center">
              {qrUrl ? (
                <Image
                  src={qrUrl}
                  alt={`QR code for ${team.team_id}`}
                  width={800}
                  height={800}
                  unoptimized
                  priority
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full skeleton rounded-2xl" />
              )}
            </div>

            {/* Team Name - ID displayed directly below QR code in live card */}
            <div className="w-full pt-3 mt-1 border-t border-slate-100 text-center">
              <p className="text-slate-900 font-extrabold text-base sm:text-xl md:text-2xl tracking-tight truncate select-all" title={teamIdentifierLabel}>
                {teamIdentifierLabel}
              </p>
            </div>
          </div>

          {/* Additional info below QR box */}
          <div className="mt-2 text-center">
            <p className="text-slate-400 text-sm sm:text-base">Leader: {team.leader_name}</p>
          </div>

          <p className="text-violet-400 text-xs sm:text-sm font-medium flex items-center gap-2 mt-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Scan with any camera or the Judge Portal to score
          </p>
        </div>

        {/* Bottom indicator */}
        <div className="w-full max-w-4xl text-center text-slate-600 text-xs">
          Press <kbd className="px-2 py-1 bg-slate-800 rounded-md text-slate-300 font-mono">Esc</kbd> or click Exit to return
        </div>
      </div>
    );
  }

  // Normal Modal View (Fully Responsive)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative glass rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <span>QR Code</span>
            <Badge variant="info">{team.team_id}</Badge>
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleFullScreen}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Full Screen View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center space-y-4">
          {/* Responsive QR Box with Team Name - ID below QR */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl flex flex-col items-center justify-center w-full max-w-[260px] sm:max-w-[280px] mx-auto shadow-lg border border-slate-200">
            <div className="w-full aspect-square flex items-center justify-center">
              {qrUrl ? (
                <Image
                  src={qrUrl}
                  alt={team.team_id}
                  width={800}
                  height={800}
                  unoptimized
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full skeleton rounded-xl" />
              )}
            </div>

            {/* Team Name - ID displayed directly below QR inside white card */}
            <div className="w-full pt-2.5 mt-1 border-t border-slate-100 text-center">
              <p className="text-slate-900 font-bold text-xs sm:text-sm tracking-tight truncate select-all" title={teamIdentifierLabel}>
                {teamIdentifierLabel}
              </p>
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-100 text-base sm:text-lg truncate" title={teamIdentifierLabel}>
              {teamIdentifierLabel}
            </p>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">Leader: {team.leader_name}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <Button variant="secondary" size="sm" onClick={toggleFullScreen} title="View in full screen">
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Full Screen</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={download} title="Download PNG with team label">
              <Download className="w-4 h-4" />
              Download
            </Button>
            <Button size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
