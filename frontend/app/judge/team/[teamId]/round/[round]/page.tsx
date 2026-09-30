'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { teamsApi, scoresApi } from '@/lib/api';
import { Team } from '@/types';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { getApiError } from '@/lib/utils';
import { ArrowLeft, CheckCircle, AlertTriangle, Send, Lock } from 'lucide-react';

interface ScoreSliderProps {
  label: string;
  description?: string;
  value: number;
  onChange: (val: number) => void;
}

function ScoreSlider({ label, description, value, onChange }: ScoreSliderProps) {
  const color = value >= 8 ? 'text-emerald-400' : value >= 5 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <label className="text-sm font-medium text-slate-300">{label}</label>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
        <div className={`text-2xl font-bold ${color} w-12 text-right shrink-0`}>{value}</div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 w-4">0</span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="flex-1 h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-violet-500"
          style={{
            background: `linear-gradient(to right, #7c3aed ${value * 10}%, #334155 ${value * 10}%)`,
          }}
        />
        <span className="text-xs text-slate-500 w-4">10</span>
      </div>
      <div className="grid grid-cols-11 gap-0.5">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i)}
            className={`h-7 rounded text-xs font-semibold transition-all ${
              i === value
                ? 'bg-violet-600 text-white scale-105'
                : 'bg-slate-700/50 text-slate-500 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Round 1 criteria ──────────────────────────────────────────────────────────
const ROUND_1_CRITERIA = [
  {
    key: 'innovation_creativity_score' as const,
    label: 'Innovation & Creativity',
    description: 'How novel and creative is the idea? Does it bring a fresh perspective?',
  },
  {
    key: 'technical_implementation_score' as const,
    label: 'Technical Implementation',
    description: 'Quality of the codebase, architecture, and technical decisions.',
  },
  {
    key: 'ui_ux_score' as const,
    label: 'UI & UX',
    description: 'User interface design, usability, and overall user experience.',
  },
  {
    key: 'impact_scope_score' as const,
    label: 'Impact & Scope',
    description: 'Potential real-world impact and breadth of the problem being solved.',
  },
  {
    key: 'research_development_score' as const,
    label: 'Research & Development',
    description: 'Depth of research, ideation process, and development effort.',
  },
] as const;

// ── Round 2 criteria ──────────────────────────────────────────────────────────
const ROUND_2_CRITERIA = [
  {
    key: 'project_completeness_score' as const,
    label: 'Project Completeness',
    description: 'How complete and polished is the final product?',
  },
  {
    key: 'deployment_github_score' as const,
    label: 'Deployment & GitHub Source Code',
    description: 'Is the project deployed? Is the source code available and well-organized on GitHub?',
  },
  {
    key: 'qa_score' as const,
    label: 'Q&A',
    description: 'How well did the team answer questions and defend their project?',
  },
  {
    key: 'testing_prototype_score' as const,
    label: 'Testing & Working Prototype',
    description: 'Does the prototype work as expected? Has the team tested their solution?',
  },
  {
    key: 'documentation_score' as const,
    label: 'Documentation',
    description: 'Quality and thoroughness of technical documentation and README.',
  },
] as const;

type Round1Keys = (typeof ROUND_1_CRITERIA)[number]['key'];
type Round2Keys = (typeof ROUND_2_CRITERIA)[number]['key'];
type AllKeys = Round1Keys | Round2Keys;

type ScoreState = Record<AllKeys, number>;

const defaultScores: ScoreState = {
  // Round 1
  innovation_creativity_score: 5,
  technical_implementation_score: 5,
  ui_ux_score: 5,
  impact_scope_score: 5,
  research_development_score: 5,
  // Round 2
  project_completeness_score: 5,
  deployment_github_score: 5,
  qa_score: 5,
  testing_prototype_score: 5,
  documentation_score: 5,
};

export default function ScoringPage() {
  const { teamId, round } = useParams<{ teamId: string; round: string }>();
  const router = useRouter();
  const roundNum = Number(round) as 1 | 2;

  const [team, setTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState<ScoreState>(defaultScores);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const criteria = roundNum === 1 ? ROUND_1_CRITERIA : ROUND_2_CRITERIA;
  const activeKeys = criteria.map((c) => c.key) as AllKeys[];
  const total = activeKeys.reduce((sum, key) => sum + scores[key], 0);
  const maxTotal = criteria.length * 10; // 50

  useEffect(() => {
    if (roundNum !== 1 && roundNum !== 2) {
      router.push('/judge');
      return;
    }
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
          const status = statusRes.data;

          // Check if Round 2 is attempted without Round 1 completed
          if (roundNum === 2 && !status.round_1.submitted) {
            toast.error('You must submit Round 1 (Day 1) scores before scoring Round 2 (Day 2).');
            router.push(`/judge/team/${teamId}`);
            return;
          }

          const roundStatus = roundNum === 1 ? status.round_1 : status.round_2;
          if (roundStatus.submitted) {
            toast.error('You have already submitted scores for this round.');
            router.push(`/judge/team/${teamId}`);
          }
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
  }, [teamId, roundNum, router]);

  const setScore = (key: AllKeys, val: number) =>
    setScores((prev) => ({ ...prev, [key]: val }));

  const buildPayload = () => {
    if (roundNum === 1) {
      return {
        team_id: teamId,
        round: 1 as const,
        innovation_creativity_score: scores.innovation_creativity_score,
        technical_implementation_score: scores.technical_implementation_score,
        ui_ux_score: scores.ui_ux_score,
        impact_scope_score: scores.impact_scope_score,
        research_development_score: scores.research_development_score,
      };
    }
    return {
      team_id: teamId,
      round: 2 as const,
      project_completeness_score: scores.project_completeness_score,
      deployment_github_score: scores.deployment_github_score,
      qa_score: scores.qa_score,
      testing_prototype_score: scores.testing_prototype_score,
      documentation_score: scores.documentation_score,
    };
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await scoresApi.submit(buildPayload());
      toast.success('Score submitted successfully! It is now immutable.');
      router.push(`/judge/team/${teamId}`);
    } catch (err) {
      toast.error(getApiError(err));
      setShowConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!team) return null;

  const roundName = roundNum === 1 ? 'Round 1 (Day 1)' : 'Round 2 (Day 2)';

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.push(`/judge/team/${teamId}`)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Team
      </button>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="info">{team.team_id}</Badge>
          <Badge variant="submitted">{roundName}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{team.team_name}</h1>
        <p className="text-slate-400 text-sm">Leader: {team.leader_name}</p>
      </div>

      {/* Criteria label */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs text-slate-400">
        <span className="font-semibold text-slate-300 uppercase tracking-wider">
          {roundNum === 1 ? 'Round 1' : 'Round 2'} Criteria
        </span>
        <span className="ml-auto text-slate-500">Each criterion: 0–10 pts</span>
      </div>

      {/* Scoring Form */}
      <Card className="space-y-8">
        {criteria.map((c, idx) => (
          <div key={c.key}>
            {idx > 0 && <div className="border-t border-slate-700/50 mb-8" />}
            <ScoreSlider
              label={c.label}
              description={c.description}
              value={scores[c.key]}
              onChange={(val) => setScore(c.key, val)}
            />
          </div>
        ))}
      </Card>

      {/* Total */}
      <Card className="gradient-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{roundName} Total</p>
            <p className="text-4xl font-bold text-slate-100 mt-1">
              {total}
              <span className="text-slate-500 text-xl font-normal">/{maxTotal}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-2xl font-bold text-white">{Math.round((total / maxTotal) * 100)}%</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <Button size="lg" className="w-full" onClick={() => setShowConfirm(true)}>
        <CheckCircle className="w-5 h-5" />
        Review Submission
      </Button>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirm} onClose={() => !submitting && setShowConfirm(false)} title="Confirm Score Submission">
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-sm font-medium">
              You are about to permanently submit scores. Once submitted, they <strong>cannot be edited or deleted</strong>.
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Team</span>
              <span className="text-slate-200 font-medium">{team.team_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Round</span>
              <span className="text-slate-200 font-medium">{roundName}</span>
            </div>
            <div className="border-t border-slate-700/50 my-2" />

            {criteria.map((c) => (
              <div key={c.key} className="flex justify-between text-sm">
                <span className="text-slate-400">{c.label}</span>
                <span className="text-slate-200 font-bold">{scores[c.key]} / 10</span>
              </div>
            ))}

            <div className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between">
              <span className="text-slate-300 font-semibold">Total</span>
              <span className="text-violet-400 font-bold text-lg">{total} / {maxTotal}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-slate-700/50 rounded-lg">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <p className="text-xs text-slate-500">
              Scores are <strong className="text-slate-400">read-only</strong> after submission. No modifications are permitted.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setShowConfirm(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="success" className="flex-1" onClick={handleSubmit} loading={submitting}>
              <Send className="w-4 h-4" />
              Permanently Submit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
