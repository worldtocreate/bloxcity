import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Send, Mail } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import UserAvatar from '@/components/forum/UserAvatar';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_admin_only: boolean;
}

interface QuoteData {
  id: string;
  content: string;
  created_at: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
}

export default function ForumNewThread() {
  const { slug, quoteId } = useParams<{ slug: string; quoteId?: string }>();
  const navigate = useNavigate();
  const { forumUser, isAdmin, emailVerified } = useOutletContext<{ 
    forumUser: ForumUser | null;
    isAdmin: boolean;
    emailVerified: boolean | null;
  }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [quote, setQuote] = useState<QuoteData | null>(null);

  useEffect(() => {
    fetchCategory();
    if (quoteId) fetchQuote();
  }, [slug, quoteId]);

  const fetchCategory = async () => {
    const { data } = await supabase
      .from('forum_categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (data) {
      setCategory(data);
      if (data.is_admin_only && !isAdmin) {
        toast.error('You do not have permission to post in this category');
        navigate(`/category/${slug}`);
      }
    } else {
      navigate('/');
    }
  };

  const fetchQuote = async () => {
    if (!quoteId) return;
    const { data } = await supabase
      .from('forum_posts')
      .select('id, content, created_at, author_id')
      .eq('id', quoteId)
      .single();
    
    if (data) {
      const { data: author } = await supabase
        .from('forum_users')
        .select('username, avatar_url')
        .eq('id', data.author_id)
        .single();
      
      setQuote({
        id: data.id,
        content: data.content,
        created_at: data.created_at,
        author: author || { username: 'Unknown', avatar_url: null }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !forumUser || !category) return;

    setSubmitting(true);

    const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
      body: { content: title + ' ' + content }
    });

    if (profanityCheck.data?.hasProfanity) {
      toast.error('Your post contains inappropriate content. Please revise.');
      setSubmitting(false);
      return;
    }

    const { data: thread, error: threadError } = await supabase
      .from('forum_threads')
      .insert({
        category_id: category.id,
        author_id: forumUser.id,
        title: title.trim(),
        last_post_by: forumUser.id
      })
      .select()
      .single();

    if (threadError || !thread) {
      if (threadError?.message.includes('row-level security') || threadError?.code === '42501') {
        toast.error('Please wait 30 seconds between posts.');
      } else {
        toast.error('Failed to create thread');
      }
      setSubmitting(false);
      return;
    }

    const { error: postError } = await supabase.from('forum_posts').insert({
      thread_id: thread.id,
      author_id: forumUser.id,
      content: content.trim(),
      quoted_post_id: quote?.id || null
    });

    if (postError) {
      toast.error('Failed to create post');
      await supabase.from('forum_threads').delete().eq('id', thread.id);
      setSubmitting(false);
      return;
    }

    await supabase.from('forum_users').update({
      post_count: forumUser.post_count + 1
    }).eq('id', forumUser.id);

    toast.success('Thread created!');
    navigate(`/thread/${thread.id}`);
  };

  if (!forumUser) {
    navigate('/login');
    return null;
  }

  if (emailVerified === false) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <Mail className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-amber-800 mb-2">Email Verification Required</h1>
          <p className="text-amber-700">
            You must verify your email address before creating threads. Check the banner above to send a verification email.
          </p>
          <Link
            to={`/category/${slug}`}
            className="inline-block mt-4 text-amber-600 hover:underline"
          >
            ← Back to category
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link to="/" className="text-[hsl(var(--bc-primary))] hover:underline">Forum</Link>
        <ChevronRight className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
        <span className="text-[hsl(var(--bc-text))]">New Thread</span>
      </nav>

      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-[hsl(var(--bc-primary))] text-white px-4 py-3 font-medium">
          Create New Thread in {category?.name}
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quote Preview */}
            {quote && (
              <div className="bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <UserAvatar avatarUrl={quote.author.avatar_url} username={quote.author.username} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                      {new Date(quote.created_at).toLocaleString()}, <span className="text-[hsl(var(--bc-primary))]">{quote.author.username}</span> wrote:
                    </div>
                    <div className="text-[hsl(var(--bc-text))] italic mt-1 line-clamp-3">
                      {quote.content}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Title"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                required
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Body
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post here..."
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                rows={5}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))]/90 disabled:bg-[hsl(var(--bc-text-muted))] text-white px-6 py-3 rounded-lg transition font-medium"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Thread'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
