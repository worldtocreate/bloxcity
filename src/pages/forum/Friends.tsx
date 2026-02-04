import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserPlus, UserMinus, Check, X, Loader2, Clock } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import UserAvatar from '@/components/forum/UserAvatar';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import UserLevelBadge from '@/components/forum/UserLevelBadge';

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  level: number;
  avatar_effect: string | null;
  membership_tier: 'bronze' | 'silver' | 'platinum' | null;
  last_seen_at: string | null;
}

interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  sender?: Friend;
  receiver?: Friend;
}

export default function Friends() {
  const { forumUser } = useOutletContext<{ forumUser: ForumUser | null }>();
  const [activeTab, setActiveTab] = useState<'friends' | 'pending' | 'sent'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (forumUser) {
      fetchData();
    }
  }, [forumUser]);

  const fetchData = async () => {
    if (!forumUser) return;
    setLoading(true);

    // Fetch friends
    const { data: friendships } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id')
      .or(`user_1_id.eq.${forumUser.id},user_2_id.eq.${forumUser.id}`);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f =>
        f.user_1_id === forumUser.id ? f.user_2_id : f.user_1_id
      );

      const { data: friendData } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, is_verified, level, avatar_effect, membership_tier, last_seen_at')
        .in('id', friendIds);

      if (friendData) {
        setFriends(friendData as Friend[]);
      }
    } else {
      setFriends([]);
    }

    // Fetch pending requests (received)
    const { data: pending } = await supabase
      .from('forum_friend_requests')
      .select('*')
      .eq('receiver_id', forumUser.id)
      .eq('status', 'pending');

    if (pending && pending.length > 0) {
      const senderIds = pending.map(r => r.sender_id);
      const { data: senders } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, is_verified, level, avatar_effect, membership_tier, last_seen_at')
        .in('id', senderIds);

      const requestsWithSenders = pending.map(r => ({
        ...r,
        sender: senders?.find(s => s.id === r.sender_id) as Friend
      }));
      setPendingRequests(requestsWithSenders);
    } else {
      setPendingRequests([]);
    }

    // Fetch sent requests
    const { data: sent } = await supabase
      .from('forum_friend_requests')
      .select('*')
      .eq('sender_id', forumUser.id)
      .eq('status', 'pending');

    if (sent && sent.length > 0) {
      const receiverIds = sent.map(r => r.receiver_id);
      const { data: receivers } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, is_verified, level, avatar_effect, membership_tier, last_seen_at')
        .in('id', receiverIds);

      const requestsWithReceivers = sent.map(r => ({
        ...r,
        receiver: receivers?.find(s => s.id === r.receiver_id) as Friend
      }));
      setSentRequests(requestsWithReceivers);
    } else {
      setSentRequests([]);
    }

    setLoading(false);
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: requestId });
      if (error) throw error;
      toast.success('Friend request accepted!');
      fetchData();
    } catch (error) {
      toast.error('Failed to accept request');
    }
    setActionLoading(null);
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    const { error } = await supabase
      .from('forum_friend_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to decline request');
    } else {
      toast.success('Friend request declined');
      fetchData();
    }
    setActionLoading(null);
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    const { error } = await supabase
      .from('forum_friend_requests')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to cancel request');
    } else {
      toast.success('Friend request cancelled');
      fetchData();
    }
    setActionLoading(null);
  };

  const handleRemoveFriend = async (friendId: string, friendUsername: string) => {
    if (!forumUser) return;
    setActionLoading(friendId);

    // Delete friendship (could be in either direction)
    const { error: err1 } = await supabase
      .from('forum_friendships')
      .delete()
      .eq('user_1_id', forumUser.id)
      .eq('user_2_id', friendId);

    const { error: err2 } = await supabase
      .from('forum_friendships')
      .delete()
      .eq('user_1_id', friendId)
      .eq('user_2_id', forumUser.id);

    if (!err1 || !err2) {
      toast.success(`Removed ${friendUsername} from friends`);
      fetchData();
    } else {
      toast.error('Failed to remove friend');
    }
    setActionLoading(null);
  };

  const isOnline = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastSeenAt) > fiveMinutesAgo;
  };

  const getLastSeenText = (lastSeenAt: string | null) => {
    if (!lastSeenAt) return 'Never';
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 5) return 'Online';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (!forumUser) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Users className="w-16 h-16 text-[hsl(var(--bc-text-muted))] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Sign In Required</h1>
        <p className="text-[hsl(var(--bc-text-muted))]">Please sign in to view your friends.</p>
        <Link to="/login" className="inline-block mt-4 text-[hsl(var(--bc-primary))] hover:underline">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--bc-primary))]/20 flex items-center justify-center">
            <Users className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Friends</h1>
            <p className="text-[hsl(var(--bc-text-muted))]">Manage your friends and requests</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[hsl(var(--bc-border))]">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-[2px] ${
            activeTab === 'friends'
              ? 'border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-primary))]'
              : 'border-transparent text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-[2px] flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-primary))]'
              : 'border-transparent text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
          }`}
        >
          Pending
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 bg-[hsl(var(--bc-primary))] text-white text-xs rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`px-4 py-2 font-medium transition border-b-2 -mb-[2px] ${
            activeTab === 'sent'
              ? 'border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-primary))]'
              : 'border-transparent text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
          }`}
        >
          Sent ({sentRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
        </div>
      ) : (
        <>
          {/* Friends List */}
          {activeTab === 'friends' && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
              {friends.length === 0 ? (
                <div className="p-8 text-center">
                  <Users className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
                  <p className="text-[hsl(var(--bc-text-muted))]">You don't have any friends yet.</p>
                  <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-1">
                    Visit user profiles to send friend requests!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--bc-border))]">
                  {friends.map(friend => (
                    <div key={friend.id} className="p-4 flex items-center justify-between">
                      <Link to={`/id/${friend.username}/profile`} className="flex items-center gap-3 flex-1">
                        <div className="relative">
                          <UserAvatar
                            avatarUrl={friend.avatar_url}
                            username={friend.username}
                            size="md"
                            effect={friend.avatar_effect}
                            membershipTier={friend.membership_tier}
                          />
                          {isOnline(friend.last_seen_at) && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-[hsl(var(--bc-bg-card))] rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[hsl(var(--bc-text))]">{friend.username}</span>
                            {friend.is_verified && <VerifiedBadge size="sm" />}
                            <UserLevelBadge level={friend.level} size="sm" />
                          </div>
                          <p className={`text-xs ${isOnline(friend.last_seen_at) ? 'text-green-500' : 'text-[hsl(var(--bc-text-muted))]'}`}>
                            {getLastSeenText(friend.last_seen_at)}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleRemoveFriend(friend.id, friend.username)}
                        disabled={actionLoading === friend.id}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition"
                      >
                        {actionLoading === friend.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <UserMinus className="w-4 h-4" />
                            Remove
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Requests */}
          {activeTab === 'pending' && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
              {pendingRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
                  <p className="text-[hsl(var(--bc-text-muted))]">No pending friend requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--bc-border))]">
                  {pendingRequests.map(request => (
                    <div key={request.id} className="p-4 flex items-center justify-between">
                      <Link to={`/id/${request.sender?.username}/profile`} className="flex items-center gap-3 flex-1">
                        <UserAvatar
                          avatarUrl={request.sender?.avatar_url || null}
                          username={request.sender?.username || 'User'}
                          size="md"
                          effect={request.sender?.avatar_effect}
                          membershipTier={request.sender?.membership_tier}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[hsl(var(--bc-text))]">{request.sender?.username}</span>
                            {request.sender?.is_verified && <VerifiedBadge size="sm" />}
                          </div>
                          <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[hsl(var(--bc-primary))] text-white rounded-lg hover:bg-[hsl(var(--bc-primary-dark))] transition"
                        >
                          {actionLoading === request.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDecline(request.id)}
                          disabled={actionLoading === request.id}
                          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))] rounded-lg hover:bg-[hsl(var(--bc-border))] transition"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sent Requests */}
          {activeTab === 'sent' && (
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
              {sentRequests.length === 0 ? (
                <div className="p-8 text-center">
                  <UserPlus className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
                  <p className="text-[hsl(var(--bc-text-muted))]">No pending sent requests.</p>
                </div>
              ) : (
                <div className="divide-y divide-[hsl(var(--bc-border))]">
                  {sentRequests.map(request => (
                    <div key={request.id} className="p-4 flex items-center justify-between">
                      <Link to={`/id/${request.receiver?.username}/profile`} className="flex items-center gap-3 flex-1">
                        <UserAvatar
                          avatarUrl={request.receiver?.avatar_url || null}
                          username={request.receiver?.username || 'User'}
                          size="md"
                          effect={request.receiver?.avatar_effect}
                          membershipTier={request.receiver?.membership_tier}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-[hsl(var(--bc-text))]">{request.receiver?.username}</span>
                            {request.receiver?.is_verified && <VerifiedBadge size="sm" />}
                          </div>
                          <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                            Sent {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleCancelRequest(request.id)}
                        disabled={actionLoading === request.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition"
                      >
                        {actionLoading === request.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4" />
                            Cancel
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
