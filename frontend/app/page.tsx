import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Zap,
  QrCode,
  ShieldCheck,
  Trophy,
  Smartphone,
  Sliders,
  Lock,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Users,
} from 'lucide-react';

function GithubIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export const metadata: Metadata = {
  title: 'Evalix | Next-Gen Hackathon Evaluation & Real-Time Judging Platform',
  description:
    'Evalix is an audit-proof, real-time hackathon judging and evaluation platform. Eliminate paper rubrics with QR code scanning, write-once score immutability, and live leaderboards for INNOV8 3.0.',
  alternates: {
    canonical: '/',
  },
};

const faqs = [
  {
    question: 'What is Evalix and how does it work?',
    answer:
      'Evalix is a dedicated hackathon evaluation platform built to eliminate spreadsheets and paper rubrics. Organizers configure criteria and rounds, judges scan team QR codes on mobile devices to submit locked scores, and real-time leaderboards compute final rankings instantly.',
  },
  {
    question: 'How does Evalix ensure score immutability and prevent tampering?',
    answer:
      'Evalix implements a write-once score architecture backed by strict PostgreSQL uniqueness constraints and backend validation. Once a judge locks in and finalizes their score, it cannot be overwritten or altered, providing full audit compliance.',
  },
  {
    question: 'Can judges evaluate teams using their mobile phones?',
    answer:
      'Yes. Evalix is built mobile-first. Judges can use any mobile camera or built-in QR scanner to instantly open a team’s criteria sliders and submit ratings right at the team’s booth or table.',
  },
  {
    question: 'Does Evalix support multiple judging rounds and custom rubrics?',
    answer:
      'Yes. Evalix supports multi-round workflows (such as Preliminary, Semi-Final, and Grand Finale) with custom criteria weights (e.g., Innovation, Technical Execution, Design, Pitch) and automated cross-judge averaging.',
  },
  {
    question: 'Is Evalix designed for INNOV8 3.0?',
    answer:
      'Yes! Evalix serves as the official judging nerve center for the INNOV8 3.0 Hackathon, managing hundreds of participants, multi-judge rosters, and live stage finals with zero downtime.',
  },
];

