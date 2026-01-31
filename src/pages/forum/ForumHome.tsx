import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Shield, Play } from 'lucide-react';
import WelcomeDialog from '@/components/forum/WelcomeDialog';
import LeaderboardSidebar from '@/components/forum/LeaderboardSidebar';
import teaserVideo from '@/assets/bloxcity-teaser.mp4';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_admin_only: boolean;
  thread_count?: number;
  reply_count?: number;
  latest_thread?: {
    title: string;
    author: string;
    created_at: string;
  };
}

interface CategoryGroup {
  name: string;
  categories: Category[];
}

interface OutletContext {
  isAdmin: boolean;
  forumUser: unknown;
}

export default function ForumHome() {
  const { isAdmin, forumUser } = useOutletContext<OutletContext>();
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loading, setLoading] = useState(true);

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
      const categoriesWithStats = await Promise.all(
        data.map(async (cat) => {
          const { count: threadCount } = await supabase
            .from('forum_threads')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('is_deleted', false);
          
          const { count: replyCount } = await supabase
            .from('forum_posts')
            .select('*, forum_threads!inner(category_id)')
            .eq('forum_threads.category_id', cat.id)
            .eq('is_deleted', false);

          // Get latest thread
          const { data: latestThread } = await supabase
            .from('forum_threads')
            .select('title, created_at, author:author_id(username)')
            .eq('category_id', cat.id)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          return { 
            ...cat, 
            thread_count: threadCount || 0,
            reply_count: replyCount || 0,
            latest_thread: latestThread ? {
              title: latestThread.title,
              author: (latestThread.author as any)?.username || 'Unknown',
              created_at: latestThread.created_at
            } : undefined
          };
        })
      );

      // Group categories - BLOX City main and Game Development
      const bloxCityCategories = categoriesWithStats.filter(c => 
        !c.slug.includes('building') && !c.slug.includes('scripting')
      );
      const devCategories = categoriesWithStats.filter(c => 
        c.slug.includes('building') || c.slug.includes('scripting')
      );

      const groups: CategoryGroup[] = [
        { name: 'BLOX City', categories: bloxCityCategories },
      ];

      if (devCategories.length > 0) {
        groups.push({ name: 'Game Development', categories: devCategories });
      }

      setCategoryGroups(groups);
    }
    setLoading(false);
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (seconds < 60) return `${seconds} seconds ago`;
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-[hsl(var(--bc-table-header))] rounded-t" />
            <div className="h-32 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-b" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        <WelcomeDialog isLoggedIn={isLoggedIn} />

        {/* Teaser Video */}
        <div className="bg-[hsl(var(--bc-bg-card))] rounded border border-[hsl(var(--bc-border))] overflow-hidden">
          <div className="relative">
            <video 
              className="w-full aspect-video object-cover"
              controls
              preload="metadata"
            >
              <source src={teaserVideo} type="video/mp4" />
            </video>
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 px-2 py-1 rounded text-xs text-white">
              <Play className="w-3 h-3" />
              <span>BLOX City Teaser</span>
            </div>
          </div>
        </div>

        {/* Forum Categories - Classic Table Style */}
        {categoryGroups.map((group) => (
          <div key={group.name} className="overflow-hidden rounded border border-[hsl(var(--bc-border))]">
            {/* Section Header - Teal */}
            <div className="bg-[hsl(var(--bc-table-header))] text-white px-4 py-2.5 flex items-center justify-between text-sm font-medium">
              <span>{group.name}</span>
              <div className="flex gap-8 text-xs">
                <span className="w-16 text-center">Threads</span>
                <span className="w-16 text-center">Replies</span>
                <span className="w-40 text-right hidden md:block">Last Post</span>
              </div>
            </div>

            {/* Category Rows */}
            <div className="divide-y divide-[hsl(var(--bc-border))]">
              {group.categories.map((category, idx) => (
                <div 
                  key={category.id}
                  className={`p-4 ${idx % 2 === 1 ? 'bg-[hsl(var(--bc-table-alt))]' : 'bg-[hsl(var(--bc-bg-card))]'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/category/${category.slug}`}
                        className="text-[hsl(var(--bc-link))] hover:underline font-medium flex items-center gap-2"
                      >
                        {category.is_admin_only && (
                          <Shield className="w-4 h-4 text-[hsl(var(--bc-secondary))]" />
                        )}
                        {category.name}
                      </Link>
                      {category.description && (
                        <p className="text-[hsl(var(--bc-text-muted))] text-xs mt-1">{category.description}</p>
                      )}
                    </div>

                    <div className="flex gap-8 items-center text-sm shrink-0">
                      <span className="w-16 text-center text-[hsl(var(--bc-text))]">
                        {(category.thread_count || 0).toLocaleString()}
                      </span>
                      <span className="w-16 text-center text-[hsl(var(--bc-text))]">
                        {(category.reply_count || 0).toLocaleString()}
                      </span>
                      <div className="w-40 text-right hidden md:block">
                        {category.latest_thread ? (
                          <div className="text-xs">
                            <div className="text-[hsl(var(--bc-link))] truncate hover:underline">
                              {category.latest_thread.title.length > 25 
                                ? category.latest_thread.title.slice(0, 22) + '...'
                                : category.latest_thread.title}
                            </div>
                            <div className="text-[hsl(var(--bc-text-muted))]">
                              by <Link to={`/user/${category.latest_thread.author}`} className="text-[hsl(var(--bc-link))] hover:underline">{category.latest_thread.author}</Link>, {formatTimeAgo(category.latest_thread.created_at)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[hsl(var(--bc-text-muted))] text-xs">No posts yet</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-64 flex-shrink-0 space-y-4">
        <LeaderboardSidebar />
      </div>
    </div>
  );
}
