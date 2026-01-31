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

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);

      if (session?.user) {
        // Check admin role
        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        setIsAdmin(hasAdminRole === true);

        // Fetch forum user
        const { data: forumData } = await supabase
          .from('forum_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        setForumUser(forumData as ForumUser | null);
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const { data: hasAdminRole } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });
        setIsAdmin(hasAdminRole === true);

        const { data: forumData } = await supabase
          .from('forum_users')
          .select('*')
          .eq('user_id', session.user.id)
          .single();
        
        setForumUser(forumData as ForumUser | null);
      } else {
        setIsAdmin(false);
        setForumUser(null);
      }
    });

    return () => subscription.unsubscribe();
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
