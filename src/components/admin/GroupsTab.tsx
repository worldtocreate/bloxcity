import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, Loader2, Search, CheckCircle, XCircle, Trash2, Eye, MoreVertical, Crown } from 'lucide-react';
import { toast } from 'sonner';

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_verified: boolean;
  member_count: number;
  created_at: string;
  owner: { id: string; username: string };
}

export default function GroupsTab() {
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [showActions, setShowActions] = useState<string | null>(null);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from('forum_groups').select('id, name, slug, description, icon_url, is_verified, member_count, created_at, owner:owner_id (id, username)').order('member_count', { ascending: false });
    if (data) setGroups(data as unknown as GroupData[]);
    setLoading(false);
  };

  const handleVerify = async (groupId: string, verify: boolean) => {
    const { error } = await supabase.from('forum_groups').update({ is_verified: verify, verified_at: verify ? new Date().toISOString() : null }).eq('id', groupId);
    if (error) toast.error('Failed to update verification status');
    else { toast.success(verify ? 'Group verified!' : 'Verification removed'); setGroups(prev => prev.map(g => g.id === groupId ? { ...g, is_verified: verify } : g)); }
    setShowActions(null);
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to delete "${groupName}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('forum_groups').delete().eq('id', groupId);
    if (error) toast.error('Failed to delete group');
    else { toast.success('Group deleted'); setGroups(prev => prev.filter(g => g.id !== groupId)); }
    setShowActions(null);
  };

  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.owner?.username?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'verified' && g.is_verified) || (filter === 'unverified' && !g.is_verified);
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-xl font-bold text-white">Group Management</h2><p className="text-gray-400">{groups.length} total groups • {groups.filter(g => g.is_verified).length} verified</p></div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search groups..." className="w-full pl-10 pr-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white placeholder-gray-500" /></div>
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="px-3 py-2 border border-white/10 rounded-lg bg-white/5 text-white"><option value="all">All</option><option value="verified">Verified</option><option value="unverified">Unverified</option></select>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-[#12121a]">
        <table className="w-full">
          <thead className="bg-[#0a0a0f]">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Group</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Owner</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Members</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredGroups.map(group => (
              <tr key={group.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {group.icon_url ? <img src={group.icon_url} alt={group.name} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5"><Users className="w-5 h-5 text-gray-500" /></div>}
                    <div>
                      <div className="flex items-center gap-2"><span className="font-medium text-white">{group.name}</span>{group.is_verified && <Shield className="w-4 h-4 text-blue-400" />}</div>
                      <span className="text-xs text-gray-500">/{group.slug}</span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3"><div className="flex items-center gap-1"><Crown className="w-3 h-3 text-amber-400" /><span className="text-gray-300">{group.owner?.username || 'Unknown'}</span></div></td>
                <td className="px-4 py-3 text-gray-300">{group.member_count?.toLocaleString() || 0}</td>
                <td className="px-4 py-3">{group.is_verified ? <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">Verified</span> : <span className="px-2 py-1 text-xs rounded-full bg-white/5 text-gray-400">Unverified</span>}</td>
                <td className="px-4 py-3 text-right">
                  <div className="relative">
                    <button onClick={() => setShowActions(showActions === group.id ? null : group.id)} className="p-2 rounded-lg hover:bg-white/10"><MoreVertical className="w-4 h-4 text-gray-400" /></button>
                    {showActions === group.id && (
                      <div className="absolute right-0 mt-1 w-48 rounded-lg shadow-lg border border-white/10 z-10 bg-[#0a0a0f]">
                        <a href={`/group/${group.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 text-gray-300"><Eye className="w-4 h-4" />View Group</a>
                        {group.is_verified ? <button onClick={() => handleVerify(group.id, false)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 text-orange-400"><XCircle className="w-4 h-4" />Remove Verification</button> : <button onClick={() => handleVerify(group.id, true)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 text-blue-400"><CheckCircle className="w-4 h-4" />Verify Group</button>}
                        <button onClick={() => handleDelete(group.id, group.name)} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/5 text-red-400"><Trash2 className="w-4 h-4" />Delete Group</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredGroups.length === 0 && <div className="text-center py-12"><Users className="w-12 h-12 mx-auto mb-3 text-gray-600" /><p className="text-gray-500">No groups found</p></div>}
      </div>
    </div>
  );
}
