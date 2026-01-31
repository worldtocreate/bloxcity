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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Status Bubble - shown at top if user has status */}
      {profile.status_text && (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <UserAvatar
              avatarUrl={profile.avatar_url}
              username={profile.username}
              size="md"
              effect={profile.avatar_effect}
              membershipTier={profile.membership_tier}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-[hsl(var(--bc-text))]">{profile.username}</span>
                {profile.status_updated_at && (
                  <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                    {getTimeSince(profile.status_updated_at)}
                  </span>
                )}
              </div>
              <div className="relative bg-[hsl(var(--bc-bg-light))] rounded-xl p-3">
                <div className="absolute -top-2 left-4 w-3 h-3 bg-[hsl(var(--bc-bg-light))] rotate-45" />
                <p className="text-[hsl(var(--bc-text))]">{profile.status_text}</p>
              </div>
              {/* Like button */}
              {forumUser && !isOwnProfile && (
                <div className="flex items-center gap-3 mt-2">
                  <button
                    onClick={handleLikeStatus}
                    className={`flex items-center gap-1 text-sm transition ${
                      statusLiked 
                        ? 'text-red-500' 
                        : 'text-[hsl(var(--bc-text-muted))] hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${statusLiked ? 'fill-current' : ''}`} />
                    {statusLikeCount > 0 && statusLikeCount}
                  </button>
                </div>
              )}
              {isOwnProfile && statusLikeCount > 0 && (
                <div className="flex items-center gap-1 mt-2 text-sm text-[hsl(var(--bc-text-muted))]">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                  {statusLikeCount} {statusLikeCount === 1 ? 'like' : 'likes'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
        {/* Cover/Banner Area */}
        {profile.cover_url ? (
          <div 
            className="h-32 sm:h-40 bg-cover bg-center"
            style={{ backgroundImage: `url(${profile.cover_url})` }}
          />
        ) : (
          <div className="h-24 bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))]" />
        )}
        
        <div className="relative px-6 pb-6">
          {/* Avatar - overlapping banner */}
          <div className="absolute -top-12 left-6">
            <UserAvatar
              avatarUrl={profile.avatar_url}
              username={profile.username}
              size="xl"
              effect={profile.avatar_effect}
              membershipTier={profile.membership_tier}
              className="border-4 border-[hsl(var(--bc-bg-card))] shadow-lg"
            />
          </div>

          {/* Actions - aligned right */}
          <div className="flex justify-end pt-4">
            {!isOwnProfile && forumUser && (
              <div className="flex gap-2">
                <FriendButton
                  currentUserId={forumUser.id}
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                />
                <button
                  onClick={() => navigate(`/messages?to=${profile.username}`)}
                  disabled={!profile.allow_dms && !isAdmin}
                  className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] disabled:cursor-not-allowed text-white rounded-lg transition text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
                {!isAdmin && (
                  <button
                    onClick={handleBlock}
                    disabled={blocking}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
                      isBlocked
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))]'
                    }`}
                  >
                    <Ban className="w-4 h-4" />
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                )}
                <ReportButton
                  reporterId={forumUser.id}
                  reportedType="profile"
                  reportedId={profile.id}
                  reportedName={profile.username}
                  variant="icon"
                />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">{profile.username}</h1>
              {profile.is_verified && <VerifiedBadge size="lg" />}
              {profile.membership_tier && <MembershipBadge tier={profile.membership_tier} size="md" />}
              <UserLevelBadge level={profile.level} xp={profile.xp} size="md" />
              {profile.is_suspended && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Suspended</span>
              )}
            </div>

            {/* Member since */}
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Member since {formatDate(profile.created_at)}
            </p>


            {/* Signature */}
            {profile.signature && (
              <div className="p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg border-l-4 border-[hsl(var(--bc-primary))]">
                <p className="text-sm text-[hsl(var(--bc-text-muted))] italic">"{profile.signature}"</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Level & XP */}
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(var(--bc-text))]">{profile.xp.toLocaleString()}</div>
              <div className="text-xs text-[hsl(var(--bc-text-muted))]">XP</div>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--bc-primary))]/20 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(var(--bc-text))]">{profile.post_count}</div>
              <div className="text-xs text-[hsl(var(--bc-text-muted))]">Posts</div>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--bc-accent))]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(var(--bc-text))]">{profile.thread_count}</div>
              <div className="text-xs text-[hsl(var(--bc-text-muted))]">Threads</div>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(var(--bc-text))]">{stats.totalViews.toLocaleString()}</div>
              <div className="text-xs text-[hsl(var(--bc-text-muted))]">Views</div>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <div className="text-xl font-bold text-[hsl(var(--bc-text))]">{stats.totalReplies.toLocaleString()}</div>
              <div className="text-xs text-[hsl(var(--bc-text-muted))]">Replies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Info & Social Links */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 space-y-3">
        {/* Membership Badge at top */}
        {profile.membership_tier && (
          <div className="pb-3 border-b border-[hsl(var(--bc-border))]">
            <MembershipBadge tier={profile.membership_tier} size="lg" />
          </div>
        )}
        
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))]">
            <Calendar className="w-4 h-4" />
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
          {profile.last_post_at && (
            <div className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))]">
              <Clock className="w-4 h-4" />
              <span>Last active {getTimeSince(profile.last_post_at)}</span>
            </div>
          )}
        </div>
        
        {/* Social Links */}
        {(profile.social_discord || profile.social_x) && (
          <div className="flex items-center gap-3 pt-3 border-t border-[hsl(var(--bc-border))] flex-wrap">
            {profile.social_discord && (
              <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] px-3 py-1.5 rounded-full">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                {profile.social_discord}
              </div>
            )}
            {profile.social_x && (
              <a
                href={`https://x.com/${profile.social_x}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] px-3 py-1.5 rounded-full hover:bg-[hsl(var(--bc-border))] transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @{profile.social_x}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Threads Section */}
      {canSeeThreads && (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
          <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Recent Threads</h2>
            <span className="text-sm text-[hsl(var(--bc-text-muted))]">{threads.length} threads</span>
          </div>

          {threads.length === 0 ? (
            <div className="p-8 text-center text-[hsl(var(--bc-text-muted))]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No threads yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[hsl(var(--bc-border))]">
              {threads.map((thread) => (
                <Link
                  key={thread.id}
                  to={`/thread/${thread.id}`}
                  className="block p-4 hover:bg-[hsl(var(--bc-bg-light))] transition"
                >
                  <div className="flex items-start gap-3">
                    {pinnedThreadIds.has(thread.id) && (
                      <Pin className="w-4 h-4 text-[hsl(var(--bc-primary))] mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[hsl(var(--bc-text))] truncate">{thread.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-[hsl(var(--bc-text-muted))]">
                        <span className="px-2 py-0.5 bg-[hsl(var(--bc-bg-light))] rounded text-xs">{thread.category?.name}</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {thread.reply_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" />
                          {thread.view_count}
                        </span>
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
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <MessageSquare className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--bc-text-muted))]">This user has hidden their threads from public view.</p>
        </div>
      )}

      {/* Friends List */}
      <FriendsList forumUserId={profile.id} limit={6} showTitle={true} />
    </div>
  );
}
