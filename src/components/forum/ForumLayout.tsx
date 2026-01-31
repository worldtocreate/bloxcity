import { Outlet } from 'react-router-dom';
import { useForumAuth } from '@/hooks/useForumAuth';
import ForumHeader from './ForumHeader';
import { Loader2 } from 'lucide-react';

export default function ForumLayout() {
  const { user, forumUser, isAdmin, loading } = useForumAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  // Check if user is suspended
  if (forumUser?.is_suspended) {
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

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg-light))]">
      <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet context={{ user, forumUser, isAdmin, loading }} />
      </main>
      <footer className="border-t border-[hsl(var(--bc-border))] py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-[hsl(var(--bc-text-muted))] text-sm">
          © 2026 BLOX City, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
