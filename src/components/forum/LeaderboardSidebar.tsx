import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, MessageSquare, FileText, Star } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  avatar_url: string | null;
  post_count: number;
  thread_count: number;
  xp: number;
  level: number;
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
      .select('id, username, avatar_url, post_count, thread_count, xp, level')
      .eq('is_suspended', false)
      .order(orderColumn, { ascending: false })
      .limit(10);
    
    if (data) {
      setUsers(data as LeaderboardUser[]);
    }
    setLoading(false);
  };

  const tabs: { key: LeaderboardType; label: string; icon: React.ReactNode }[] = [
    { key: 'xp', label: 'XP', icon: <Star className="w-3 h-3" /> },
    { key: 'posts', label: 'Posts', icon: <MessageSquare className="w-3 h-3" /> },
    { key: 'threads', label: 'Threads', icon: <FileText className="w-3 h-3" /> },
  ];

  const getValue = (user: LeaderboardUser) => {
    if (activeTab === 'posts') return user.post_count;
    if (activeTab === 'threads') return user.thread_count;
    return user.xp;
  };

  return (
    <div className="rounded border border-[hsl(var(--bc-border))] overflow-hidden">
      {/* Header */}
      <div className="bg-[hsl(var(--bc-table-header))] text-white px-3 py-2 text-sm font-medium flex items-center gap-2">
        <Trophy className="w-4 h-4" />
        Leaderboard
      </div>

      {/* Tabs */}
      <div className="flex bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition ${
              activeTab === tab.key
                ? 'text-[hsl(var(--bc-primary))] border-b-2 border-[hsl(var(--bc-primary))] -mb-px'
                : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-[hsl(var(--bc-bg-card))] divide-y divide-[hsl(var(--bc-border))]">
        {loading ? (
          <div className="p-3 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-6 bg-[hsl(var(--bc-bg))] rounded animate-pulse" />
            ))}
          </div>
        ) : (
          users.map((user, index) => (
            <Link
              key={user.id}
              to={`/user/${user.username}`}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[hsl(var(--bc-bg))] transition text-sm"
            >
              <span className={`w-5 text-center text-xs font-bold ${
                index === 0 ? 'text-yellow-500' :
                index === 1 ? 'text-gray-400' :
                index === 2 ? 'text-amber-600' :
                'text-[hsl(var(--bc-text-muted))]'
              }`}>
                {index + 1}
              </span>
              
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-6 h-6 rounded object-cover" />
              ) : (
                <div className="w-6 h-6 rounded bg-[hsl(var(--bc-primary))] flex items-center justify-center text-white text-xs font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
              
              <span className="flex-1 truncate text-[hsl(var(--bc-link))]">
                {user.username}
              </span>
              
              <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                {getValue(user).toLocaleString()}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
