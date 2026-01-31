import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, MessageSquare, Pin, MessageCircle, Ban, Loader2, Eye, Clock, FileText, TrendingUp, ExternalLink, Star, Heart } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';
import UserAvatar from '@/components/forum/UserAvatar';
import UserLevelBadge from '@/components/forum/UserLevelBadge';
import FriendButton from '@/components/forum/FriendButton';
import FriendsList from '@/components/forum/FriendsList';
import ReportButton from '@/components/forum/ReportButton';
import ProfileViews from '@/components/forum/ProfileViews';
import UserAchievements from '@/components/forum/UserAchievements';
import UserGroups from '@/components/forum/UserGroups';

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  cover_url: string | null;
  signature: string | null;
  created_at: string;
  post_count: number;
  is_verified: boolean;
  is_suspended: boolean;
  hide_threads: boolean;
  allow_dms: boolean;
  last_post_at: string | null;
  social_discord: string | null;
  social_x: string | null;
  membership_tier: 'bronze' | 'silver' | 'platinum' | null;
  xp: number;
  level: number;
  thread_count: number;
  avatar_effect: string | null;
  status_text: string | null;
  status_updated_at: string | null;
  last_seen_at: string | null;
}

interface ThreadData {
  id: string;
  title: string;
  reply_count: number;
  view_count: number;
  created_at: string;
  category: {
    name: string;
    slug: string;
  };
  is_pinned_by_user?: boolean;
}

interface ProfileStats {
  totalViews: number;
  totalReplies: number;
  threadCount: number;
}

