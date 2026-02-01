import { useState, useEffect, useRef } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, Loader2, Users, Plus, Shield, CheckCircle, 
  ChevronLeft, ChevronRight, Crown, Upload, X
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
  is_verified: boolean;
  member_count: number;
  owner: {
    username: string;
  };
}

const ITEMS_PER_PAGE = 12;

export default function Groups() {
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { forumUser } = context || {};

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [myGroups, setMyGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [groupIconFile, setGroupIconFile] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchGroups();
  }, [debouncedSearch, currentPage]);

  useEffect(() => {
    if (forumUser) {
      fetchMyGroups();
    }
  }, [forumUser]);

  const fetchGroups = async () => {
    setLoading(true);
    
    let query = supabase
      .from('forum_groups')
      .select(`
        id, name, slug, description, icon_url, is_verified, member_count,
        owner:owner_id (username)
      `, { count: 'exact' })
      .order('member_count', { ascending: false });

    if (debouncedSearch.trim()) {
      query = query.ilike('name', `%${debouncedSearch.trim()}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      setGroups(data as unknown as GroupData[]);
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const fetchMyGroups = async () => {
    if (!forumUser) return;
    
    const { data } = await supabase
      .from('forum_group_members')
      .select(`
        group:group_id (
          id, name, slug, description, icon_url, is_verified, member_count,
          owner:owner_id (username)
        )
      `)
      .eq('forum_user_id', forumUser.id);

    if (data) {
      setMyGroups(data.map(d => d.group) as unknown as GroupData[]);
    }
  };

  const handleIconSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setGroupIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setGroupIconPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!forumUser || !newGroupName.trim()) return;
    
    // Check if user has enough coins
    const GROUP_CREATION_COST = 25;
    if ((forumUser.coins || 0) < GROUP_CREATION_COST) {
      toast.error(`You need ${GROUP_CREATION_COST} coins to create a group. You have ${forumUser.coins || 0}.`);
      return;
    }
    
    setCreating(true);
    try {
      // Deduct coins first
      const { error: coinError } = await supabase
        .from('forum_users')
        .update({ coins: (forumUser.coins || 0) - GROUP_CREATION_COST })
        .eq('id', forumUser.id);

      if (coinError) {
        toast.error('Failed to process payment');
        setCreating(false);
        return;
      }

      // Generate slug from name
      const slug = newGroupName.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Create the group
      const { data: group, error } = await supabase
        .from('forum_groups')
        .insert({
          name: newGroupName.trim(),
          slug,
          description: newGroupDescription.trim() || null,
          owner_id: forumUser.id
        })
        .select()
        .single();

      if (error) {
        // Refund coins on failure
        await supabase
          .from('forum_users')
          .update({ coins: forumUser.coins })
          .eq('id', forumUser.id);
          
        if (error.message.includes('unique')) {
          toast.error('A group with this name already exists');
        } else {
          toast.error('Failed to create group');
        }
        setCreating(false);
        return;
      }

      // Upload icon if selected - submit for admin review
      if (groupIconFile) {
        const fileExt = groupIconFile.name.split('.').pop();
        const filePath = `group-icons/${group.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('forum-avatars')
          .upload(filePath, groupIconFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('forum-avatars')
            .getPublicUrl(filePath);

          // Submit for review
          await supabase
            .from('forum_group_media_requests')
            .insert({
              group_id: group.id,
              media_type: 'icon',
              image_url: publicUrl
            });
        }
      }

      // Create default "Member" role
      await supabase
        .from('forum_group_roles')
        .insert({
          group_id: group.id,
          name: 'Member',
          is_default: true,
          rank: 0
        });

      // Add owner as member
      await supabase
        .from('forum_group_members')
        .insert({
          group_id: group.id,
          forum_user_id: forumUser.id
        });

      toast.success(groupIconFile ? 'Group created! Icon pending review.' : 'Group created!');
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setGroupIconFile(null);
      setGroupIconPreview(null);
      navigate(`/group/${slug}`);
    } catch {
      toast.error('Failed to create group');
    }
    setCreating(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Groups</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">
            Join communities and connect with other players
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="w-full sm:w-48 pl-10 pr-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
            />
          </div>
          
          {forumUser && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Group</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Groups</TabsTrigger>
          {forumUser && <TabsTrigger value="my">My Groups ({myGroups.length})</TabsTrigger>}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
            </div>
          ) : groups.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto text-[hsl(var(--bc-text-muted))] mb-4" />
              <p className="text-[hsl(var(--bc-text-muted))]">
                {debouncedSearch ? 'No groups found' : 'No groups yet. Be the first to create one!'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] disabled:opacity-50 hover:bg-[hsl(var(--bc-bg-light))] transition"
                  >
                    <ChevronLeft className="w-4 h-4 text-[hsl(var(--bc-text))]" />
                  </button>
                  
                  <span className="text-sm text-[hsl(var(--bc-text-muted))]">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] disabled:opacity-50 hover:bg-[hsl(var(--bc-bg-light))] transition"
                  >
                    <ChevronRight className="w-4 h-4 text-[hsl(var(--bc-text))]" />
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {myGroups.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto text-[hsl(var(--bc-text-muted))] mb-4" />
              <p className="text-[hsl(var(--bc-text-muted))]">You haven't joined any groups yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-2">Create New Group</h2>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Cost: <span className="font-semibold text-amber-600">25 coins</span>
              {forumUser && (
                <span className="ml-2">(You have {forumUser.coins?.toLocaleString() || 0} coins)</span>
              )}
            </p>
            
            <div className="space-y-4">
              {/* Group Icon Upload */}
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Group Icon
                </label>
                <div className="flex items-center gap-4">
                  {groupIconPreview ? (
                    <div className="relative">
                      <img 
                        src={groupIconPreview} 
                        alt="Preview" 
                        className="w-20 h-20 rounded-xl object-cover"
                      />
                      <button
                        onClick={() => {
                          setGroupIconFile(null);
                          setGroupIconPreview(null);
                        }}
                        className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl border-2 border-dashed border-[hsl(var(--bc-border))] flex flex-col items-center justify-center gap-1 hover:border-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-bg-light))] transition"
                    >
                      <Upload className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                      <span className="text-xs text-[hsl(var(--bc-text-muted))]">Upload</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleIconSelect}
                    className="hidden"
                  />
                  <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                    Optional. Max 2MB. Requires admin approval.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value.slice(0, 50))}
                  placeholder="Enter group name"
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{newGroupName.length}/50</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Description
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value.slice(0, 500))}
                  placeholder="What is your group about?"
                  rows={3}
                  className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                />
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{newGroupDescription.length}/500</p>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Group logos and cover photos require admin approval before being displayed.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setGroupIconFile(null);
                    setGroupIconPreview(null);
                  }}
                  className="flex-1 px-4 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={creating || !newGroupName.trim() || (forumUser?.coins || 0) < 25}
                  className="flex-1 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create (25 coins)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupCard({ group }: { group: GroupData }) {
  return (
    <Link
      to={`/group/${group.slug}`}
      className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 hover:border-[hsl(var(--bc-primary))] transition"
    >
      <div className="flex items-start gap-4">
        {group.icon_url ? (
          <img 
            src={group.icon_url} 
            alt={group.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-[hsl(var(--bc-primary))] flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2 truncate">
            {group.name}
            {group.is_verified && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
          </h3>
          
          <p className="text-sm text-[hsl(var(--bc-text-muted))] flex items-center gap-1 mt-1">
            <Crown className="w-3 h-3" />
            {group.owner?.username || 'Unknown'}
          </p>
          
          <p className="text-sm text-[hsl(var(--bc-text-muted))] flex items-center gap-1 mt-1">
            <Users className="w-3 h-3" />
            {group.member_count.toLocaleString()} members
          </p>

          {group.description && (
            <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-2 line-clamp-2">
              {group.description}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
