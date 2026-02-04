import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Calendar, MessageSquare, Pin, MessageCircle, Ban, Loader2, Eye, Clock, FileText, TrendingUp, ExternalLink, Star, Heart, Users, Lock, Trash2, Gamepad2 } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';
import UserAvatar from '@/components/forum/UserAvatar';
import UserLevelBadge from '@/components/forum/UserLevelBadge';
import FriendButton from '@/components/forum/FriendButton';
import FriendsList from '@/components/forum/FriendsList';
import ReportButton from '@/components/forum/ReportButton';
import ProfileViews from '@/components/forum/ProfileViews';
import UserAchievements from '@/components/forum/UserAchievements';
import UserGroups from '@/components/forum/UserGroups';
// Inlined FollowButtonInline component (named to avoid conflict with FriendButton)
function FollowButtonInline({ currentUserId, targetUserId }: { currentUserId: string; targetUserId: string }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    const checkFollowing = async () => {
      const { data } = await supabase
        .from('forum_follows')
        .select('id')
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId)
        .single();
      setIsFollowing(!!data);
      setLoading(false);
    };
    checkFollowing();
  }, [currentUserId, targetUserId]);

  const handleToggle = async () => {
    setToggling(true);
    if (isFollowing) {
      await supabase.from('forum_follows').delete()
        .eq('follower_id', currentUserId)
        .eq('following_id', targetUserId);
      setIsFollowing(false);
      toast.success('Unfollowed');
    } else {
      await supabase.from('forum_follows').insert({ follower_id: currentUserId, following_id: targetUserId });
      setIsFollowing(true);
      toast.success('Following!');
    }
    setToggling(false);
  };

  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={toggling}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition text-sm font-medium ${
        isFollowing
          ? 'bg-[hsl(var(--bc-bg-light))] hover:bg-red-100 text-[hsl(var(--bc-text))] hover:text-red-600'
          : 'bg-[hsl(var(--bc-accent))] hover:bg-[hsl(var(--bc-accent))]/80 text-[hsl(var(--bc-text))]'
      }`}
    >
      <Users className="w-4 h-4" />
      {toggling ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  );
}

// Inlined FollowersList component
function FollowersList({ forumUserId, showTitle = true }: { forumUserId: string; showTitle?: boolean }) {
  const [followers, setFollowers] = useState<Array<{ id: string; username: string; avatar_url: string | null }>>([]);
  const [following, setFollowing] = useState<Array<{ id: string; username: string; avatar_url: string | null }>>([]);
  const [tab, setTab] = useState<'followers' | 'following'>('followers');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch followers
      const { data: followerRows } = await supabase
        .from('forum_follows')
        .select('follower_id')
        .eq('following_id', forumUserId);
      
      if (followerRows && followerRows.length > 0) {
        const ids = followerRows.map(r => r.follower_id);
        const { data: users } = await supabase
          .from('forum_users')
          .select('id, username, avatar_url')
          .in('id', ids);
        setFollowers(users || []);
      }

      // Fetch following
      const { data: followingRows } = await supabase
        .from('forum_follows')
        .select('following_id')
        .eq('follower_id', forumUserId);
      
      if (followingRows && followingRows.length > 0) {
        const ids = followingRows.map(r => r.following_id);
        const { data: users } = await supabase
          .from('forum_users')
          .select('id, username, avatar_url')
          .in('id', ids);
        setFollowing(users || []);
      }

      setLoading(false);
    };
    fetchData();
  }, [forumUserId]);

  const currentList = tab === 'followers' ? followers : following;

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
      {showTitle && (
        <div className="flex gap-4 mb-4 border-b border-[hsl(var(--bc-border))] pb-2">
          <button
            onClick={() => setTab('followers')}
            className={`text-sm font-medium pb-2 border-b-2 transition ${
              tab === 'followers' ? 'border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-primary))]' : 'border-transparent text-[hsl(var(--bc-text-muted))]'
            }`}
          >
            Followers ({followers.length})
          </button>
          <button
            onClick={() => setTab('following')}
            className={`text-sm font-medium pb-2 border-b-2 transition ${
              tab === 'following' ? 'border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-primary))]' : 'border-transparent text-[hsl(var(--bc-text-muted))]'
            }`}
          >
            Following ({following.length})
          </button>
        </div>
      )}
      {loading ? (
        <div className="text-center py-4 text-[hsl(var(--bc-text-muted))]">Loading...</div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-4 text-[hsl(var(--bc-text-muted))]">
          {tab === 'followers' ? 'No followers yet' : 'Not following anyone'}
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {currentList.map(u => (
            <Link
              key={u.id}
              to={`/id/${u.username}/profile`}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition group"
            >
              <UserAvatar avatarUrl={u.avatar_url} username={u.username} size="sm" />
              <span className="text-xs text-[hsl(var(--bc-text-muted))] group-hover:text-[hsl(var(--bc-text))] truncate max-w-full">
                {u.username}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Inlined ProfileWall component
function ProfileWall({ 
  forumUserId, 
  currentUserId, 
  isOwnProfile, 
  isAdmin, 
  wallIsPrivate 
}: { 
  forumUserId: string; 
  currentUserId?: string; 
  isOwnProfile: boolean; 
  isAdmin: boolean; 
  wallIsPrivate?: boolean;
}) {
  const [posts, setPosts] = useState<Array<{
    id: string;
    content: string;
    created_at: string;
    author: { id: string; username: string; avatar_url: string | null };
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [forumUserId]);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('forum_wall_posts')
      .select('id, content, created_at, author_id')
      .eq('profile_id', forumUserId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data && data.length > 0) {
      const authorIds = [...new Set(data.map(p => p.author_id))];
      const { data: authors } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url')
        .in('id', authorIds);

      const postsWithAuthors = data.map(p => ({
        ...p,
        author: authors?.find(a => a.id === p.author_id) || { id: p.author_id, username: 'Unknown', avatar_url: null }
      }));
      setPosts(postsWithAuthors);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!newPost.trim() || !currentUserId) return;
    setSubmitting(true);
    
    const { error } = await supabase
      .from('forum_wall_posts')
      .insert({ profile_id: forumUserId, author_id: currentUserId, content: newPost.trim() });

    if (error) {
      toast.error('Failed to post');
    } else {
      setNewPost('');
      fetchPosts();
      toast.success('Posted!');
    }
    setSubmitting(false);
  };

  const handleDelete = async (postId: string) => {
    const { error } = await supabase
      .from('forum_wall_posts')
      .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: currentUserId })
      .eq('id', postId);

    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast.success('Post deleted');
    }
  };

  // Hide wall if private and not owner/admin
  if (wallIsPrivate && !isOwnProfile && !isAdmin) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 text-center">
        <Lock className="w-8 h-8 text-[hsl(var(--bc-text-muted))] mx-auto mb-2" />
        <p className="text-[hsl(var(--bc-text-muted))]">This wall is private</p>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
      <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5" />
        Wall
        {wallIsPrivate && <Lock className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />}
      </h2>

      {currentUserId && (
        <div className="mb-4">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="Write on this wall..."
            className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] resize-none"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting || !newPost.trim()}
            className="mt-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg text-sm"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-4 text-[hsl(var(--bc-text-muted))]">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-4 text-[hsl(var(--bc-text-muted))]">No wall posts yet</div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex gap-3 p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg">
              <Link to={`/id/${post.author.username}/profile`}>
                <UserAvatar avatarUrl={post.author.avatar_url} username={post.author.username} size="sm" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <Link to={`/id/${post.author.username}/profile`} className="font-medium text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]">
                    {post.author.username}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    {(isAdmin || post.author.id === currentUserId) && (
                      <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[hsl(var(--bc-text))] mt-1">{post.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useVerificationStatus } from '@/components/forum/VerifiedBadge';

type AffiliateUser = {
  id: string;
  username: string;
  avatar_url: string | null;
};

function AffiliatesSectionProfileInline({
  forumUserId,
  isOwnProfile,
}: {
  forumUserId: string;
  isOwnProfile: boolean;
}) {
  const [loading, setLoading] = useState(true);
  const [isHidden, setIsHidden] = useState(false);
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setIsHidden(false);
      setAffiliates([]);

      const { data: goldData } = await supabase
        .from('forum_gold_checkmarks')
        .select('hide_affiliates')
        .eq('forum_user_id', forumUserId)
        .maybeSingle();

      if (cancelled) return;

      if (!goldData) {
        setLoading(false);
        return;
      }

      if (goldData.hide_affiliates && !isOwnProfile) {
        setIsHidden(true);
        setLoading(false);
        return;
      }

      const { data: affRows } = await supabase
        .from('forum_affiliates')
        .select('affiliate_user_id')
        .eq('gold_user_id', forumUserId);

      if (cancelled) return;

      const affiliateIds = (affRows ?? []).map((r) => r.affiliate_user_id).filter(Boolean);
      if (affiliateIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: users } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url')
        .in('id', affiliateIds);

      if (cancelled) return;

      setAffiliates((users ?? []) as AffiliateUser[]);
      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [forumUserId, isOwnProfile]);

  if (loading || isHidden || affiliates.length === 0) return null;

  return (
    <section className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
      <h2 className="text-sm font-semibold text-[hsl(var(--bc-text))] mb-3 flex items-center gap-2">
        <User className="w-4 h-4" />
        Affiliates
      </h2>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {affiliates.map((u) => (
          <Link
            key={u.id}
            to={`/id/${u.username}/profile`}
            className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition group"
          >
            <UserAvatar avatarUrl={u.avatar_url} username={u.username} size="sm" />
            <span className="text-xs text-[hsl(var(--bc-text-muted))] group-hover:text-[hsl(var(--bc-text))] truncate max-w-full">
              {u.username}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

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
  wall_is_private: boolean;
  follower_count: number;
  following_count: number;
  bio: string | null;
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
  const { serialId, username } = useParams<{ serialId: string; username: string }>();
  const navigate = useNavigate();
  const { user, forumUser, isAdmin } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userGames, setUserGames] = useState<Array<{id: string; title: string; thumbnail_url: string | null; play_count: number; favorite_count: number; category: string}>>([]);
  const [pinnedThreadIds, setPinnedThreadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [stats, setStats] = useState<ProfileStats>({ totalViews: 0, totalReplies: 0, threadCount: 0 });
  const [statusLiked, setStatusLiked] = useState(false);
  const [statusLikeCount, setStatusLikeCount] = useState(0);

  // Check if it's own profile based on serial_id or username
  const isOwnProfile = forumUser?.serial_id === parseInt(serialId || '0') || 
                       forumUser?.username?.toLowerCase() === username?.toLowerCase();

  useEffect(() => {
    if (serialId || username) {
      fetchProfile();
    }
  }, [serialId, username]);

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
    
    // Prefer serial_id for lookup, fallback to username
    let query = supabase.from('forum_users').select('*');
    
    if (serialId && /^\d+$/.test(serialId)) {
      query = query.eq('serial_id', parseInt(serialId));
    } else if (username) {
      query = query.eq('username', username);
    }
    
    const { data: userData, error } = await query.single();

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

    // Fetch pinned thread IDs (kept for potential future use)
    const { data: pinned } = await supabase
      .from('forum_pinned_threads')
      .select('thread_id')
      .eq('forum_user_id', userData.id);
    
    if (pinned) {
      setPinnedThreadIds(new Set(pinned.map(p => p.thread_id)));
    }

    // Fetch user's games
    const { data: gamesData } = await supabase
      .from('forum_games')
      .select('id, title, thumbnail_url, play_count, favorite_count, category')
      .eq('creator_id', userData.id)
      .eq('is_private', false)
      .order('created_at', { ascending: false })
      .limit(6);
    
    if (gamesData) {
      setUserGames(gamesData);
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
        
        <div className="px-4 sm:px-6 pb-6">
          {/* Avatar and User Info Row */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 sm:-mt-12">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                username={profile.username}
                size="xl"
                effect={profile.avatar_effect}
                membershipTier={profile.membership_tier}
                className="border-4 border-[hsl(var(--bc-bg-card))] shadow-lg"
              />
              {/* Online status indicator */}
              {profile.last_seen_at && new Date(profile.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000) && (
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-[hsl(var(--bc-bg-card))] rounded-full z-10" />
              )}
            </div>

            {/* User Info - Next to avatar */}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[hsl(var(--bc-text))]">{profile.username}</h1>
                <VerificationBadge size="lg" forumUserId={profile.id} isVerified={profile.is_verified} />
                {profile.membership_tier && <MembershipBadge tier={profile.membership_tier} size="md" />}
                {profile.is_suspended && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">Suspended</span>
                )}
              </div>

              {/* Member since & Online Status */}
              <div className="flex items-center gap-3 flex-wrap mt-1">
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                  Member since {formatDate(profile.created_at)}
                </p>
                {profile.last_seen_at && (
                  <>
                    <span className="text-[hsl(var(--bc-text-muted))]">•</span>
                    {new Date(profile.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000) ? (
                      <span className="text-sm text-green-500 font-medium flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Online
                      </span>
                    ) : (
                      <span className="text-sm text-[hsl(var(--bc-text-muted))]">
                        Last seen {getTimeSince(profile.last_seen_at)}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && forumUser && (
            <div className="flex flex-wrap gap-2 mt-4">
              <FollowButtonInline
                currentUserId={forumUser.id}
                targetUserId={profile.id}
              />
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

          {/* Signature */}
          {profile.signature && (
            <div className="p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg border-l-4 border-[hsl(var(--bc-primary))] mt-4">
              <p className="text-sm text-[hsl(var(--bc-text-muted))] italic">"{profile.signature}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Bio Section - always show */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2 flex items-center gap-2">
          <User className="w-5 h-5" />
          About
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] whitespace-pre-wrap">{profile.bio || 'No description yet.'}</p>
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

      {/* Achievements Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        <UserAchievements forumUserId={profile.id} />
      </div>

      {/* Affiliates Section - for gold checkmark users */}
      <AffiliatesSectionProfileInline forumUserId={profile.id} isOwnProfile={isOwnProfile} />

      {/* Groups Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        <UserGroups forumUserId={profile.id} />
      </div>

      {/* User Games Section */}
      {userGames.length > 0 && (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
          <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Games
            </h2>
            <span className="text-sm text-[hsl(var(--bc-text-muted))]">{userGames.length} games</span>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {userGames.map((game) => (
              <Link
                key={game.id}
                to={`/game/${game.id}`}
                className="bg-[hsl(var(--bc-bg-light))] rounded-xl overflow-hidden hover:ring-2 hover:ring-[hsl(var(--bc-primary))] transition block"
              >
                <div className="h-24 bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] flex items-center justify-center">
                  <Gamepad2 className="w-8 h-8 text-white/50" />
                  {game.thumbnail_url && (
                    <img
                      src={game.thumbnail_url}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-[hsl(var(--bc-text))] truncate">{game.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[hsl(var(--bc-text-muted))]">
                    <span>{game.play_count || 0} plays</span>
                    <span>{game.favorite_count || 0} favorites</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Profile Views - only visible to profile owner */}
      {isOwnProfile && profile && (
        <ProfileViews forumUserId={profile.id} isOwnProfile={isOwnProfile} />
      )}

      {/* Followers/Following */}
      <FollowersList forumUserId={profile.id} showTitle={true} />

      {/* Profile Wall */}
      <ProfileWall 
        forumUserId={profile.id} 
        currentUserId={forumUser?.id} 
        isOwnProfile={isOwnProfile} 
        isAdmin={isAdmin}
        wallIsPrivate={profile.wall_is_private}
      />

      {/* Friends List */}
      <FriendsList forumUserId={profile.id} limit={6} showTitle={true} />
    </div>
  );
}
