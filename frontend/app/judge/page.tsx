'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { scoresApi } from '@/lib/api';
import { ScoreResponse } from '@/types';
import { StatCard, Card, Badge, Skeleton } from '@/components/ui';
import { QrCode, Keyboard, History, Award, CheckCircle, Circle } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function JudgeDashboard() {
  const { user } = useAuth();
  const [scores, setScores] = useState<ScoreResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scoresApi.my().then((r) => {
      setScores(r.data);
    }).finally(() => setLoading(false));
  }, []);

  const round1Count = scores.filter((s) => s.round === 1).length;
  const round2Count = scores.filter((s) => s.round === 2).length;
  const uniqueTeams = new Set(scores.map((s) => s.team_identifier)).size;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Welcome, <span className="gradient-text">{user?.name || '...'}</span> 👋
        </h1>
        <p className="text-slate-400 mt-1">INNOV8 3.0 — Judging Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-16 w-full" /></Card>
          ))
        ) : (
          <>
            <StatCard title="Teams Judged" value={uniqueTeams} icon={<Award className="w-6 h-6 text-white" />} color="from-violet-600 to-indigo-600" />
            <StatCard title="Round 1 Done" value={round1Count} icon={<CheckCircle className="w-6 h-6 text-white" />} color="from-emerald-600 to-teal-600" />
            <StatCard title="Round 2 Done" value={round2Count} icon={<CheckCircle className="w-6 h-6 text-white" />} color="from-blue-600 to-cyan-600" />
            <StatCard title="Total Scores" value={scores.length} icon={<Circle className="w-6 h-6 text-white" />} color="from-amber-600 to-orange-600" />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/judge/scan">
          <Card hover className="text-center py-8 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-violet-500/30 transition-shadow">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-200">Scan Team QR</h3>
            <p className="text-slate-500 text-sm mt-1">Use camera to scan</p>
          </Card>
        </Link>

        <Link href="/judge/scan?mode=manual">
          <Card hover className="text-center py-8 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-shadow">
              <Keyboard className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-200">Enter Team ID</h3>
            <p className="text-slate-500 text-sm mt-1">Type team ID manually</p>
          </Card>
        </Link>

        <Link href="/judge/history">
          <Card hover className="text-center py-8 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg group-hover:shadow-emerald-500/30 transition-shadow">
              <History className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-slate-200">My Judged Teams</h3>
            <p className="text-slate-500 text-sm mt-1">View submitted scores</p>
          </Card>
        </Link>
      </div>

      {/* Recent Scores */}
      {!loading && scores.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Recent Submissions</h2>
          <div className="space-y-3">
            {scores.slice(0, 5).map((score) => (
              <Link key={score.id} href={`/judge/team/${score.team_identifier}`}>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="submitted">Round {score.round}</Badge>
                    <div>
                      <p className="font-medium text-slate-200">{score.team_name}</p>
                      <p className="text-xs text-slate-500">{score.team_identifier} · {formatDate(score.submitted_at)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-violet-400">{score.total_score}<span className="text-slate-500 font-normal text-sm">/30</span></p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
