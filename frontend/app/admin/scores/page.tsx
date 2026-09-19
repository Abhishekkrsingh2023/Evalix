'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { LeaderboardResponse } from '@/types';
import { Card, Skeleton } from '@/components/ui';
import { getStatusBadge } from '@/lib/utils';
import { Trophy, Medal, Crown } from 'lucide-react';
import Link from 'next/link';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
}

export default function AdminScoresPage() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    adminApi
      .leaderboard()
      .then((r) => {
        if (!ignore) setData(r.data);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const refresh = () => {
    setLoading(true);
    adminApi.leaderboard().then((r) => setData(r.data)).finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Trophy className="w-7 h-7 text-amber-400" />
            Final Leaderboard
          </h1>
          <p className="text-slate-400 mt-1">
            Sorted by overall average score · Read-only
          </p>
        </div>
        <button onClick={refresh} className="text-slate-500 hover:text-violet-400 text-sm transition-colors">
          ↻ Refresh
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="text-center">
            <p className="text-slate-400 text-sm">Total Teams</p>
            <p className="text-3xl font-bold text-violet-400 mt-1">{data.total_teams}</p>
          </Card>
          <Card className="text-center">
            <p className="text-slate-400 text-sm">Active Judges</p>
            <p className="text-3xl font-bold text-violet-400 mt-1">{data.total_judges}</p>
          </Card>
        </div>
      )}

      {/* Leaderboard Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : !data || data.entries.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No scores submitted yet</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {data.entries.filter(e => e.rank <= 3 && e.overall_avg !== null).length > 0 && (
              <div className="grid grid-cols-3 gap-3 p-4 border-b border-slate-800">
                {data.entries.filter(e => e.rank <= 3 && e.overall_avg !== null).map((entry) => (
                  <div
                    key={entry.team_id}
                    className={`text-center p-4 rounded-xl border ${
                      entry.rank === 1 ? 'border-yellow-500/30 bg-yellow-500/5' :
                      entry.rank === 2 ? 'border-slate-400/30 bg-slate-400/5' :
                      'border-amber-600/30 bg-amber-600/5'
                    }`}
                  >
                    <RankIcon rank={entry.rank} />
                    <p className="font-semibold text-slate-200 text-sm mt-2 truncate">{entry.team_name}</p>
                    <p className="text-xs text-slate-500">{entry.team_id}</p>
                    <p className={`text-xl font-bold mt-2 ${entry.rank === 1 ? 'text-yellow-400' : entry.rank === 2 ? 'text-slate-300' : 'text-amber-500'}`}>
                      {entry.overall_avg?.toFixed(1)}
                    </p>
                    <p className="text-slate-500 text-xs">avg</p>
                  </div>
                ))}
              </div>
            )}

            {/* Full table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    {['Rank', 'Team', 'Round 1 Avg', 'Round 2 Avg', 'Overall Avg', 'Judges', 'Status'].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {data.entries.map((entry) => (
                    <tr key={entry.team_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-4 w-16">
                        <div className="flex items-center justify-center w-8">
                          <RankIcon rank={entry.rank} />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Link href={`/admin/teams/${entry.team_id}`} className="group">
                          <p className="font-semibold text-slate-200 group-hover:text-violet-400 transition-colors">{entry.team_name}</p>
                          <p className="text-slate-500 text-xs">{entry.team_id}</p>
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-medium">
                        {entry.round_1_avg !== null ? `${entry.round_1_avg.toFixed(1)}/30` : '—'}
                      </td>
                      <td className="px-4 py-4 text-slate-300 font-medium">
                        {entry.round_2_avg !== null ? `${entry.round_2_avg.toFixed(1)}/30` : '—'}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-violet-400 font-bold text-lg">
                          {entry.overall_avg !== null ? entry.overall_avg.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-400 text-sm">
                        {entry.judges_completed}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getStatusBadge(entry.status)}`}>
                          {entry.status === 'complete' ? '✓ Complete' : entry.status === 'partial' ? '~ Partial' : '○ Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      <Card className="border border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-400 mb-2">Score Calculation Method</h3>
        <p className="text-slate-500 text-xs leading-relaxed">
          Scores are aggregated as follows: for each team, all submitted Round 1 scores across judges are averaged, and all Round 2 scores are averaged. 
          The Overall Average is the mean of all submitted scores across both rounds and all judges. 
          Teams are ranked by Overall Average (descending). All calculations are performed server-side and are read-only.
        </p>
      </Card>
    </div>
  );
}
