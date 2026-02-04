import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Loader2 } from 'lucide-react';
import UserAvatar from './UserAvatar';
import { VerificationBadge } from './VerifiedBadge';

interface Friend {
  id: string;
  serial_id: number;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  level: number;
  avatar_effect: string | null;
  membership_tier: 'bronze' | 'silver' | 'platinum' | null;
}

interface FriendsListProps {
  forumUserId: string;
  limit?: number;
  showTitle?: boolean;
}

export default function FriendsList({ forumUserId, limit = 6, showTitle = true }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchFriends();
  }, [forumUserId]);

  const fetchFriends = async () => {
    setLoading(true);

    // Get all friendships for this user
    const { data: friendships, count } = await supabase
      .from('forum_friendships')
      .select('user_1_id, user_2_id', { count: 'exact' })
      .or(`user_1_id.eq.${forumUserId},user_2_id.eq.${forumUserId}`)
      .limit(limit);

    if (friendships && friendships.length > 0) {
      const friendIds = friendships.map(f => 
        f.user_1_id === forumUserId ? f.user_2_id : f.user_1_id
      );

      const { data: friendData } = await supabase
        .from('forum_users')
        .select('id, serial_id, username, avatar_url, is_verified, level, avatar_effect, membership_tier')
        .in('id', friendIds);

      if (friendData) {
        setFriends(friendData as Friend[]);
      }
    }

    setTotalCount(count || 0);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-[hsl(var(--bc-primary))] animate-spin" />
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        {showTitle && (
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
            <h3 className="font-semibold text-[hsl(var(--bc-text))]">Friends</h3>
          </div>
        )}
        <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center py-2">No friends yet</p>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
      {showTitle && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
            <h3 className="font-semibold text-[hsl(var(--bc-text))]">Friends</h3>
          </div>
          <span className="text-sm text-[hsl(var(--bc-text-muted))]">{totalCount}</span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-2">
        {friends.map(friend => (
          <Link
            key={friend.id}
            to={`/${friend.serial_id}/${friend.username}/profile`}
            className="flex flex-col items-center p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
          >
            <UserAvatar
              avatarUrl={friend.avatar_url}
              username={friend.username}
              size="md"
              effect={friend.avatar_effect}
              membershipTier={friend.membership_tier}
            />
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-xs text-[hsl(var(--bc-text))] truncate max-w-[60px]">
                {friend.username}
              </span>
              <VerificationBadge size="sm" forumUserId={friend.id} isVerified={friend.is_verified} />
            </div>
          </Link>
        ))}
      </div>

      {totalCount > limit && (
        <div className="mt-3 text-center">
          <span className="text-xs text-[hsl(var(--bc-text-muted))]">
            +{totalCount - limit} more
          </span>
        </div>
      )}
    </div>
  );
}
