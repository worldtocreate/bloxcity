import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface ProfileView {
  id: string;
  created_at: string;
  viewer: {
    id: string;
    username: string;
    avatar_url: string | null;
    user_id: string;
  } | null;
}

interface ProfileViewsProps {
  forumUserId: string;
  isOwnProfile: boolean;
}

export default function ProfileViews({ forumUserId, isOwnProfile }: ProfileViewsProps) {
  const [views, setViews] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOwnProfile) {
      fetchViews();
    }
  }, [forumUserId, isOwnProfile]);

  const fetchViews = async () => {
    const { data } = await supabase
      .from('forum_profile_views')
      .select(`
        id,
        created_at,
        viewer_user_id
      `)
      .eq('viewed_user_id', forumUserId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data && data.length > 0) {
      // Fetch viewer details separately
      const viewerIds = data.map(v => v.viewer_user_id).filter(Boolean);
      const { data: viewers } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url, user_id')
        .in('id', viewerIds);

      const viewerMap = new Map(viewers?.map(v => [v.id, v]) || []);
      
      // Check admin status for each viewer
      const uniqueUserIds = [...new Set(
        viewers?.map(v => v.user_id).filter(Boolean) || []
      )];

      if (uniqueUserIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', uniqueUserIds)
          .eq('role', 'admin');

        const adminMap: Record<string, boolean> = {};
        roles?.forEach(r => {
          adminMap[r.user_id] = true;
        });
        setIsAdmin(adminMap);
      }

      const formattedViews = data.map(v => ({
        id: v.id,
        created_at: v.created_at,
        viewer: v.viewer_user_id ? viewerMap.get(v.viewer_user_id) || null : null
      }));

      setViews(formattedViews as unknown as ProfileView[]);
    }
    setLoading(false);
  };

  if (!isOwnProfile) return null;

  if (loading) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-[hsl(var(--bc-bg-light))] rounded w-32" />
          <div className="h-8 bg-[hsl(var(--bc-bg-light))] rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Eye className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
        <h3 className="font-medium text-[hsl(var(--bc-text))]">Recent Profile Views</h3>
      </div>

      {views.length === 0 ? (
        <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center py-4">
          No profile views yet
        </p>
      ) : (
        <div className="space-y-2">
          {views.map((view) => (
            <div key={view.id} className="flex items-center justify-between">
              {view.viewer ? (
                <Link 
                  to={`/user/${view.viewer.username}`}
                  className="flex items-center gap-2 hover:opacity-80 transition"
                >
                  {isAdmin[view.viewer.user_id] ? (
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <User className="w-4 h-4 text-red-500" />
                    </div>
                  ) : view.viewer.avatar_url ? (
                    <img 
                      src={view.viewer.avatar_url} 
                      alt={view.viewer.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className={`text-sm font-medium ${
                    isAdmin[view.viewer.user_id] 
                      ? 'text-red-500' 
                      : 'text-[hsl(var(--bc-text))]'
                  }`}>
                    {view.viewer.username}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center">
                    <User className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
                  </div>
                  <span className="text-sm text-[hsl(var(--bc-text-muted))]">Guest</span>
                </div>
              )}
              <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                {formatDistanceToNow(new Date(view.created_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
