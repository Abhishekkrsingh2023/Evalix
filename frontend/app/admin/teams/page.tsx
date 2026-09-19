'use client';

import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { Team } from '@/types';
import { Card, Button, Input, Badge, Modal, Skeleton } from '@/components/ui';
import { getApiError, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Search, QrCode, Users } from 'lucide-react';
import Link from 'next/link';
import { QrModal } from '@/components/QrModal';

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [qrTeam, setQrTeam] = useState<Team | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ team_id: '', team_name: '', leader_name: '' });

  const fetchTeams = useCallback(async (q?: string, showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const r = await adminApi.listTeams({ search: q });
      setTeams(r.data.teams);
      setTotal(r.data.total);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search query and fetch teams
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeams(search || undefined);
    }, 400);

    return () => clearTimeout(timer);
  }, [search, fetchTeams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const r = await adminApi.createTeam(form);
      toast.success(`Team ${r.data.team_id} created!`);
      setShowCreate(false);
      setForm({ team_id: '', team_name: '', leader_name: '' });
      setQrTeam(r.data);
      await fetchTeams(search || undefined);
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Teams</h1>
          <p className="text-slate-400 mt-1">{total} teams registered</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" />
          Register Team
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={handleSearch}
          placeholder="Search by team ID, name, or leader..."
          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
        />
      </div>

      {/* Teams Table */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No teams found</p>
            <p className="text-slate-500 text-sm mt-1">Register a team to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  {['Team ID', 'Team Name', 'Leader', 'Registered', 'QR Code', ''].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {teams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <Badge variant="info">{team.team_id}</Badge>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-200">{team.team_name}</td>
                    <td className="px-5 py-4 text-slate-400 text-sm">{team.leader_name}</td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{formatDate(team.created_at)}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setQrTeam(team)}
                        className="flex items-center gap-1.5 text-violet-400 hover:text-violet-300 text-sm transition-colors"
                      >
                        <QrCode className="w-4 h-4" />
                        View QR
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/admin/teams/${team.team_id}`} className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
                        View scores →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create team modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Register New Team">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Team ID"
            value={form.team_id}
            onChange={(e) => setForm({ ...form, team_id: e.target.value.toUpperCase() })}
            placeholder="e.g. INNOV8-001"
            required
          />
          <Input
            label="Team Name"
            value={form.team_name}
            onChange={(e) => setForm({ ...form, team_name: e.target.value })}
            placeholder="e.g. Neural Ninjas"
            required
          />
          <Input
            label="Leader Name"
            value={form.leader_name}
            onChange={(e) => setForm({ ...form, leader_name: e.target.value })}
            placeholder="e.g. Abhishek Kumar"
            required
          />
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={creating}>
              <Plus className="w-4 h-4" />
              Register Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* QR Modal */}
      {qrTeam && <QrModal team={qrTeam} onClose={() => setQrTeam(null)} />}
    </div>
  );
}
