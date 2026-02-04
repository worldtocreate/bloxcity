import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, UserCheck, Clock, Loader2, UserX } from 'lucide-react';
import { toast } from 'sonner';

interface FriendButtonProps {
  currentUserId: string; // forum_user id
  targetUserId: string; // forum_user id
  targetUsername: string;
  className?: string;
}

type FriendshipStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';

export default function FriendButton({ currentUserId, targetUserId, targetUsername, className = '' }: FriendButtonProps) {
  const [status, setStatus] = useState<FriendshipStatus>('none');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    checkFriendshipStatus();
  }, [currentUserId, targetUserId]);

  const checkFriendshipStatus = async () => {
    setLoading(true);

    // Check if already friends
    const user1 = currentUserId < targetUserId ? currentUserId : targetUserId;
    const user2 = currentUserId < targetUserId ? targetUserId : currentUserId;

    const { data: friendship } = await supabase
      .from('forum_friendships')
      .select('id')
      .eq('user_1_id', user1)
      .eq('user_2_id', user2)
      .single();

    if (friendship) {
      setStatus('friends');
      setLoading(false);
      return;
    }

    // Check for pending requests
    const { data: sentRequest } = await supabase
      .from('forum_friend_requests')
      .select('id')
      .eq('sender_id', currentUserId)
      .eq('receiver_id', targetUserId)
      .eq('status', 'pending')
      .single();

    if (sentRequest) {
      setStatus('pending_sent');
      setLoading(false);
      return;
    }

    const { data: receivedRequest } = await supabase
      .from('forum_friend_requests')
      .select('id')
      .eq('sender_id', targetUserId)
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending')
      .single();

    if (receivedRequest) {
      setStatus('pending_received');
      setLoading(false);
      return;
    }

    setStatus('none');
    setLoading(false);
  };

  const handleSendRequest = async () => {
    setActing(true);
    
    const { error } = await supabase
      .from('forum_friend_requests')
      .insert({
        sender_id: currentUserId,
        receiver_id: targetUserId
      });

    if (error) {
      toast.error('Failed to send friend request');
    } else {
      toast.success(`Friend request sent to ${targetUsername}!`);
      setStatus('pending_sent');
    }
    setActing(false);
  };

  const handleCancelRequest = async () => {
    setActing(true);
    
    const { error } = await supabase
      .from('forum_friend_requests')
      .delete()
      .eq('sender_id', currentUserId)
      .eq('receiver_id', targetUserId)
      .eq('status', 'pending');

    if (error) {
      toast.error('Failed to cancel request');
    } else {
      toast.success('Friend request cancelled');
      setStatus('none');
    }
    setActing(false);
  };

  const handleAcceptRequest = async () => {
    setActing(true);
    
    // Find the request
    const { data: request } = await supabase
      .from('forum_friend_requests')
      .select('id')
      .eq('sender_id', targetUserId)
      .eq('receiver_id', currentUserId)
      .eq('status', 'pending')
      .single();

    if (request) {
      const { error } = await supabase.rpc('accept_friend_request', { request_id: request.id });
      
      if (error) {
        toast.error('Failed to accept friend request');
      } else {
        toast.success(`You are now friends with ${targetUsername}!`);
        setStatus('friends');
      }
    }
    setActing(false);
  };

  const handleUnfriend = async () => {
    setActing(true);
    
    const user1 = currentUserId < targetUserId ? currentUserId : targetUserId;
    const user2 = currentUserId < targetUserId ? targetUserId : currentUserId;

    const { error } = await supabase
      .from('forum_friendships')
      .delete()
      .eq('user_1_id', user1)
      .eq('user_2_id', user2);

    if (error) {
      toast.error('Failed to remove friend');
    } else {
      toast.success(`Removed ${targetUsername} from friends`);
      setStatus('none');
    }
    setActing(false);
  };

  if (loading) {
    return (
      <button disabled className={`bc-btn bc-btn-secondary bc-btn-sm justify-center ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  if (status === 'friends') {
    return (
      <button
        onClick={handleUnfriend}
        disabled={acting}
        className={`bc-btn bc-btn-sm justify-center bg-green-500 hover:bg-red-500 text-white transition group ${className}`}
      >
        {acting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserCheck className="w-4 h-4 group-hover:hidden" />
            <UserX className="w-4 h-4 hidden group-hover:block" />
            <span className="group-hover:hidden">Friends</span>
            <span className="hidden group-hover:inline">Unfriend</span>
          </>
        )}
      </button>
    );
  }

  if (status === 'pending_sent') {
    return (
      <button
        onClick={handleCancelRequest}
        disabled={acting}
        className={`bc-btn bc-btn-secondary bc-btn-sm justify-center hover:bg-red-100 hover:text-red-600 transition ${className}`}
      >
        {acting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <Clock className="w-4 h-4" />
            <span>Pending</span>
          </>
        )}
      </button>
    );
  }

  if (status === 'pending_received') {
    return (
      <button
        onClick={handleAcceptRequest}
        disabled={acting}
        className={`bc-btn bc-btn-success bc-btn-sm justify-center ${className}`}
      >
        {acting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <UserCheck className="w-4 h-4" />
            <span>Accept</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleSendRequest}
      disabled={acting}
      className={`bc-btn bc-btn-info bc-btn-sm justify-center ${className}`}
    >
      {acting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Add Friend</span>
        </>
      )}
    </button>
  );
}
