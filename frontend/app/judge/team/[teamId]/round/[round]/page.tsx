'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { teamsApi, scoresApi } from '@/lib/api';
import { Team } from '@/types';
import { Card, Button, Badge, Modal } from '@/components/ui';
import { getApiError } from '@/lib/utils';
import { ArrowLeft, CheckCircle, AlertTriangle, Send } from 'lucide-react';

interface ScoreSliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

function ScoreSlider({ label, value, onChange }: ScoreSliderProps) {
  const color = value >= 8 ? 'text-emerald-400' : value >= 5 ? 'text-amber-400' : 'text-red-400';
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <div className={`text-2xl font-bold ${color} w-12 text-right`}>{value}</div>
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

export default function ScoringPage() {
  const { teamId, round } = useParams<{ teamId: string; round: string }>();
  const router = useRouter();
  const roundNum = Number(round) as 1 | 2;

  const [team, setTeam] = useState<Team | null>(null);
  const [qa, setQa] = useState(5);
  const [innovation, setInnovation] = useState(5);
  const [execution, setExecution] = useState(5);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const total = qa + innovation + execution;

  useEffect(() => {
    if (roundNum !== 1 && roundNum !== 2) {
      router.push('/judge');
      return;
    }
    if (!teamId) return;

    let ignore = false;
    const load = async () => {
      try {
        // Verify team exists and this round not yet submitted
        const [teamRes, statusRes] = await Promise.all([
          teamsApi.get(teamId),
          scoresApi.teamStatus(teamId),
        ]);
        if (!ignore) {
          setTeam(teamRes.data);
          const status = statusRes.data;
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

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await scoresApi.submit({
        team_id: teamId,
        round: roundNum,
        qa_score: qa,
        innovation_score: innovation,
        execution_score: execution,
      });
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
          <Badge variant="submitted">Round {roundNum}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{team.team_name}</h1>
        <p className="text-slate-400 text-sm">Leader: {team.leader_name}</p>
      </div>

      {/* Scoring Form */}
      <Card className="space-y-8">
        <ScoreSlider label="Q&A" value={qa} onChange={setQa} />
        <div className="border-t border-slate-700/50" />
        <ScoreSlider label="Innovation & Originality" value={innovation} onChange={setInnovation} />
        <div className="border-t border-slate-700/50" />
        <ScoreSlider label="Execution & MVP" value={execution} onChange={setExecution} />
      </Card>

      {/* Total */}
      <Card className="gradient-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">Round {roundNum} Total</p>
            <p className="text-4xl font-bold text-slate-100 mt-1">
              {total}
              <span className="text-slate-500 text-xl font-normal">/30</span>
            </p>
          </div>
          <div className="text-right">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <span className="text-2xl font-bold text-white">{Math.round((total / 30) * 100)}%</span>
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
              <span className="text-slate-200 font-medium">Round {roundNum}</span>
            </div>
            <div className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Q&amp;A</span>
              <span className="text-slate-200 font-bold">{qa} / 10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Innovation &amp; Originality</span>
              <span className="text-slate-200 font-bold">{innovation} / 10</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Execution &amp; MVP</span>
              <span className="text-slate-200 font-bold">{execution} / 10</span>
            </div>
            <div className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between">
              <span className="text-slate-300 font-semibold">Total</span>
              <span className="text-violet-400 font-bold text-lg">{total} / 30</span>
            </div>
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
