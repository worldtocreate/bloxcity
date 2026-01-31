import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Calendar, MessageCircle, Shield, MessageSquare, Pin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VerifiedBadge from './VerifiedBadge';

interface ForumUserProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  post_count: number;
  is_verified: boolean;
  is_suspended: boolean;
  hide_threads: boolean;
}

interface PinnedThread {
  id: string;
  thread_id: string;
  thread: {
    id: string;
    title: string;
    reply_count: number;
  };
}

interface UserProfileCardProps {
  username: string;
  onClose: () => void;
  currentUserId?: string;
  isAdmin?: boolean;
}

export default function UserProfileCard({ username, onClose, currentUserId, isAdmin }: UserProfileCardProps) {
  const [profile, setProfile] = useState<ForumUserProfile | null>(null);
  const [pinnedThreads, setPinnedThreads] = useState<PinnedThread[]>([]);
  const [recentThreads, setRecentThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    const { data: userData } = await supabase
      .from('forum_users')
      .select('*')
      .eq('username', username)
      .single();

    if (userData) {
      setProfile(userData as ForumUserProfile);
      
      // Fetch pinned threads
      const { data: pinned } = await supabase
        .from('forum_pinned_threads')
        .select('id, thread_id, thread:thread_id (id, title, reply_count)')
        .eq('forum_user_id', userData.id)
        .order('pinned_at', { ascending: false })
        .limit(3);
      
      if (pinned) {
        setPinnedThreads(pinned as unknown as PinnedThread[]);
      }

      // Fetch recent threads (only if not hidden or viewing own profile or admin)
      if (!userData.hide_threads || (currentUserId && currentUserId === userData.user_id) || isAdmin) {
        const { data: threads } = await supabase
          .from('forum_threads')
          .select('id, title, reply_count, created_at')
          .eq('author_id', userData.id)
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (threads) {
          setRecentThreads(threads);
        }
      }
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="absolute z-50 w-72 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl shadow-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--bc-bg-light))]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[hsl(var(--bc-bg-light))] rounded w-24" />
              <div className="h-3 bg-[hsl(var(--bc-bg-light))] rounded w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="absolute z-50 w-72 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl shadow-xl p-4">
        <p className="text-[hsl(var(--bc-text-muted))]">User not found</p>
      </div>
    );
  }

  return (
    <div 
      className="absolute z-50 w-80 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl shadow-xl"
      onMouseLeave={onClose}
    >
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--bc-border))]">
        <div className="flex items-start gap-3">
          <Link 
            to={`/forum/user/${profile.username}`}
            className="block hover:opacity-80 transition"
          >
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
            )}
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[hsl(var(--bc-text))] truncate">{profile.username}</span>
              {profile.is_verified && <VerifiedBadge size="md" />}
            </div>
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--bc-text-muted))]">
              <Calendar className="w-3 h-3" />
              Joined {new Date(profile.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-[hsl(var(--bc-text-muted))] mt-0.5">
              <MessageSquare className="w-3 h-3" />
              {profile.post_count} posts
            </div>
          </div>
        </div>
      </div>

      {/* Pinned Threads */}
      {pinnedThreads.length > 0 && (
        <div className="p-3 border-b border-[hsl(var(--bc-border))]">
          <div className="flex items-center gap-1 text-xs font-medium text-[hsl(var(--bc-text-muted))] mb-2">
            <Pin className="w-3 h-3" />
            Pinned
          </div>
          <div className="space-y-1">
            {pinnedThreads.map((pinned) => (
              <Link
                key={pinned.id}
                to={`/forum/thread/${pinned.thread.id}`}
                className="block text-sm text-[hsl(var(--bc-primary))] hover:underline truncate"
              >
                {pinned.thread.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Threads */}
      {recentThreads.length > 0 && !profile.hide_threads && (
        <div className="p-3 border-b border-[hsl(var(--bc-border))]">
          <div className="text-xs font-medium text-[hsl(var(--bc-text-muted))] mb-2">Recent Threads</div>
          <div className="space-y-1">
            {recentThreads.map((thread) => (
              <Link
                key={thread.id}
                to={`/forum/thread/${thread.id}`}
                className="block text-sm text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] truncate"
              >
                {thread.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="p-3 flex gap-2">
        <Link
          to={`/forum/user/${profile.username}`}
          className="flex-1 text-center text-sm bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] py-2 rounded-lg transition"
        >
          View Profile
        </Link>
        <Link
          to={`/forum/messages?to=${profile.username}`}
          className="flex-1 text-center text-sm bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white py-2 rounded-lg transition flex items-center justify-center gap-1"
        >
          <MessageCircle className="w-4 h-4" />
          Message
        </Link>
      </div>
    </div>
  );
}
