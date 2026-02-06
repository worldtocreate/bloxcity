import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Calendar, MessageSquare, MessageCircle, Ban, Loader2, 
  Clock, Users, MoreVertical, Flag, Award, Frown, Rocket, Medal,
  UserPlus, Globe, ShieldCheck, X, Gamepad2, Play, Heart, UserMinus,
  Send, Crown, BadgeCheck
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import UserAvatar from '@/components/forum/UserAvatar';
import FriendButton from '@/components/forum/FriendButton';
import MembershipBadge from '@/components/forum/MembershipBadge';
import StaffBadge from '@/components/forum/StaffBadge';
import ReportButton from '@/components/forum/ReportButton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  membership_tier: 'bronze' | 'silver' | 'platinum' | null;
  xp: number;
  level: number;
  thread_count: number;
  avatar_effect: string | null;
  status_text: string | null;
  status_updated_at: string | null;
  last_seen_at: string | null;
  bio: string | null;
}

interface GroupData {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
}

interface Achievement {
  id: string;
  name: string;
  image_url: string | null;
  description: string | null;
}

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface GameData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  play_count: number;
  favorite_count: number;
}

interface AffiliateUser {
  id: string;
  username: string;
  avatar_url: string | null;
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
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [games, setGames] = useState<GameData[]>([]);
  const [primaryGroup, setPrimaryGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [areFriends, setAreFriends] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [verifiedModalOpen, setVerifiedModalOpen] = useState(false);
  
  // Follow system state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  
  // Wall posts state
  const [wallPosts, setWallPosts] = useState<any[]>([]);
  const [newWallPost, setNewWallPost] = useState('');
  const [postingWall, setPostingWall] = useState(false);
  
  // Gold checkmark and affiliates state
  const [hasGoldCheckmark, setHasGoldCheckmark] = useState(false);
  const [hideAffiliates, setHideAffiliates] = useState(false);
  const [affiliatedUsers, setAffiliatedUsers] = useState<AffiliateUser[]>([]);

  // Staff role for the profile being viewed (owner/admin/mod)
  const [profileStaffRole, setProfileStaffRole] = useState<string | null>(null);

  const isOwnProfile = forumUser?.serial_id === parseInt(serialId || '0') || 
                       forumUser?.username?.toLowerCase() === username?.toLowerCase();

  const isOnline = profile?.last_seen_at && 
    new Date(profile.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000);

  useEffect(() => {
    if (serialId || username) {
      fetchProfile();
    }
  }, [serialId, username]);

  // Log profile view
  useEffect(() => {
    const logProfileView = async () => {
      if (!profile || !user) return;
      if (isOwnProfile) return;
      
      const viewKey = `profile_view_${profile.id}`;
      const lastView = localStorage.getItem(viewKey);
      if (lastView && Date.now() - parseInt(lastView) < 3600000) return;
      
      await supabase
        .from('forum_profile_views')
        .insert({
          viewed_user_id: profile.id,
          viewer_user_id: forumUser?.id || null,
          viewer_ip: null
        });
      
      localStorage.setItem(viewKey, Date.now().toString());
    };
    
    logProfileView();
  }, [profile, user, isOwnProfile, forumUser]);

  const fetchProfile = async () => {
    setLoading(true);
    
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

    // Resolve staff role (via security definer RPC) for the profile being viewed
    if ((userData as any).user_id) {
      const { data: staffRole } = await supabase.rpc('get_staff_role', {
        _user_id: (userData as any).user_id,
      });
      setProfileStaffRole((staffRole as string | null) ?? null);
    } else {
      setProfileStaffRole(null);
    }

    if (forumUser && forumUser.id !== userData.id) {
      const { data: blockData } = await supabase
        .from('forum_blocked_users')
        .select('id')
        .eq('blocker_id', forumUser.id)
        .eq('blocked_id', userData.id)
        .single();
      
      setIsBlocked(!!blockData);

      // Check friendship status
      const { data: friendshipData } = await supabase
        .from('forum_friendships')
        .select('id')
        .or(`and(user_1_id.eq.${forumUser.id},user_2_id.eq.${userData.id}),and(user_1_id.eq.${userData.id},user_2_id.eq.${forumUser.id})`)
        .single();
      
      setAreFriends(!!friendshipData);

      // Check pending request
      if (!friendshipData) {
        const { data: pendingData } = await supabase
          .from('forum_friend_requests')
          .select('id')
          .or(`and(sender_id.eq.${forumUser.id},receiver_id.eq.${userData.id}),and(sender_id.eq.${userData.id},receiver_id.eq.${forumUser.id})`)
          .eq('status', 'pending')
          .single();
        
        setIsPending(!!pendingData);
      }
    }

    // Fetch user's groups
    const { data: memberData } = await supabase
      .from('forum_group_members')
      .select('group:group_id(id, name, slug, icon_url)')
      .eq('forum_user_id', userData.id)
      .limit(6);
    
    if (memberData) {
      const groupsList = memberData
        .map((m: any) => m.group)
        .filter(Boolean) as GroupData[];
      setGroups(groupsList);
      // First group as primary for now
      if (groupsList.length > 0) {
        setPrimaryGroup(groupsList[0]);
      }
    }

    // Fetch achievements
    const { data: userAchievements } = await supabase
      .from('forum_user_achievements')
      .select('achievement:achievement_id(id, name, image_url, description)')
      .eq('forum_user_id', userData.id)
      .limit(12);
    
    if (userAchievements) {
      setAchievements(
        userAchievements
          .map((a: any) => a.achievement)
          .filter(Boolean) as Achievement[]
      );
    }

    // Fetch friends
    const { data: friendshipsData } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id')
      .or(`user_1_id.eq.${userData.id},user_2_id.eq.${userData.id}`)
      .limit(6);
    
    if (friendshipsData && friendshipsData.length > 0) {
      const friendIds = friendshipsData.map(f => 
        f.user_1_id === userData.id ? f.user_2_id : f.user_1_id
      );
      
      const { data: friendUsers } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url')
        .in('id', friendIds);
      
      if (friendUsers) {
        setFriends(friendUsers as Friend[]);
      }
    }

    // Fetch user's games
    const { data: gamesData } = await supabase
      .from('forum_games')
      .select('id, title, thumbnail_url, play_count, favorite_count')
      .eq('creator_id', userData.id)
      .eq('is_private', false)
      .order('play_count', { ascending: false })
      .limit(6);
    
    if (gamesData) {
      setGames(gamesData as GameData[]);
    }

    // Fetch followers count
    const { count: followersCountData } = await supabase
      .from('forum_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userData.id);
    setFollowersCount(followersCountData || 0);

    // Fetch following count
    const { count: followingCountData } = await supabase
      .from('forum_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userData.id);
    setFollowingCount(followingCountData || 0);

    // Check if current user is following
    if (forumUser && forumUser.id !== userData.id) {
      const { data: followData } = await supabase
        .from('forum_follows')
        .select('id')
        .eq('follower_id', forumUser.id)
        .eq('following_id', userData.id)
        .single();
      setIsFollowing(!!followData);
    }

    // Fetch wall posts
    const { data: wallData } = await supabase
      .from('forum_wall_posts')
      .select(`
        id,
        content,
        created_at,
        author:author_id(id, username, avatar_url)
      `)
      .eq('profile_id', userData.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (wallData) {
      setWallPosts(wallData);
    }

    // Fetch gold checkmark status and affiliates
    const { data: hasGold } = await supabase.rpc('has_gold_checkmark', { 
      _forum_user_id: userData.id 
    });
    setHasGoldCheckmark(hasGold || false);

    if (hasGold) {
      // Check if affiliates are hidden
      const { data: goldSettings } = await supabase
        .from('forum_gold_checkmarks')
        .select('hide_affiliates')
        .eq('forum_user_id', userData.id)
        .single();
      
      const shouldHide = goldSettings?.hide_affiliates || false;
      setHideAffiliates(shouldHide);
      
      // Fetch affiliates if not hidden
      if (!shouldHide) {
        const { data: affiliatesData } = await supabase
          .from('forum_affiliates')
          .select('affiliate_user_id')
          .eq('gold_user_id', userData.id);
        
        if (affiliatesData && affiliatesData.length > 0) {
          const affiliateIds = affiliatesData.map(a => a.affiliate_user_id);
          const { data: affiliateUsers } = await supabase
            .from('forum_users')
            .select('id, username, avatar_url')
            .in('id', affiliateIds);
          
          if (affiliateUsers) {
            setAffiliatedUsers(affiliateUsers as AffiliateUser[]);
          }
        }
      }
    }

    setLoading(false);
  };

  const handleBlock = async () => {
    if (!forumUser || !profile) return;
    setBlocking(true);

    if (isBlocked) {
      const { error } = await supabase
        .from('forum_blocked_users')
        .delete()
        .eq('blocker_id', forumUser.id)
        .eq('blocked_id', profile.id);

      if (!error) {
        toast.success('User unblocked');
        setIsBlocked(false);
      }
    } else {
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

  const handleFollow = async () => {
    if (!forumUser || !profile) return;
    setFollowLoading(true);

    if (isFollowing) {
      // Unfollow
      const { error } = await supabase
        .from('forum_follows')
        .delete()
        .eq('follower_id', forumUser.id)
        .eq('following_id', profile.id);

      if (!error) {
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success(`Unfollowed ${profile.username}`);
      }
    } else {
      // Follow
      const { error } = await supabase
        .from('forum_follows')
        .insert({
          follower_id: forumUser.id,
          following_id: profile.id
        });

      if (!error) {
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Following ${profile.username}`);
      }
    }
    setFollowLoading(false);
  };

  const handlePostWall = async () => {
    if (!forumUser || !profile || !newWallPost.trim()) return;
    setPostingWall(true);

    const { error } = await supabase
      .from('forum_wall_posts')
      .insert({
        profile_id: profile.id,
        author_id: forumUser.id,
        content: newWallPost.trim()
      });

    if (error) {
      toast.error('Failed to post');
    } else {
      toast.success('Posted to wall!');
      setNewWallPost('');
      // Refetch wall posts
      const { data: wallData } = await supabase
        .from('forum_wall_posts')
        .select(`
          id,
          content,
          created_at,
          author:author_id(id, username, avatar_url)
        `)
        .eq('profile_id', profile.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (wallData) setWallPosts(wallData);
    }
    setPostingWall(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-info))] animate-spin" />
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
          className="inline-block mt-4 text-[hsl(var(--bc-info))] hover:underline"
        >
          Back to Forum
        </Link>
      </div>
    );
  }

  if (profile.is_suspended) {
    return (
      <div className="text-center py-20">
        <Ban className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">User Banned</h1>
        <p className="text-[hsl(var(--bc-text-muted))]">This user has been banned from the platform.</p>
      </div>
    );
  }

  return (
    <>
      {/* Verified Badge Modal */}
      <Dialog open={verifiedModalOpen} onOpenChange={setVerifiedModalOpen}>
        <DialogContent className="bc-card max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Verified Badge</span>
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">
              This account is verified because it's a notable and trustworthy figure in BloxCity.
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <button className="bc-btn bc-btn-success bc-btn-sm">Learn More</button>
            <button 
              onClick={() => setVerifiedModalOpen(false)}
              className="bc-btn bc-btn-secondary bc-btn-sm"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 py-6">
        {/* Left Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
          {/* Username Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                 <div className="flex items-center gap-1.5 font-semibold text-xl text-[hsl(var(--bc-text))]">
                   {profile.username}
                   <VerificationBadge 
                     forumUserId={profile.id}
                     isVerified={profile.is_verified}
                     size="md"
                   />
                   <StaffBadge role={profileStaffRole} size="md" />
                 </div>
                <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                  @{profile.username}
                </div>
                {/* Followers/Following */}
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <Link to={`/users?followers=${profile.username}`} className="hover:underline text-[hsl(var(--bc-text))]">
                    <strong>{followersCount}</strong> <span className="text-[hsl(var(--bc-text-muted))]">Followers</span>
                  </Link>
                  <Link to={`/users?following=${profile.username}`} className="hover:underline text-[hsl(var(--bc-text))]">
                    <strong>{followingCount}</strong> <span className="text-[hsl(var(--bc-text-muted))]">Following</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* More Options Dropdown */}
            {forumUser && forumUser.id !== profile.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="bc-btn-circle">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bc-dropdown">
                  <DropdownMenuItem 
                    onClick={() => navigate('/report')}
                    className="bc-dropdown-item"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => navigate(`/admin?tab=users&user=${profile.id}`)}
                        className="bc-dropdown-item text-red-600"
                      >
                        View in Panel
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Avatar Card with Status */}
          <div className={`bc-card p-4 ${isOnline ? 'ring-2 ring-green-500' : 'ring-2 ring-gray-300'}`}>
            <div className="flex justify-center">
              <UserAvatar
                avatarUrl={profile.avatar_url}
                username={profile.username}
                size="xl"
                effect={profile.avatar_effect}
                membershipTier={profile.membership_tier}
              />
            </div>
            
            {/* Action Buttons */}
            {forumUser && forumUser.id !== profile.id && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                <FriendButton
                  currentUserId={forumUser.id}
                  targetUserId={profile.id}
                  targetUsername={profile.username}
                />
                <button 
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`bc-btn bc-btn-sm justify-center ${isFollowing ? 'bc-btn-secondary' : 'bc-btn-info'}`}
                >
                  {followLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
                {profile.allow_dms && (
                  <button 
                    onClick={() => navigate(`/messages?to=${profile.username}`)}
                    className="bc-btn bc-btn-success bc-btn-sm col-span-2 justify-center"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Message</span>
                  </button>
                )}
              </div>
            )}

            {/* Primary Group */}
            {primaryGroup && (
              <Link 
                to={`/group/${primaryGroup.slug}`}
                className="bc-card mt-4 p-2 flex items-center gap-2 hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                {primaryGroup.icon_url ? (
                  <img 
                    src={primaryGroup.icon_url} 
                    alt={primaryGroup.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--bc-info))] flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">
                    Primary Space
                  </div>
                  <div className="text-sm font-semibold text-[hsl(var(--bc-text))] truncate">
                    {primaryGroup.name}
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* About Section */}
          {profile.bio && (
            <>
              <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">About</div>
              <div className="bc-card p-4">
                <p className="text-sm text-[hsl(var(--bc-text))] whitespace-pre-wrap">
                  {profile.bio}
                </p>
              </div>
            </>
          )}

          {/* Statistics */}
          <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Statistics</div>
          <div className="bc-card p-4 space-y-2">
            {profile.membership_tier && (
              <div className="flex items-center gap-2">
                <MembershipBadge tier={profile.membership_tier} size="md" />
              </div>
            )}
            <div className="text-sm text-[hsl(var(--bc-text))] flex items-center gap-2">
              <Medal className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              Rank Lvl. {profile.level}
            </div>
            <div className="text-sm text-[hsl(var(--bc-text))] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              Joined on {formatDate(profile.created_at)}
            </div>
            <div className="text-sm text-[hsl(var(--bc-text))] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              Last seen {profile.last_seen_at ? getTimeAgo(profile.last_seen_at) : 'never'}
            </div>
            <div className="text-sm text-[hsl(var(--bc-text))] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              {profile.post_count.toLocaleString()} Discussion Posts
            </div>
          </div>

          {/* Spaces/Groups */}
          <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Spaces</div>
          <div className="bc-card p-4">
            {groups.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {groups.map((group) => (
                  <Link
                    key={group.id}
                    to={`/group/${group.slug}`}
                    className="text-center hover:opacity-80 transition"
                  >
                    {group.icon_url ? (
                      <img 
                        src={group.icon_url} 
                        alt={group.name}
                        className="w-full aspect-square rounded-lg object-cover mb-1"
                      />
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-[hsl(var(--bc-info))] flex items-center justify-center mb-1">
                        <Users className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div className="text-sm font-semibold text-[hsl(var(--bc-text))] truncate">
                      {group.name}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Globe className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-2" />
                <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">
                  No Spaces
                </div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                  {profile.username} has not joined any spaces.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="md:col-span-8 lg:col-span-9 space-y-4">
          {/* Personal Status */}
          {profile.status_text && (
            <>
              <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Personal Status</div>
              <div className="bc-card p-4">
                <p className="text-[hsl(var(--bc-text))]">{profile.status_text}</p>
              </div>
            </>
          )}

          {/* Achievements */}
          <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Achievements</div>
          <div className="bc-card p-4">
            {achievements.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {achievements.map((achievement) => (
                  <Link
                    key={achievement.id}
                    to="/achievements"
                    className="text-center hover:opacity-80 transition"
                  >
                    {achievement.image_url ? (
                      <img 
                        src={achievement.image_url} 
                        alt={achievement.name}
                        className="w-full aspect-square object-contain"
                      />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center">
                        <Award className="w-12 h-12 text-amber-500" />
                      </div>
                    )}
                    <div className="text-sm truncate text-[hsl(var(--bc-text))]">
                      {achievement.name}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Award className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-2" />
                <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">
                  No Achievements
                </div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                  {profile.username} has not earned any achievements.
                </div>
              </div>
            )}
          </div>

          {/* Friends */}

          {/* Affiliates Section - Only for gold checkmark users with visible affiliates */}
          {hasGoldCheckmark && !hideAffiliates && affiliatedUsers.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-yellow-500" />
                  Affiliates
                </div>
              </div>
              <div className="bc-card p-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                  {affiliatedUsers.map((affiliate) => (
                    <Link
                      key={affiliate.id}
                      to={`/forum/user/${affiliate.username}`}
                      className="text-center hover:opacity-80 transition"
                    >
                      <UserAvatar
                        avatarUrl={affiliate.avatar_url}
                        username={affiliate.username}
                        size="lg"
                        className="mx-auto"
                      />
                      <div className="text-sm truncate text-[hsl(var(--bc-text))] mt-1 flex items-center justify-center gap-1">
                        {affiliate.username}
                        <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Friends</div>
            <Link 
              to={`/friends?user=${profile.username}`}
              className="bc-btn bc-btn-secondary bc-btn-sm"
            >
              View All
            </Link>
          </div>
          <div className="bc-card p-4">
            {friends.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {friends.map((friend) => (
                  <Link
                    key={friend.id}
                    to={`/id/${friend.username}/profile`}
                    className="text-center hover:opacity-80 transition"
                  >
                    <UserAvatar
                      avatarUrl={friend.avatar_url}
                      username={friend.username}
                      size="lg"
                      className="mx-auto"
                    />
                    <div className="text-sm truncate text-[hsl(var(--bc-text))] mt-1">
                      {friend.username}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Frown className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-2" />
                <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">
                  No Friends
                </div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                  {profile.username} has not made any friends.
                </div>
              </div>
            )}
          </div>

          {/* Games Section */}
          <div className="flex items-center justify-between">
            <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Games</div>
            <Link 
              to={`/games?creator=${profile.username}`}
              className="bc-btn bc-btn-secondary bc-btn-sm"
            >
              View All
            </Link>
          </div>
          <div className="bc-card p-4">
            {games.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {games.map((game) => (
                  <Link
                    key={game.id}
                    to={`/game/${game.id}`}
                    className="group"
                  >
                    <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[hsl(var(--bc-info))] to-[hsl(var(--bc-primary))] mb-2">
                      {game.thumbnail_url ? (
                        <img 
                          src={game.thumbnail_url} 
                          alt={game.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gamepad2 className="w-8 h-8 text-white/60" />
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-info))] transition">
                      {game.title}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[hsl(var(--bc-text-muted))]">
                      <span className="flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        {game.play_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3" />
                        {game.favorite_count || 0}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Gamepad2 className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-2" />
                <div className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase">
                  No Games
                </div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                  {profile.username} has not created any games.
                </div>
              </div>
            )}
          </div>

          {/* Profile Wall */}
          <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Profile Wall</div>
          <div className="bc-card p-4 space-y-4">
            {/* Post form */}
            {forumUser && (
              <div className="flex gap-2">
                <UserAvatar
                  avatarUrl={forumUser.avatar_url}
                  username={forumUser.username}
                  size="sm"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={newWallPost}
                    onChange={(e) => setNewWallPost(e.target.value)}
                    placeholder={`Write on ${profile.username}'s wall...`}
                    className="bc-input flex-1"
                    maxLength={500}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostWall()}
                  />
                  <button
                    onClick={handlePostWall}
                    disabled={postingWall || !newWallPost.trim()}
                    className="bc-btn bc-btn-info bc-btn-sm"
                  >
                    {postingWall ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Wall posts list */}
            {wallPosts.length > 0 ? (
              <div className="space-y-3">
                {wallPosts.map((post) => (
                  <div key={post.id} className="flex gap-2 p-2 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                    <Link to={`/user/${post.author?.username}`}>
                      <UserAvatar
                        avatarUrl={post.author?.avatar_url}
                        username={post.author?.username}
                        size="sm"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/user/${post.author?.username}`}
                          className="font-semibold text-sm text-[hsl(var(--bc-text))] hover:underline"
                        >
                          {post.author?.username}
                        </Link>
                        <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {getTimeAgo(post.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-[hsl(var(--bc-text))] break-words">
                        {post.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-[hsl(var(--bc-text-muted))]">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No wall posts yet. Be the first to post!</p>
              </div>
            )}
          </div>

          {/* Inventory Section */}
          <div className="text-xl font-semibold text-[hsl(var(--bc-text))]">Inventory</div>
          <div className="bc-card p-4">
            <div className="text-center py-6 text-[hsl(var(--bc-text-muted))]">
              Inventory coming soon...
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
