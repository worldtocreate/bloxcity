import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ForumUser } from '@/hooks/useForumAuth';
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
  author_username: string;
  author_id: string;
  last_poster_username: string | null;
  last_poster_id: string | null;
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

  const isLoggedIn = !!forumUser;

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
      .eq('is_deleted', false)
      .order('is_pinned', { ascending: false })
      .order('last_post_at', { ascending: false });

    if (threadData) {
      const threadsWithAuthors = await Promise.all(
        threadData.map(async (thread) => {
          const { data: author } = await supabase
            .from('forum_users')
            .select('id, username')
            .eq('id', thread.author_id)
            .single();

          const { data: lastPoster } = thread.last_post_by
            ? await supabase
                .from('forum_users')
                .select('id, username')
                .eq('id', thread.last_post_by)
                .single()
            : { data: null };

          return {
            ...thread,
            author_username: author?.username || 'Unknown',
            author_id: author?.id || '',
            last_poster_username: lastPoster?.username || null,
            last_poster_id: lastPoster?.id || null,
          };
        })
      );
      setThreads(threadsWithAuthors as Thread[]);
    }
    setLoading(false);
  };

  const canCreateThread = !!forumUser && (!category?.is_admin_only || isAdmin);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-white border border-[#ccc] rounded w-1/3" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white border border-[#ccc] rounded" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Mobile Buttons */}
      {isLoggedIn && (
        <div className="show-for-small-only text-center mb-4">
          <Link to="/forum/my-threads" className="button button-blue">My Threads</Link>
          <Link to="/forum/search" className="button button-red">Search Forum</Link>
          {canCreateThread && (
            <Link to={`/category/${slug}/new`} className="button button-green">Create</Link>
          )}
        </div>
      )}

      {/* Navigation Row */}
      <div className="grid-x grid-margin-x mb-4">
        <div className="cell small-9 medium-6">
          <div className="forum-navigation">
            <div className="forum-navigation-item">
              <Link to="/forum">Forum</Link>
            </div>
            <div className="forum-navigation-item">
              <Link to="/forum">BLOX City</Link>
            </div>
            <div className="forum-navigation-item">
              <Link to={`/category/${slug}`}>{category?.name}</Link>
            </div>
          </div>
        </div>
        {isLoggedIn && (
          <div className="cell medium-6 text-right hide-for-small-only">
            <div className="forum-auth-navigation">
              <div className="forum-auth-navigation-item">
                <Link to="/forum/my-threads">My Threads</Link>
              </div>
              <div className="forum-auth-navigation-item">
                <Link to="/forum/search">Search Forum</Link>
              </div>
              {canCreateThread && (
                <div className="forum-auth-navigation-item">
                  <Link to={`/category/${slug}/new`}>Create Thread</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Thread List Header */}
      <div className="forum-header forum-post-header">
        <div className="grid-x grid-margin-x">
          <div className="cell medium-8">Post</div>
          <div className="cell medium-1 text-center hide-for-small-only">Replies</div>
          <div className="cell medium-1 text-center hide-for-small-only">Views</div>
          <div className="cell medium-2 text-right hide-for-small-only">Last Post</div>
        </div>
      </div>

      {/* Thread List */}
      <div className="forum-container forum-topic-container">
        {threads.length === 0 ? (
          <div className="cell" style={{ padding: 15 }}>There are no threads in this topic.</div>
        ) : (
          threads.map((thread) => (
            <div key={thread.id} className="forum-thread-item">
              <div>
                {/* Badges */}
                {(thread.is_pinned || thread.is_locked) && (
                  <div className="forum-thread-badges">
                    {thread.is_pinned && (
                      <span className="forum-thread-badge forum-thread-badge-pinned">Pinned</span>
                    )}
                    {thread.is_locked && (
                      <span className="forum-thread-badge forum-thread-badge-locked">Locked</span>
                    )}
                  </div>
                )}
                <Link to={`/thread/${thread.id}`} className="forum-thread-title">
                  {thread.title}
                </Link>
                <div className="forum-thread-meta">
                  by <Link to={`/user/${thread.author_username}`}>{thread.author_username}</Link>,{' '}
                  {getRelativeTime(thread.created_at)}
                </div>
              </div>
              <div className="text-center hide-for-small-only">
                <span className="forum-container-stat">{thread.reply_count}</span>
              </div>
              <div className="text-center hide-for-small-only">
                <span className="forum-container-stat">{thread.view_count}</span>
              </div>
              <div className="text-right hide-for-small-only">
                {thread.last_poster_username ? (
                  <>
                    <Link
                      to={`/user/${thread.last_poster_username}`}
                      className="forum-container-stat forum-container-stat-last-post"
                    >
                      {thread.last_poster_username}
                    </Link>
                    <div className="forum-container-stat-last-poster">
                      {getRelativeTime(thread.last_post_at)}
                    </div>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/user/${thread.author_username}`}
                      className="forum-container-stat forum-container-stat-last-post"
                    >
                      {thread.author_username}
                    </Link>
                    <div className="forum-container-stat-last-poster">
                      {getRelativeTime(thread.created_at)}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
