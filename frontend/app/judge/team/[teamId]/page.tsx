'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { teamsApi, scoresApi } from '@/lib/api';
import { Team, TeamScoreStatus } from '@/types';
import { Card, Badge, Button, Skeleton, ScoreBar } from '@/components/ui';
import { formatDate, getApiError } from '@/lib/utils';
import { Users, ChevronRight, Lock, CheckCircle2, PlayCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function JudgeTeamPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [status, setStatus] = useState<TeamScoreStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;
    let ignore = false;
    const load = async () => {
      try {
        const [teamRes, statusRes] = await Promise.all([
          teamsApi.get(teamId),
          scoresApi.teamStatus(teamId),
        ]);
        if (!ignore) {
          setTeam(teamRes.data);
          setStatus(statusRes.data);
        }
      } catch (err) {
        if (!ignore) {
          toast.error(getApiError(err));
          router.push('/judge/scan');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    load();

    return () => {
      ignore = true;
    };
  }, [teamId, router]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!team || !status) return null;

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Back */}
      <button onClick={() => router.push('/judge/scan')} className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Scanner
      </button>

      {/* Team Card */}
      <Card className="gradient-border">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="info">{team.team_id}</Badge>
            </div>
            <h1 className="text-xl font-bold text-slate-100 mt-1">{team.team_name}</h1>
            <p className="text-slate-400 text-sm">Leader: {team.leader_name}</p>
          </div>
        </div>
      </Card>

      {/* Round Cards */}
      {([status.round_1, status.round_2] as typeof status.round_1[]).map((roundStatus) => {
        const isSubmitted = roundStatus.submitted;
        const score = roundStatus.score;
        const round = roundStatus.round as 1 | 2;

        return (
          <Card key={round} className={isSubmitted ? 'border border-emerald-500/20' : ''}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-200 flex items-center gap-2">
                {isSubmitted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-violet-400" />
                )}
                Round {round}
              </h2>
              {isSubmitted ? (
                <Badge variant="success">
                  <Lock className="w-3 h-3" />
                  Submitted
                </Badge>
              ) : (
                <Badge variant="info">Not Started</Badge>
              )}
            </div>

            {isSubmitted && score ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-400">Q&amp;A</span>
                    <span className="text-slate-300">{score.qa_score} / 10</span>
                  </div>
                  <ScoreBar value={score.qa_score} />

                  <div className="flex items-center justify-between text-sm mb-1 mt-3">
                    <span className="text-slate-400">Innovation &amp; Originality</span>
                    <span className="text-slate-300">{score.innovation_score} / 10</span>
                  </div>
                  <ScoreBar value={score.innovation_score} />

                  <div className="flex items-center justify-between text-sm mb-1 mt-3">
                    <span className="text-slate-400">Execution &amp; MVP</span>
                    <span className="text-slate-300">{score.execution_score} / 10</span>
                  </div>
                  <ScoreBar value={score.execution_score} />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50 mt-4">
                  <span className="font-semibold text-slate-300">Round {round} Total</span>
                  <span className="text-2xl font-bold text-violet-400">
                    {score.total_score}<span className="text-slate-500 text-base font-normal">/30</span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span className="flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    READ ONLY — Score is immutable
                  </span>
                  <span>{formatDate(score.submitted_at)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm mb-4">This round has not been scored yet.</p>
                <Link href={`/judge/team/${teamId}/round/${round}`}>
                  <Button size="lg" className="w-full">
                    <PlayCircle className="w-5 h-5" />
                    Score Round {round}
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
