import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Coins, Heart, Flag, MessageCircle, Clock, Users, 
  Loader2, Sparkles, ChevronRight, AlertTriangle, CheckCircle, Send, User, UsersRound, Gift, DollarSign,
  Package, Copy, TrendingUp, Zap, FileText, PenSquare
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import UserAvatar from '@/components/forum/UserAvatar';
import MembershipBadge from '@/components/forum/MembershipBadge';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import WelcomeDialog from '@/components/forum/WelcomeDialog';
import UserAdBanner from '@/components/forum/UserAdBanner';
import { Progress } from '@/components/ui/progress';

// Inlined CompensationDialog to fix module resolution issues
function CompensationDialog({ forumUserId, userCreatedAt }: { forumUserId: string; userCreatedAt: string }) {
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const COMPENSATION_ID = 'feb2026-coin-refresh-issue-v2';
  const COMPENSATION_AMOUNT = 100;
  const CUTOFF_DATE = new Date('2026-02-04T23:59:59Z');

  useEffect(() => {
    const checkEligibility = async () => {
      const userDate = new Date(userCreatedAt);
      if (userDate >= CUTOFF_DATE) return;

      const { data: existing } = await supabase
        .from('forum_coin_compensations')
        .select('id')
        .eq('forum_user_id', forumUserId)
        .eq('compensation_id', COMPENSATION_ID)
        .single();

      if (!existing) {
        setOpen(true);
      }
    };

    checkEligibility();
  }, [forumUserId, userCreatedAt]);

  const handleClaim = async () => {
    setClaiming(true);
    try {
      const { error } = await supabase.rpc('claim_coin_compensation', {
        p_compensation_id: COMPENSATION_ID,
        p_amount: COMPENSATION_AMOUNT
      });

      if (error) throw error;

      setClaimed(true);
      toast.success(`🪙 +${COMPENSATION_AMOUNT} coins claimed!`);
      setTimeout(() => setOpen(false), 2000);
    } catch (err) {
      toast.error('Failed to claim compensation');
    }
    setClaiming(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
        <DialogHeader>
          <DialogTitle className="text-[hsl(var(--bc-text))] flex items-center gap-2">
            <Gift className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
            Compensation Notice
          </DialogTitle>
          <DialogDescription className="text-[hsl(var(--bc-text-muted))]">
            We're sorry for the inconvenience
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-[hsl(var(--bc-text))]">
            On the 4th of February 2026, we experienced some technical issues with your daily coin refresh. 
            As a token of our apologies, we're awarding your account <strong className="text-[hsl(var(--bc-accent))]">100 coins</strong> in compensation.
          </p>
          {claimed ? (
            <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-primary))] py-4">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold">Coins Claimed!</span>
            </div>
          ) : (
            <button
              onClick={handleClaim}
              disabled={claiming}
              className="w-full bg-gradient-to-r from-[hsl(var(--bc-accent))] to-[hsl(var(--bc-primary))] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {claiming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Coins className="w-5 h-5" />
                  Claim 100 Coins
                </>
              )}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

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

interface Referral {
  id: string;
  referred_id: string;
  created_at: string;
  referred_user: {
    username: string;
    avatar_url: string | null;
  };
}

// XP calculation helpers
function calculateXpForLevel(level: number): number {
  // Each level requires more XP: level 1 = 100, level 2 = 300, level 3 = 600, etc.
  return level * level * 100;
}

