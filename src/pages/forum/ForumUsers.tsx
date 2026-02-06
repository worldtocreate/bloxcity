import { useState, useEffect } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import UserAvatar from '@/components/forum/UserAvatar';
import { VerificationBadge } from '@/components/forum/VerifiedBadge';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { ForumUser } from '@/hooks/useForumAuth';
import { getRelativeTime } from '@/lib/timeUtils';

function StaffBadge({ role, size = 'sm' }: { role: string | null | undefined; size?: 'sm' | 'md' }) {
  if (!role) return null;
  const normalized = role.toLowerCase();
  const label = normalized === 'owner' ? 'Owner' : normalized === 'admin' ? 'Admin' : 'Mod';
  const sizeClasses = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1';
  const colorClasses =
    normalized === 'moderator'
      ? 'bg-[hsla(var(--bc-primary),0.15)] text-[hsl(var(--bc-primary))]'
      : 'bg-[hsla(var(--bc-error),0.15)] text-[hsl(var(--bc-error))]';

  return <span className={`inline-flex items-center font-semibold rounded ${sizeClasses} ${colorClasses}`}>{label}</span>;
}

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
  staff_role?: string | null; // 'owner' | 'admin' | 'moderator' | null
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
      // Resolve staff roles via secure RPC (avoids direct admin_accounts access)
      const roleEntries = await Promise.all(
        usersData.map(async (u) => {
          const { data } = await supabase.rpc('get_staff_role', { _user_id: u.user_id });
          return [u.id, (data as string | null) ?? null] as const;
        })
      );
      const roleMap = new Map(roleEntries);

      const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;
      const now = Date.now();
      const isOnline = (lastSeen: string | null | undefined) => {
        if (!lastSeen) return false;
        const t = new Date(lastSeen).getTime();
        return Number.isFinite(t) && now - t <= ONLINE_THRESHOLD_MS;
      };

      const usersWithRoles = usersData.map((user) => {
        const staffRole = roleMap.get(user.id);
        return {
          ...user,
          staff_role: staffRole ?? null,
        };
      });

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
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h1 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">All Players</h1>
        <span className="text-[hsl(var(--bc-text-muted))] font-semibold">
          {totalCount.toLocaleString()} Total Users
        </span>
      </div>

      {/* Search */}
      <div className="bc-card mb-4">
        <div className="p-4">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))]"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Users List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="bc-card p-8 text-center text-[hsl(var(--bc-text-muted))]">
          No users have been found.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => {
            const isOnline = user.last_seen_at && 
              (Date.now() - new Date(user.last_seen_at).getTime() <= 3 * 60 * 1000);
            
            return (
              <Link
                key={user.id}
                to={`/${user.serial_id}/${user.username}/profile`}
                className="bc-card block hover:border-[hsl(var(--bc-primary))] transition"
              >
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <UserAvatar
                        avatarUrl={user.avatar_url}
                        username={user.username}
                        size="lg"
                        effect={user.avatar_effect}
                        membershipTier={user.membership_tier as any}
                      />
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-[hsl(var(--bc-text))] truncate">
                          {user.username}
                        </span>
                        <VerificationBadge size="sm" forumUserId={user.id} isVerified={user.is_verified} />
                        <StaffBadge role={user.staff_role} size="sm" />
                      </div>
                      <div className="text-xs text-[hsl(var(--bc-text-muted))] mb-1">
                        <span className="italic">@</span>{user.username}
                      </div>
                      {user.membership_tier && (
                        <div className="mb-1">
                          <MembershipBadge tier={user.membership_tier as any} size="sm" />
                        </div>
                      )}
                      <p className="text-xs text-[hsl(var(--bc-text-muted))] line-clamp-1">
                        {user.bio || ''}
                      </p>
                    </div>

                    {/* Last Seen */}
                    <div className="hidden sm:block text-right flex-shrink-0">
                      <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                        Last seen {getRelativeTime(user.last_seen_at || null)}
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
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: String(page - 1) })}
            disabled={page === 1}
            className="p-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-[hsl(var(--bc-text))]" />
          </button>
          <span className="text-sm text-[hsl(var(--bc-text-muted))] px-4">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setSearchParams({ q: searchParams.get('q') || '', page: String(page + 1) })}
            disabled={page === totalPages}
            className="p-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] hover:bg-[hsl(var(--bc-bg-light))] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-[hsl(var(--bc-text))]" />
          </button>
        </div>
      )}
    </div>
  );
}
