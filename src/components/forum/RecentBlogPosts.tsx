import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Newspaper, ChevronRight } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published_at: string;
}

export default function RecentBlogPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, content, published_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .limit(3);

    if (data) {
      setPosts(data);
    }
  };

  if (posts.length === 0) return null;

  const truncate = (text: string, maxLength: number = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
          Recent Blog Posts
        </h3>
        <Link to="/blog" className="text-sm text-[hsl(var(--bc-primary))] hover:underline flex items-center gap-1">
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            to={`/blog/${post.slug}`}
            className="block p-3 rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
          >
            <h4 className="font-medium text-[hsl(var(--bc-text))] text-sm mb-1">{post.title}</h4>
            <p className="text-xs text-[hsl(var(--bc-text-muted))]">
              {truncate(post.excerpt || post.content, 50)}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}