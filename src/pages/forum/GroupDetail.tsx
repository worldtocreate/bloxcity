import { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Settings, MessageSquare, Calendar, Shield, 
  Loader2, CheckCircle, Crown, Plus, UserPlus, UserMinus,
  Coins, Send, Trash2, Clock, Info, Link2, FileText, Ban
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserAvatar from '@/components/forum/UserAvatar';
import VerifiedBadge from '@/components/forum/VerifiedBadge';

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  owner_id: string;
  is_verified: boolean;
  member_count: number;
  coins_vault: number;
  require_approval: boolean;
  created_at: string;
  owner: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface GroupMember {
  id: string;
  forum_user_id: string;
  joined_at: string;
  role: {
    name: string;
    color: string;
  } | null;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
    level: number;
  };
}

interface WallPost {
  id: string;
  content: string;
  created_at: string;
  is_deleted: boolean;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
  };
}

interface GroupEvent {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  event_date: string | null;
  status: string;
  created_at: string;
}

export default function GroupDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { forumUser, isAdmin: isSiteAdmin } = context || {};

  const [group, setGroup] = useState<GroupData | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [wallPosts, setWallPosts] = useState<WallPost[]>([]);
  const [events, setEvents] = useState<GroupEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchGroup();
    }
  }, [slug]);

  const fetchGroup = async () => {
    setLoading(true);
    
    const { data: groupData, error } = await supabase
      .from('forum_groups')
      .select(`
        id, name, slug, description, icon_url, cover_url, owner_id,
        is_verified, member_count, coins_vault, require_approval, created_at,
        owner:owner_id (id, username, avatar_url, is_verified)
      `)
      .eq('slug', slug)
      .single();

    if (error || !groupData) {
      navigate('/groups');
      return;
    }

    setGroup(groupData as unknown as GroupData);
    setIsOwner(forumUser?.id === groupData.owner_id);

    // Check membership
    if (forumUser) {
      const { data: memberData } = await supabase
        .from('forum_group_members')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('forum_user_id', forumUser.id)
        .single();
      
      setIsMember(!!memberData);

      // Check pending request
      const { data: requestData } = await supabase
        .from('forum_group_join_requests')
        .select('id')
        .eq('group_id', groupData.id)
        .eq('forum_user_id', forumUser.id)
        .eq('status', 'pending')
        .single();
      
      setHasPendingRequest(!!requestData);
    }

    // Fetch members
    const { data: membersData } = await supabase
      .from('forum_group_members')
      .select(`
        id, forum_user_id, joined_at,
        role:role_id (name, color),
        user:forum_user_id (id, username, avatar_url, is_verified, level)
      `)
      .eq('group_id', groupData.id)
      .order('joined_at', { ascending: true })
      .limit(50);

    if (membersData) {
      setMembers(membersData as unknown as GroupMember[]);
    }

    // Fetch wall posts
    const { data: postsData } = await supabase
      .from('forum_group_wall_posts')
      .select(`
        id, content, created_at, is_deleted,
        author:author_id (id, username, avatar_url, is_verified)
      `)
      .eq('group_id', groupData.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (postsData) {
      setWallPosts(postsData as unknown as WallPost[]);
    }

    // Fetch approved events
    const { data: eventsData } = await supabase
      .from('forum_group_events')
      .select('id, title, description, image_url, event_date, status, created_at')
      .eq('group_id', groupData.id)
      .eq('status', 'approved')
      .order('event_date', { ascending: true });

    if (eventsData) {
      setEvents(eventsData);
    }

    setLoading(false);
  };

  const handleJoinGroup = async () => {
    if (!forumUser || !group) return;
    
    setJoining(true);
    try {
      if (group.require_approval) {
        // Create join request
        const { error } = await supabase
          .from('forum_group_join_requests')
          .insert({
            group_id: group.id,
            forum_user_id: forumUser.id
          });

        if (error) {
          toast.error('Failed to send join request');
        } else {
          toast.success('Join request sent! Waiting for approval.');
          setHasPendingRequest(true);
        }
      } else {
        // Join directly
        const { error } = await supabase
          .from('forum_group_members')
          .insert({
            group_id: group.id,
            forum_user_id: forumUser.id
          });

        if (error) {
          toast.error('Failed to join group');
        } else {
          toast.success('Joined group!');
          setIsMember(true);
          fetchGroup();
        }
      }
    } catch {
      toast.error('Failed to join group');
    }
    setJoining(false);
  };

  const handleLeaveGroup = async () => {
    if (!forumUser || !group || isOwner) return;
    
    if (!confirm('Are you sure you want to leave this group?')) return;
    
    const { error } = await supabase
      .from('forum_group_members')
      .delete()
      .eq('group_id', group.id)
      .eq('forum_user_id', forumUser.id);

    if (error) {
      toast.error('Failed to leave group');
    } else {
      toast.success('Left group');
      setIsMember(false);
      fetchGroup();
    }
  };

  const handlePostToWall = async () => {
    if (!forumUser || !group || !newPostContent.trim()) return;
    
    setPosting(true);
    try {
      const { error } = await supabase
        .from('forum_group_wall_posts')
        .insert({
          group_id: group.id,
          author_id: forumUser.id,
          content: newPostContent.trim()
        });

      if (error) {
        toast.error('Failed to post');
      } else {
        toast.success('Posted to wall!');
        setNewPostContent('');
        fetchGroup();
      }
    } catch {
      toast.error('Failed to post');
    }
    setPosting(false);
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    
    const { error } = await supabase
      .from('forum_group_wall_posts')
      .update({ is_deleted: true, deleted_by: forumUser?.id, deleted_at: new Date().toISOString() })
      .eq('id', postId);

    if (error) {
      toast.error('Failed to delete post');
    } else {
      toast.success('Post deleted');
      setWallPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        {/* Cover */}
        <div className="h-48 rounded-t-2xl bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] overflow-hidden">
          {group.cover_url && (
            <img src={group.cover_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Group Info */}
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] border-t-0 rounded-b-2xl p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Icon */}
            <div className="-mt-16 sm:-mt-20">
              {group.icon_url ? (
                <img 
                  src={group.icon_url} 
                  alt={group.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-[hsl(var(--bc-bg-card))]"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-[hsl(var(--bc-primary))] flex items-center justify-center border-4 border-[hsl(var(--bc-bg-card))]">
                  <Users className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-2">
                {group.name}
                {group.is_verified && <CheckCircle className="w-6 h-6 text-green-500" />}
              </h1>
              
              <div className="flex items-center gap-4 mt-2 text-sm text-[hsl(var(--bc-text-muted))]">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {group.member_count.toLocaleString()} members
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  {group.coins_vault.toLocaleString()} in vault
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 text-sm">
                <span className="text-[hsl(var(--bc-text-muted))]">Owner:</span>
                <Link 
                  to={`/user/${group.owner.username}`} 
                  className="flex items-center gap-1 text-[hsl(var(--bc-primary))] hover:underline"
                >
                  <Crown className="w-4 h-4" />
                  {group.owner.username}
                  {group.owner.is_verified && <VerifiedBadge size="sm" />}
                </Link>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-start gap-2">
              {forumUser && !isOwner && (
                isMember ? (
                  <button
                    onClick={handleLeaveGroup}
                    className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-light))] transition"
                  >
                    <UserMinus className="w-4 h-4" />
                    Leave
                  </button>
                ) : hasPendingRequest ? (
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-bg-light))] rounded-lg text-[hsl(var(--bc-text-muted))]"
                  >
                    <Clock className="w-4 h-4" />
                    Pending
                  </button>
                ) : (
                  <button
                    onClick={handleJoinGroup}
                    disabled={joining}
                    className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition"
                  >
                    {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    {group.require_approval ? 'Request to Join' : 'Join'}
                  </button>
                )
              )}
              
              {(isOwner || isSiteAdmin) && (
                <Link
                  to={`/group/${slug}/settings`}
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-card))] transition"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="about">
        <TabsList>
          <TabsTrigger value="about" className="flex items-center gap-1">
            <Info className="w-4 h-4" />
            About
          </TabsTrigger>
          <TabsTrigger value="wall" className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            Wall
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Events
          </TabsTrigger>
          <TabsTrigger value="affiliates" className="flex items-center gap-1">
            <Link2 className="w-4 h-4" />
            Affiliates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">About</h2>
            <p className="text-[hsl(var(--bc-text-muted))] whitespace-pre-wrap">
              {group.description || 'No description provided.'}
            </p>
            
            <div className="mt-6 pt-6 border-t border-[hsl(var(--bc-border))]">
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                Created {new Date(group.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="wall" className="mt-6 space-y-4">
          {/* Post Input */}
          {isMember && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
              <textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value.slice(0, 500))}
                placeholder="Write something on the wall..."
                rows={3}
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-3 text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-[hsl(var(--bc-text-muted))]">{newPostContent.length}/500</span>
                <button
                  onClick={handlePostToWall}
                  disabled={posting || !newPostContent.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Wall Posts */}
          {wallPosts.length === 0 ? (
            <div className="text-center py-12 text-[hsl(var(--bc-text-muted))]">
              No posts yet. Be the first to write something!
            </div>
          ) : (
            <div className="space-y-4">
              {wallPosts.map((post) => (
                <div key={post.id} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Link to={`/user/${post.author.username}`}>
                      <UserAvatar 
                        username={post.author.username}
                        avatarUrl={post.author.avatar_url}
                        size="md"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Link 
                          to={`/user/${post.author.username}`}
                          className="font-medium text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] flex items-center gap-1"
                        >
                          {post.author.username}
                          {post.author.is_verified && <VerifiedBadge size="sm" />}
                        </Link>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                            {formatTimeAgo(post.created_at)}
                          </span>
                          {(isOwner || post.author.id === forumUser?.id || isSiteAdmin) && (
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 text-[hsl(var(--bc-text-muted))] hover:text-red-500 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-[hsl(var(--bc-text))] mt-1 whitespace-pre-wrap">{post.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="members" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">
              Members ({group.member_count})
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {members.map((member) => (
                <Link
                  key={member.id}
                  to={`/user/${member.user.username}`}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
                >
                  <UserAvatar 
                    username={member.user.username}
                    avatarUrl={member.user.avatar_url}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="font-medium text-[hsl(var(--bc-text))] truncate flex items-center gap-1">
                      {member.user.username}
                      {member.user.is_verified && <VerifiedBadge size="sm" />}
                      {member.forum_user_id === group.owner_id && <Crown className="w-3 h-3 text-yellow-500" />}
                    </p>
                    {member.role && (
                      <p className="text-xs" style={{ color: member.role.color }}>
                        {member.role.name}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Events</h2>
            
            {events.length === 0 ? (
              <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">
                No events scheduled
              </p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="flex gap-4 p-4 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                    {event.image_url && (
                      <img src={event.image_url} alt="" className="w-24 h-24 rounded-lg object-cover" />
                    )}
                    <div>
                      <h3 className="font-semibold text-[hsl(var(--bc-text))]">{event.title}</h3>
                      {event.event_date && (
                        <p className="text-sm text-[hsl(var(--bc-primary))]">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1">{event.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="affiliates" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Affiliated Groups</h2>
            <p className="text-center text-[hsl(var(--bc-text-muted))] py-8">
              No affiliates yet
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
