'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { LeaderboardResponse, TeamLeaderboardEntry } from '@/types';
import { Card, Skeleton } from '@/components/ui';
import { getStatusBadge } from '@/lib/utils';
import {
  Trophy,
  Medal,
  Crown,
  Radio,
  Eye,
  EyeOff,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

type LeaderboardTab = '1' | '2' | 'final';

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_6px_rgba(203,213,225,0.4)]" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]" />;
  return <span className="text-slate-400 font-bold text-sm">#{rank}</span>;
}

export default function AdminScoresPage() {
  const [isLive, setIsLive] = useState(false);
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('final');
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchLeaderboard = useCallback(async (tab: LeaderboardTab) => {
    try {
      setLoading(true);
      const res = await adminApi.leaderboard(tab);
      setData(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch only when live is enabled or tab changes while live
  useEffect(() => {
    if (isLive) {
      fetchLeaderboard(activeTab);
    }
  }, [isLive, activeTab, fetchLeaderboard]);

  // Polling auto-refresh when live is active
  useEffect(() => {
    if (!isLive || !autoRefresh) return;
    const interval = setInterval(() => {
      adminApi
        .leaderboard(activeTab)
        .then((r) => {
          setData(r.data);
          setLastRefreshed(new Date());
        })
        .catch((err) => console.error('Auto refresh error:', err));
    }, 12000);

    return () => clearInterval(interval);
  }, [isLive, autoRefresh, activeTab]);

  // Sort and re-rank entries for client view
  const displayEntries: TeamLeaderboardEntry[] = data
    ? [...data.entries].sort((a, b) => {
        if (activeTab === '1') {
          const scoreA = a.round_1_avg ?? -1;
          const scoreB = b.round_1_avg ?? -1;
          return scoreB - scoreA;
        } else if (activeTab === '2') {
          const scoreA = a.round_2_avg ?? -1;
          const scoreB = b.round_2_avg ?? -1;
          return scoreB - scoreA;
        } else {
          const scoreA = a.overall_avg ?? -1;
          const scoreB = b.overall_avg ?? -1;
          return scoreB - scoreA;
        }
      }).map((entry, idx) => ({ ...entry, rank: idx + 1 }))
    : [];

  const top3 = displayEntries.filter((e) => {
    if (activeTab === '1') return e.round_1_avg !== null && e.rank <= 3;
    if (activeTab === '2') return e.round_2_avg !== null && e.rank <= 3;
    return e.overall_avg !== null && e.rank <= 3;
  });

  const getActiveScore = (entry: TeamLeaderboardEntry) => {
    if (activeTab === '1') return entry.round_1_avg;
    if (activeTab === '2') return entry.round_2_avg;
    return entry.overall_avg;
  };

  const getTabTitle = () => {
    if (activeTab === '1') return 'Round 1 (Day 1)';
    if (activeTab === '2') return 'Round 2 (Day 2)';
    return 'Final Score';
  };

  return (
    <div className="space-y-6 min-w-0 w-full max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5 sm:gap-3">
            <Trophy className="w-6 h-6 sm:w-7 h-7 text-amber-400 shrink-0" />
            <span>Final Leaderboard</span>
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Sorted by overall average score · Read-only
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-violet-300 text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
        >
          <span className={loading ? 'animate-spin inline-block' : ''}>↻</span>
          <span>Refresh</span>
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <Card className="text-center p-3 sm:p-5">
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Teams</p>
            <p className="text-2xl sm:text-3xl font-bold text-violet-400 mt-1">{data.total_teams}</p>
          </Card>
          <Card className="text-center p-3 sm:p-5">
            <p className="text-slate-400 text-xs sm:text-sm font-medium">Active Judges</p>
            <p className="text-2xl sm:text-3xl font-bold text-violet-400 mt-1">{data.total_judges}</p>
          </Card>
        </div>
      </div>

      {/* Leaderboard Card Container */}
      <Card className="overflow-hidden p-0 min-w-0 w-full">
        {loading ? (
          <div className="p-4 sm:p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : !data || data.entries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No scores submitted yet</p>
            <p className="text-slate-500 text-xs mt-1">Scores will appear here once judges start submitting evaluations.</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {data.entries.filter(e => e.rank <= 3 && e.overall_avg !== null).length > 0 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-5 border-b border-slate-800/80 bg-slate-900/20">
                {data.entries.filter(e => e.rank <= 3 && e.overall_avg !== null).map((entry) => (
                  <div
                    key={entry.team_id}
                    className={`text-center p-2.5 sm:p-4 rounded-xl border flex flex-col items-center justify-between min-w-0 ${
                      entry.rank === 1 ? 'border-yellow-500/30 bg-yellow-500/5 shadow-sm shadow-yellow-500/10' :
                      entry.rank === 2 ? 'border-slate-400/30 bg-slate-400/5' :
                      'border-amber-600/30 bg-amber-600/5'
                    }`}
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-slate-800/60 border border-slate-700/50 mb-1">
                      <RankIcon rank={entry.rank} />
                    </div>
                    <p className="font-semibold text-slate-200 text-xs sm:text-sm mt-1 truncate w-full" title={entry.team_name}>
                      {entry.team_name}
                    </p>
                    <p className="text-[10px] sm:text-xs text-slate-500 truncate w-full">{entry.team_id}</p>
                    <p className={`text-base sm:text-2xl font-bold mt-1.5 sm:mt-2 ${
                      entry.rank === 1 ? 'text-yellow-400' :
                      entry.rank === 2 ? 'text-slate-300' :
                      'text-amber-500'
                    }`}>
                      {entry.overall_avg?.toFixed(1)}
                    </p>
                    <p className="text-slate-500 text-[10px] sm:text-xs">avg</p>
                  </div>
                ))}
              </div>
            ) : displayEntries.length === 0 ? (
              <div className="text-center py-16">
                <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">No scores submitted yet</p>
              </div>
            ) : (
              <>
                {/* Top 3 Podium for Selected View */}
                {top3.length > 0 && (
                  <div className="p-5 border-b border-slate-800 bg-gradient-to-b from-slate-800/40 to-transparent">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-yellow-400" />
                        Top Performers · {getTabTitle()}
                      </h3>
                      <span className="text-xs text-slate-500">
                        Ranked by {getTabTitle()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {top3.map((entry) => {
                        const scoreVal = getActiveScore(entry);
                        return (
                          <div
                            key={entry.team_id}
                            className={`text-center p-4 rounded-xl border transition-all ${
                              entry.rank === 1
                                ? 'border-yellow-500/40 bg-yellow-500/10 shadow-lg shadow-yellow-500/5'
                                : entry.rank === 2
                                ? 'border-slate-400/40 bg-slate-400/10'
                                : 'border-amber-600/40 bg-amber-600/10'
                            }`}
                          >
                            <div className="flex justify-center mb-1">
                              <RankIcon rank={entry.rank} />
                            </div>
                            <p className="font-semibold text-slate-100 text-sm mt-1 truncate">
                              {entry.team_name}
                            </p>
                            <p className="text-xs text-slate-500">{entry.team_id}</p>
                            <div className="mt-2">
                              <span
                                className={`text-2xl font-black ${
                                  entry.rank === 1
                                    ? 'text-yellow-400'
                                    : entry.rank === 2
                                    ? 'text-slate-200'
                                    : 'text-amber-500'
                                }`}
                              >
                                {scoreVal !== null && scoreVal !== undefined
                                  ? scoreVal.toFixed(1)
                                  : '—'}
                              </span>
                              <span className="text-slate-500 text-xs ml-1">
                                {activeTab === 'final' ? 'overall avg' : '/30 avg'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Full Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-800/30">
                        <th className="px-4 py-3.5 text-center text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">
                          Rank
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Team
                        </th>
                        <th
                          className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                            activeTab === '1'
                              ? 'text-violet-400 bg-violet-500/10 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          Round 1 (Day 1)
                        </th>
                        <th
                          className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                            activeTab === '2'
                              ? 'text-violet-400 bg-violet-500/10 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          Round 2 (Day 2)
                        </th>
                        <th
                          className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${
                            activeTab === 'final'
                              ? 'text-amber-400 bg-amber-500/10 font-bold'
                              : 'text-slate-400'
                          }`}
                        >
                          Final Score
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Judges
                        </th>
                        <th className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {displayEntries.map((entry) => (
                        <tr
                          key={entry.team_id}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3.5 text-center w-16">
                            <div className="flex items-center justify-center">
                              <RankIcon rank={entry.rank} />
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <Link href={`/admin/teams/${entry.team_id}`} className="group">
                              <p className="font-semibold text-slate-200 group-hover:text-violet-400 transition-colors">
                                {entry.team_name}
                              </p>
                              <p className="text-slate-500 text-xs">{entry.team_id} · {entry.leader_name}</p>
                            </Link>
                          </td>
                          <td
                            className={`px-4 py-3.5 font-medium ${
                              activeTab === '1'
                                ? 'bg-violet-500/5 text-violet-300 font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            {entry.round_1_avg !== null ? `${entry.round_1_avg.toFixed(1)}/30` : '—'}
                          </td>
                          <td
                            className={`px-4 py-3.5 font-medium ${
                              activeTab === '2'
                                ? 'bg-violet-500/5 text-violet-300 font-bold'
                                : 'text-slate-300'
                            }`}
                          >
                            {entry.round_2_avg !== null ? `${entry.round_2_avg.toFixed(1)}/30` : '—'}
                          </td>
                          <td
                            className={`px-4 py-3.5 ${
                              activeTab === 'final' ? 'bg-amber-500/5' : ''
                            }`}
                          >
                            <span
                              className={`text-lg font-bold ${
                                activeTab === 'final' ? 'text-amber-400' : 'text-slate-200'
                              }`}
                            >
                              {entry.overall_avg !== null ? entry.overall_avg.toFixed(1) : '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-sm">
                            {entry.judges_completed}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${getStatusBadge(
                                entry.status
                              )}`}
                            >
                              {entry.status === 'complete'
                                ? '✓ Complete'
                                : entry.status === 'partial'
                                ? '~ Partial'
                                : '○ Pending'}
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

            {/* Mobile Card List (visible on small screens < md) */}
            <div className="md:hidden divide-y divide-slate-800/60">
              {data.entries.map((entry) => (
                <div key={entry.team_id} className="p-3.5 sm:p-4 space-y-2.5 hover:bg-slate-800/20 transition-colors">
                  {/* Top row: Rank, Team Name, and Overall Score */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shrink-0">
                        <RankIcon rank={entry.rank} />
                      </div>
                      <Link href={`/admin/teams/${entry.team_id}`} className="min-w-0 flex-1 group">
                        <p className="font-semibold text-slate-200 group-hover:text-violet-400 transition-colors text-sm truncate">
                          {entry.team_name}
                        </p>
                        <p className="text-slate-500 text-[11px] truncate">{entry.team_id}</p>
                      </Link>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-violet-400 font-bold text-base sm:text-lg leading-tight">
                        {entry.overall_avg !== null ? entry.overall_avg.toFixed(1) : '—'}
                      </div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold">avg</span>
                    </div>
                  </div>

                  {/* Sub-stats row */}
                  <div className="grid grid-cols-3 gap-1.5 py-1.5 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">R1 Avg</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {entry.round_1_avg !== null ? `${entry.round_1_avg.toFixed(1)}/30` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">R2 Avg</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {entry.round_2_avg !== null ? `${entry.round_2_avg.toFixed(1)}/30` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Judges</span>
                      <span className="text-slate-300 font-medium text-xs">
                        {entry.judges_completed} done
                      </span>
                    </div>
                  </div>

                  {/* Status row */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500 text-[11px]">Evaluation Status:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getStatusBadge(entry.status)}`}>
                      {entry.status === 'complete' ? '✓ Complete' : entry.status === 'partial' ? '~ Partial' : '○ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (hidden on mobile, visible on md+) */}
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full min-w-[640px]">
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

      {/* Info Card */}
      <Card className="border border-slate-700/50 p-4 sm:p-5">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-400 mb-1.5">Score Calculation Method</h3>
        <p className="text-slate-500 text-[11px] sm:text-xs leading-relaxed">
          Scores are aggregated as follows: for each team, all submitted Round 1 scores across judges are averaged, and all Round 2 scores are averaged. 
          The Overall Average is the mean of all submitted scores across both rounds and all judges. 
          Teams are ranked by Overall Average (descending). All calculations are performed server-side and are read-only.
        </p>
      </Card>
    </div>
  );
}
