import { useState, useEffect } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChevronLeft, ChevronRight, Loader2, Users } from 'lucide-react';
import UserAvatar from '@/components/forum/UserAvatar';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { ForumUser } from '@/hooks/useForumAuth';
import { getRelativeTime } from '@/lib/timeUtils';

interface UserListItem {
  id: string;
  serial_id: number;
  username: string;
  avatar_url: string | null;
  is_verified: boolean;
  membership_tier: string | null;
  avatar_effect: string | null;
  post_count: number;
  created_at: string;
  user_id: string;
  bio: string | null;
  last_seen_at?: string | null;
  is_admin?: boolean;
  is_moderator?: boolean;
}

const USERS_PER_PAGE = 20;
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

export default function ForumUsers() {
  const { forumUser } = useOutletContext<{ forumUser: ForumUser | null }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    document.title = 'All Players - BLOX City';
    fetchUsers();
  }, [page, searchParams.get('q')]);

  const fetchUsers = async () => {
    setLoading(true);
    const query = searchParams.get('q');
    
    let countQuery = supabase
      .from('forum_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_suspended', false);
    
    if (query) {
      countQuery = countQuery.ilike('username', `%${query}%`);
    }
    
    const { count } = await countQuery;
    setTotalCount(count || 0);

    let usersQuery = supabase
      .from('forum_users')
      .select('id, serial_id, user_id, username, avatar_url, is_verified, membership_tier, avatar_effect, post_count, created_at, bio, last_seen_at')
      .eq('is_suspended', false)
      .order('last_seen_at', { ascending: false, nullsFirst: false })
      .range((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE - 1);
    
    if (query) {
      usersQuery = usersQuery.ilike('username', `%${query}%`);
    }
    
    const { data: usersData } = await usersQuery;

    if (usersData) {
      const userIds = usersData.map(u => u.user_id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const now = Date.now();
      const isOnline = (lastSeen: string | null | undefined) => {
        if (!lastSeen) return false;
        const t = new Date(lastSeen).getTime();
        return Number.isFinite(t) && (now - t) <= ONLINE_THRESHOLD_MS;
      };

      const usersWithRoles = usersData.map(user => ({
        ...user,
        is_admin: roles?.some(r => r.user_id === user.user_id && r.role === 'admin'),
        is_moderator: roles?.some(r => r.user_id === user.user_id && r.role === 'moderator')
      }));

      usersWithRoles.sort((a: any, b: any) => {
        const aOnline = isOnline(a.last_seen_at);
        const bOnline = isOnline(b.last_seen_at);
        if (aOnline !== bOnline) return aOnline ? -1 : 1;
        const aSeen = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0;
        const bSeen = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0;
        return bSeen - aSeen;
      });
      
      setUsers(usersWithRoles);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: searchQuery, page: '1' });
  };

  const isUserOnline = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return false;
    return Date.now() - new Date(lastSeen).getTime() <= ONLINE_THRESHOLD_MS;
  };

  const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))]">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">All Players</h1>
            <p className="text-sm text-[hsl(var(--bc-text-muted))]">
              {totalCount.toLocaleString()} members in our community
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search players by username..."
              className="w-full pl-12 pr-4 py-3.5 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent transition-all"
            />
          </div>
        </form>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bc-card p-12 text-center">
          <Users className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3 opacity-50" />
          <p className="text-[hsl(var(--bc-text-muted))]">No players found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => {
            const online = isUserOnline(user.last_seen_at);
            
            return (
              <Link
                key={user.id}
                to={`/${user.serial_id}/${user.username}/profile`}
                className="group bc-card p-4 hover:border-[hsl(var(--bc-primary))] hover:shadow-lg hover:shadow-[hsla(var(--bc-primary),0.1)] transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar with online indicator */}
                  <div className="relative flex-shrink-0">
                    <UserAvatar
                      avatarUrl={user.avatar_url}
                      username={user.username}
                      size="lg"
                      effect={user.avatar_effect}
                      membershipTier={user.membership_tier as any}
                    />
                    {/* Online indicator */}
                    <div 
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[hsl(var(--bc-bg-card))] ${
                        online 
                          ? 'bg-green-500' 
                          : 'bg-[hsl(var(--bc-text-muted))]'
                      }`}
                    />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-semibold text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))] transition-colors">
                        {user.username}
                      </span>
                      <VerificationBadge size="sm" forumUserId={user.id} isVerified={user.is_verified} />
                    </div>
                    
                    {/* Badges row */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      {user.is_admin && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full">
                          Admin
                        </span>
                      )}
                      {user.is_moderator && !user.is_admin && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full">
                          Mod
                        </span>
                      )}
                      {user.membership_tier && (
                        <MembershipBadge tier={user.membership_tier as any} size="sm" showLabel={false} />
                      )}
                    </div>

                    {/* Bio */}
                    {user.bio && (
                      <p className="text-xs text-[hsl(var(--bc-text-muted))] line-clamp-2 mb-2">
                        {user.bio}
                      </p>
                    )}

                    {/* Status */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className={online ? 'text-green-500 font-medium' : 'text-[hsl(var(--bc-text-muted))]'}>
                        {online ? 'Online now' : getRelativeTime(user.last_seen_at || null)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8 pb-4">
          <button
            onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: String(page - 1) })}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition font-medium text-sm text-[hsl(var(--bc-text))]"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 bg-[hsl(var(--bc-primary))] text-white rounded-lg font-semibold text-sm">
              {page}
            </span>
            <span className="text-[hsl(var(--bc-text-muted))] text-sm">of {totalPages}</span>
          </div>
          <button
            onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: String(page + 1) })}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition font-medium text-sm text-[hsl(var(--bc-text))]"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
