import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  MessageSquare, Shield, Search, ChevronRight, Users, 
  TrendingUp, Clock, Star, Flame, Plus 
} from 'lucide-react';
import UserAvatar from '@/components/forum/UserAvatar';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_admin_only: boolean;
  thread_count?: number;
  post_count?: number;
  latest_thread?: {
    id: string;
    title: string;
    created_at: string;
    author: {
      username: string;
      avatar_url: string | null;
    };
  } | null;
}

interface TopUser {
  id: string;
  serial_id: number;
  username: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  membership_tier: string | null;
  avatar_effect: string | null;
}

interface RecentThread {
  id: string;
  title: string;
  created_at: string;
  reply_count: number;
  author: {
    username: string;
    serial_id: number;
    avatar_url: string | null;
  };
  category: {
    name: string;
    slug: string;
  };
}

interface OutletContext {
  isAdmin: boolean;
  forumUser: any;
}

export default function ForumHome() {
  const navigate = useNavigate();
  const { isAdmin, forumUser } = useOutletContext<OutletContext>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentThreads, setRecentThreads] = useState<RecentThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0 });

  const isLoggedIn = !!forumUser;

  useEffect(() => {
    Promise.all([fetchCategories(), fetchTopUsers(), fetchRecentThreads(), fetchStats()])
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('forum_categories')
      .select('*')
      .order('sort_order');
    
    if (data) {
      const categoriesWithCounts = await Promise.all(
        data.map(async (cat) => {
          const [{ count: threadCount }, { count: postCount }] = await Promise.all([
            supabase.from('forum_threads').select('*', { count: 'exact', head: true }).eq('category_id', cat.id),
            supabase.from('forum_posts').select('*', { count: 'exact', head: true })
              .in('thread_id', (await supabase.from('forum_threads').select('id').eq('category_id', cat.id)).data?.map(t => t.id) || [])
          ]);
          
          // Get latest thread
          const { data: latestThread } = await supabase
            .from('forum_threads')
            .select('id, title, created_at, author:author_id(username, avatar_url)')
            .eq('category_id', cat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          return { 
            ...cat, 
            thread_count: threadCount || 0, 
            post_count: postCount || 0,
            latest_thread: latestThread as any
          };
        })
      );
      setCategories(categoriesWithCounts);
    }
  };

  const fetchTopUsers = async () => {
    const { data } = await supabase
      .from('forum_users_public')
      .select('id, serial_id, username, avatar_url, xp, level, membership_tier, avatar_effect')
      .order('xp', { ascending: false })
      .limit(5);
    
    if (data) setTopUsers(data as TopUser[]);
  };

  const fetchRecentThreads = async () => {
    const { data } = await supabase
      .from('forum_threads')
      .select(`
        id, title, created_at, reply_count,
        author:author_id(username, serial_id, avatar_url),
        category:category_id(name, slug)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (data) setRecentThreads(data as any);
  };

  const fetchStats = async () => {
    const [{ count: users }, { count: threads }, { count: posts }] = await Promise.all([
      supabase.from('forum_users_public').select('*', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ users: users || 0, threads: threads || 0, posts: posts || 0 });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-32 bg-[hsl(var(--bc-bg-card))] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-[hsl(var(--bc-bg-card))] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="space-y-4">
            <div className="h-64 bg-[hsl(var(--bc-bg-card))] rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[hsl(var(--bc-primary))] via-[hsl(var(--bc-primary))]/80 to-[hsl(var(--bc-accent))] p-6 md:p-8">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1.5' cy='1.5' r='1.5' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E\")" }} />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Welcome to the Forums
              </h1>
              <p className="text-white/80 text-sm md:text-base max-w-xl">
                Join the conversation, share your creations, and connect with the BLOX City community.
              </p>
            </div>
            {isLoggedIn && (
              <Link
                to="/new-thread"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-xl font-medium transition-all hover:scale-105 shrink-0"
              >
                <Plus className="w-4 h-4" />
                New Thread
              </Link>
            )}
          </div>
          
          {/* Search */}
          <form onSubmit={handleSearch} className="mt-6 flex gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search threads, posts, users..."
                className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-white text-[hsl(var(--bc-primary))] rounded-xl font-semibold hover:bg-white/90 transition-all"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-primary))] mb-1">
            <Users className="w-4 h-4" />
            <span className="text-2xl font-bold">{stats.users.toLocaleString()}</span>
          </div>
          <p className="text-xs text-[hsl(var(--bc-text-muted))]">Members</p>
        </div>
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-accent))] mb-1">
            <MessageSquare className="w-4 h-4" />
            <span className="text-2xl font-bold">{stats.threads.toLocaleString()}</span>
          </div>
          <p className="text-xs text-[hsl(var(--bc-text-muted))]">Threads</p>
        </div>
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-[hsl(var(--bc-green))] mb-1">
            <Flame className="w-4 h-4" />
            <span className="text-2xl font-bold">{stats.posts.toLocaleString()}</span>
          </div>
          <p className="text-xs text-[hsl(var(--bc-text-muted))]">Posts</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Categories */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
              Categories
            </h2>
          </div>

          <div className="space-y-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="block bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl hover:border-[hsl(var(--bc-primary))]/50 hover:shadow-lg hover:shadow-[hsl(var(--bc-primary))]/5 transition-all group"
              >
                <div className="p-4 flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    category.is_admin_only 
                      ? 'bg-gradient-to-br from-[hsl(var(--bc-accent))]/20 to-[hsl(var(--bc-accent))]/5' 
                      : 'bg-gradient-to-br from-[hsl(var(--bc-primary))]/20 to-[hsl(var(--bc-primary))]/5'
                  }`}>
                    {category.is_admin_only ? (
                      <Shield className="w-6 h-6 text-[hsl(var(--bc-accent))]" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition-colors">
                        {category.name}
                      </h3>
                      {category.is_admin_only && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--bc-accent))]/15 text-[hsl(var(--bc-accent))] font-medium">
                          Staff
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[hsl(var(--bc-text-muted))] line-clamp-1">
                      {category.description}
                    </p>
                    
                    {/* Latest Thread */}
                    {category.latest_thread && (
                      <div className="mt-3 pt-3 border-t border-[hsl(var(--bc-border))] flex items-center gap-2 text-xs">
                        <Clock className="w-3 h-3 text-[hsl(var(--bc-text-muted))]" />
                        <span className="text-[hsl(var(--bc-text-muted))]">Latest:</span>
                        <span className="text-[hsl(var(--bc-text))] truncate flex-1">
                          {category.latest_thread.title}
                        </span>
                        <span className="text-[hsl(var(--bc-text-muted))] shrink-0">
                          {formatTimeAgo(category.latest_thread.created_at)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-lg font-bold text-[hsl(var(--bc-text))]">
                      {category.thread_count}
                    </div>
                    <div className="text-xs text-[hsl(var(--bc-text-muted))]">threads</div>
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-[hsl(var(--bc-text-muted))] group-hover:text-[hsl(var(--bc-primary))] group-hover:translate-x-1 transition-all shrink-0 self-center" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Top Members */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-2">
              <Star className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
              <h3 className="font-semibold text-[hsl(var(--bc-text))]">Top Members</h3>
            </div>
            <div className="p-3 space-y-1">
              {topUsers.map((user, index) => (
                <Link
                  key={user.id}
                  to={`/${user.serial_id}/${user.username}/profile`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition group"
                >
                  <span className={`w-5 text-center font-bold text-sm ${
                    index === 0 ? 'text-[hsl(var(--bc-accent))]' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-amber-600' :
                    'text-[hsl(var(--bc-text-muted))]'
                  }`}>
                    {index + 1}
                  </span>
                  <UserAvatar
                    avatarUrl={user.avatar_url}
                    username={user.username}
                    size="sm"
                    effect={user.avatar_effect}
                    membershipTier={user.membership_tier as any}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))] transition block">
                      {user.username}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text-muted))]">
                    Lv.{user.level}
                  </span>
                </Link>
              ))}
            </div>
            <div className="p-3 pt-0">
              <Link
                to="/forum/leaderboard"
                className="block w-full py-2 text-center text-sm text-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary))]/10 rounded-lg transition"
              >
                View Full Leaderboard
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[hsl(var(--bc-border))] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--bc-green))]" />
              <h3 className="font-semibold text-[hsl(var(--bc-text))]">Recent Threads</h3>
            </div>
            <div className="divide-y divide-[hsl(var(--bc-border))]">
              {recentThreads.map((thread) => (
                <Link
                  key={thread.id}
                  to={`/thread/${thread.id}`}
                  className="block p-3 hover:bg-[hsl(var(--bc-bg-light))] transition group"
                >
                  <div className="text-sm font-medium text-[hsl(var(--bc-text))] line-clamp-1 group-hover:text-[hsl(var(--bc-primary))] transition">
                    {thread.title}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[hsl(var(--bc-text-muted))]">
                    <span>by {thread.author?.username}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(thread.created_at)}</span>
                    {thread.reply_count > 0 && (
                      <>
                        <span>•</span>
                        <span>{thread.reply_count} replies</span>
                      </>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