export default function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      {/* FAQ Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-violet-500/30 selection:text-violet-200">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/30 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">Evalix</span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  INNOV8 3.0
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-slate-200 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-slate-200 transition-colors">
                How It Works
              </a>
              <a href="#security" className="hover:text-slate-200 transition-colors">
                Security
              </a>
              <a href="#faq" className="hover:text-slate-200 transition-colors">
                FAQ
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <a
                href="https://github.com/Abhishekkrsingh2023/Evalix"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Evalix GitHub Repository"
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <GithubIcon className="w-4 h-4" />
              </a>
              <Link
                href="/login"
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-lg shadow-violet-500/25 transition-all"
              >
                <span>Enter Portal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section
            id="hero"
            className="relative pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden border-b border-slate-900"
          >
            {/* Background Glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-violet-600/20 to-indigo-600/20 blur-[130px] rounded-full" />
              <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
              {/* Pill Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-950/60 border border-violet-700/40 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                Next-Gen Hackathon Evaluation Engine
              </div>

              {/* Main Heading 1 */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-5xl mx-auto leading-[1.1]">
                Real-Time Hackathon Judging.{' '}
                <span className="gradient-text">Zero Spreadsheets.</span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                Evalix eliminates paper rubrics and evaluation delays. Equip judges with instant QR
                scanners, enforce write-once score immutability, and generate live audit-proof leaderboards
                for INNOV8 3.0 and competitive hackathons.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Link
                  href="/login"
                  className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl shadow-xl shadow-violet-600/30 hover:shadow-violet-600/50 transition-all text-base"
                >
                  <Zap className="w-5 h-5" />
                  <span>Launch Judging Portal</span>
                </Link>
                <a
                  href="#features"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 font-medium px-8 py-3.5 rounded-xl transition-all text-base"
                >
                  <span>Explore Features</span>
                </a>
              </div>

              {/* Key Trust Signals Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">Instant</div>
                  <div className="text-xs text-slate-400 font-medium">QR Rubric Scanning</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-violet-400 mb-1">100%</div>
                  <div className="text-xs text-slate-400 font-medium">Score Immutability</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-white mb-1">Real-Time</div>
                  <div className="text-xs text-slate-400 font-medium">Live Leaderboards</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-400 mb-1">0</div>
                  <div className="text-xs text-slate-400 font-medium">Paper Rubrics Needed</div>
                </div>
              </div>
            </div>
          </section>

          {/* Core Features Section */}
          <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Engineered for High-Stakes Hackathon Judging
              </h2>
              <p className="text-slate-400 text-base sm:text-lg">
                Built from the ground up to solve the chaotic scoring, delayed results, and manual data entry of traditional developer competitions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="glass card-hover rounded-2xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center mb-5">
                  <QrCode className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">QR Code Quick-Scan</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Judges scan team table badges using any mobile device camera to instantly load custom evaluation rubrics with zero searching or typos.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass card-hover rounded-2xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Score Immutability</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Write-once architecture backed by strict database constraints guarantees scores cannot be manipulated, replaced, or tampered with once submitted.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass card-hover rounded-2xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-5">
                  <Trophy className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Live Dynamic Leaderboards</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Automated score averaging aggregates marks across all judges in real time. Organizers can project live rankings or keep them blinded until stage finals.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass card-hover rounded-2xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-5">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Mobile-First Touch Rubrics</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Optimized for fast tap-and-slide mobile scoring during live table demos. Works seamlessly without requiring judges to install native apps.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="glass card-hover rounded-2xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center mb-5">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Multi-Round & Criteria</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Structure your hackathon across Preliminary, Semi-Final, and Grand Finale rounds. Configure customizable rubrics like Innovation, Technical Depth, and Pitch.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="glass card-hover rounded-2xl p-6 border border-slate-800">
                <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-5">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Role-Based Access Control</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Clear separation of concerns between Super Admins and Judges with Argon2 password hashing, secure HttpOnly tokens, and API rate limiting.
                </p>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <section id="how-it-works" className="py-20 md:py-28 bg-slate-900/40 border-y border-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  How Evalix Powers Your Hackathon
                </h2>
                <p className="text-slate-400 text-base sm:text-lg">
                  A frictionless 3-step workflow designed for organizers and evaluators.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="relative glass rounded-2xl p-8 border border-slate-800">
                  <div className="text-4xl font-black text-violet-500/20 absolute top-4 right-6">
                    01
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-violet-600/20 text-violet-400 flex items-center justify-center mb-5 font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Setup Teams & Roster</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Admins create judge credentials, register participant teams, define evaluation criteria, and generate table QR codes with one click.
                  </p>
                </div>

                <div className="relative glass rounded-2xl p-8 border border-slate-800">
                  <div className="text-4xl font-black text-indigo-500/20 absolute top-4 right-6">
                    02
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center mb-5 font-bold">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Scan, Evaluate & Lock</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Judges walk up to booths, scan team QR stands with their smartphone, score against standard rubrics, and finalize audit-proof marks.
                  </p>
                </div>

                <div className="relative glass rounded-2xl p-8 border border-slate-800">
                  <div className="text-4xl font-black text-pink-500/20 absolute top-4 right-6">
                    03
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-pink-600/20 text-pink-400 flex items-center justify-center mb-5 font-bold">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Instant Live Leaderboard</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Scores automatically synchronize into the admin console. View overall rankings, individual criteria breakdowns, and crown winners without human error.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Security & Immutability Section */}
          <section id="security" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass rounded-3xl p-8 md:p-12 border border-slate-800 relative overflow-hidden">
              <div className="absolute -right-20 -top-20 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tamper-Proof Architecture
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Built on Score Immutability & Full Transparency
                </h2>
                <p className="text-slate-300 text-base leading-relaxed mb-8">
                  Hackathon judging disputes damage participant trust. Evalix incorporates cryptographic principles and write-once data rules: once a judge locks in their evaluation, the score is permanent and cannot be modified or re-submitted.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Unique database constraints per judge, team, and round
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Argon2 password hashing & HttpOnly secure cookies
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Zero client-side score computation or tampering vectors
                    </span>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">
                      Full audit logs and transparent criteria aggregations
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-slate-400 text-base">
                Everything you need to know about Evalix and hackathon evaluation.
              </p>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <details
                  key={index}
                  className="group glass rounded-xl border border-slate-800/80 p-5 open:border-violet-600/40 transition-all"
                >
                  <summary className="flex items-center justify-between cursor-pointer font-semibold text-slate-200 group-open:text-violet-300 text-base list-none">
                    <span className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-violet-400 shrink-0" />
                      {faq.question}
                    </span>
                    <span className="text-slate-500 group-open:rotate-180 transition-transform duration-200">
                      ▼
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-slate-400 leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Banner Section */}
          <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-700 p-8 sm:p-12 text-center text-white shadow-2xl shadow-violet-600/20 overflow-hidden">
              <div className="relative z-10 max-w-2xl mx-auto">
                <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">
                  Ready to Run Seamless Hackathon Judging?
                </h2>
                <p className="text-violet-100 text-base mb-8">
                  Sign in to the portal as an evaluator or log into the admin console to oversee INNOV8 3.0 teams and live leaderboards.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/login"
                    className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-100 font-bold px-8 py-3.5 rounded-xl shadow-lg transition-all"
                  >
                    Enter Judging Portal
                  </Link>
                  <a
                    href="https://github.com/Abhishekkrsingh2023/Evalix"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto bg-violet-800/60 hover:bg-violet-800 text-white border border-violet-400/30 font-semibold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
                  >
                    <GithubIcon className="w-5 h-5" />
                    <span>View on GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Semantic Footer */}
        <footer className="border-t border-slate-900 bg-slate-950 py-12 text-sm text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-300">Evalix</span>
              <span className="text-slate-600">·</span>
              <span>Official Judging System for INNOV8 3.0</span>
            </div>

            <nav className="flex items-center gap-6 text-xs sm:text-sm">
              <a href="#features" className="hover:text-slate-300 transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="hover:text-slate-300 transition-colors">
                How It Works
              </a>
              <a href="#security" className="hover:text-slate-300 transition-colors">
                Security
              </a>
              <a href="#faq" className="hover:text-slate-300 transition-colors">
                FAQ
              </a>
              <Link href="/login" className="hover:text-slate-300 transition-colors">
                Sign In
              </Link>
            </nav>

            <div className="text-xs text-slate-600">
              © {new Date().getFullYear()} Evalix. Open source under MIT License.
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
