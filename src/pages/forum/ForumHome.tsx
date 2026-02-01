import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, ChevronRight, Users, Shield, Ticket, Search, Play } from 'lucide-react';
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
}

interface OutletContext {
  isAdmin: boolean;
  forumUser: unknown;
}

export default function ForumHome() {
  const { isAdmin, forumUser } = useOutletContext<OutletContext>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0 });

  const isLoggedIn = !!forumUser;

  useEffect(() => {
    fetchCategories();
    fetchStats();
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

  const fetchStats = async () => {
    const [{ count: users }, { count: threads }, { count: posts }] = await Promise.all([
      supabase.from('forum_users').select('*', { count: 'exact', head: true }),
      supabase.from('forum_threads').select('*', { count: 'exact', head: true }),
      supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
    ]);
    setStats({ users: users || 0, threads: threads || 0, posts: posts || 0 });
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
      {/* Main Content */}
      <div className="flex-1 space-y-6 min-w-0">
        {/* Welcome Dialog for non-logged-in users */}
        <WelcomeDialog isLoggedIn={isLoggedIn} />

        {/* Teaser Video */}
        <div className="bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))] overflow-hidden">
          <div className="relative">
            <video 
              className="w-full aspect-video object-cover"
              controls
              poster=""
              preload="metadata"
            >
              <source src={teaserVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute top-3 left-3 flex items-center gap-2 bg-[hsl(var(--bc-bg-dark))]/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Play className="w-4 h-4 text-[hsl(var(--bc-primary))]" />
              <span className="text-sm font-medium text-[hsl(var(--bc-text))]">BLOX City Teaser</span>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
</div>
        {/* Categories */}
        <div className="space-y-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/category/${category.slug}`}
              className="block bg-[hsl(var(--bc-bg-card))] hover:bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] rounded-xl p-5 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    category.is_admin_only ? 'bg-[hsla(var(--bc-accent),0.2)]' : 'bg-[hsla(var(--bc-primary),0.1)]'
                  }`}>
                    {category.is_admin_only ? (
                      <Shield className="w-6 h-6 text-[hsl(var(--bc-accent))]" />
                    ) : (
                      <MessageSquare className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition flex items-center gap-2">
                      {category.name}
                      {category.is_admin_only && (
                        <span className="text-xs bg-[hsla(var(--bc-accent),0.2)] text-[hsl(var(--bc-accent))] px-2 py-0.5 rounded-full">
                          Staff Only
                        </span>
                      )}
                    </h3>
                    <p className="text-[hsl(var(--bc-text-muted))] text-sm">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right hidden sm:block">
                    <div className="text-[hsl(var(--bc-text))] font-medium">{category.thread_count || 0}</div>
                    <div className="text-[hsl(var(--bc-text-muted))] text-sm">threads</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[hsl(var(--bc-text-muted))] group-hover:text-[hsl(var(--bc-primary))] transition" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Username Reservation Section */}
        {isLoggedIn ? (
          <div className="bg-[hsl(var(--bc-bg-card))] rounded-xl p-5 border border-[hsl(var(--bc-border))]">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Username Reservation</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Link
                to="/reserve"
                className="flex items-center gap-4 p-4 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsla(var(--bc-primary),0.1)] border border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] rounded-xl transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsla(var(--bc-primary),0.1)] flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition">Reserve Username</h3>
                  <p className="text-sm text-[hsl(var(--bc-text-muted))]">Secure your username for BLOX City</p>
                </div>
              </Link>
              <Link
                to="/check-status"
                className="flex items-center gap-4 p-4 bg-[hsl(var(--bc-bg-light))] hover:bg-[hsla(var(--bc-green),0.1)] border border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-green))] rounded-xl transition group"
              >
                <div className="w-12 h-12 rounded-xl bg-[hsla(var(--bc-green),0.1)] flex items-center justify-center">
                  <Search className="w-6 h-6 text-[hsl(var(--bc-green))]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-green))] transition">Check Status</h3>
                  <p className="text-sm text-[hsl(var(--bc-text-muted))]">Look up your reservation status</p>
                </div>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[hsl(var(--bc-bg-card))] rounded-xl p-5 border border-[hsl(var(--bc-border))]">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsla(var(--bc-primary),0.1)] flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
                </div>
                <p className="text-[hsl(var(--bc-text))]">
                  Looking to reserve your BLOX City username?{' '}
                  <Link to="/register" className="text-[hsl(var(--bc-primary))] font-medium hover:underline">Sign up</Link>
                  {' '}or{' '}
                  <Link to="/login" className="text-[hsl(var(--bc-primary))] font-medium hover:underline">log in</Link>
                  {' '}to do so.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0 space-y-4">
        <LeaderboardSidebar />
      </div>
    </div>
  );
}