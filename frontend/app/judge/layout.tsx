'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Zap, LogOut, User, QrCode, History, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/judge', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/judge/scan', label: 'Scan QR', icon: QrCode },
  { href: '/judge/history', label: 'My Scores', icon: History },
];

export default function JudgeLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      fetchMe().then((u) => {
        if (!u) { router.push('/login'); return; }
        if (u.role === 'SUPER_ADMIN') { router.push('/admin'); }
      });
    } else if (isAdmin) {
      router.push('/admin');
    }
  }, [user, isAdmin, fetchMe, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="glass border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-100 text-sm">INNOV8 3.0</span>
              <span className="text-slate-500 text-xs ml-2">Judge Portal</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    active ? 'bg-violet-600/20 text-violet-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-slate-300 font-medium">{user?.name || '...'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-sm transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass border-t border-slate-800 z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl text-xs font-medium transition-all',
                  active ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>
    </div>
  );
}
