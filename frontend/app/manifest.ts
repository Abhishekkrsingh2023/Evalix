import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Evalix — Hackathon Evaluation & Judging Platform',
    short_name: 'Evalix',
    description: 'Next-Gen Hackathon Evaluation & Real-Time Judging Platform for INNOV8 3.0 and competitive hackathons.',
    start_url: '/',
    display: 'standalone',
    background_color: '#020617',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
