'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import { TeamDetailWithScores } from '@/types';
import { Card, Badge, Skeleton, ScoreBar, Button } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ArrowLeft, Lock, Users, Award, QrCode } from 'lucide-react';
import { QrModal } from '@/components/QrModal';

export default function AdminTeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<TeamDetailWithScores | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    let ignore = false;
    adminApi
      .teamDetail(teamId)
      .then((r) => {
        if (!ignore) setDetail(r.data);
      })
      .catch(() => {
        if (!ignore) {
          toast.error('Team not found');
          router.push('/admin/teams');
        }
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [teamId, router]);

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );
  if (!detail) return null;

  const { team, judge_scores, round_1_avg, round_2_avg, overall_avg, total_submissions } = detail;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/teams')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to Teams
      </button>

      {/* Team Header */}
      <Card className="gradient-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <Badge variant="info">{team.team_id}</Badge>
              <h1 className="text-2xl font-bold text-slate-100 mt-1">{team.team_name}</h1>
              <p className="text-slate-400">Leader: {team.leader_name}</p>
              <p className="text-slate-500 text-xs mt-1">Registered {formatDate(team.created_at)}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowQr(true)} className="flex-shrink-0">
            <QrCode className="w-4 h-4" />
            View QR
          </Button>
        </div>

        {/* QR Modal */}
        {showQr && <QrModal team={team} onClose={() => setShowQr(false)} />}

        {/* Aggregate stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-700/50">
          {[
            { label: 'Round 1 Avg', value: round_1_avg !== null ? `${round_1_avg}/30` : '—' },
            { label: 'Round 2 Avg', value: round_2_avg !== null ? `${round_2_avg}/30` : '—' },
            { label: 'Overall Avg', value: overall_avg !== null ? `${overall_avg}/30` : '—' },
            { label: 'Total Submissions', value: total_submissions },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-3 bg-slate-800/50 rounded-xl">
              <p className="text-slate-500 text-xs font-medium">{label}</p>
              <p className="text-violet-400 font-bold text-lg mt-1">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* READ-ONLY banner */}
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
        <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-amber-300 text-sm font-medium">
          This is a read-only view. No scores can be modified through this interface.
        </p>
      </div>

      {/* Judge Scores */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Award className="w-5 h-5 text-violet-400" />
          Judge Scores
        </h2>

        {judge_scores.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-slate-400">No scores submitted yet</p>
          </Card>
        ) : (
          judge_scores.map((jd) => (
            <Card key={jd.judge_id}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-200">{jd.judge_name}</h3>
                  <p className="text-slate-500 text-xs">{jd.judge_email}</p>
                </div>
                {jd.judge_total !== null && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Judge Total</p>
                    <p className="text-2xl font-bold text-violet-400">{jd.judge_total}<span className="text-slate-500 text-sm font-normal">/60</span></p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[jd.round_1, jd.round_2].map((score, idx) => {
                  if (!score) {
                    return (
                      <div key={idx} className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
                        <p className="text-slate-500 text-sm font-medium">Round {idx + 1}</p>
                        <p className="text-slate-600 text-xs mt-1">Not submitted</p>
                      </div>
                    );
                  }
                  return (
                    <div key={score.round} className="p-4 bg-slate-800/50 rounded-xl border border-violet-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="submitted">Round {score.round}</Badge>
                        <span className="text-violet-400 font-bold">{score.total_score}/30</span>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: 'Q&A', val: score.qa_score },
                          { label: 'Innovation', val: score.innovation_score },
                          { label: 'Execution', val: score.execution_score },
                        ].map(({ label, val }) => (
                          <div key={label}>
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                              <span>{label}</span><span>{val}/10</span>
                            </div>
                            <ScoreBar value={val} />
                          </div>
                        ))}
                      </div>
                      <p className="text-slate-600 text-xs flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {formatDate(score.submitted_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
