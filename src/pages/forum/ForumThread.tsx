import { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, User, Shield, Quote, Send, Lock, Clock, Edit2 } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';

interface Post {
  id: string;
  content: string;
  created_at: string;
  is_edited: boolean;
  edited_at: string | null;
  quoted_post_id: string | null;
  quoted_post?: {
    id: string;
    content: string;
    author?: { username: string };
  };
  author: {
    id: string;
    user_id: string;
    username: string;
    avatar_url: string | null;
    signature: string | null;
    post_count: number;
  };
}

interface Thread {
  id: string;
  title: string;
  is_locked: boolean;
  view_count: number;
  category: {
    name: string;
    slug: string;
  };
}

export default function ForumThread() {
  const { threadId } = useParams<{ threadId: string }>();
  const { user, forumUser, isAdmin } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();

  const [thread, setThread] = useState<Thread | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [quotedPost, setQuotedPost] = useState<Post | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (threadId) {
      fetchThread();
      incrementViewCount();
      if (forumUser) fetchBlockedUsers();
    }
  }, [threadId, forumUser]);

  const fetchThread = async () => {
    const { data: threadData } = await supabase
      .from('forum_threads')
      .select('*')
      .eq('id', threadId)
      .single();

    if (threadData) {
      const { data: categoryData } = await supabase
        .from('forum_categories')
        .select('name, slug')
        .eq('id', threadData.category_id)
        .single();

      setThread({ 
        ...threadData, 
        category: categoryData || { name: 'Unknown', slug: '' }
      } as Thread);
      await fetchPosts();
    }
    setLoading(false);
  };

  const fetchPosts = async () => {
    const { data: postsData } = await supabase
      .from('forum_posts')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at');

    if (postsData) {
      const postsWithAuthors = await Promise.all(
        postsData.map(async (post) => {
          const { data: author } = await supabase
            .from('forum_users')
            .select('id, user_id, username, avatar_url, signature, post_count')
            .eq('id', post.author_id)
            .single();
          
          let quotedPost = undefined;
          if (post.quoted_post_id) {
            const { data: qp } = await supabase
              .from('forum_posts')
              .select('id, content, author_id')
              .eq('id', post.quoted_post_id)
              .single();
            if (qp) {
              const { data: qpAuthor } = await supabase
                .from('forum_users')
                .select('username')
                .eq('id', qp.author_id)
                .single();
              quotedPost = { ...qp, author: qpAuthor };
            }
          }

          return { ...post, author, quoted_post: quotedPost };
        })
      );
      setPosts(postsWithAuthors as unknown as Post[]);
    }
  };

  const fetchBlockedUsers = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_blocked_users')
      .select('blocked_id')
      .eq('blocker_id', forumUser.id);
    setBlockedUsers((data || []).map(b => b.blocked_id));
  };

  const incrementViewCount = async () => {
    try {
      const { data: currentThread } = await supabase
        .from('forum_threads')
        .select('view_count')
        .eq('id', threadId)
        .single();
      
      if (currentThread) {
        await supabase
          .from('forum_threads')
          .update({ view_count: (currentThread.view_count || 0) + 1 })
          .eq('id', threadId);
      }
    } catch (e) {
      // Ignore errors
    }
  };

  const handleQuote = (post: Post) => {
    setQuotedPost(post);
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !forumUser || thread?.is_locked) return;

    setSubmitting(true);
    
    const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
      body: { content: replyContent }
    });

    if (profanityCheck.data?.hasProfanity) {
      toast.error('Your post contains inappropriate content. Please revise.');
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from('forum_posts').insert({
      thread_id: threadId,
      author_id: forumUser.id,
      content: replyContent,
      quoted_post_id: quotedPost?.id || null
    });

    if (error) {
      toast.error('Failed to post reply');
    } else {
      toast.success('Reply posted!');
      setReplyContent('');
      setQuotedPost(null);
      fetchPosts();

      await supabase.from('forum_threads').update({
        reply_count: posts.length + 1,
        last_post_at: new Date().toISOString(),
        last_post_by: forumUser.id
      }).eq('id', threadId);

      await supabase.from('forum_users').update({
        post_count: forumUser.post_count + 1
      }).eq('id', forumUser.id);
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[hsl(var(--bc-bg-card))] rounded w-1/2 border border-[hsl(var(--bc-border))]" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[hsl(var(--bc-bg-card))] rounded-xl border border-[hsl(var(--bc-border))]" />
        ))}
      </div>
    );
  }

  if (!thread) {
    return <div className="text-center text-[hsl(var(--bc-text-muted))]">Thread not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          to={`/forum/category/${thread.category.slug}`}
          className="flex items-center gap-1 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition mb-2"
        >
          <ChevronLeft className="w-4 h-4" />
          {thread.category.name}
        </Link>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-2">
          {thread.title}
          {thread.is_locked && <Lock className="w-5 h-5 text-[hsl(var(--bc-secondary))]" />}
        </h1>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post) => {
          const isBlocked = blockedUsers.includes(post.author.id);
          
          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={`bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden ${
                isBlocked ? 'opacity-50' : ''
              }`}
            >
              {isBlocked && (
                <div className="bg-[hsl(var(--bc-bg-light))] px-4 py-2 text-sm text-[hsl(var(--bc-text-muted))] border-b border-[hsl(var(--bc-border))]">
                  This user is blocked. Content hidden.
                </div>
              )}
              
              {!isBlocked && (
                <div className="flex flex-col sm:flex-row">
                  {/* Author Sidebar */}
                  <div className="sm:w-48 p-4 bg-[hsl(var(--bc-bg-light))] border-b sm:border-b-0 sm:border-r border-[hsl(var(--bc-border))]">
                    <div className="flex sm:flex-col items-center sm:items-start gap-3">
                      {post.author.avatar_url ? (
                        <img
                          src={post.author.avatar_url}
                          alt={post.author.username}
                          className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <User className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[hsl(var(--bc-text))] flex items-center gap-1">
                          {post.author.username}
                          <AdminBadge userId={post.author?.user_id || ''} />
                        </div>
                        <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                          {post.author.post_count} posts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-center justify-between mb-3 text-xs text-[hsl(var(--bc-text-muted))]">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {new Date(post.created_at).toLocaleString()}
                        {post.is_edited && (
                          <span className="flex items-center gap-1">
                            <Edit2 className="w-3 h-3" />
                            edited
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleQuote(post)}
                        className="flex items-center gap-1 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition"
                      >
                        <Quote className="w-4 h-4" />
                        Quote
                      </button>
                    </div>

                    {/* Quoted Post */}
                    {post.quoted_post && (
                      <div className="bg-[hsl(var(--bc-bg-light))] border-l-4 border-[hsl(var(--bc-primary))] p-3 mb-3 rounded">
                        <div className="text-xs text-[hsl(var(--bc-text-muted))] mb-1">
                          Originally posted by {(post.quoted_post as any).author?.username}:
                        </div>
                        <div className="text-[hsl(var(--bc-text))] text-sm line-clamp-3">
                          {post.quoted_post.content}
                        </div>
                      </div>
                    )}

                    <div className="text-[hsl(var(--bc-text))] whitespace-pre-wrap">{post.content}</div>

                    {/* Signature */}
                    {post.author.signature && (
                      <div className="mt-4 pt-4 border-t border-[hsl(var(--bc-border))]">
                        <div className="text-sm text-[hsl(var(--bc-text-muted))] italic">{post.author.signature}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Reply Form */}
      {forumUser && !thread.is_locked ? (
        <form onSubmit={handleSubmitReply} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <h3 className="text-lg font-medium text-[hsl(var(--bc-text))] mb-3">Reply to this thread</h3>
          
          {quotedPost && (
            <div className="bg-[hsl(var(--bc-bg-light))] border-l-4 border-[hsl(var(--bc-primary))] p-3 mb-3 rounded flex items-start justify-between">
              <div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))] mb-1">
                  Quoting {quotedPost.author.username}:
                </div>
                <div className="text-[hsl(var(--bc-text))] text-sm line-clamp-2">
                  {quotedPost.content}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuotedPost(null)}
                className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]"
              >
                ×
              </button>
            </div>
          )}

          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write your reply..."
            className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
            rows={4}
            required
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition font-medium"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      ) : thread.is_locked ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
          <Lock className="w-6 h-6 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">This thread is locked and cannot receive new replies.</p>
        </div>
      ) : (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 text-center">
          <p className="text-[hsl(var(--bc-text-muted))]">
            <Link to="/forum/login" className="text-[hsl(var(--bc-primary))] hover:underline">Login</Link>
            {' '}or{' '}
            <Link to="/forum/register" className="text-[hsl(var(--bc-primary))] hover:underline">register</Link>
            {' '}to reply.
          </p>
        </div>
      )}
    </div>
  );
}

function AdminBadge({ userId }: { userId: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.rpc('has_role', { _user_id: userId, _role: 'admin' })
      .then(({ data }) => setIsAdmin(data === true));
  }, [userId]);

  if (!isAdmin) return null;
  return <span title="Administrator"><Shield className="w-4 h-4 text-[hsl(var(--bc-accent))]" /></span>;
}
