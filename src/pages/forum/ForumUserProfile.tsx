import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, MessageSquare, Pin, MessageCircle, Ban, Loader2, Eye, Clock, FileText, TrendingUp } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import VerifiedBadge from '@/components/forum/VerifiedBadge';

interface ProfileData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  signature: string | null;
  created_at: string;
  post_count: number;
  is_verified: boolean;
  is_suspended: boolean;
  hide_threads: boolean;
  allow_dms: boolean;
  last_post_at: string | null;
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
      {/* Profile Header Card */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
        {/* Cover/Banner Area */}
        <div className="h-24 bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))]" />
        
        <div className="relative px-6 pb-6">
          {/* Avatar - overlapping banner */}
          <div className="absolute -top-12 left-6">
            {profile.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.username}
                className="w-24 h-24 rounded-xl object-cover border-4 border-[hsl(var(--bc-bg-card))] shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-xl bg-[hsl(var(--bc-primary))] flex items-center justify-center border-4 border-[hsl(var(--bc-bg-card))] shadow-lg">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
          </div>

          {/* Actions - aligned right */}
          <div className="flex justify-end pt-4">
            {!isOwnProfile && forumUser && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/forum/messages?to=${profile.username}`)}
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
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">{profile.username}</h1>
              {profile.is_verified && <VerifiedBadge size="lg" />}
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
              <div className="text-xl font-bold text-[hsl(var(--bc-text))]">{stats.threadCount}</div>
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

      {/* Activity Info */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
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
                  to={`/forum/thread/${thread.id}`}
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
    </div>
  );
}
