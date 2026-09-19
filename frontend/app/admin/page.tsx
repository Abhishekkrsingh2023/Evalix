'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { DashboardStats } from '@/types';
import { StatCard, Card, Skeleton } from '@/components/ui';
import { Users, UserCheck, CheckCircle, Clock, BarChart3, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    adminApi
      .dashboard()
      .then((r) => {
        if (!ignore) setStats(r.data);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Admin Dashboard</h1>
        <p className="text-slate-400 mt-1">INNOV8 3.0 Hackathon Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <Card key={i}><Skeleton className="h-20" /></Card>)
        ) : stats ? (
          <>
            <StatCard title="Total Teams" value={stats.total_teams} icon={<Users className="w-6 h-6 text-white" />} color="from-violet-600 to-indigo-600" />
            <StatCard title="Total Judges" value={stats.total_judges} icon={<UserCheck className="w-6 h-6 text-white" />} color="from-blue-600 to-cyan-600" />
            <StatCard title="Round 1 Submissions" value={stats.round_1_submissions} icon={<BarChart3 className="w-6 h-6 text-white" />} color="from-emerald-600 to-teal-600" />
            <StatCard title="Round 2 Submissions" value={stats.round_2_submissions} icon={<BarChart3 className="w-6 h-6 text-white" />} color="from-amber-600 to-orange-600" />
            <StatCard title="Completed Teams" value={stats.completed_teams} icon={<CheckCircle className="w-6 h-6 text-white" />} color="from-emerald-600 to-green-600" subtitle="Both rounds judged" />
            <StatCard title="Pending Teams" value={stats.pending_teams} icon={<Clock className="w-6 h-6 text-white" />} color="from-slate-600 to-slate-700" subtitle="Awaiting judging" />
          </>
        ) : null}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/teams', label: 'Manage Teams', desc: 'Register & view teams', icon: Users, color: 'from-violet-600 to-indigo-600' },
          { href: '/admin/judges', label: 'Manage Judges', desc: 'Add & control judges', icon: UserCheck, color: 'from-blue-600 to-cyan-600' },
          { href: '/admin/scores', label: 'Leaderboard', desc: 'View final results', icon: Trophy, color: 'from-amber-600 to-orange-600' },
        ].map(({ href, label, desc, icon: Icon, color }) => (
          <Link key={href} href={href}>
            <Card hover className="text-center py-6">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mx-auto mb-3`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-slate-200">{label}</h3>
              <p className="text-slate-500 text-sm mt-1">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Info banner */}
      <Card className="border border-violet-500/20 bg-violet-500/5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Trophy className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-200">Score Immutability Active</h3>
            <p className="text-slate-400 text-sm mt-1">
              All submitted scores are permanently locked. The admin panel provides read-only access to all judging data. 
              No scores can be modified, deleted, or overridden through this interface.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
