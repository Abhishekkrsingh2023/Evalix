import { ImageResponse } from 'next/og';

export const alt = 'Evalix — Next-Gen Hackathon Evaluation & Judging Platform';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          backgroundColor: '#020617',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.25) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.25) 0%, transparent 50%)',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '9999px',
              padding: '8px 24px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#cbd5e1',
            }}
          >
            <span style={{ color: '#818cf8', marginRight: '10px' }}>⚡</span>
            INNOV8 3.0 • Official Judging Nerve Center
          </div>

          <div
            style={{
              display: 'flex',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(129, 140, 248, 0.4)',
              borderRadius: '9999px',
              padding: '8px 20px',
              fontSize: '16px',
              fontWeight: 700,
              color: '#a5b4fc',
              letterSpacing: '1px',
            }}
          >
            REAL-TIME • AUDIT-PROOF
          </div>
        </div>

        {/* Main Center Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '76px',
              fontWeight: 900,
              letterSpacing: '-2px',
              display: 'flex',
              alignItems: 'center',
              color: '#ffffff',
            }}
          >
            Evalix
          </div>
          <div
            style={{
              fontSize: '32px',
              fontWeight: 600,
              color: '#94a3b8',
              lineHeight: 1.3,
              maxWidth: '900px',
            }}
          >
            Next-Gen Hackathon Evaluation & Real-Time Judging Platform
          </div>
        </div>

        {/* Feature Pills Footer */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            '📱 QR Code Quick-Scan',
            '🔒 Write-Once Immutability',
            '🏆 Live Leaderboard Sync',
            '⚡ 0 Paper Rubrics',
          ].map((pill, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                border: '1px solid rgba(71, 85, 105, 0.4)',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '18px',
                fontWeight: 600,
                color: '#e2e8f0',
              }}
            >
              {pill}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
