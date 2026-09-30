'use client';

import { useEffect, useState } from 'react';
import { scoresApi } from '@/lib/api';
import { ScoreResponse } from '@/types';
import { Card, Badge, Skeleton, ScoreBar } from '@/components/ui';
import { formatDate } from '@/lib/utils';
import { History, Lock, Users } from 'lucide-react';
import Link from 'next/link';

// Round-specific criteria for compact history display
const ROUND_1_CRITERIA: { key: keyof ScoreResponse; label: string }[] = [
  { key: 'innovation_creativity_score', label: 'Innovation & Creativity' },
  { key: 'technical_implementation_score', label: 'Technical Implementation' },
  { key: 'ui_ux_score', label: 'UI & UX' },
  { key: 'impact_scope_score', label: 'Impact & Scope' },
  { key: 'research_development_score', label: 'Research & Development' },
];

const ROUND_2_CRITERIA: { key: keyof ScoreResponse; label: string }[] = [
  { key: 'project_completeness_score', label: 'Project Completeness' },
  { key: 'deployment_github_score', label: 'Deployment & GitHub' },
  { key: 'qa_score', label: 'Q&A' },
  { key: 'testing_prototype_score', label: 'Testing & Prototype' },
  { key: 'documentation_score', label: 'Documentation' },
];

const MAX_ROUND_SCORE = 50;

export default function JudgeHistoryPage() {
  const [scores, setScores] = useState<ScoreResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scoresApi.my().then((r) => setScores(r.data)).finally(() => setLoading(false));
  }, []);

  // Group by team
  const grouped = scores.reduce((acc, score) => {
    const key = score.team_identifier;
    if (!acc[key]) acc[key] = { name: score.team_name, identifier: key, scores: [] };
    acc[key].scores.push(score);
    return acc;
  }, {} as Record<string, { name: string; identifier: string; scores: ScoreResponse[] }>);

  const groups = Object.values(grouped);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <History className="w-6 h-6 text-violet-400" />
          My Submitted Scores
        </h1>
        <p className="text-slate-400 mt-1">All scores are immutable after submission</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><Skeleton className="h-32 w-full" /></Card>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <Card className="text-center py-12">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-slate-400 font-medium">No scores submitted yet</h3>
          <p className="text-slate-500 text-sm mt-1">Start by scanning a team QR code</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {groups.map(({ name, identifier, scores: teamScores }) => {
            const r1 = teamScores.find((s) => s.round === 1);
            const r2 = teamScores.find((s) => s.round === 2);
            const bothDone = r1 && r2;

            return (
              <Link key={identifier} href={`/judge/team/${identifier}`}>
                <Card hover className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="info">{identifier}</Badge>
                      <h3 className="font-semibold text-slate-200">{name}</h3>
                    </div>
                    {bothDone ? (
                      <Badge variant="success">
                        <Lock className="w-3 h-3" />
                        Complete
                      </Badge>
                    ) : (
                      <Badge variant="warning">Partial</Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[r1, r2].map((score, idx) => {
                      const roundLabel = idx === 0 ? 'Round 1 (Day 1)' : 'Round 2 (Day 2)';
                      const criteria = idx === 0 ? ROUND_1_CRITERIA : ROUND_2_CRITERIA;

                      if (!score) {
                        return (
                          <div key={idx} className="p-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
                            <p className="text-slate-500 text-sm font-medium mb-1">{roundLabel}</p>
                            <p className="text-slate-600 text-xs">Not submitted</p>
                          </div>
                        );
                      }
                      return (
                        <div key={score.id} className="p-3 bg-slate-800/50 rounded-xl border border-violet-500/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="submitted">{roundLabel}</Badge>
                            <span className="text-violet-400 font-bold">{score.total_score}/{MAX_ROUND_SCORE}</span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            {criteria.map(({ key, label }) => {
                              const val = score[key] as number;
                              return (
                                <div key={key}>
                                  <div className="flex justify-between text-slate-400">
                                    <span>{label}</span><span>{val}/10</span>
                                  </div>
                                  <ScoreBar value={val} />
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-slate-600 text-xs flex items-center gap-1 pt-1">
                            <Lock className="w-3 h-3" />
                            {formatDate(score.submitted_at)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
