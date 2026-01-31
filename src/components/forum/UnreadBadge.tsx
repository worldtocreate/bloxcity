import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UnreadBadgeProps {
  forumUserId: string;
}

export default function UnreadBadge({ forumUserId }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnread();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('dm-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'forum_direct_messages',
          filter: `recipient_id=eq.${forumUserId}`
        },
        () => {
          fetchUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [forumUserId]);

  const fetchUnread = async () => {
    const { count } = await supabase
      .from('forum_direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', forumUserId)
      .eq('is_read', false);

    setUnreadCount(count || 0);
  };

  return (
    <Link 
      to="/messages"
      className="relative flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
    >
      <Mail className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
