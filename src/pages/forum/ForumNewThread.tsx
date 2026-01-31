import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Send } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  slug: string;
  is_admin_only: boolean;
}

export default function ForumNewThread() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { forumUser, isAdmin } = useOutletContext<{ 
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [slug]);

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
        navigate(`/forum/category/${slug}`);
      }
    } else {
      navigate('/forum');
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
      content: content.trim()
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
    navigate(`/forum/thread/${thread.id}`);
  };

  if (!forumUser) {
    navigate('/forum/login');
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        to={`/forum/category/${slug}`}
        className="flex items-center gap-1 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to {category?.name || 'Category'}
      </Link>

      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-6">Create New Thread</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
              Thread Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              to={`/forum/category/${slug}`}
              className="px-4 py-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-6 py-2 rounded-lg transition font-medium"
            >
              <Send className="w-4 h-4" />
              {submitting ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
