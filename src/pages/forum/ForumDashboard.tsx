import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Coins, Gift, Heart, Flag, MessageCircle, Clock, Users, 
  Loader2, Sparkles, ChevronRight, AlertTriangle, CheckCircle, Send, User
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import UserAvatar from '@/components/forum/UserAvatar';
import MembershipBadge from '@/components/forum/MembershipBadge';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import WelcomeDialog from '@/components/forum/WelcomeDialog';
import LeaderboardSidebar from '@/components/forum/LeaderboardSidebar';
import UserAdBanner from '@/components/forum/UserAdBanner';

interface FriendStatus {
  id: string;
  username: string;
  avatar_url: string | null;
  status_text: string;
  status_updated_at: string;
  is_verified: boolean;
  level: number;
  avatar_effect: string | null;
  membership_tier: 'bronze' | 'silver' | 'platinum' | null;
  is_liked: boolean;
  like_count: number;
}

interface FriendRequest {
  id: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string | null;
    level: number;
    membership_tier: 'bronze' | 'silver' | 'platinum' | null;
  };
  created_at: string;
}

const MEMBERSHIP_COSTS = {
  bronze: 250,
  silver: 500,
  platinum: 1000
} as const;

export default function ForumDashboard() {
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { user, forumUser } = context || {};

  const [loading, setLoading] = useState(true);
  const [friendStatuses, setFriendStatuses] = useState<FriendStatus[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [coins, setCoins] = useState(0);
  const [lastClaim, setLastClaim] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [redeemingTier, setRedeemingTier] = useState<string | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'platinum' | null>(null);
  const [reportingStatus, setReportingStatus] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [statusText, setStatusText] = useState('');
  const [postingStatus, setPostingStatus] = useState(false);

  const isLoggedIn = !!user;

  useEffect(() => {
    if (forumUser) {
      fetchDashboardData();
      setStatusText(forumUser.status_text || '');
    }
  }, [forumUser]);

  const fetchDashboardData = async () => {
    if (!forumUser) return;
    
    setLoading(true);
    setCoins(forumUser.coins || 0);

    // Fetch last coin claim
    const { data: userData } = await supabase
      .from('forum_users')
      .select('last_coin_claim, coins')
      .eq('id', forumUser.id)
      .single();
    
    if (userData) {
      setLastClaim(userData.last_coin_claim);
      setCoins(userData.coins || 0);
    }

    // Fetch friend requests
    const { data: requests } = await supabase
      .from('forum_friend_requests')
      .select(`
        id,
        created_at,
        sender:sender_id (
          id,
          username,
          avatar_url,
          level,
          membership_tier
        )
      `)
      .eq('receiver_id', forumUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requests) {
      setFriendRequests(requests as unknown as FriendRequest[]);
    }

    // Fetch friends with statuses
    const { data: friendships } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id')
      .or(`user_1_id.eq.${forumUser.id},user_2_id.eq.${forumUser.id}`);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => 
        f.user_1_id === forumUser.id ? f.user_2_id : f.user_1_id
      );

      const { data: friends } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, status_text, status_updated_at, is_verified, level, avatar_effect, membership_tier')
        .in('id', friendIds)
        .not('status_text', 'is', null)
        .order('status_updated_at', { ascending: false });

      if (friends) {
        // Fetch likes for these statuses
        const { data: likes } = await supabase
          .from('forum_status_likes')
          .select('liked_user_id')
          .eq('liker_id', forumUser.id);

        const likedUserIds = new Set(likes?.map(l => l.liked_user_id) || []);

        // Fetch like counts
        const { data: likeCounts } = await supabase
          .from('forum_status_likes')
          .select('liked_user_id')
          .in('liked_user_id', friends.map(f => f.id));

        const countMap = new Map<string, number>();
        likeCounts?.forEach(l => {
          countMap.set(l.liked_user_id, (countMap.get(l.liked_user_id) || 0) + 1);
        });

        setFriendStatuses(friends.map(f => ({
          ...f,
          is_liked: likedUserIds.has(f.id),
          like_count: countMap.get(f.id) || 0
        })) as FriendStatus[]);
      }
    }

    setLoading(false);
  };

  const canClaimCoins = () => {
    if (!lastClaim) return true;
    const lastClaimDate = new Date(lastClaim);
    const now = new Date();
    return now.getTime() - lastClaimDate.getTime() >= 24 * 60 * 60 * 1000;
  };

  const getTimeUntilClaim = () => {
    if (!lastClaim) return null;
    const lastClaimDate = new Date(lastClaim);
    const nextClaim = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const diff = nextClaim.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleClaimCoins = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_coins');
      
      if (error) {
        if (error.message.includes('already claimed')) {
          toast.error('Daily coins already claimed! Come back tomorrow.');
        } else {
          toast.error('Failed to claim coins');
        }
      } else {
        setCoins(data);
        setLastClaim(new Date().toISOString());
        toast.success('🪙 +25 coins claimed!');
      }
    } catch {
      toast.error('Failed to claim coins');
    }
    setClaiming(false);
  };

  const handleRedeemMembership = async () => {
    if (!selectedTier) return;
    
    setRedeemingTier(selectedTier);
    try {
      const { error } = await supabase.rpc('redeem_membership', { tier_name: selectedTier });
      
      if (error) {
        if (error.message.includes('Not enough coins')) {
          toast.error('Not enough coins!');
        } else {
          toast.error('Failed to redeem membership');
        }
      } else {
        setCoins(prev => prev - MEMBERSHIP_COSTS[selectedTier]);
        toast.success(
          <div className="space-y-1">
            <div className="font-semibold">🎉 {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Membership Activated!</div>
            <div className="text-sm opacity-90">Your membership will stay active. Once BLOX City launches, you'll have your membership for 1 month.</div>
          </div>
        );
        setShowRedeemDialog(false);
        // Refresh data
        fetchDashboardData();
      }
    } catch {
      toast.error('Failed to redeem membership');
    }
    setRedeemingTier(null);
  };

  const handleAcceptFriend = async (requestId: string) => {
    try {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });
      
      if (error) {
        toast.error('Failed to accept friend request');
      } else {
        toast.success('Friend request accepted!');
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
        fetchDashboardData();
      }
    } catch {
      toast.error('Failed to accept friend request');
    }
  };

  const handleDeclineFriend = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('forum_friend_requests')
        .update({ status: 'declined', responded_at: new Date().toISOString() })
        .eq('id', requestId);
      
      if (error) {
        toast.error('Failed to decline request');
      } else {
        toast.success('Request declined');
        setFriendRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch {
      toast.error('Failed to decline request');
    }
  };

  const handleLikeStatus = async (userId: string, isLiked: boolean) => {
    if (!forumUser) return;
    
    if (isLiked) {
      await supabase
        .from('forum_status_likes')
        .delete()
        .eq('liker_id', forumUser.id)
        .eq('liked_user_id', userId);
    } else {
      await supabase
        .from('forum_status_likes')
        .insert({ liker_id: forumUser.id, liked_user_id: userId });
    }

    setFriendStatuses(prev => prev.map(f => 
      f.id === userId 
        ? { ...f, is_liked: !isLiked, like_count: f.like_count + (isLiked ? -1 : 1) }
        : f
    ));
  };

  const handleReportStatus = async (userId: string) => {
    if (!forumUser || !reportReason.trim()) {
      toast.error('Please provide a reason for the report');
      return;
    }

    try {
      const { error } = await supabase
        .from('forum_reports')
        .insert({
          reporter_id: forumUser.id,
          reported_type: 'status',
          reported_id: userId,
          reason: reportReason
        });

      if (error) {
        toast.error('Failed to submit report');
      } else {
        toast.success('Report submitted. Thank you!');
    setReportingStatus(null);
        setReportReason('');
      }
    } catch {
      toast.error('Failed to submit report');
    }
  };

  const handlePostStatus = async () => {
    if (!forumUser || !statusText.trim()) return;
    
    setPostingStatus(true);
    try {
      const { error } = await supabase
        .from('forum_users')
        .update({ 
          status_text: statusText.trim(),
          status_updated_at: new Date().toISOString()
        })
        .eq('id', forumUser.id);

      if (error) {
        toast.error('Failed to post status');
      } else {
        toast.success('Status updated!');
      }
    } catch {
      toast.error('Failed to post status');
    }
    setPostingStatus(false);
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

  // Not logged in - show public dashboard
  if (!user) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <WelcomeDialog isLoggedIn={false} />
          
          {/* Login CTA */}
          <div className="bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] rounded-2xl p-8 text-white text-center">
            <h1 className="text-3xl font-bold mb-3">Welcome to BLOX City</h1>
            <p className="opacity-90 mb-6 max-w-md mx-auto">
              Join our community to connect with friends, earn coins, and redeem exclusive memberships!
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="bg-white text-[hsl(var(--bc-primary))] hover:bg-white/90 px-6 py-3 rounded-lg font-semibold transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-lg font-semibold transition"
              >
                Sign Up
              </Link>
            </div>
          </div>

          {/* Explore Links */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Link
              to="/forum"
              className="bg-[hsl(var(--bc-bg-card))] hover:bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-xl p-6 transition group"
            >
              <MessageCircle className="w-8 h-8 text-[hsl(var(--bc-primary))] mb-3" />
              <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))]">Browse Forums</h3>
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">Explore community discussions</p>
            </Link>
            <Link
              to="/reserve"
              className="bg-[hsl(var(--bc-bg-card))] hover:bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-xl p-6 transition group"
            >
              <Gift className="w-8 h-8 text-[hsl(var(--bc-accent))] mb-3" />
              <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-accent))]">Reserve Username</h3>
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">Secure your name for launch</p>
            </Link>
          </div>
        </div>

        {/* Sidebar with Skyscraper Ad */}
        <div className="hidden lg:block w-44 flex-shrink-0 space-y-4">
          <UserAdBanner type="skyscraper" />
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
          <LeaderboardSidebar />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner Ad */}
      <UserAdBanner type="banner" />
      
      <div className="flex gap-6">
      <div className="flex-1 space-y-6 min-w-0">
      {/* Welcome Header with Profile Picture */}
      <div className="bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {/* Profile Picture */}
            <Link to={`/user/${forumUser?.username}`} className="shrink-0">
              {forumUser?.avatar_url ? (
                <img 
                  src={forumUser.avatar_url} 
                  alt={forumUser.username}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
              )}
            </Link>
            <div>
              <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
                Welcome back, {forumUser?.username}!
                {forumUser?.is_verified && <VerifiedBadge size="lg" />}
              </h1>
              <p className="opacity-90">Check out what your friends are up to</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-300" />
              <span className="font-bold">{coins.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Status Posting Box */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        <div className="flex gap-3">
          <Link to={`/user/${forumUser?.username}`} className="shrink-0">
            {forumUser?.avatar_url ? (
              <img 
                src={forumUser.avatar_url} 
                alt={forumUser.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
            )}
          </Link>
          <div className="flex-1">
            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value.slice(0, 280))}
              placeholder="What's on your mind?"
              className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-3 text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              rows={2}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[hsl(var(--bc-text-muted))]">{statusText.length}/280</span>
              <button
                onClick={handlePostStatus}
                disabled={postingStatus || !statusText.trim()}
                className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                {postingStatus ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Post Status
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column - Coins & Membership */}
        <div className="space-y-4">
          {/* Daily Coins */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="w-5 h-5 text-yellow-500" />
              <h2 className="font-semibold text-[hsl(var(--bc-text))]">Daily Coins</h2>
            </div>
            
            {canClaimCoins() ? (
              <button
                onClick={handleClaimCoins}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {claiming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Claim +25 Coins
                  </>
                )}
              </button>
            ) : (
              <div className="text-center py-3">
                <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-text-muted))]">
                  <Clock className="w-4 h-4" />
                  <span>Next claim in {getTimeUntilClaim()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Redeem Membership */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5 text-purple-500" />
              <h2 className="font-semibold text-[hsl(var(--bc-text))]">Membership Shop</h2>
            </div>
            
            <div className="space-y-2">
              {(['bronze', 'silver', 'platinum'] as const).map(tier => (
                <button
                  key={tier}
                  onClick={() => {
                    setSelectedTier(tier);
                    setShowRedeemDialog(true);
                  }}
                  disabled={coins < MEMBERSHIP_COSTS[tier]}
                  className={`w-full p-3 rounded-lg border transition flex items-center justify-between ${
                    coins >= MEMBERSHIP_COSTS[tier]
                      ? 'border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))]'
                      : 'border-[hsl(var(--bc-border))] opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MembershipBadge tier={tier} size="sm" />
                    <span className="text-sm font-medium text-[hsl(var(--bc-text))] capitalize">{tier}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[hsl(var(--bc-text-muted))]">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    {MEMBERSHIP_COSTS[tier]}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <h2 className="font-semibold text-[hsl(var(--bc-text))]">Friend Requests</h2>
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {friendRequests.length}
                </span>
              </div>
              
              <div className="space-y-3">
                {friendRequests.slice(0, 3).map(request => (
                  <div key={request.id} className="flex items-center gap-3">
                    <Link to={`/user/${request.sender.username}`}>
                      <UserAvatar
                        avatarUrl={request.sender.avatar_url}
                        username={request.sender.username}
                        size="sm"
                        membershipTier={request.sender.membership_tier}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/user/${request.sender.username}`}
                        className="font-medium text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] text-sm truncate block"
                      >
                        {request.sender.username}
                      </Link>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleAcceptFriend(request.id)}
                        className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeclineFriend(request.id)}
                        className="p-1.5 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text-muted))] rounded-lg transition"
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Friend Feed */}
        <div className="md:col-span-2">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center justify-between">
              <h2 className="font-semibold text-[hsl(var(--bc-text))]">Friends' Statuses</h2>
              <Link 
                to="/settings"
                className="text-sm text-[hsl(var(--bc-primary))] hover:underline flex items-center gap-1"
              >
                Update your status
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {friendStatuses.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3 opacity-50" />
                <p className="text-[hsl(var(--bc-text-muted))]">No friend statuses yet</p>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1">
                  Add friends to see their updates here!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[hsl(var(--bc-border))]">
                {friendStatuses.map(friend => (
                  <div key={friend.id} className="p-4">
                    <div className="flex gap-3">
                      <Link to={`/user/${friend.username}`}>
                        <UserAvatar
                          avatarUrl={friend.avatar_url}
                          username={friend.username}
                          size="md"
                          effect={friend.avatar_effect}
                          membershipTier={friend.membership_tier}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Link 
                            to={`/user/${friend.username}`}
                            className="font-medium text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]"
                          >
                            {friend.username}
                          </Link>
                          <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                            {formatTimeAgo(friend.status_updated_at)}
                          </span>
                        </div>
                        
                        {/* Thought bubble */}
                        <div className="relative bg-[hsl(var(--bc-bg-light))] rounded-xl p-3 mt-2">
                          <div className="absolute -top-2 left-4 w-3 h-3 bg-[hsl(var(--bc-bg-light))] rotate-45" />
                          <p className="text-[hsl(var(--bc-text))]">{friend.status_text}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3 mt-2">
                          <button
                            onClick={() => handleLikeStatus(friend.id, friend.is_liked)}
                            className={`flex items-center gap-1 text-sm transition ${
                              friend.is_liked 
                                ? 'text-red-500' 
                                : 'text-[hsl(var(--bc-text-muted))] hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${friend.is_liked ? 'fill-current' : ''}`} />
                            {friend.like_count > 0 && friend.like_count}
                          </button>
                          
                          {reportingStatus === friend.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Reason for report..."
                                className="flex-1 text-sm bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded px-2 py-1 text-[hsl(var(--bc-text))]"
                              />
                              <button
                                onClick={() => handleReportStatus(friend.id)}
                                className="text-sm text-red-500 hover:text-red-600"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => {
                                  setReportingStatus(null);
                                  setReportReason('');
                                }}
                                className="text-sm text-[hsl(var(--bc-text-muted))]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReportingStatus(friend.id)}
                              className="flex items-center gap-1 text-sm text-[hsl(var(--bc-text-muted))] hover:text-red-500 transition"
                            >
                              <Flag className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Redeem Dialog */}
      {/* Redeem Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--bc-text))]">
              Redeem {selectedTier?.charAt(0).toUpperCase()}{selectedTier?.slice(1)} Membership
            </DialogTitle>
            <DialogDescription className="text-[hsl(var(--bc-text-muted))]">
              This will cost {selectedTier ? MEMBERSHIP_COSTS[selectedTier] : 0} coins
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTier && <MembershipBadge tier={selectedTier} size="lg" />}
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Your membership will stay active. Once BLOX City launches, you'll have your membership for 1 month.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowRedeemDialog(false)}
                className="flex-1 py-2 border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeemMembership}
                disabled={!!redeemingTier}
                className="flex-1 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition flex items-center justify-center gap-2"
              >
                {redeemingTier ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    Redeem
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>

      {/* Sidebar with Skyscraper Ad */}
      <div className="hidden lg:block w-44 flex-shrink-0 space-y-4">
        <UserAdBanner type="skyscraper" />
      </div>
      
      {/* Right Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
        <LeaderboardSidebar />
      </div>
    </div>
    </div>
  );
}
