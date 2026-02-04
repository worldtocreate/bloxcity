import { useState, useEffect } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import UserAvatar from '@/components/forum/UserAvatar';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { ForumUser } from '@/hooks/useForumAuth';
import { getRelativeTime } from '@/lib/timeUtils';

interface UserListItem {
  id: string;
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

export default function ForumUsers() {
  const { forumUser } = useOutletContext<{ forumUser: ForumUser | null }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const page = parseInt(searchParams.get('page') || '1');

  useEffect(() => {
    document.title = 'Players - BLOX City';
    fetchUsers();
  }, [page, searchParams.get('q')]);

  const fetchUsers = async () => {
    setLoading(true);
    const query = searchParams.get('q');
    
    // Get total count
    let countQuery = supabase
      .from('forum_users')
      .select('*', { count: 'exact', head: true })
      .eq('is_suspended', false);
    
    if (query) {
      countQuery = countQuery.ilike('username', `%${query}%`);
    }
    
    const { count } = await countQuery;
    setTotalCount(count || 0);

    // Fetch users for current page
    let usersQuery = supabase
      .from('forum_users')
      .select('id, user_id, username, avatar_url, is_verified, membership_tier, avatar_effect, post_count, created_at, bio, last_seen_at')
      .eq('is_suspended', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE - 1);
    
    if (query) {
      usersQuery = usersQuery.ilike('username', `%${query}%`);
    }
    
    const { data: usersData } = await usersQuery;

    if (usersData) {
      // Get roles for all users
      const userIds = usersData.map(u => u.user_id);
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;
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

      // Online users first, then most recently seen
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

  const totalPages = Math.ceil(totalCount / USERS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[hsla(var(--bc-primary),0.1)] flex items-center justify-center">
            <Users className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Players</h1>
            <p className="text-[hsl(var(--bc-text-muted))]">{totalCount.toLocaleString()} registered players</p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="pl-10 pr-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))] w-64"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users List */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-[hsl(var(--bc-text-muted))]">
            No users found.
          </div>
        ) : (
          <div className="divide-y divide-[hsl(var(--bc-border))]">
            {users.map((user) => (
              <Link
                key={user.id}
                to={`/user/${user.username}`}
                className="flex items-center gap-4 p-4 hover:bg-[hsl(var(--bc-bg-light))] transition group"
              >
                <UserAvatar
                  avatarUrl={user.avatar_url}
                  username={user.username}
                  size="md"
                  effect={user.avatar_effect}
                  membershipTier={user.membership_tier as any}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition">
                      {user.username}
                    </span>
                    <VerificationBadge size="sm" forumUserId={user.id} isVerified={user.is_verified} />
                    {/* Online status */}
                    {user.last_seen_at && (
                      (() => {
                        const online = new Date().getTime() - new Date(user.last_seen_at!).getTime() <= 3 * 60 * 1000;
                        return (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${online ? 'bg-[hsla(var(--bc-primary),0.15)] text-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))]'}`}>
                            {online ? 'Online' : 'Offline'}
                          </span>
                        );
                      })()
                    )}
                    {user.is_admin && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[hsla(var(--bc-accent),0.15)] text-[hsl(var(--bc-accent))] rounded-full">Admin</span>
                    )}
                    {user.is_moderator && !user.is_admin && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-[hsla(var(--bc-primary),0.15)] text-[hsl(var(--bc-primary))] rounded-full">Mod</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-[hsl(var(--bc-text-muted))]">
                    {user.membership_tier && <MembershipBadge tier={user.membership_tier as any} size="sm" />}
                  </div>
                  <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1 line-clamp-1">{user.bio || 'No description yet.'}</p>
                </div>
                <div className="text-sm text-[hsl(var(--bc-text-muted))] hidden sm:block text-right">
                  <span className="text-xs">Last seen</span>
                  <div className="text-xs">{getRelativeTime(user.last_seen_at || null)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-[hsl(var(--bc-border))]">
            <button
              onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: String(page - 1) })}
              disabled={page === 1}
              className="p-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronLeft className="w-5 h-5 text-[hsl(var(--bc-text))]" />
            </button>
            <span className="text-sm text-[hsl(var(--bc-text-muted))]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: String(page + 1) })}
              disabled={page === totalPages}
              className="p-2 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
            >
              <ChevronRight className="w-5 h-5 text-[hsl(var(--bc-text))]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
