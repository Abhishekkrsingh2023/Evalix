import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In to Judging Portal',
  description:
    'Sign in to the Evalix judging portal to evaluate hackathon teams, score criteria with instant QR codes, or access the admin nerve center for INNOV8 3.0.',
  alternates: {
    canonical: '/login',
  },
  openGraph: {
    title: 'Sign In | Evalix Hackathon Judging Portal',
    description: 'Secure authentication portal for hackathon judges and administrators.',
    url: '/login',
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
