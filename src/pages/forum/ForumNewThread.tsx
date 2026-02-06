import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
  const { forumUser, isAdmin, emailVerified } = useOutletContext<{ 
    forumUser: ForumUser | null;
    isAdmin: boolean;
    emailVerified: boolean | null;
  }>();

  const [category, setCategory] = useState<Category | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = !!forumUser;

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
        navigate(`/category/${slug}`);
      }
    } else {
      navigate('/forum');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !forumUser || !category) return;

    setSubmitting(true);

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

    const { error: postError } = await supabase.from('forum_posts').insert({
      thread_id: thread.id,
      author_id: forumUser.id,
      content: content.trim(),
    });

    if (postError) {
      toast.error('Failed to create post');
      await supabase.from('forum_threads').delete().eq('id', thread.id);
      setSubmitting(false);
      return;
    }

    toast.success('Thread created!');
    navigate(`/thread/${thread.id}`);
  };

  if (!forumUser) {
    navigate('/login');
    return null;
  }

  return (
    <div>
      {/* Mobile Buttons */}
      {isLoggedIn && (
        <div className="show-for-small-only text-center mb-4">
          <Link to="/forum/my-threads" className="button button-blue">My Threads</Link>
          <Link to="/forum/search" className="button button-red">Search Forum</Link>
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
        <div className="cell medium-6 text-right hide-for-small-only">
          <div className="forum-auth-navigation">
            <div className="forum-auth-navigation-item">
              <Link to="/forum/my-threads">My Threads</Link>
            </div>
            <div className="forum-auth-navigation-item">
              <Link to="/forum/search">Search Forum</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="forum-header forum-thread-header">
        Create Thread in "{category?.name}"
      </div>

      {/* Form */}
      <div className="container forum-container">
        <form onSubmit={handleSubmit}>
          <input 
            className="form-input" 
            type="text" 
            name="title" 
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea 
            className="form-input" 
            name="body" 
            placeholder="Write your post here." 
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button className="forum-button" type="submit" disabled={submitting}>
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
