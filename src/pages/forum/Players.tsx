import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, User, ChevronLeft, ChevronRight, Shield } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import UserLevelBadge from '@/components/forum/UserLevelBadge';
import VerifiedBadge from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';

interface PlayerData {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  post_count: number;
  created_at: string;
  is_verified: boolean;
  membership_tier: string | null;
  is_admin?: boolean;
}

const ITEMS_PER_PAGE = 24;

export default function Players() {
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();

  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchPlayers();
  }, [debouncedSearch, currentPage]);

  const fetchPlayers = async () => {
    setLoading(true);
    
    // Get admin user IDs first
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');
    
    const adminUserIds = new Set(adminRoles?.map(r => r.user_id) || []);

    let query = supabase
      .from('forum_users')
      .select('id, username, avatar_url, level, xp, post_count, created_at, is_verified, membership_tier, user_id', { count: 'exact' })
      .eq('is_suspended', false)
      .order('level', { ascending: false });

    if (debouncedSearch.trim()) {
      query = query.ilike('username', `%${debouncedSearch.trim()}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      setPlayers(data.map(p => ({
        ...p,
        is_admin: adminUserIds.has(p.user_id)
      })));
      setTotalCount(count || 0);
    }
    setLoading(false);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Players</h1>
          <p className="text-[hsl(var(--bc-text-muted))]">
            {totalCount.toLocaleString()} registered players
          </p>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search players..."
            className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
          />
        </div>
      </div>

      {/* Players Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-20 text-[hsl(var(--bc-text-muted))]">
          No players found
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {players.map((player) => (
              <Link
                key={player.id}
                to={`/user/${player.username}`}
                className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 hover:border-[hsl(var(--bc-primary))] transition text-center group"
              >
                {/* Avatar - Show profile picture for everyone including admins */}
                {player.avatar_url ? (
                  <img 
                    src={player.avatar_url} 
                    alt={player.username}
                    className="w-16 h-16 mx-auto mb-3 rounded-full object-cover"
                  />
                ) : (
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                    player.is_admin 
                      ? 'bg-gradient-to-br from-red-500 to-red-600' 
                      : 'bg-[hsl(var(--bc-primary))]'
                  }`}>
                    {player.is_admin ? (
                      <Shield className="w-8 h-8 text-white" />
                    ) : (
                      <User className="w-8 h-8 text-white" />
                    )}
                  </div>
                )}

                {/* Username */}
                <h3 className={`font-semibold truncate group-hover:text-[hsl(var(--bc-primary))] transition flex items-center justify-center gap-1 ${
                  player.is_admin ? 'text-red-500' : 'text-[hsl(var(--bc-text))]'
                }`}>
                  {player.username}
                  {player.is_verified && <VerifiedBadge size="sm" />}
                </h3>

                

                {/* Stats */}
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-2">
                  {player.post_count.toLocaleString()} posts
                </p>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] disabled:opacity-50 hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                <ChevronLeft className="w-4 h-4 text-[hsl(var(--bc-text))]" />
              </button>
              
              <span className="text-sm text-[hsl(var(--bc-text-muted))]">
                Page {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] disabled:opacity-50 hover:bg-[hsl(var(--bc-bg-light))] transition"
              >
                <ChevronRight className="w-4 h-4 text-[hsl(var(--bc-text))]" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
