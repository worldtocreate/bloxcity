import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pin, Lock, MessageSquare, ChevronRight, User, Shield } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import UserAvatar from '@/components/forum/UserAvatar';
import { getRelativeTime } from '@/lib/timeUtils';

interface Thread {
  id: string;
  title: string;
  is_pinned: boolean;
  is_locked: boolean;
  is_deleted?: boolean;
  view_count: number;
  reply_count: number;
  created_at: string;
  last_post_at: string;
  author: {
    id: string;
    username: string;
    avatar_url: string | null;
    is_verified: boolean;
    is_staff?: boolean;
  };
  last_poster?: {
    username: string;
    is_staff?: boolean;
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
      navigate('/');
      return;
    }

    setCategory(cat);

    const { data: threadData } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('category_id', cat.id)
     .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('last_post_at', { ascending: false });

    if (threadData) {
      const threadsWithAuthors = await Promise.all(
        threadData.map(async (thread) => {
          const { data: author } = await supabase
            .from('forum_users')
            .select('id, username, avatar_url, is_verified, user_id')
            .eq('id', thread.author_id)
            .single();
          
          // Check if author is staff via admin_accounts
          let isStaff = false;
          if (author?.id) {
            const { data: adminAccount } = await supabase
              .from('admin_accounts')
              .select('staff_role')
              .eq('forum_user_id', author.id)
              .eq('is_active', true)
              .maybeSingle();
            isStaff = !!adminAccount;
          }

          const { data: lastPoster } = thread.last_post_by 
            ? await supabase.from('forum_users').select('id, username, user_id').eq('id', thread.last_post_by).single()
            : { data: null };

          let lastPosterIsStaff = false;
          if (lastPoster?.id) {
            const { data: adminAccount } = await supabase
              .from('admin_accounts')
              .select('staff_role')
              .eq('forum_user_id', lastPoster.id)
              .eq('is_active', true)
              .maybeSingle();
            lastPosterIsStaff = !!adminAccount;
          }

          return { 
            ...thread, 
            author: { ...author, is_staff: isStaff }, 
            last_poster: lastPoster ? { ...lastPoster, is_staff: lastPosterIsStaff } : null 
          };
        })
      );
      setThreads(threadsWithAuthors as unknown as Thread[]);
    }
    setLoading(false);
  };

  const canCreateThread = !!forumUser && (!category?.is_admin_only || isAdmin);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[hsl(var(--bc-bg-card))] rounded w-1/3 border border-[hsl(var(--bc-border))]" />
        <div className="h-4 bg-[hsl(var(--bc-bg-card))] rounded w-1/2 border border-[hsl(var(--bc-border))]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))]">Forum</h1>
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link to="/" className="text-[hsl(var(--bc-primary))] hover:underline">Forum</Link>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
        <span className="text-[hsl(var(--bc-text))]">{category?.name}</span>
      </nav>

      {/* New Thread Button */}
      <div className="flex justify-end">
        {canCreateThread ? (
          <Link
            to={`/category/${slug}/new`}
            className="flex items-center gap-2 bg-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))]/90 text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            New Thread
          </Link>
        ) : user ? (
          <Link
            to="/register"
            className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-4 py-2 rounded-lg transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Create forum profile
          </Link>
        ) : null}
      </div>

      {/* Threads Table */}
      {threads.length === 0 ? (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-12 text-center">
          <MessageSquare className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-4" />
          <p className="text-[hsl(var(--bc-text-muted))]">
            There are no threads in this topic. Maybe{' '}
            <Link to={`/category/${slug}/new`} className="text-[hsl(var(--bc-primary))] hover:underline">
              create one?
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="bg-[hsl(var(--bc-primary))] text-white px-4 py-3 hidden md:grid md:grid-cols-12 gap-4 text-sm font-medium">
            <div className="col-span-8">Post</div>
            <div className="col-span-2 text-center">Replies</div>
            <div className="col-span-2 text-center">Last Reply</div>
          </div>

          {/* Threads */}
          <div className="divide-y divide-[hsl(var(--bc-border))]">
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/thread/${thread.id}`}
                className={`block px-4 py-4 hover:bg-[hsl(var(--bc-bg-light))] transition ${thread.is_deleted ? 'opacity-50' : ''}`}
              >
                <div className="grid md:grid-cols-12 gap-4 items-center">
                  {/* Post Info */}
                  <div className="md:col-span-8 flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <UserAvatar 
                        avatarUrl={thread.author?.avatar_url} 
                        username={thread.author?.username || ''} 
                        size="md" 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {thread.is_pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-[hsl(var(--bc-accent))] text-white rounded">
                            <Pin className="w-3 h-3" /> Pinned
                          </span>
                        )}
                        {thread.is_locked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold bg-black text-white rounded">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[hsl(var(--bc-text))] hover:text-[hsl(var(--bc-primary))] transition truncate text-lg">
                        {thread.title}
                      </h3>
                      <div className="text-sm text-[hsl(var(--bc-text-muted))] mt-1">
                        <span className="hidden sm:inline">Posted by </span>
                        <span className={thread.author?.is_staff ? 'text-[hsl(var(--bc-accent))]' : ''}>
                          {thread.author?.username}
                        </span>
                        <span> - {getRelativeTime(thread.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  <div className="md:col-span-2 text-center hidden md:block">
                    <span className="text-[hsl(var(--bc-text))]">{thread.reply_count.toLocaleString()}</span>
                  </div>

                  {/* Last Reply */}
                  <div className="md:col-span-2 text-center hidden md:block">
                    {thread.last_poster ? (
                      <div>
                        <span className={thread.last_poster.is_staff ? 'text-[hsl(var(--bc-accent))]' : 'text-[hsl(var(--bc-text))]'}>
                          {thread.last_poster.username}
                        </span>
                        <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {getRelativeTime(thread.last_post_at)}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <span className={thread.author?.is_staff ? 'text-[hsl(var(--bc-accent))]' : 'text-[hsl(var(--bc-text))]'}>
                          {thread.author?.username}
                        </span>
                        <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {getRelativeTime(thread.created_at)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