function calculateXpProgress(xp: number, level: number): { current: number; required: number; percentage: number } {
  const currentLevelXp = level > 1 ? calculateXpForLevel(level - 1) : 0;
  const nextLevelXp = calculateXpForLevel(level);
  const xpInCurrentLevel = xp - currentLevelXp;
  const xpNeededForNextLevel = nextLevelXp - currentLevelXp;
  const percentage = Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100));
  
  return {
    current: xpInCurrentLevel,
    required: xpNeededForNextLevel,
    percentage
  };
}

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
  const [cash, setCash] = useState(0);
  const [lastClaim, setLastClaim] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [redeemingTier, setRedeemingTier] = useState<string | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [selectedTier, setSelectedTier] = useState<'bronze' | 'silver' | 'platinum' | null>(null);
  const [reportingStatus, setReportingStatus] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [statusText, setStatusText] = useState('');
  const [postingStatus, setPostingStatus] = useState(false);
  
  // Referral state
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  
  // Level state
  const [userXp, setUserXp] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [lastDailyLoginXp, setLastDailyLoginXp] = useState<string | null>(null);
  const [claimingXp, setClaimingXp] = useState(false);
  
  // Reward dialog state
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [rewardResult, setRewardResult] = useState<{ type: 'coins' | 'cash'; amount: number } | null>(null);

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
    setCash(forumUser.cash || 0);

    // Fetch user data including referral info and XP
    const { data: userData } = await supabase
      .from('forum_users')
      .select('last_coin_claim, coins, cash, referral_code, referral_count, xp, level, last_daily_login_xp')
      .eq('id', forumUser.id)
      .single();
    
    if (userData) {
      setLastClaim(userData.last_coin_claim);
      setCoins(userData.coins || 0);
      setCash(userData.cash || 0);
      setReferralCode(userData.referral_code || '');
      setReferralCount(userData.referral_count || 0);
      setUserXp(userData.xp || 0);
      setUserLevel(userData.level || 1);
      setLastDailyLoginXp(userData.last_daily_login_xp);
    }

    // Fetch referrals
    const { data: referralsData } = await supabase
      .from('forum_referrals')
      .select(`
        id,
        referred_id,
        created_at,
        referred_user:referred_id (
          username,
          avatar_url
        )
      `)
      .eq('referrer_id', forumUser.id)
      .order('created_at', { ascending: false });
    
    if (referralsData) {
      setReferrals(referralsData as unknown as Referral[]);
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
        const { data: likes } = await supabase
          .from('forum_status_likes')
          .select('liked_user_id')
          .eq('liker_id', forumUser.id);

        const likedUserIds = new Set(likes?.map(l => l.liked_user_id) || []);

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

  const canClaimReward = () => {
    if (!lastClaim) return true;
    const lastClaimDate = new Date(lastClaim);
    const now = new Date();
    return now.getTime() - lastClaimDate.getTime() >= 24 * 60 * 60 * 1000;
  };

  const canClaimDailyXp = () => {
    if (!lastDailyLoginXp) return true;
    const lastClaimDate = new Date(lastDailyLoginXp);
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
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  const handleClaimReward = async () => {
    setClaiming(true);
    try {
      const { data, error } = await supabase.rpc('claim_random_reward');
      
      if (error) {
        if (error.message.includes('already claimed')) {
          toast.error('Daily reward already claimed! Come back tomorrow.');
        } else {
          toast.error('Failed to claim reward');
        }
      } else if (data) {
        const result = data as { type: 'coins' | 'cash'; amount: number; new_balance: number };
        setRewardResult({ type: result.type, amount: result.amount });
        setShowRewardDialog(true);
        
        if (result.type === 'coins') {
          setCoins(result.new_balance);
        } else {
          setCash(result.new_balance);
        }
        setLastClaim(new Date().toISOString());
      }
    } catch {
      toast.error('Failed to claim reward');
    }
    setClaiming(false);
  };

  const handleClaimDailyXp = async () => {
    setClaimingXp(true);
    try {
      const { data, error } = await supabase.rpc('claim_daily_login_xp');
      
      if (error) {
        if (error.message.includes('already claimed')) {
          toast.error('Daily login XP already claimed!');
        } else {
          toast.error('Failed to claim XP');
        }
      } else {
        setUserXp(data);
        setLastDailyLoginXp(new Date().toISOString());
        toast.success('⚡ +50 XP claimed!');
        // Recalculate level
        const newLevel = Math.floor(Math.sqrt(data / 100)) + 1;
        setUserLevel(newLevel);
      }
    } catch {
      toast.error('Failed to claim XP');
    }
    setClaimingXp(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
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
      const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
        body: { content: statusText }
      });

      if (profanityCheck.data?.hasProfanity) {
        toast.error('Your status contains inappropriate content. Please revise.');
        setPostingStatus(false);
        return;
      }

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

  const xpProgress = calculateXpProgress(userXp, userLevel);

  // Not logged in - show public dashboard
  if (!user) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          <WelcomeDialog isLoggedIn={false} />
          
          <div className="bc-card" style={{ background: 'hsl(var(--bc-info))', border: 'none' }}>
            <div className="bc-card-body text-white text-center py-8">
              <h1 className="text-3xl font-bold mb-3">Welcome to BLOX City</h1>
              <p className="opacity-90 mb-6 max-w-md mx-auto">
                Join our community to connect with friends, earn coins, and redeem exclusive memberships!
              </p>
              <div className="flex justify-center gap-4">
                <Link to="/login" className="bc-btn bc-btn-success">
                  Log In
                </Link>
                <Link to="/register" className="bc-btn bc-btn-gray">
                  Sign Up
                </Link>
              </div>
            </div>
          </div>

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
              to="/groups"
              className="bg-[hsl(var(--bc-bg-card))] hover:bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-xl p-6 transition group"
            >
              <UsersRound className="w-8 h-8 text-[hsl(var(--bc-accent))] mb-3" />
              <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-accent))]">Browse Groups</h3>
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">Join community groups</p>
            </Link>
          </div>
        </div>

        <div className="hidden lg:block w-44 flex-shrink-0 space-y-4">
          <UserAdBanner type="skyscraper" />
        </div>
        
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
          <Link
            to="/forum/leaderboard"
            className="block bg-[hsl(var(--bc-bg-card))] hover:bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] rounded-xl p-4 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsla(var(--bc-accent),0.1)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition">Leaderboard</h3>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">View top players</p>
              </div>
            </div>
          </Link>
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
      {/* Compensation Dialog for existing users */}
      {forumUser && (
        <CompensationDialog 
          forumUserId={forumUser.id} 
          userCreatedAt={forumUser.created_at} 
        />
      )}

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--bc-text))] flex items-center gap-2">
              <Gift className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
              Daily Reward!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            {rewardResult && (
              <>
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  rewardResult.type === 'coins' 
                    ? 'bg-yellow-500/20' 
                    : 'bg-green-500/20'
                }`}>
                  {rewardResult.type === 'coins' ? (
                    <Coins className="w-10 h-10 text-yellow-500" />
                  ) : (
                    <DollarSign className="w-10 h-10 text-green-500" />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">
                  +{rewardResult.amount} {rewardResult.type === 'coins' ? 'Coins' : 'Cash'}!
                </h3>
                <p className="text-[hsl(var(--bc-text-muted))]">
                  Come back tomorrow for another reward!
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <UserAdBanner type="banner" />
      
      <div className="flex gap-6">
        <div className="flex-1 space-y-6 min-w-0">
          {/* Welcome Header */}
          <div className="bc-card" style={{ background: 'hsl(var(--bc-info))', border: 'none' }}>
            <div className="bc-card-body text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Link to={`/id/${forumUser?.username}/profile`} className="shrink-0">
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
                  <Link to="/convert" className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition">
                    <Coins className="w-5 h-5 text-yellow-300" />
                    <span className="font-bold">{coins.toLocaleString()}</span>
                  </Link>
                  <Link to="/convert" className="bg-white/20 backdrop-blur rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-white/30 transition">
                    <DollarSign className="w-5 h-5 text-green-300" />
                    <span className="font-bold">{cash}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Status Posting Box */}
          <div className="bc-card">
            <div className="bc-card-body">
              <div className="flex gap-3">
                <Link to={`/id/${forumUser?.username}/profile`} className="shrink-0">
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
                    className="bc-input"
                    style={{ resize: 'none' }}
                    rows={2}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs" style={{ color: 'hsl(var(--bc-text-muted))' }}>{statusText.length}/280</span>
                    <button
                      onClick={handlePostStatus}
                      disabled={postingStatus || !statusText.trim()}
                      className="bc-btn bc-btn-info bc-btn-sm"
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
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Daily Reward */}
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="w-5 h-5 text-purple-500" />
                  <h2 className="font-semibold text-[hsl(var(--bc-text))]">Daily Reward</h2>
                </div>
                
                {canClaimReward() ? (
                  <button
                    onClick={handleClaimReward}
                    disabled={claiming}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                  >
                    {claiming ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Package className="w-5 h-5" />
                        Claim Reward
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

              {/* My Level */}
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <h2 className="font-semibold text-[hsl(var(--bc-text))]">My Level</h2>
                </div>
                
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-[hsl(var(--bc-primary))]">{userLevel}</div>
                  <div className="text-sm text-[hsl(var(--bc-text-muted))]">Level {userLevel}</div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[hsl(var(--bc-text-muted))]">{xpProgress.current.toLocaleString()} / {xpProgress.required.toLocaleString()} XP</span>
                    <span className="text-[hsl(var(--bc-primary))] font-medium">{xpProgress.percentage}%</span>
                  </div>
                  <Progress value={xpProgress.percentage} className="h-2" />
                  <div className="text-xs text-[hsl(var(--bc-text-muted))] text-center">To Next Level</div>
                </div>

                {/* How to earn XP */}
                <div className="border-t border-[hsl(var(--bc-border))] pt-3 mt-3">
                  <h3 className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2">How to earn XP</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))]">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>Daily Login</span>
                      </div>
                      <span className="text-green-500 font-medium">+50 XP daily</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))]">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Create Content</span>
                      </div>
                      <span className="text-green-500 font-medium">+25 XP per item</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-[hsl(var(--bc-text-muted))]">
                        <PenSquare className="w-4 h-4 text-purple-500" />
                        <span>Write Posts</span>
                      </div>
                      <span className="text-green-500 font-medium">+5 XP per post</span>
                    </div>
                  </div>

                  {canClaimDailyXp() && (
                    <button
                      onClick={handleClaimDailyXp}
                      disabled={claimingXp}
                      className="w-full mt-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      {claimingXp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Claim Daily +50 XP
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Referral System */}
              <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-green-500" />
                  <h2 className="font-semibold text-[hsl(var(--bc-text))]">Refer Friends</h2>
                </div>
                
                <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-3">
                  Earn 10 coins for each friend who signs up! ({referralCount}/5 referrals)
                </p>

                <div className="flex gap-2 mb-3">
                  <div className="flex-1 bg-[hsl(var(--bc-bg-light))] rounded-lg px-3 py-2 text-sm font-mono text-[hsl(var(--bc-text))] truncate">
                    {referralCode}
                  </div>
                  <button
                    onClick={copyReferralLink}
                    className="p-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary))]/80 text-white rounded-lg transition"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                {referralCount >= 5 ? (
                  <div className="text-center py-2 text-sm text-green-500 font-medium">
                    ✓ Maximum referrals reached!
                  </div>
                ) : (
                  <div className="text-xs text-[hsl(var(--bc-text-muted))] text-center">
                    Share your link to earn coins!
                  </div>
                )}

                {referrals.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[hsl(var(--bc-border))]">
                    <h4 className="text-xs font-medium text-[hsl(var(--bc-text-muted))] mb-2">Your Referrals</h4>
                    <div className="space-y-2">
                      {referrals.slice(0, 3).map(ref => (
                        <div key={ref.id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 h-6 rounded-full bg-[hsl(var(--bc-bg-light))] overflow-hidden">
                            {ref.referred_user?.avatar_url ? (
                              <img src={ref.referred_user.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <User className="w-3 h-3 text-[hsl(var(--bc-text-muted))]" />
                              </div>
                            )}
                          </div>
                          <span className="text-[hsl(var(--bc-text))]">{ref.referred_user?.username || 'User'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                        <Link to={`/id/${request.sender.username}/profile`}>
                          <UserAvatar
                            avatarUrl={request.sender.avatar_url}
                            username={request.sender.username}
                            size="sm"
                            membershipTier={request.sender.membership_tier}
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link 
                            to={`/id/${request.sender.username}/profile`}
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
                          <Link to={`/id/${friend.username}/profile`}>
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
                                to={`/id/${friend.username}/profile`}
                                className="font-medium text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))]"
                              >
                                {friend.username}
                              </Link>
                              <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                                {formatTimeAgo(friend.status_updated_at)}
                              </span>
                            </div>
                            
                            <div className="relative bg-[hsl(var(--bc-bg-light))] rounded-xl p-3 mt-2">
                              <div className="absolute -top-2 left-4 w-3 h-3 bg-[hsl(var(--bc-bg-light))] rotate-45" />
                              <p className="text-[hsl(var(--bc-text))]">{friend.status_text}</p>
                            </div>

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
        </div>

        {/* Sidebar with Skyscraper Ad */}
        <div className="hidden lg:block w-44 flex-shrink-0 space-y-4">
          <UserAdBanner type="skyscraper" />
        </div>
        
        {/* Right Sidebar */}
        <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
          <Link
            to="/forum/leaderboard"
            className="block bg-[hsl(var(--bc-bg-card))] hover:bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] rounded-xl p-4 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsla(var(--bc-accent),0.1)] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
              </div>
              <div>
                <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition">Leaderboard</h3>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">View top players</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
