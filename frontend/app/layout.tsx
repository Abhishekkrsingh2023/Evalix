import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://evalix-swart.vercel.app';

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Evalix | Next-Gen Hackathon Evaluation & Real-Time Judging Platform',
    template: '%s | Evalix',
  },
  description:
    'Evalix is an audit-proof, real-time hackathon judging and evaluation platform. Features instant QR code scanning, write-once score immutability, live leaderboards, and role-based workflows for INNOV8 3.0.',
  keywords: [
    'Evalix',
    'hackathon judging platform',
    'hackathon evaluation tool',
    'real-time hackathon scoring',
    'INNOV8 3.0',
    'hackathon leaderboard',
    'QR code judging rubric',
    'audit-proof scoring system',
    'developer competition judging',
    'mobile judging portal',
  ],
  authors: [{ name: 'Evalix Team' }],
  creator: 'Evalix',
  publisher: 'Evalix',
  applicationName: 'Evalix',
  generator: 'Next.js',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Evalix',
    title: 'Evalix — Next-Gen Hackathon Evaluation & Real-Time Judging Platform',
    description:
      'High-performance, mobile-first judging portal for modern hackathons. Eliminates paper rubrics with QR scanning, tamper-proof score validation, and instant live leaderboards.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Evalix — Next-Gen Hackathon Evaluation & Real-Time Judging Platform',
    description:
      'Audit-proof hackathon judging platform with QR scanning, write-once score security, and real-time live leaderboards.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
  },
  category: 'technology',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'Evalix',
      url: siteUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'All',
      description:
        'A secure, high-performance, mobile-friendly judging system built for modern hackathons and competitive developer events like INNOV8 3.0.',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Instant QR Code rubric scanning for team evaluation',
        'Multi-layer write-once score immutability',
        'Live aggregated real-time leaderboards',
        'Mobile-first touch rubrics for judges',
        'Super admin command center with live round controls',
        'Role-based access control with secure HttpOnly authentication',
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Evalix',
      url: siteUrl,
      logo: `${siteUrl}/favicon.ico`,
      sameAs: ['https://github.com/Abhishekkrsingh2023/Evalix'],
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-950 text-slate-100 min-h-screen selection:bg-indigo-500/30 selection:text-indigo-200`}>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1e293b' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1e293b' },
            },
          }}
        />
      </body>
    </html>
  );
}
