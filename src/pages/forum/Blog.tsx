import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Calendar, User, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published_at: string;
  author: {
    username: string;
    avatar_url: string | null;
  };
}

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Blog - BLOX City';
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        published_at,
        author:author_id (
          username,
          avatar_url
        )
      `)
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (data) {
      setPosts(data as unknown as BlogPost[]);
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--bc-text))]">Blog</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mt-2">
          Latest news, updates, and announcements from BLOX City
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-8 text-center">
          <p className="text-[hsl(var(--bc-text-muted))]">No blog posts yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <Link
              key={post.id}
              to={`/blog/${post.slug}`}
              className="block bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 hover:border-[hsl(var(--bc-primary))] transition group"
            >
              <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] group-hover:text-[hsl(var(--bc-primary))] transition mb-2">
                {post.title}
              </h2>
              
              <p className="text-[hsl(var(--bc-text-muted))] mb-4 line-clamp-2">
                {post.excerpt || post.content.substring(0, 150)}...
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-[hsl(var(--bc-text-muted))]">
                  <div className="flex items-center gap-2">
                    {post.author?.avatar_url ? (
                      <img 
                        src={post.author.avatar_url} 
                        alt={post.author.username}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5" />
                    )}
                    <span>{post.author?.username}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{format(new Date(post.published_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
                
                <span className="text-[hsl(var(--bc-primary))] flex items-center gap-1 text-sm font-medium">
                  Read more <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
