'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';
import { Zap, LogOut, LayoutDashboard, Users, UserCheck, Trophy } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/judges', label: 'Judges', icon: UserCheck },
  { href: '/admin/scores', label: 'Leaderboard', icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, logout, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      fetchMe().then((u) => {
        if (!u) { router.push('/login'); return; }
        if (u.role !== 'SUPER_ADMIN') { router.push('/judge'); }
      });
    } else if (!isAdmin) {
      router.push('/judge');
    }
  }, [user, isAdmin, fetchMe, router]);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 glass border-r border-slate-800 fixed h-full z-30">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-100">INNOV8 3.0</p>
              <p className="text-slate-500 text-xs">Admin Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                  active
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{user?.name?.[0] || 'A'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-slate-200 text-sm font-medium truncate">{user?.name || 'Admin'}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email || ''}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 text-sm transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <header className="lg:hidden fixed top-0 inset-x-0 glass border-b border-slate-800 z-40 h-14 flex items-center px-4 gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-slate-100 text-sm flex-1">INNOV8 3.0 Admin</span>
        <button onClick={handleLogout} className="text-slate-500 hover:text-red-400">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 glass border-t border-slate-800 z-40">
        <div className="flex items-center justify-around h-16">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-all',
                  active ? 'text-violet-400' : 'text-slate-500'
                )}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
