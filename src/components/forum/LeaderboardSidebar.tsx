import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, MessageSquare, FileText, Star } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  post_count: number;
  thread_count: number;
  xp: number;
  level: number;
  membership_tier: string | null;
  avatar_effect: string | null;
}

type LeaderboardType = 'posts' | 'threads' | 'xp';

export default function LeaderboardSidebar() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<LeaderboardType>('xp');

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    
    let orderColumn = 'xp';
    if (activeTab === 'posts') orderColumn = 'post_count';
    if (activeTab === 'threads') orderColumn = 'thread_count';
    
    const { data } = await supabase
      .from('forum_users')
      .select('id, username, avatar_url, post_count, thread_count, xp, level, membership_tier, avatar_effect')
      .eq('is_suspended', false)
      .order(orderColumn, { ascending: false })
      .limit(5);
    
    if (data) {
      setUsers(data as LeaderboardUser[]);
    }
    setLoading(false);
  };

  const tabs: { key: LeaderboardType; label: string; icon: React.ReactNode }[] = [
    { key: 'xp', label: 'XP', icon: <Star className="w-3.5 h-3.5" /> },
    { key: 'posts', label: 'Posts', icon: <MessageSquare className="w-3.5 h-3.5" /> },
    { key: 'threads', label: 'Threads', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  const getValue = (user: LeaderboardUser) => {
    if (activeTab === 'posts') return user.post_count;
    if (activeTab === 'threads') return user.thread_count;
    return user.xp;
  };

  const getLabel = () => {
    if (activeTab === 'posts') return 'posts';
    if (activeTab === 'threads') return 'threads';
    return 'XP';
  };

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
        <h3 className="font-semibold text-[hsl(var(--bc-text))]">Leaderboard</h3>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[hsl(var(--bc-border))]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition ${
              activeTab === tab.key
                ? 'text-[hsl(var(--bc-primary))] border-b-2 border-[hsl(var(--bc-primary))] bg-[hsla(var(--bc-primary),0.05)]'
                : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-5 h-5 bg-[hsl(var(--bc-bg-light))] rounded" />
                <div className="w-8 h-8 bg-[hsl(var(--bc-bg-light))] rounded-full" />
                <div className="flex-1 h-4 bg-[hsl(var(--bc-bg-light))] rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user, index) => (
              <Link
                key={user.id}
                to={`/forum/user/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition group"
              >
                <span className={`w-5 text-center font-bold text-sm ${
                  index === 0 ? 'text-[hsl(var(--bc-accent))]' :
                  index === 1 ? 'text-gray-400' :
                  index === 2 ? 'text-amber-600' :
                  'text-[hsl(var(--bc-text-muted))]'
                }`}>
                  #{index + 1}
                </span>
                <UserAvatar
                  avatarUrl={user.avatar_url}
                  username={user.username}
                  size="sm"
                  effect={user.avatar_effect}
                  membershipTier={user.membership_tier as any}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))] transition">
                      {user.username}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))]">
                      Lv.{user.level}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-[hsl(var(--bc-text-muted))]">
                  {getValue(user).toLocaleString()} {getLabel()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
