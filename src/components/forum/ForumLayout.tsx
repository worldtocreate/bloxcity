import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useForumAuth } from '@/hooks/useForumAuth';
import ForumHeader from './ForumHeader';
import { Loader2, Megaphone, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ForumAnnouncement {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export default function ForumLayout() {
  const { user, forumUser, isAdmin, loading } = useForumAuth();
  const [announcement, setAnnouncement] = useState<ForumAnnouncement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const fetchAnnouncement = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'forum_announcement')
      .single();
    
    if (data?.value) {
      setAnnouncement(data.value as unknown as ForumAnnouncement);
    }
  };

  // Check if user is suspended (only after loading completes)
  if (!loading && forumUser?.is_suspended) {
    const now = new Date();
    const endsAt = forumUser.suspension_ends_at ? new Date(forumUser.suspension_ends_at) : null;
    
    if (!endsAt || now < endsAt) {
      return (
        <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center p-4">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Account Suspended</h1>
            <p className="text-[hsl(var(--bc-text))] mb-4">
              Your forum account has been suspended.
            </p>
            {forumUser.suspension_reason && (
              <p className="text-[hsl(var(--bc-text-muted))] mb-4">
                <strong>Reason:</strong> {forumUser.suspension_reason}
              </p>
            )}
            {endsAt && (
              <p className="text-[hsl(var(--bc-text-muted))]">
                <strong>Ends:</strong> {endsAt.toLocaleDateString()} at {endsAt.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  const bannerStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg-light))]">
      <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
      
      {/* Announcement Banner */}
      {announcement?.enabled && announcement.message && !bannerDismissed && (
        <div className={`border-b ${bannerStyles[announcement.type]}`}>
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Megaphone className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{announcement.message}</span>
            </div>
            <button
              onClick={() => setBannerDismissed(true)}
              className="p-1 hover:bg-black/10 rounded transition"
              aria-label="Dismiss announcement"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
          </div>
        ) : (
          <Outlet context={{ user, forumUser, isAdmin, loading }} />
        )}
      </main>
      <footer className="border-t border-[hsl(var(--bc-border))] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-[hsl(var(--bc-text-muted))] text-sm">
          © 2026 BLOX City, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
