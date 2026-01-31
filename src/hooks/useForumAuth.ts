import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface ForumUser {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  cover_url: string | null;
  signature: string | null;
  is_suspended: boolean;
  suspension_reason: string | null;
  suspension_ends_at: string | null;
  post_count: number;
  created_at: string;
  is_verified: boolean;
  dm_encryption_pin_hash: string | null;
  allow_dms: boolean;
  hide_threads: boolean;
  xp: number;
  level: number;
  thread_count: number;
  avatar_effect: string | null;
  membership_tier: 'bronze' | 'silver' | 'platinum' | null;
  coins: number;
  last_coin_claim: string | null;
  status_text: string | null;
  status_updated_at: string | null;
}

export function useForumAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [forumUser, setForumUser] = useState<ForumUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

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
      
      // Set email verification status
      if (isMounted) setEmailVerified(!!authUser.email_confirmed_at);
    };

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (isMounted) {
          setUser(session?.user ?? null);
          if (session?.user) {
            setEmailVerified(!!session.user.email_confirmed_at);
          }
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
        setEmailVerified(!!session.user.email_confirmed_at);
      } else {
        setEmailVerified(null);
      }
      
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

  const refreshEmailVerification = async () => {
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) {
      setUser(freshUser);
      setEmailVerified(!!freshUser.email_confirmed_at);
    }
  };

  return { user, forumUser, isAdmin, loading, emailVerified, refreshForumUser, refreshEmailVerification };
}