export default function ForumUserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, forumUser, isAdmin } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({ totalViews: 0, totalReplies: 0, threadCount: 0 });
  const [activeTab, setActiveTab] = useState<'threads' | 'activity'>('threads');
  const [statusLiked, setStatusLiked] = useState(false);
  const [statusLikeCount, setStatusLikeCount] = useState(0);

  const isOwnProfile = forumUser?.username === username;
  const canSeeThreads = isOwnProfile || isAdmin || !profile?.hide_threads;

  useEffect(() => {
    if (username) {
      fetchProfile();
    }
  }, [username]);

  // Log profile view
  useEffect(() => {
    const logProfileView = async () => {
      if (!profile || !user) return;
      if (isOwnProfile) return; // Don't log own profile views
      
      // Check if we already viewed this profile recently (within 1 hour)
      const viewKey = `profile_view_${profile.id}`;
      const lastView = localStorage.getItem(viewKey);
      if (lastView && Date.now() - parseInt(lastView) < 3600000) return;
      
      await supabase
        .from('forum_profile_views')
        .insert({
          viewed_user_id: profile.id,
          viewer_user_id: forumUser?.id || null,
          viewer_ip: null // We don't track IP on client side
        });
      
      localStorage.setItem(viewKey, Date.now().toString());
    };
    
    logProfileView();
  }, [profile, user, isOwnProfile, forumUser]);

  const fetchProfile = async () => {
    setLoading(true);
    
    // Fetch user profile
    const { data: userData, error } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !userData) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setProfile(userData as ProfileData);

    // Check if blocked
    if (forumUser && forumUser.id !== userData.id) {
      const { data: blockData } = await supabase
        .from('forum_blocked_users')
        .select('id')
        .eq('blocker_id', forumUser.id)
        .eq('blocked_id', userData.id)
        .single();
      
      setIsBlocked(!!blockData);
    }

    // Fetch pinned thread IDs
    const { data: pinned } = await supabase
      .from('forum_pinned_threads')
      .select('thread_id')
      .eq('forum_user_id', userData.id);
    
    if (pinned) {
      setPinnedThreadIds(new Set(pinned.map(p => p.thread_id)));
    }

    // Fetch threads (if visible)
    if (!userData.hide_threads || isOwnProfile || isAdmin) {
      const { data: threadData } = await supabase
        .from('forum_threads')
        .select('id, title, reply_count, view_count, created_at, category:category_id (name, slug)')
        .eq('author_id', userData.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (threadData) {
        setThreads(threadData as unknown as ThreadData[]);
        
        // Calculate stats
        const totalViews = threadData.reduce((sum, t: any) => sum + (t.view_count || 0), 0);
        const totalReplies = threadData.reduce((sum, t: any) => sum + (t.reply_count || 0), 0);
        setStats({
          totalViews,
          totalReplies,
          threadCount: threadData.length
        });
      }
    }

    // Fetch status likes
    if (forumUser) {
      const { data: likeData } = await supabase
        .from('forum_status_likes')
        .select('id')
        .eq('liker_id', forumUser.id)
        .eq('liked_user_id', userData.id)
        .single();
      setStatusLiked(!!likeData);
    }

    // Fetch total status likes
    const { count: likeCount } = await supabase
      .from('forum_status_likes')
      .select('id', { count: 'exact', head: true })
      .eq('liked_user_id', userData.id);
    setStatusLikeCount(likeCount || 0);

    setLoading(false);
  };

  const handleBlock = async () => {
    if (!forumUser || !profile) return;
    setBlocking(true);

    if (isBlocked) {
      // Unblock
      const { error } = await supabase
        .from('forum_blocked_users')
        .delete()
        .eq('blocker_id', forumUser.id)
        .eq('blocked_id', profile.id);

      if (error) {
        toast.error('Failed to unblock user');
      } else {
        toast.success('User unblocked');
        setIsBlocked(false);
      }
    } else {
      // Block
      const { error } = await supabase
        .from('forum_blocked_users')
        .insert({
          blocker_id: forumUser.id,
          blocked_id: profile.id
        });

      if (error) {
        if (error.message.includes('admin')) {
          toast.error('Cannot block admins');
        } else {
          toast.error('Failed to block user');
        }
      } else {
        toast.success('User blocked');
        setIsBlocked(true);
      }
    }
    setBlocking(false);
  };

  const handleLikeStatus = async () => {
    if (!forumUser || !profile) return;
    
    if (statusLiked) {
      await supabase
        .from('forum_status_likes')
        .delete()
        .eq('liker_id', forumUser.id)
        .eq('liked_user_id', profile.id);
      setStatusLiked(false);
      setStatusLikeCount(prev => Math.max(0, prev - 1));
    } else {
      await supabase
        .from('forum_status_likes')
        .insert({ liker_id: forumUser.id, liked_user_id: profile.id });
      setStatusLiked(true);
      setStatusLikeCount(prev => prev + 1);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeSince = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <User className="w-16 h-16 text-[hsl(var(--bc-text-muted))] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">User Not Found</h1>
        <p className="text-[hsl(var(--bc-text-muted))]">The user "{username}" doesn't exist.</p>
        <Link
          to="/forum"
          className="inline-block mt-4 text-[hsl(var(--bc-primary))] hover:underline"
        >
          Back to Forum
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Left Column - Profile Info (Classic 2017 style) */}
      <div className="w-72 flex-shrink-0 space-y-4">
        {/* Profile Card */}
        <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
          {/* Header */}
          <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
            {profile.username}
            {profile.is_verified && <VerifiedBadge size="sm" />}
          </div>
          
          {/* Avatar */}
          <div className="bg-[hsl(var(--bc-bg-card))] p-4 border-b border-[hsl(var(--bc-border))]">
            <div className="flex justify-center">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                username={profile.username}
                size="xl"
                effect={profile.avatar_effect}
                membershipTier={profile.membership_tier}
                className="border-2 border-[hsl(var(--bc-border))]"
              />
            </div>
          </div>

          {/* Signature/Bio */}
          {profile.signature && (
            <div className="bg-[hsl(var(--bc-bg-card))] p-3 border-b border-[hsl(var(--bc-border))] text-sm text-[hsl(var(--bc-text))]">
              {profile.signature}
            </div>
          )}

          {/* Stats Table */}
          <div className="bg-[hsl(var(--bc-bg-card))] text-sm">
            <div className="flex justify-between px-3 py-2 border-b border-[hsl(var(--bc-border))]">
              <span className="font-medium text-[hsl(var(--bc-text))]">Profile Views:</span>
              <span className="text-[hsl(var(--bc-text-muted))]">{stats.totalViews.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 py-2 border-b border-[hsl(var(--bc-border))]">
              <span className="font-medium text-[hsl(var(--bc-text))]">Forum Posts:</span>
              <span className="text-[hsl(var(--bc-text-muted))]">{profile.post_count.toLocaleString()}</span>
            </div>
            <div className="flex justify-between px-3 py-2 border-b border-[hsl(var(--bc-border))]">
              <span className="font-medium text-[hsl(var(--bc-text))]">Date Joined:</span>
              <span className="text-[hsl(var(--bc-text-muted))]">{formatDate(profile.created_at)}</span>
            </div>
            <div className="flex justify-between px-3 py-2 border-b border-[hsl(var(--bc-border))]">
              <span className="font-medium text-[hsl(var(--bc-text))]">Level:</span>
              <span className="text-[hsl(var(--bc-text-muted))]">{profile.level}</span>
            </div>
            <div className="flex justify-between px-3 py-2">
              <span className="font-medium text-[hsl(var(--bc-text))]">XP:</span>
              <span className="text-[hsl(var(--bc-text-muted))]">{profile.xp.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isOwnProfile && forumUser && (
          <div className="space-y-2">
            <FriendButton
              currentUserId={forumUser.id}
              targetUserId={profile.id}
              targetUsername={profile.username}
            />
            <button
              onClick={() => navigate(`/messages?to=${profile.username}`)}
              disabled={!profile.allow_dms && !isAdmin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] disabled:cursor-not-allowed text-white rounded text-sm transition"
            >
              <MessageCircle className="w-4 h-4" />
              Send Message
            </button>
            {!isAdmin && (
              <button
                onClick={handleBlock}
                disabled={blocking}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm transition ${
                  isBlocked
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-[hsl(var(--bc-bg))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] border border-[hsl(var(--bc-border))]'
                }`}
              >
                <Ban className="w-4 h-4" />
                {isBlocked ? 'Unblock' : 'Block'}
              </button>
            )}
          </div>
        )}

        {/* Achievements */}
        <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
          <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium">
            Achievements
          </div>
          <div className="bg-[hsl(var(--bc-bg-card))] p-3">
            <UserAchievements forumUserId={profile.id} />
          </div>
        </div>
      </div>

      {/* Right Column - Content */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Threads Section */}
        {canSeeThreads && (
          <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
            <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium flex items-center justify-between">
              <span>Recent Threads</span>
              <span className="text-xs opacity-80">{threads.length} threads</span>
            </div>

            {threads.length === 0 ? (
              <div className="bg-[hsl(var(--bc-bg-card))] p-8 text-center text-[hsl(var(--bc-text-muted))]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No threads yet</p>
              </div>
            ) : (
              <div className="bg-[hsl(var(--bc-bg-card))] divide-y divide-[hsl(var(--bc-border))]">
                {threads.map((thread) => (
                  <Link
                    key={thread.id}
                    to={`/thread/${thread.id}`}
                    className="block p-3 hover:bg-[hsl(var(--bc-bg))] transition"
                  >
                    <div className="flex items-start gap-2">
                      {pinnedThreadIds.has(thread.id) && (
                        <Pin className="w-3 h-3 text-[hsl(var(--bc-primary))] mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[hsl(var(--bc-link))] hover:underline text-sm">{thread.title}</h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--bc-text-muted))]">
                          <span>{thread.category?.name}</span>
                          <span>•</span>
                          <span>{thread.reply_count} replies</span>
                          <span>•</span>
                          <span>{getTimeSince(thread.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {!canSeeThreads && (
          <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
            <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium">
              Threads
            </div>
            <div className="bg-[hsl(var(--bc-bg-card))] p-8 text-center text-[hsl(var(--bc-text-muted))]">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>This user has hidden their threads from public view.</p>
            </div>
          </div>
        )}

        {/* Groups */}
        <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
          <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium">
            Groups
          </div>
          <div className="bg-[hsl(var(--bc-bg-card))] p-3">
            <UserGroups forumUserId={profile.id} />
          </div>
        </div>

        {/* Friends */}
        <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
          <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium flex items-center justify-between">
            <span>Friends</span>
            <Link to={`/user/${profile.username}/friends`} className="text-xs hover:underline opacity-80">View All</Link>
          </div>
          <div className="bg-[hsl(var(--bc-bg-card))] p-3">
            <FriendsList forumUserId={profile.id} limit={6} showTitle={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
