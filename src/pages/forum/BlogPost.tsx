import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPostData {
  id: string;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchPost();
    }
  }, [slug]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        content,
        published_at,
        author:author_id (
          username,
          avatar_url
        )
      `)
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setPost(data as unknown as BlogPostData);
      document.title = `${data.title} - BLOX City Blog`;
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-4xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-4">Post Not Found</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-6">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-[hsl(var(--bc-primary))] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/blog"
        className="inline-flex items-center gap-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] mb-6 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </Link>

      <article className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))] mb-4">
          {post.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-[hsl(var(--bc-text-muted))] mb-8 pb-6 border-b border-[hsl(var(--bc-border))]">
          <div className="flex items-center gap-2">
            {post.author?.avatar_url ? (
              <img 
                src={post.author.avatar_url} 
                alt={post.author.username}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <User className="w-6 h-6" />
            )}
            <span>{post.author?.username}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{format(new Date(post.published_at), 'MMMM d, yyyy')}</span>
          </div>
        </div>

        <div 
          className="prose prose-lg max-w-none text-[hsl(var(--bc-text))]
            prose-headings:text-[hsl(var(--bc-text))]
            prose-p:text-[hsl(var(--bc-text))]
            prose-a:text-[hsl(var(--bc-primary))]
            prose-strong:text-[hsl(var(--bc-text))]
            prose-ul:text-[hsl(var(--bc-text))]
            prose-ol:text-[hsl(var(--bc-text))]
            whitespace-pre-wrap"
        >
          {post.content}
        </div>
      </article>
    </div>
  );
}
