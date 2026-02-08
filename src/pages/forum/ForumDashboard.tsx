import { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Coins, Heart, Flag, MessageCircle, Clock, Users, 
  Loader2, Sparkles, ChevronRight, AlertTriangle, CheckCircle, Send, User, UsersRound, Gift, DollarSign,
  Package, Copy, TrendingUp, Zap, FileText, PenSquare, Star, Plus, Flame, Gamepad2, Trophy, ShoppingBag
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

// Inlined RecentBlogPosts component
interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  thumbnail_url: string | null;
  published_at: string;
}

function RecentBlogPosts() {
  const [posts, setPosts] = useState<BlogPostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, thumbnail_url, published_at')
        .eq('is_published', true)
        .order('published_at', { ascending: false })
        .limit(6);
      
      if (data) setPosts(data);
      setLoading(false);
    };

    fetchPosts();
  }, []);

  if (loading) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-3xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-[hsl(var(--bc-primary))] animate-spin" />
        </div>
      </div>
    );
  }

  if (posts.length === 0) return null;

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between p-5 border-b border-[hsl(var(--bc-border))]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-[hsl(var(--bc-text))]">Latest News</h3>
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">Stay updated!</p>
          </div>
        </div>
        <Link 
          to="/blog" 
          className="flex items-center gap-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-primary))] hover:text-white text-sm font-bold text-[hsl(var(--bc-text))] rounded-xl transition-all"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="p-5">
        <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-hide">
          {posts.map((post, index) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="group flex-shrink-0 w-72 bg-gradient-to-b from-[hsl(var(--bc-bg-light))] to-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden hover:border-[hsl(var(--bc-primary))]/50 hover:shadow-2xl hover:shadow-[hsl(var(--bc-primary))]/10 transition-all hover:-translate-y-2"
            >
              <div className="relative h-36 bg-gradient-to-br from-[hsl(var(--bc-primary))]/20 to-pink-500/20">
                {post.thumbnail_url ? (
                  <img 
                    src={post.thumbnail_url} 
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(var(--bc-primary))] to-purple-600">
                    <FileText className="w-16 h-16 text-white/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                {index === 0 && (
                  <div className="absolute top-3 left-3">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                      ✨ NEW
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4">
                <h4 className="font-bold text-[hsl(var(--bc-text))] line-clamp-2 group-hover:text-[hsl(var(--bc-primary))] transition mb-2">
                  {post.title}
                </h4>
                {post.excerpt && (
                  <p className="text-sm text-[hsl(var(--bc-text-muted))] line-clamp-2">
                    {post.excerpt}
                  </p>
                )}
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-3 font-medium">
                  📅 {new Date(post.published_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  serial_id: number;
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
    serial_id: number;
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

    const { data: referralsData } = await supabase
      .from('forum_referrals')
      .select(`id, referred_id, created_at, referred_user:referred_id (username, avatar_url)`)
      .eq('referrer_id', forumUser.id)
      .order('created_at', { ascending: false });
    
    if (referralsData) {
      setReferrals(referralsData as unknown as Referral[]);
    }

    const { data: requests } = await supabase
      .from('forum_friend_requests')
      .select(`id, created_at, sender:sender_id (id, serial_id, username, avatar_url, level, membership_tier)`)
      .eq('receiver_id', forumUser.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (requests) {
      setFriendRequests(requests as unknown as FriendRequest[]);
    }

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
        .select('id, serial_id, username, avatar_url, status_text, status_updated_at, is_verified, level, avatar_effect, membership_tier')
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
    return `${hours}h ${minutes}m`;
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
      <div className="space-y-8">
        <WelcomeDialog isLoggedIn={false} />
        
        {/* Hero Section - Roblox-inspired */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--bc-primary))] via-blue-500 to-cyan-400 p-8 md:p-12">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='4' fill='rgba(255,255,255,0.3)'/%3E%3C/svg%3E\")" }} />
          
          <div className="relative z-10 text-center py-6">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="text-white font-semibold">Join the adventure!</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
              Welcome to BLOX City
            </h1>
            <p className="text-white/90 max-w-lg mx-auto mb-8 text-lg">
              Join millions of players, create amazing games, and make new friends!
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                to="/login" 
                className="group px-8 py-3.5 bg-white text-[hsl(var(--bc-primary))] rounded-2xl font-bold shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 transition-all"
              >
                Log In
              </Link>
              <Link 
                to="/register" 
                className="group px-8 py-3.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/30 hover:shadow-xl hover:scale-105 transition-all"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Blog Posts */}
        <RecentBlogPosts />

        {/* Quick Links - Game-style cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Link
            to="/forum"
            className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 hover:shadow-2xl hover:shadow-blue-500/30 transition-all hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">Forums</h3>
              <p className="text-white/70 text-sm">Join discussions</p>
            </div>
          </Link>
          <Link
            to="/groups"
            className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UsersRound className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">Groups</h3>
              <p className="text-white/70 text-sm">Find your squad</p>
            </div>
          </Link>
          <Link
            to="/games"
            className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 hover:shadow-2xl hover:shadow-green-500/30 transition-all hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">Games</h3>
              <p className="text-white/70 text-sm">Play now</p>
            </div>
          </Link>
          <Link
            to="/forum/leaderboard"
            className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 hover:shadow-2xl hover:shadow-amber-500/30 transition-all hover:-translate-y-2"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-bold text-white text-lg mb-1">Leaderboard</h3>
              <p className="text-white/70 text-sm">Top players</p>
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
    <div className="space-y-8">
      {/* Compensation Dialog for existing users */}
      {forumUser && (
        <CompensationDialog 
          forumUserId={forumUser.id} 
          userCreatedAt={forumUser.created_at} 
        />
      )}

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-[hsl(var(--bc-text))] flex items-center gap-2 text-xl">
              <Gift className="w-6 h-6 text-[hsl(var(--bc-accent))]" />
              Daily Reward!
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            {rewardResult && (
              <>
                <div className={`w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-xl ${
                  rewardResult.type === 'coins' 
                    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/30' 
                    : 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30'
                }`}>
                  {rewardResult.type === 'coins' ? (
                    <Coins className="w-12 h-12 text-white" />
                  ) : (
                    <DollarSign className="w-12 h-12 text-white" />
                  )}
                </div>
                <h3 className="text-3xl font-extrabold text-[hsl(var(--bc-text))] mb-2">
                  +{rewardResult.amount} {rewardResult.type === 'coins' ? 'Coins' : 'Cash'}!
                </h3>
                <p className="text-[hsl(var(--bc-text-muted))]">
                  Come back tomorrow for another reward! 🎁
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <UserAdBanner type="banner" />
      
      {/* Hero Section - Roblox style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(var(--bc-primary))] via-blue-500 to-cyan-400 p-6 md:p-8">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='4' fill='rgba(255,255,255,0.2)'/%3E%3C/svg%3E\")" }} />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <Link to={`/${forumUser?.serial_id}/${forumUser?.username}/profile`} className="shrink-0 group">
                {forumUser?.avatar_url ? (
                  <div className="relative">
                    <img 
                      src={forumUser.avatar_url} 
                      alt={forumUser.username}
                      className="w-20 h-20 rounded-2xl object-cover border-4 border-white/30 shadow-xl group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {userLevel}
                    </div>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/30">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </Link>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white drop-shadow-lg">
                    Hey, {forumUser?.username}! 👋
                  </h1>
                  {forumUser?.is_verified && <VerifiedBadge size="lg" />}
                </div>
                <p className="text-white/80 text-sm font-medium">Ready for today's adventure?</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/convert" className="group bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-3 hover:bg-white/30 transition-all border border-white/20 hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Coins className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-extrabold text-white">{coins.toLocaleString()}</div>
                  <div className="text-xs text-white/70 font-medium">Coins</div>
                </div>
              </Link>
              <Link to="/convert" className="group bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-3 hover:bg-white/30 transition-all border border-white/20 hover:scale-105">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-extrabold text-white">{cash}</div>
                  <div className="text-xs text-white/70 font-medium">Cash</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Game style tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/games" className="group relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-5 hover:shadow-xl hover:shadow-green-500/20 transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <Gamepad2 className="w-8 h-8 text-white mb-3" />
            <h3 className="font-bold text-white">Play Games</h3>
            <p className="text-white/70 text-sm">Discover fun</p>
          </div>
        </Link>
        <Link to="/market" className="group relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 hover:shadow-xl hover:shadow-purple-500/20 transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <ShoppingBag className="w-8 h-8 text-white mb-3" />
            <h3 className="font-bold text-white">Marketplace</h3>
            <p className="text-white/70 text-sm">Shop items</p>
          </div>
        </Link>
        <Link to="/groups" className="group relative overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-5 hover:shadow-xl hover:shadow-blue-500/20 transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <UsersRound className="w-8 h-8 text-white mb-3" />
            <h3 className="font-bold text-white">Groups</h3>
            <p className="text-white/70 text-sm">Join clans</p>
          </div>
        </Link>
        <Link to="/create" className="group relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 hover:shadow-xl hover:shadow-amber-500/20 transition-all hover:-translate-y-1">
          <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <Plus className="w-8 h-8 text-white mb-3" />
            <h3 className="font-bold text-white">Create</h3>
            <p className="text-white/70 text-sm">Build games</p>
          </div>
        </Link>
      </div>

      {/* Recent Blog Posts */}
      <RecentBlogPosts />

      {/* Stats Bar - Roblox game stats style */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="relative overflow-hidden bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-5 hover:border-[hsl(var(--bc-primary))]/30 transition-all group">
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[hsl(var(--bc-text))]">{userLevel}</div>
              <div className="text-sm font-medium text-[hsl(var(--bc-text-muted))]">Level</div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-5 hover:border-purple-500/30 transition-all group">
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Zap className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[hsl(var(--bc-text))]">{userXp.toLocaleString()}</div>
              <div className="text-sm font-medium text-[hsl(var(--bc-text-muted))]">Total XP</div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-5 hover:border-green-500/30 transition-all group">
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[hsl(var(--bc-text))]">{friendStatuses.length}</div>
              <div className="text-sm font-medium text-[hsl(var(--bc-text-muted))]">Friends Online</div>
            </div>
          </div>
        </div>
        <div className="relative overflow-hidden bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-5 hover:border-amber-500/30 transition-all group">
          <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition" />
          <div className="relative flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Star className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-[hsl(var(--bc-text))]">{referralCount}/5</div>
              <div className="text-sm font-medium text-[hsl(var(--bc-text-muted))]">Referrals</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Actions & Progress */}
        <div className="space-y-5">
          {/* Status Update - Roblox style */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <PenSquare className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-[hsl(var(--bc-text))]">Post Status</h3>
            </div>
            <div className="p-4">
              <div className="flex gap-3">
                <Link to={`/${forumUser?.serial_id}/${forumUser?.username}/profile`} className="shrink-0">
                  <UserAvatar
                    avatarUrl={forumUser?.avatar_url || null}
                    username={forumUser?.username || ''}
                    size="md"
                  />
                </Link>
                <div className="flex-1">
                  <textarea
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value.slice(0, 280))}
                    placeholder="What's happening? 🎮"
                    className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-xl px-4 py-3 text-sm text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))]/20 resize-none transition-all"
                    rows={2}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-[hsl(var(--bc-text-muted))] font-medium">{statusText.length}/280</span>
                    <button
                      onClick={handlePostStatus}
                      disabled={postingStatus || !statusText.trim()}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105"
                    >
                      {postingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Rewards Card - Game style */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Gift className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[hsl(var(--bc-text))]">Daily Rewards</h3>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">Claim your goodies!</p>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {canClaimReward() ? (
                <button
                  onClick={handleClaimReward}
                  disabled={claiming}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:scale-[1.02]"
                >
                  {claiming ? <Loader2 className="w-6 h-6 animate-spin" /> : <Package className="w-6 h-6" />}
                  🎁 Claim Daily Reward
                </button>
              ) : (
                <div className="flex items-center justify-center gap-3 py-4 text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] rounded-2xl border border-[hsl(var(--bc-border))]">
                  <Clock className="w-5 h-5" />
                  <span className="font-medium">Next claim in {getTimeUntilClaim()}</span>
                </div>
              )}

              {canClaimDailyXp() && (
                <button
                  onClick={handleClaimDailyXp}
                  disabled={claimingXp}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-orange-500/20 hover:shadow-xl hover:scale-[1.02]"
                >
                  {claimingXp ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
                  ⚡ Claim +50 XP
                </button>
              )}
            </div>
          </div>

          {/* Level Progress - Game style */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-[hsl(var(--bc-text))]">Level Progress</h3>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-[hsl(var(--bc-text-muted))]">
                  {xpProgress.current.toLocaleString()} / {xpProgress.required.toLocaleString()} XP
                </span>
                <span className="text-sm font-bold text-[hsl(var(--bc-primary))]">{xpProgress.percentage}%</span>
              </div>
              <div className="h-4 bg-[hsl(var(--bc-bg-light))] rounded-full overflow-hidden border border-[hsl(var(--bc-border))]">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center mt-3 font-medium">🚀 Level {userLevel + 1} awaits!</p>
            </div>
          </div>

          {/* Referral System - Game style */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[hsl(var(--bc-text))]">Invite Friends</h3>
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">Earn 10 coins each!</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <div className="flex-1 bg-[hsl(var(--bc-bg-light))] rounded-xl px-4 py-3 text-sm font-mono text-[hsl(var(--bc-text))] truncate border border-[hsl(var(--bc-border))]">
                  {referralCode}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-green-500/20 hover:scale-105"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              {referrals.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[hsl(var(--bc-border))]">
                  <p className="text-xs text-[hsl(var(--bc-text-muted))] mb-3 font-medium">Recent recruits 🎉</p>
                  <div className="flex -space-x-2">
                    {referrals.slice(0, 5).map(ref => (
                      <div key={ref.id} className="w-10 h-10 rounded-full bg-[hsl(var(--bc-bg-light))] border-3 border-[hsl(var(--bc-bg-card))] overflow-hidden shadow-lg">
                        {ref.referred_user?.avatar_url ? (
                          <img src={ref.referred_user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-500">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Friend Requests - Game style */}
          {friendRequests.length > 0 && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <UsersRound className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-[hsl(var(--bc-text))]">Friend Requests</h3>
                <span className="ml-auto bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full font-bold shadow-lg">
                  {friendRequests.length}
                </span>
              </div>
              <div className="divide-y divide-[hsl(var(--bc-border))]">
                {friendRequests.slice(0, 3).map(request => (
                  <div key={request.id} className="p-4 flex items-center gap-3 hover:bg-[hsl(var(--bc-bg-light))]/50 transition">
                    <Link to={`/${request.sender.serial_id}/${request.sender.username}/profile`}>
                      <UserAvatar
                        avatarUrl={request.sender.avatar_url}
                        username={request.sender.username}
                        size="sm"
                        membershipTier={request.sender.membership_tier}
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={`/${request.sender.serial_id}/${request.sender.username}/profile`}
                        className="font-bold text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] text-sm truncate block"
                      >
                        {request.sender.username}
                      </Link>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptFriend(request.id)}
                        className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-lg hover:scale-105"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeclineFriend(request.id)}
                        className="p-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text-muted))] rounded-xl transition"
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

        {/* Right Column - Friend Feed (takes 2 cols) - Roblox style */}
        <div className="lg:col-span-2">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[hsl(var(--bc-border))] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-[hsl(var(--bc-text))]">Friend Activity</h3>
                  <p className="text-xs text-[hsl(var(--bc-text-muted))]">What your squad is up to</p>
                </div>
              </div>
              <Link 
                to="/friends"
                className="flex items-center gap-1 px-4 py-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-primary))] hover:text-white text-sm font-bold text-[hsl(var(--bc-text))] rounded-xl transition-all"
              >
                All Friends
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {friendStatuses.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mx-auto mb-5 shadow-lg">
                  <MessageCircle className="w-10 h-10 text-[hsl(var(--bc-text-muted))]" />
                </div>
                <h4 className="font-bold text-xl text-[hsl(var(--bc-text))] mb-2">No friend activity yet</h4>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] max-w-xs mx-auto mb-6">
                  Add friends to see what they're up to!
                </p>
                <Link
                  to="/users"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-500/20 hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-5 h-5" />
                  Find Friends
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-[hsl(var(--bc-border))]">
                {friendStatuses.map(friend => (
                  <div key={friend.id} className="p-5 hover:bg-[hsl(var(--bc-bg-light))]/50 transition">
                    <div className="flex gap-4">
                      <Link to={`/${friend.serial_id}/${friend.username}/profile`} className="shrink-0">
                        <UserAvatar
                          avatarUrl={friend.avatar_url}
                          username={friend.username}
                          size="md"
                          effect={friend.avatar_effect}
                          membershipTier={friend.membership_tier}
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Link 
                            to={`/${friend.serial_id}/${friend.username}/profile`}
                            className="font-bold text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] transition"
                          >
                            {friend.username}
                          </Link>
                          {friend.is_verified && <VerifiedBadge />}
                          <span className="text-xs text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] px-2 py-0.5 rounded-full">
                            {formatTimeAgo(friend.status_updated_at)}
                          </span>
                        </div>
                        
                        <div className="relative bg-gradient-to-br from-[hsl(var(--bc-bg-light))] to-[hsl(var(--bc-bg-card))] rounded-2xl p-4 border border-[hsl(var(--bc-border))]">
                          <p className="text-[hsl(var(--bc-text))]">{friend.status_text}</p>
                        </div>

                        <div className="flex items-center gap-4 mt-4">
                          <button
                            onClick={() => handleLikeStatus(friend.id, friend.is_liked)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                              friend.is_liked 
                                ? 'bg-red-500/10 text-red-500' 
                                : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:bg-red-500/10 hover:text-red-500'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${friend.is_liked ? 'fill-current' : ''}`} />
                            <span>{friend.like_count > 0 ? friend.like_count : 'Like'}</span>
                          </button>
                          
                          {reportingStatus === friend.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Reason for report..."
                                className="flex-1 text-sm bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-xl px-4 py-2 text-[hsl(var(--bc-text))] focus:outline-none focus:border-[hsl(var(--bc-primary))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))]/20"
                              />
                              <button
                                onClick={() => handleReportStatus(friend.id)}
                                className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-500/10 rounded-xl transition"
                              >
                                Submit
                              </button>
                              <button
                                onClick={() => {
                                  setReportingStatus(null);
                                  setReportReason('');
                                }}
                                className="px-4 py-2 text-sm text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-light))] rounded-xl transition"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReportingStatus(friend.id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))] hover:text-red-500 hover:bg-red-500/10 transition-all"
                            >
                              <Flag className="w-4 h-4" />
                              <span>Report</span>
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
  );
}
