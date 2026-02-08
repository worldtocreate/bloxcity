import { useState, useEffect } from 'react';
import { useParams, Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, Calendar, MessageSquare, MessageCircle, Ban, Loader2, 
  Clock, Users, MoreVertical, Flag, Award, Frown, Medal,
  UserPlus, Globe, ShieldCheck, X, Gamepad2, Play, Heart, UserMinus,
  Send, BadgeCheck, ArrowRightLeft, Package, Eye, TrendingUp, UserCheck
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import UserAvatar from '@/components/forum/UserAvatar';
import FriendButton from '@/components/forum/FriendButton';
import MembershipBadge from '@/components/forum/MembershipBadge';
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
  serial_id?: number;
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
  const [loading, setLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [areFriends, setAreFriends] = useState(false);
  const [verifiedModalOpen, setVerifiedModalOpen] = useState(false);

  const [inventoryPreview, setInventoryPreview] = useState<any[]>([]);
  const [inventoryPreviewLoading, setInventoryPreviewLoading] = useState(false);
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [friendsCount, setFriendsCount] = useState(0);
  const [profileViews, setProfileViews] = useState(0);
  
  const [wallPosts, setWallPosts] = useState<any[]>([]);
  const [newWallPost, setNewWallPost] = useState('');
  const [postingWall, setPostingWall] = useState(false);
  
  const [hasGoldCheckmark, setHasGoldCheckmark] = useState(false);
  const [hideAffiliates, setHideAffiliates] = useState(false);
  const [affiliatedUsers, setAffiliatedUsers] = useState<AffiliateUser[]>([]);

  const isOwnProfile = forumUser?.serial_id === parseInt(serialId || '0') || 
                       forumUser?.username?.toLowerCase() === username?.toLowerCase();

  const canViewInventory = !!profile && (isOwnProfile || isAdmin);

  const isOnline = profile?.last_seen_at && 
    new Date(profile.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000);

  useEffect(() => {
    if (serialId || username) {
      fetchProfile();
    }
  }, [serialId, username]);

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

    // Fetch profile views count
    const { count: viewsCount } = await supabase
      .from('forum_profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('viewed_user_id', userData.id);
    setProfileViews(viewsCount || 0);

    setInventoryPreview([]);
    if (isOwnProfile || isAdmin) {
      setInventoryPreviewLoading(true);
      const { data: invPreview } = await supabase
        .from('user_inventory')
        .select('id, serial_number, is_for_sale, acquired_at, item:item_id(id, name, thumbnail_url, is_limited)')
        .eq('forum_user_id', userData.id)
        .order('acquired_at', { ascending: false })
        .limit(8);
      setInventoryPreview(invPreview || []);
      setInventoryPreviewLoading(false);
    }

    if (forumUser && forumUser.id !== userData.id) {
      const { data: blockData } = await supabase
        .from('forum_blocked_users')
        .select('id')
        .eq('blocker_id', forumUser.id)
        .eq('blocked_id', userData.id)
        .single();
      
      setIsBlocked(!!blockData);

      const { data: friendshipData } = await supabase
        .from('forum_friendships')
        .select('id')
        .or(`and(user_1_id.eq.${forumUser.id},user_2_id.eq.${userData.id}),and(user_1_id.eq.${userData.id},user_2_id.eq.${forumUser.id})`)
        .single();
      
      setAreFriends(!!friendshipData);
    }

    // Fetch groups
    const { data: memberData } = await supabase
      .from('forum_group_members')
      .select('group:group_id(id, name, slug, icon_url)')
      .eq('forum_user_id', userData.id)
      .limit(6);
    
    if (memberData) {
      const groupsList = memberData.map((m: any) => m.group).filter(Boolean) as GroupData[];
      setGroups(groupsList);
    }

    // Fetch achievements
    const { data: userAchievements } = await supabase
      .from('forum_user_achievements')
      .select('achievement:achievement_id(id, name, image_url, description)')
      .eq('forum_user_id', userData.id)
      .limit(12);
    
    if (userAchievements) {
      setAchievements(userAchievements.map((a: any) => a.achievement).filter(Boolean) as Achievement[]);
    }

    // Fetch friends count and list
    const { data: friendshipsData, count: friendshipsCount } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id', { count: 'exact' })
      .or(`user_1_id.eq.${userData.id},user_2_id.eq.${userData.id}`)
      .limit(6);
    
    setFriendsCount(friendshipsCount || 0);
    
    if (friendshipsData && friendshipsData.length > 0) {
      const friendIds = friendshipsData.map(f => 
        f.user_1_id === userData.id ? f.user_2_id : f.user_1_id
      );
      
      const { data: friendUsers } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, serial_id')
        .in('id', friendIds);
      
      if (friendUsers) {
        setFriends(friendUsers as Friend[]);
      }
    }

    // Fetch games
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

    // Fetch follow counts
    const { count: followersCountData } = await supabase
      .from('forum_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userData.id);
    setFollowersCount(followersCountData || 0);

    const { count: followingCountData } = await supabase
      .from('forum_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', userData.id);
    setFollowingCount(followingCountData || 0);

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
      .select(`id, content, created_at, author:author_id(id, username, avatar_url, serial_id)`)
      .eq('profile_id', userData.id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (wallData) setWallPosts(wallData);

    // Fetch gold checkmark
    const { data: hasGold } = await supabase.rpc('has_gold_checkmark', { _forum_user_id: userData.id });
    setHasGoldCheckmark(hasGold || false);

    if (hasGold) {
      const { data: goldSettings } = await supabase
        .from('forum_gold_checkmarks')
        .select('hide_affiliates')
        .eq('forum_user_id', userData.id)
        .single();
      
      const shouldHide = goldSettings?.hide_affiliates || false;
      setHideAffiliates(shouldHide);
      
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
          
          if (affiliateUsers) setAffiliatedUsers(affiliateUsers as AffiliateUser[]);
        }
      }
    }

    setLoading(false);
  };

  const handleFollow = async () => {
    if (!forumUser || !profile) return;
    setFollowLoading(true);

    if (isFollowing) {
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
      const { error } = await supabase
        .from('forum_follows')
        .insert({ follower_id: forumUser.id, following_id: profile.id });

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
      .insert({ profile_id: profile.id, author_id: forumUser.id, content: newWallPost.trim() });

    if (error) {
      toast.error('Failed to post');
    } else {
      toast.success('Posted to wall!');
      setNewWallPost('');
      const { data: wallData } = await supabase
        .from('forum_wall_posts')
        .select(`id, content, created_at, author:author_id(id, username, avatar_url, serial_id)`)
        .eq('profile_id', profile.id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);
      if (wallData) setWallPosts(wallData);
    }
    setPostingWall(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
        <Link to="/forum" className="inline-block mt-4 text-[hsl(var(--bc-primary))] hover:underline">
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
            <DialogTitle>Verified Badge</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <ShieldCheck className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">
              This account is verified because it's a notable and trustworthy figure in BloxCity.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-5xl mx-auto">
        {/* Cover Banner */}
        <div className="relative h-40 sm:h-52 rounded-xl overflow-hidden mb-4">
          {profile.cover_url ? (
            <img src={profile.cover_url} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--bc-primary))] via-[hsl(var(--bc-accent))] to-[hsl(var(--bc-primary))]" />
          )}
          {/* Online indicator overlay */}
          {isOnline && (
            <div className="absolute top-3 right-3 px-3 py-1 bg-green-500 text-white text-xs font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Online
            </div>
          )}
        </div>

        {/* Profile Header Card */}
        <div className="bc-card p-4 sm:p-6 -mt-16 relative z-10 mx-4 sm:mx-0">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0 -mt-16 sm:-mt-20">
              <div className={`p-1 rounded-2xl bg-[hsl(var(--bc-bg-card))] ${isOnline ? 'ring-4 ring-green-500' : ''}`}>
                <UserAvatar
                  avatarUrl={profile.avatar_url}
                  username={profile.username}
                  size="xl"
                  effect={profile.avatar_effect}
                  membershipTier={profile.membership_tier}
                  className="w-24 h-24 sm:w-28 sm:h-28"
                />
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0 pt-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">{profile.username}</h1>
                    <VerificationBadge forumUserId={profile.id} isVerified={profile.is_verified} size="md" />
                    {profile.membership_tier && <MembershipBadge tier={profile.membership_tier} size="sm" />}
                  </div>
                  
                  {profile.status_text && (
                    <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1 italic">"{profile.status_text}"</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {forumUser && forumUser.id !== profile.id && (
                    <>
                      <FriendButton
                        currentUserId={forumUser.id}
                        targetUserId={profile.id}
                        targetUsername={profile.username}
                      />
                      <button 
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`bc-btn bc-btn-sm ${isFollowing ? 'bc-btn-secondary' : 'bc-btn-primary'}`}
                      >
                        {followLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                          isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
                      </button>
                      {profile.allow_dms && (
                        <button onClick={() => navigate(`/messages?to=${profile.username}`)} className="bc-btn bc-btn-sm bc-btn-secondary">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      {areFriends && (
                        <button onClick={() => navigate(`/trading?friend=${profile.id}`)} className="bc-btn bc-btn-sm bc-btn-secondary">
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  )}
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="bc-btn bc-btn-sm bc-btn-secondary">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bc-dropdown">
                      <DropdownMenuItem onClick={() => navigate('/report')} className="bc-dropdown-item">
                        <Flag className="w-4 h-4 mr-2" /> Report
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin?tab=users&user=${profile.id}`)} className="bc-dropdown-item text-red-500">
                            View in Panel
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-6 pt-4 border-t border-[hsl(var(--bc-border))]">
            <StatItem icon={Calendar} label="Join date" value={formatDate(profile.created_at)} />
            <StatItem icon={UserCheck} label="Friends" value={friendsCount.toLocaleString()} />
            <StatItem icon={Eye} label="Profile views" value={profileViews.toLocaleString()} />
            <StatItem icon={MessageSquare} label="Forum posts" value={profile.post_count.toLocaleString()} />
            <StatItem icon={TrendingUp} label="Level" value={profile.level.toLocaleString()} />
            <StatItem icon={Clock} label="Last seen" value={profile.last_seen_at ? getTimeAgo(profile.last_seen_at) : 'Never'} />
          </div>

          {/* Follow Stats */}
          <div className="flex items-center gap-4 mt-4 text-sm">
            <Link to={`/users?followers=${profile.username}`} className="hover:underline">
              <strong className="text-[hsl(var(--bc-text))]">{followersCount.toLocaleString()}</strong>{' '}
              <span className="text-[hsl(var(--bc-text-muted))]">Followers</span>
            </Link>
            <Link to={`/users?following=${profile.username}`} className="hover:underline">
              <strong className="text-[hsl(var(--bc-text))]">{followingCount.toLocaleString()}</strong>{' '}
              <span className="text-[hsl(var(--bc-text-muted))]">Following</span>
            </Link>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 px-4 sm:px-0">
          {/* Left Column */}
          <div className="space-y-4">
            {/* About */}
            {profile.bio && (
              <SectionCard title="About" icon={User}>
                <p className="text-sm text-[hsl(var(--bc-text))] whitespace-pre-wrap">{profile.bio}</p>
              </SectionCard>
            )}

            {/* Spaces/Groups */}
            <SectionCard title="Spaces" icon={Globe} count={groups.length}>
              {groups.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {groups.map((group) => (
                    <Link key={group.id} to={`/group/${group.slug}`} className="text-center group">
                      {group.icon_url ? (
                        <img src={group.icon_url} alt={group.name} className="w-full aspect-square rounded-lg object-cover group-hover:opacity-80 transition" />
                      ) : (
                        <div className="w-full aspect-square rounded-lg bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <Users className="w-6 h-6 text-white" />
                        </div>
                      )}
                      <div className="text-xs font-medium text-[hsl(var(--bc-text))] truncate mt-1">{group.name}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Globe} message={`${profile.username} hasn't joined any spaces yet.`} />
              )}
            </SectionCard>

            {/* Inventory Preview */}
            <SectionCard title="Inventory" icon={Package} action={isOwnProfile ? <Link to="/inventory" className="text-xs text-[hsl(var(--bc-primary))] hover:underline">View All</Link> : null}>
              {!canViewInventory ? (
                <EmptyState icon={Package} message="Inventory is private." />
              ) : inventoryPreviewLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--bc-primary))]" /></div>
              ) : inventoryPreview.length === 0 ? (
                <EmptyState icon={Package} message={isOwnProfile ? "Your inventory is empty." : `${profile.username} doesn't have any items yet.`} />
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {inventoryPreview.slice(0, 8).map((inv: any) => (
                    <Link key={inv.id} to={inv.item?.id ? `/market/item/${inv.item.id}` : '/market'} className="group">
                      <div className="aspect-square rounded-lg border border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg))] overflow-hidden">
                        {inv.item?.thumbnail_url ? (
                          <img src={inv.item.thumbnail_url} alt={inv.item.name || 'Item'} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" /></div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Right Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Achievements */}
            <SectionCard title="Achievements" icon={Award} count={achievements.length}>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {achievements.map((achievement) => (
                    <Link key={achievement.id} to="/achievements" className="text-center group" title={achievement.description || achievement.name}>
                      {achievement.image_url ? (
                        <img src={achievement.image_url} alt={achievement.name} className="w-full aspect-square object-contain group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full aspect-square flex items-center justify-center"><Award className="w-8 h-8 text-amber-500" /></div>
                      )}
                      <div className="text-xs truncate text-[hsl(var(--bc-text))] mt-1">{achievement.name}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Award} message={`${profile.username} hasn't earned any achievements yet.`} />
              )}
            </SectionCard>

            {/* Affiliates */}
            {hasGoldCheckmark && !hideAffiliates && affiliatedUsers.length > 0 && (
              <SectionCard title="Affiliates" icon={BadgeCheck} iconClassName="text-yellow-500">
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {affiliatedUsers.map((affiliate) => (
                    <Link key={affiliate.id} to={`/forum/user/${affiliate.username}`} className="text-center group">
                      <UserAvatar avatarUrl={affiliate.avatar_url} username={affiliate.username} size="lg" className="mx-auto group-hover:opacity-80 transition" />
                      <div className="text-xs truncate text-[hsl(var(--bc-text))] mt-1 flex items-center justify-center gap-0.5">
                        {affiliate.username}
                        <BadgeCheck className="w-3 h-3 text-blue-500" />
                      </div>
                    </Link>
                  ))}
                </div>
              </SectionCard>
            )}

            {/* Friends */}
            <SectionCard title="Friends" icon={Users} count={friendsCount} action={<Link to={`/friends?user=${profile.username}`} className="text-xs text-[hsl(var(--bc-primary))] hover:underline">View All</Link>}>
              {friends.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {friends.map((friend) => (
                    <Link key={friend.id} to={`/${friend.serial_id}/${friend.username}/profile`} className="text-center group">
                      <UserAvatar avatarUrl={friend.avatar_url} username={friend.username} size="lg" className="mx-auto group-hover:opacity-80 transition" />
                      <div className="text-xs truncate text-[hsl(var(--bc-text))] mt-1">{friend.username}</div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Frown} message={`${profile.username} hasn't made any friends yet.`} />
              )}
            </SectionCard>

            {/* Games */}
            <SectionCard title="Games" icon={Gamepad2} count={games.length} action={<Link to={`/games?creator=${profile.username}`} className="text-xs text-[hsl(var(--bc-primary))] hover:underline">View All</Link>}>
              {games.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {games.map((game) => (
                    <Link key={game.id} to={`/game/${game.id}`} className="group">
                      <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))]">
                        {game.thumbnail_url ? (
                          <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><Gamepad2 className="w-8 h-8 text-white/60" /></div>
                        )}
                      </div>
                      <div className="text-sm font-medium text-[hsl(var(--bc-text))] truncate mt-1.5 group-hover:text-[hsl(var(--bc-primary))] transition">{game.title}</div>
                      <div className="flex items-center gap-3 text-xs text-[hsl(var(--bc-text-muted))]">
                        <span className="flex items-center gap-1"><Play className="w-3 h-3" />{game.play_count || 0}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{game.favorite_count || 0}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Gamepad2} message={`${profile.username} hasn't created any games yet.`} />
              )}
            </SectionCard>

            {/* Profile Wall */}
            <SectionCard title="Profile Wall" icon={MessageCircle}>
              {forumUser && (
                <div className="flex gap-2 mb-4">
                  <UserAvatar avatarUrl={forumUser.avatar_url} username={forumUser.username} size="sm" />
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
                    <button onClick={handlePostWall} disabled={postingWall || !newWallPost.trim()} className="bc-btn bc-btn-primary bc-btn-sm">
                      {postingWall ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {wallPosts.length > 0 ? (
                <div className="space-y-3">
                  {wallPosts.map((post) => (
                    <div key={post.id} className="flex gap-2 p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                      <Link to={`/${post.author?.serial_id}/${post.author?.username}/profile`}>
                        <UserAvatar avatarUrl={post.author?.avatar_url} username={post.author?.username} size="sm" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link to={`/${post.author?.serial_id}/${post.author?.username}/profile`} className="font-semibold text-sm text-[hsl(var(--bc-text))] hover:underline">
                            {post.author?.username}
                          </Link>
                          <span className="text-xs text-[hsl(var(--bc-text-muted))]">{getTimeAgo(post.created_at)}</span>
                        </div>
                        <p className="text-sm text-[hsl(var(--bc-text))] break-words">{post.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={MessageCircle} message="No wall posts yet. Be the first to post!" />
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper Components
function StatItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 mx-auto text-[hsl(var(--bc-text-muted))] mb-1" />
      <div className="text-xs text-[hsl(var(--bc-text-muted))]">{label}</div>
      <div className="text-sm font-semibold text-[hsl(var(--bc-text))]">{value}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, iconClassName, count, action, children }: { 
  title: string; 
  icon: any; 
  iconClassName?: string;
  count?: number;
  action?: React.ReactNode; 
  children: React.ReactNode;
}) {
  return (
    <div className="bc-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--bc-border))]">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconClassName || 'text-[hsl(var(--bc-text-muted))]'}`} />
          <h3 className="font-semibold text-[hsl(var(--bc-text))]">{title}</h3>
          {count !== undefined && <span className="text-xs text-[hsl(var(--bc-text-muted))]">({count})</span>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="text-center py-6">
      <Icon className="w-10 h-10 text-[hsl(var(--bc-text-muted))] mx-auto mb-2 opacity-40" />
      <p className="text-xs text-[hsl(var(--bc-text-muted))]">{message}</p>
    </div>
  );
}
