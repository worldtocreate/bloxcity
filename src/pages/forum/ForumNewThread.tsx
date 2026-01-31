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
      // Check permissions
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

    // Check profanity
    const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
      body: { content: title + ' ' + content }
    });

    if (profanityCheck.data?.hasProfanity) {
      toast.error('Your post contains inappropriate content. Please revise.');
      setSubmitting(false);
      return;
    }

    // Create thread
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
      toast.error('Failed to create thread');
      setSubmitting(false);
      return;
    }

    // Create first post
    const { error: postError } = await supabase.from('forum_posts').insert({
      thread_id: thread.id,
      author_id: forumUser.id,
      content: content.trim()
    });

    if (postError) {
      toast.error('Failed to create post');
      // Rollback thread
      await supabase.from('forum_threads').delete().eq('id', thread.id);
      setSubmitting(false);
      return;
    }

    // Update user post count
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
        className="flex items-center gap-1 text-gray-400 hover:text-white transition mb-4"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to {category?.name || 'Category'}
      </Link>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Thread</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Thread Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post content..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <Link
              to={`/forum/category/${slug}`}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !content.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg transition font-medium"
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
