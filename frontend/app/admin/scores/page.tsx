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
    <div className="space-y-6">
      {/* Header with Live Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
              <Trophy className="w-7 h-7 text-amber-400" />
              Leaderboard
            </h1>
            {isLive ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live Broadcast
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                <EyeOff className="w-3.5 h-3.5" />
                Standby / Hidden
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            {isLive
              ? 'Real-time scores & rankings across Day 1, Day 2, and Final calculations.'
              : 'Leaderboard is currently paused. Toggle "Live Leaderboard" to view live scores.'}
          </p>
        </div>

        {/* Live Toggle Switch */}
        <div className="flex items-center gap-3 bg-slate-800/80 p-1.5 px-3 rounded-2xl border border-slate-700">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isLive ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-semibold text-slate-300">
              Live Leaderboard
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isLive}
            onClick={() => setIsLive(!isLive)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isLive ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isLive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* When Live is OFF: Standby Screen */}
      {!isLive ? (
        <Card className="text-center py-16 px-6 border-dashed border-slate-700 bg-slate-900/40">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <EyeOff className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Leaderboard is in Standby Mode</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mt-2 leading-relaxed">
            The leaderboard is currently hidden to prevent revealing scores early. 
            Toggle the <strong>Live Leaderboard</strong> button above to view live standings filtered by Round 1, Round 2, or Final Score.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setIsLive(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-600/30 transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              Turn On Live Leaderboard
            </button>
          </div>
        </Card>
      ) : (
        /* When Live is ON: Full Interactive Leaderboard */
        <div className="space-y-6">
          {/* Round / Score Filter Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-1.5 p-1 bg-slate-800/80 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setActiveTab('1')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === '1'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span>🥇</span> Round 1 (Day 1)
              </button>
              <button
                onClick={() => setActiveTab('2')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === '2'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <span>🥈</span> Round 2 (Day 2)
              </button>
              <button
                onClick={() => setActiveTab('final')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === 'final'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" /> Final Score
              </button>
            </div>

            {/* Refresh controls */}
            <div className="flex items-center gap-3 px-2">
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-slate-700 text-violet-500 focus:ring-violet-500 bg-slate-800"
                />
                Auto-sync (12s)
              </label>

              <button
                onClick={() => fetchLeaderboard(activeTab)}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-violet-400' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {data && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-3.5 text-center bg-slate-900/50">
                <p className="text-slate-400 text-xs">Total Teams</p>
                <p className="text-2xl font-bold text-violet-400 mt-0.5">{data.total_teams}</p>
              </Card>
              <Card className="p-3.5 text-center bg-slate-900/50">
                <p className="text-slate-400 text-xs">Active Judges</p>
                <p className="text-2xl font-bold text-indigo-400 mt-0.5">{data.total_judges}</p>
              </Card>
              <Card className="p-3.5 text-center bg-slate-900/50">
                <p className="text-slate-400 text-xs">Viewing Metric</p>
                <p className="text-sm font-semibold text-slate-200 mt-1 truncate">
                  {getTabTitle()}
                </p>
              </Card>
              <Card className="p-3.5 text-center bg-slate-900/50">
                <p className="text-slate-400 text-xs">Last Updated</p>
                <p className="text-xs font-medium text-slate-400 mt-1">
                  {lastRefreshed ? lastRefreshed.toLocaleTimeString() : 'Just now'}
                </p>
              </Card>
            </div>
          )}

          {/* Leaderboard Table & Podium Container */}
          <Card className="overflow-hidden p-0 border border-slate-800 bg-slate-900/60">
            {loading && !data ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
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

          {/* Scoring Methodology Note */}
          <Card className="border border-slate-800 bg-slate-900/30">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-violet-400" />
              Scoring Methodology
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              <strong>Round 1 (Day 1):</strong> Average of all judge totals submitted during Round 1 (out of 30).
              <br />
              <strong>Round 2 (Day 2):</strong> Average of all judge totals submitted during Round 2 (out of 30). Judges may only evaluate Round 2 after completing Round 1.
              <br />
              <strong>Final Score:</strong> Overall average across all submitted rounds and judges. All scores are permanent and tamper-proof.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
