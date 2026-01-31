import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, Settings, Loader2, Save, Users, Shield, 
  Trash2, Crown, Plus, X, AlertTriangle
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  owner_id: string;
  is_verified: boolean;
  require_approval: boolean;
  last_name_change: string | null;
  coins_vault: number;
}

interface GroupRole {
  id: string;
  name: string;
  color: string;
  rank: number;
  is_default: boolean;
  permissions: any;
}

interface JoinRequest {
  id: string;
  created_at: string;
  status: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

interface BlockedWord {
  id: string;
  word: string;
  created_at: string;
}

export default function GroupSettings() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { forumUser, isAdmin: isSiteAdmin } = context || {};

  const [group, setGroup] = useState<GroupData | null>(null);
  const [roles, setRoles] = useState<GroupRole[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [blockedWords, setBlockedWords] = useState<BlockedWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [newBlockedWord, setNewBlockedWord] = useState('');

  useEffect(() => {
    if (slug) {
      fetchGroup();
    }
  }, [slug]);

  const fetchGroup = async () => {
    setLoading(true);

    // Fetch group
    const { data: groupData, error } = await supabase
      .from('forum_groups')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !groupData) {
      navigate('/groups');
      return;
    }

    setGroup(groupData);
    setName(groupData.name);
    setDescription(groupData.description || '');
    setRequireApproval(groupData.require_approval || false);

    // Check if user is owner
    if (forumUser) {
      setIsOwner(groupData.owner_id === forumUser.id);
    }

    // Fetch roles
    const { data: rolesData } = await supabase
      .from('forum_group_roles')
      .select('*')
      .eq('group_id', groupData.id)
      .order('rank', { ascending: false });

    if (rolesData) {
      setRoles(rolesData);
    }

    // Fetch pending join requests
    const { data: requestsData } = await supabase
      .from('forum_group_join_requests')
      .select(`
        id,
        created_at,
        status,
        user:forum_user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('group_id', groupData.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requestsData) {
      setJoinRequests(requestsData as unknown as JoinRequest[]);
    }

    // Fetch blocked words
    const { data: wordsData } = await supabase
      .from('forum_group_blocked_words')
      .select('*')
      .eq('group_id', groupData.id)
      .order('created_at', { ascending: false });

    if (wordsData) {
      setBlockedWords(wordsData);
    }

    setLoading(false);
  };

  const canEdit = isOwner || isSiteAdmin;

  const handleSaveGeneral = async () => {
    if (!group || !canEdit) return;

    // Check name change cooldown (30 days)
    if (name !== group.name) {
      if (group.last_name_change) {
        const lastChange = new Date(group.last_name_change);
        const daysSince = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < 30) {
          toast.error(`You can change the group name again in ${Math.ceil(30 - daysSince)} days`);
          return;
        }
      }
    }

    setSaving(true);
    const updates: any = {
      description,
      require_approval: requireApproval,
    };

    if (name !== group.name) {
      updates.name = name;
      updates.last_name_change = new Date().toISOString();
      // Update slug
      updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    const { error } = await supabase
      .from('forum_groups')
      .update(updates)
      .eq('id', group.id);

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved!');
      if (updates.slug && updates.slug !== slug) {
        navigate(`/group/${updates.slug}/settings`);
      } else {
        fetchGroup();
      }
    }
    setSaving(false);
  };

  const handleJoinRequest = async (requestId: string, accept: boolean) => {
    if (!group) return;

    const request = joinRequests.find(r => r.id === requestId);
    if (!request) return;

    if (accept) {
      // Add member
      const { error: memberError } = await supabase
        .from('forum_group_members')
        .insert({
          group_id: group.id,
          forum_user_id: request.user.id
        });

      if (memberError) {
        toast.error('Failed to add member');
        return;
      }
    }

    // Update request status
    const { error } = await supabase
      .from('forum_group_join_requests')
      .update({ 
        status: accept ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
        responded_by: forumUser?.id
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to update request');
    } else {
      toast.success(accept ? 'Member accepted!' : 'Request declined');
      setJoinRequests(prev => prev.filter(r => r.id !== requestId));
    }
  };

  const handleAddBlockedWord = async () => {
    if (!group || !newBlockedWord.trim()) return;

    const { error } = await supabase
      .from('forum_group_blocked_words')
      .insert({
        group_id: group.id,
        word: newBlockedWord.trim().toLowerCase(),
        added_by: forumUser?.id
      });

    if (error) {
      toast.error('Failed to add blocked word');
    } else {
      toast.success('Word blocked');
      setNewBlockedWord('');
      fetchGroup();
    }
  };

  const handleRemoveBlockedWord = async (wordId: string) => {
    const { error } = await supabase
      .from('forum_group_blocked_words')
      .delete()
      .eq('id', wordId);

    if (error) {
      toast.error('Failed to remove word');
    } else {
      setBlockedWords(prev => prev.filter(w => w.id !== wordId));
    }
  };

  const handleDeleteGroup = async () => {
    if (!group || !isOwner) return;

    if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
    if (!confirm('This will permanently delete all group data, members, posts, and events. Type "DELETE" to confirm.')) return;

    const { error } = await supabase
      .from('forum_groups')
      .delete()
      .eq('id', group.id);

    if (error) {
      toast.error('Failed to delete group');
    } else {
      toast.success('Group deleted');
      navigate('/groups');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  if (!group || !canEdit) {
    return (
      <div className="text-center py-20">
        <p className="text-[hsl(var(--bc-text-muted))]">You don't have permission to access this page.</p>
        <Link to="/groups" className="text-[hsl(var(--bc-primary))] hover:underline mt-2 inline-block">
          Back to Groups
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/group/${slug}`}
          className="p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
        >
          <ArrowLeft className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Group Settings</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">{group.name}</p>
        </div>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-1">
            <Settings className="w-4 h-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-1">
            <Shield className="w-4 h-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Requests ({joinRequests.length})
          </TabsTrigger>
          <TabsTrigger value="moderation" className="flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            Moderation
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="mt-6 space-y-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Group Name
                <span className="text-xs text-[hsl(var(--bc-text-muted))] ml-2">(can change every 30 days)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-[hsl(var(--bc-border))]">
              <div>
                <h3 className="font-medium text-[hsl(var(--bc-text))]">Manual Approval</h3>
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                  User requests must be accepted to join community
                </p>
              </div>
              <button
                onClick={() => setRequireApproval(!requireApproval)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  requireApproval ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-border))]'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    requireApproval ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>

            <button
              onClick={handleSaveGeneral}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          {isOwner && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-semibold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-sm text-red-600 mb-4">
                Deleting your group is permanent and cannot be undone.
              </p>
              <button
                onClick={handleDeleteGroup}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            </div>
          )}
        </TabsContent>

        {/* Roles */}
        <TabsContent value="roles" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Roles</h2>
            
            {roles.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No custom roles yet.</p>
            ) : (
              <div className="space-y-2">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: role.color }}
                      />
                      <span className="font-medium text-[hsl(var(--bc-text))]">{role.name}</span>
                      {role.is_default && (
                        <span className="text-xs bg-[hsl(var(--bc-primary))]/10 text-[hsl(var(--bc-primary))] px-2 py-0.5 rounded">
                          Default
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-[hsl(var(--bc-text-muted))]">Rank {role.rank}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Join Requests */}
        <TabsContent value="requests" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Pending Requests</h2>
            
            {joinRequests.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No pending requests.</p>
            ) : (
              <div className="space-y-3">
                {joinRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.user.avatar_url ? (
                        <img src={request.user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-[hsl(var(--bc-text))]">{request.user.username}</p>
                        <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleJoinRequest(request.id, true)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleJoinRequest(request.id, false)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Moderation */}
        <TabsContent value="moderation" className="mt-6 space-y-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Blocked Words</h2>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Users cannot post these words on the group wall.
            </p>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newBlockedWord}
                onChange={(e) => setNewBlockedWord(e.target.value)}
                placeholder="Enter word to block..."
                className="flex-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
              <button
                onClick={handleAddBlockedWord}
                disabled={!newBlockedWord.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {blockedWords.length === 0 ? (
              <p className="text-[hsl(var(--bc-text-muted))]">No blocked words.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blockedWords.map((word) => (
                  <div
                    key={word.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg"
                  >
                    <span className="text-sm text-[hsl(var(--bc-text))]">{word.word}</span>
                    <button
                      onClick={() => handleRemoveBlockedWord(word.id)}
                      className="text-[hsl(var(--bc-text-muted))] hover:text-red-500 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
