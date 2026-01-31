import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useOnlineStatus(forumUserId: string | null) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!forumUserId) return;

    const updateLastSeen = async () => {
      await supabase
        .from('forum_users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', forumUserId);
    };

    // Update immediately on mount
    updateLastSeen();

    // Update every 2 minutes
    intervalRef.current = setInterval(updateLastSeen, 2 * 60 * 1000);

    // Update on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateLastSeen();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [forumUserId]);
}
