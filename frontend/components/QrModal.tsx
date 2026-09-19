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
  const [dataUrl, setDataUrl] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    // Generate high-resolution QR code for crisp rendering on retina/4K screens
    QRCode.toDataURL(team.team_id, {
      width: 600,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setDataUrl);
  }, [team.team_id]);

  const download = useCallback(() => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${team.team_id}-qr.png`;
    link.click();
  }, [dataUrl, team.team_id]);

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
        <div className="flex-1 flex flex-col items-center justify-center my-6 text-center max-w-xl w-full">
          <div className="mb-4">
            <Badge variant="info" className="text-sm sm:text-base px-3.5 py-1.5 font-mono">
              {team.team_id}
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-100 mt-3 tracking-tight">
              {team.team_name}
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mt-1">Leader: {team.leader_name}</p>
          </div>

          {/* Responsive QR Box */}
          <div className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[440px] aspect-square bg-white p-6 sm:p-8 rounded-3xl shadow-2xl shadow-violet-500/20 border-4 border-violet-500/30 my-4 flex items-center justify-center transition-all">
            {dataUrl ? (
              <Image
                src={dataUrl}
                alt={`QR code for ${team.team_id}`}
                width={600}
                height={600}
                unoptimized
                priority
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full skeleton rounded-2xl" />
            )}
          </div>

          <p className="text-violet-400 text-sm sm:text-base font-medium flex items-center gap-2 mt-2">
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
          {/* Responsive QR Box */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl inline-flex items-center justify-center w-full max-w-[240px] sm:max-w-[260px] aspect-square mx-auto shadow-lg border border-slate-200">
            {dataUrl ? (
              <Image
                src={dataUrl}
                alt={team.team_id}
                width={600}
                height={600}
                unoptimized
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full skeleton rounded-xl" />
            )}
          </div>

          <div>
            <p className="font-bold text-slate-100 text-lg">{team.team_name}</p>
            <p className="text-slate-400 text-sm">Leader: {team.leader_name}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={toggleFullScreen} title="View in full screen">
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">Full Screen</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={download} title="Download PNG">
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
