'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { JudgeStats } from '@/types';
import { Card, Button, Input, Badge, Modal, Skeleton } from '@/components/ui';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, UserCheck, Power, KeyRound } from 'lucide-react';

export default function AdminJudgesPage() {
  const [judges, setJudges] = useState<JudgeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [resetTarget, setResetTarget] = useState<JudgeStats | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  const fetchJudges = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const r = await adminApi.listJudges();
      setJudges(r.data);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    adminApi
      .listJudges()
      .then((r) => {
        if (!ignore) setJudges(r.data);
      })
      .catch((err) => {
        if (!ignore) toast.error(getApiError(err));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminApi.createJudge(form);
      toast.success(`Judge ${form.name} created`);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '' });
      await fetchJudges();
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (judge: JudgeStats) => {
    const newStatus = !judge.judge.is_active;
    try {
      await adminApi.updateJudgeStatus(judge.judge.id, newStatus);
      toast.success(`${judge.judge.name} ${newStatus ? 'activated' : 'deactivated'}`);
      await fetchJudges();
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      await adminApi.resetJudgePassword(resetTarget.judge.id, newPassword);
      toast.success('Password reset successfully');
      setResetTarget(null);
      setNewPassword('');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Judges</h1>
          <p className="text-slate-400 mt-1">{judges.length} judges registered</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Add Judge
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Card key={i}><Skeleton className="h-20" /></Card>)}
        </div>
      ) : judges.length === 0 ? (
        <Card className="text-center py-12">
          <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No judges added yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {judges.map((stats) => (
            <Card key={stats.judge.id}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ${stats.judge.is_active ? 'bg-gradient-to-br from-violet-600 to-indigo-600' : 'bg-slate-700'}`}>
                    {stats.judge.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-200">{stats.judge.name}</p>
                      {stats.judge.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="danger">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm truncate">{stats.judge.email}</p>
                    <p className="text-slate-600 text-xs mt-0.5">Added {formatDate(stats.judge.created_at)}</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex items-center gap-6 flex-shrink-0">
                  {[
                    { label: 'Total', val: stats.total_scores_submitted },
                    { label: 'Rd. 1', val: stats.round_1_count },
                    { label: 'Rd. 2', val: stats.round_2_count },
                  ].map(({ label, val }) => (
                    <div key={label} className="text-center">
                      <p className="text-lg font-bold text-violet-400">{val}</p>
                      <p className="text-slate-500 text-xs">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setResetTarget(stats); setNewPassword(''); }}
                    className="p-2 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                    title="Reset password"
                  >
                    <KeyRound className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(stats)}
                    className={`p-2 rounded-lg transition-all ${stats.judge.is_active ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
                    title={stats.judge.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile stats */}
              <div className="flex sm:hidden items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
                {[
                  { label: 'Total', val: stats.total_scores_submitted },
                  { label: 'Round 1', val: stats.round_1_count },
                  { label: 'Round 2', val: stats.round_2_count },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center flex-1">
                    <p className="text-lg font-bold text-violet-400">{val}</p>
                    <p className="text-slate-500 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Judge Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Add New Judge">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dr. Smith" required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="judge@example.com" required />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" required />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={creating}>Add Judge</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      {resetTarget && (
        <Modal isOpen onClose={() => setResetTarget(null)} title={`Reset Password — ${resetTarget.judge.name}`}>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setResetTarget(null)}>Cancel</Button>
              <Button type="submit" variant="danger" className="flex-1" loading={resetting}>
                <KeyRound className="w-4 h-4" />
                Reset Password
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
