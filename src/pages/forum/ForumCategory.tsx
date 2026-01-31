import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pin, Lock, MessageSquare, ChevronLeft, Clock, User, Shield } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';

interface Thread {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  last_post_at: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
  last_poster?: {
    username: string;
  };
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  is_admin_only: boolean;
}

export default function ForumCategory() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, forumUser, isAdmin } = useOutletContext<{ 
    user: any; 
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchCategory();
  }, [slug]);

  const fetchCategory = async () => {
    const { data: cat } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (!cat) {
      navigate('/forum');
      return;
    }

    setCategory(cat);

    const { data: threadData } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('category_id', cat.id)
      .order('is_pinned', { ascending: false })
      .order('last_post_at', { ascending: false });

    // Fetch authors for each thread
    if (threadData) {
      const threadsWithAuthors = await Promise.all(
        threadData.map(async (thread) => {
          const { data: author } = await supabase
            .from('forum_users')
            .select('id, username, avatar_url')
            .eq('id', thread.author_id)
            .single();
          
          const { data: lastPoster } = thread.last_post_by 
            ? await supabase.from('forum_users').select('username').eq('id', thread.last_post_by).single()
            : { data: null };

          return { ...thread, author, last_poster: lastPoster };
        })
      );
      setThreads(threadsWithAuthors as unknown as Thread[]);
    }
    setLoading(false);
  };

  const canCreateThread = forumUser && (!category?.is_admin_only || isAdmin);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-800 rounded w-1/3" />
        <div className="h-4 bg-gray-800 rounded w-1/2" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link 
            to="/forum" 
            className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Forums
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {category?.name}
            {category?.is_admin_only && (
              <Shield className="w-5 h-5 text-yellow-400" />
            )}
          </h1>
          <p className="text-gray-400">{category?.description}</p>
        </div>
        {canCreateThread && (
          <Link
            to={`/forum/category/${slug}/new`}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </Link>
        )}
      </div>

      {/* Threads */}
      <div className="space-y-2">
        {threads.length === 0 ? (
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No threads yet. Be the first to create one!</p>
          </div>
        ) : (
          threads.map((thread) => (
            <Link
              key={thread.id}
              to={`/forum/thread/${thread.id}`}
              className="block bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition group"
            >
              <div className="flex items-center gap-4">
                {/* Author Avatar */}
                <div className="hidden sm:block">
                  {thread.author?.avatar_url ? (
                    <img 
                      src={thread.author.avatar_url}
                      alt={thread.author.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                {/* Thread Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {thread.is_pinned && <Pin className="w-4 h-4 text-yellow-400" />}
                    {thread.is_locked && <Lock className="w-4 h-4 text-red-400" />}
                    <h3 className="text-white font-medium group-hover:text-blue-400 transition truncate">
                      {thread.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <span>{thread.author?.username}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(thread.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right hidden sm:block">
                  <div className="text-sm text-gray-400">
                    {thread.reply_count} replies • {thread.view_count} views
                  </div>
                  {thread.last_poster && (
                    <div className="text-xs text-gray-500">
                      Last: {thread.last_poster.username}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
