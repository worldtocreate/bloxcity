import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, Pin, Lock, ChevronRight, Users, Shield } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_admin_only: boolean;
  thread_count?: number;
  post_count?: number;
}

export default function ForumHome() {
  const { isAdmin } = useOutletContext<{ isAdmin: boolean }>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, threads: 0, posts: 0 });

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
      // Fetch thread and post counts for each category
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
          <div key={i} className="h-24 bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{stats.users.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Members</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <MessageSquare className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{stats.threads.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Threads</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center border border-gray-700">
          <MessageSquare className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{stats.posts.toLocaleString()}</div>
          <div className="text-sm text-gray-400">Posts</div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/forum/category/${category.slug}`}
            className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-5 transition group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  category.is_admin_only ? 'bg-yellow-600/20' : 'bg-blue-600/20'
                }`}>
                  {category.is_admin_only ? (
                    <Shield className="w-6 h-6 text-yellow-400" />
                  ) : (
                    <MessageSquare className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition flex items-center gap-2">
                    {category.name}
                    {category.is_admin_only && (
                      <span className="text-xs bg-yellow-600/30 text-yellow-400 px-2 py-0.5 rounded-full">
                        Staff Only
                      </span>
                    )}
                  </h3>
                  <p className="text-gray-400 text-sm">{category.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block">
                  <div className="text-white font-medium">{category.thread_count || 0}</div>
                  <div className="text-gray-500 text-sm">threads</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
