import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface ForumUser {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  signature: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_ends_at: string | null;
  post_count: number;
  created_at: string;
}

export function useForumAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [forumUser, setForumUser] = useState<ForumUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async (authUser: User) => {
      // Check admin role
      const { data: hasAdminRole } = await supabase.rpc('has_role', {
        _user_id: authUser.id,
        _role: 'admin'
      });
      if (isMounted) setIsAdmin(hasAdminRole === true);

      // Fetch forum user
      const { data: forumData } = await supabase
        .from('forum_users')
        .select('*')
        .eq('user_id', authUser.id)
        .single();
      
      if (isMounted) setForumUser(forumData as ForumUser | null);
    };

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setUser(session?.user ?? null);
        }

        if (session?.user) {
          await fetchUserData(session.user);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoadDone(true);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Don't await - let it update in background
        fetchUserData(session.user);
      } else {
        setIsAdmin(false);
        setForumUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshForumUser = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('forum_users')
      .select('*')
      .eq('user_id', user.id)
      .single();
    setForumUser(data as ForumUser | null);
  };

  return { user, forumUser, isAdmin, loading, refreshForumUser };
}
