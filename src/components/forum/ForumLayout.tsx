import { Outlet, Navigate } from 'react-router-dom';
import { useForumAuth } from '@/hooks/useForumAuth';
import ForumHeader from './ForumHeader';
import { Loader2 } from 'lucide-react';

export default function ForumLayout() {
  const { user, forumUser, isAdmin, loading } = useForumAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Check if user is suspended
  if (forumUser?.is_suspended) {
    const now = new Date();
    const endsAt = forumUser.suspension_ends_at ? new Date(forumUser.suspension_ends_at) : null;
    
    if (!endsAt || now < endsAt) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
          <div className="bg-red-900/30 border border-red-700 rounded-2xl p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Account Suspended</h1>
            <p className="text-gray-300 mb-4">
              Your forum account has been suspended.
            </p>
            {forumUser.suspension_reason && (
              <p className="text-gray-400 mb-4">
                <strong>Reason:</strong> {forumUser.suspension_reason}
              </p>
            )}
            {endsAt && (
              <p className="text-gray-400">
                <strong>Ends:</strong> {endsAt.toLocaleDateString()} at {endsAt.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Outlet context={{ user, forumUser, isAdmin }} />
      </main>
      <footer className="border-t border-gray-800 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-500 text-sm">
          © 2026 BLOX City, Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
