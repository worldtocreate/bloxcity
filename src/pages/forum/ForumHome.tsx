import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Shield, Search, ChevronRight } from 'lucide-react';
import LeaderboardSidebar from '@/components/forum/LeaderboardSidebar';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_admin_only: boolean;
  thread_count?: number;
}

interface OutletContext {
  isAdmin: boolean;
  forumUser: unknown;
}

export default function ForumHome() {
  const navigate = useNavigate();
  const { isAdmin, forumUser } = useOutletContext<OutletContext>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const isLoggedIn = !!forumUser;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('forum_categories')
      .select('*')
      .order('sort_order');
    
    if (data) {
      const categoriesWithCounts = await Promise.all(
        data.map(async (cat) => {
          const { count: threadCount } = await supabase
            .from('forum_threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id);
          
          return { ...cat, thread_count: threadCount || 0 };
        })
      );
      setCategories(categoriesWithCounts);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/forum/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Sidebar - Leaderboard */}
      <div className="hidden md:block w-64 flex-shrink-0">
        <LeaderboardSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Header with Search */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))]">Forum</h1>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Posts..."
                className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))] text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))]/90 text-white rounded-lg text-sm font-medium transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className={`flex items-center gap-4 p-4 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition group border-l-4 ${
                category.is_admin_only 
                  ? 'border-l-[hsl(var(--bc-accent))]' 
                  : 'border-l-[hsl(var(--bc-primary))]'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                category.is_admin_only ? 'bg-[hsla(var(--bc-accent),0.1)]' : 'bg-[hsla(var(--bc-primary),0.1)]'
              }`}>
                {category.is_admin_only ? (
                  <Shield className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[hsl(var(--bc-primary))] group-hover:underline">
                  {category.name}
                  {category.is_admin_only && (
                    <span className="ml-2 text-xs bg-[hsla(var(--bc-accent),0.15)] text-[hsl(var(--bc-accent))] px-2 py-0.5 rounded-full">
                      Staff Only
                    </span>
                  )}
                </div>
                <div className="text-sm text-[hsl(var(--bc-text-muted))]">{category.description}</div>
              </div>
              <ChevronRight className="w-5 h-5 text-[hsl(var(--bc-text-muted))] group-hover:text-[hsl(var(--bc-primary))] transition" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
