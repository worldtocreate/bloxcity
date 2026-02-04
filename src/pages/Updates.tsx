import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Megaphone, 
  Calendar, 
  Tag, 
  ArrowLeft, 
  Sparkles, 
  Bug, 
  Rocket, 
  Shield, 
  Zap,
  MessageSquare,
  Star
} from 'lucide-react';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';

interface SiteUpdate {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
}

const categoryConfig: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  feature: { icon: Sparkles, color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  bugfix: { icon: Bug, color: 'text-red-500', bgColor: 'bg-red-500/10' },
  improvement: { icon: Zap, color: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  security: { icon: Shield, color: 'text-green-500', bgColor: 'bg-green-500/10' },
  announcement: { icon: Megaphone, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  launch: { icon: Rocket, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  community: { icon: MessageSquare, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10' },
  general: { icon: Star, color: 'text-gray-500', bgColor: 'bg-gray-500/10' },
};

export default function Updates() {
  const [updates, setUpdates] = useState<SiteUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchUpdates();
  }, []);

  const fetchUpdates = async () => {
    const { data, error } = await supabase
      .from('site_updates')
      .select('id, title, content, category, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUpdates(data);
    }
    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredUpdates = selectedCategory
    ? updates.filter(u => u.category === selectedCategory)
    : updates;

  const categories = [...new Set(updates.map(u => u.category))];

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      {/* Header */}
      <header className="bc-card sticky top-0 z-50 border-t-0 border-x-0 rounded-none">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-xl" />
            <span className="text-xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>
              BLOX City
            </span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-2 text-sm transition hover:opacity-80"
            style={{ color: 'hsl(var(--bc-text-muted))' }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12 relative overflow-hidden rounded-2xl p-8 bc-card">
          <div className="relative">
            <div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
              style={{ 
                background: 'hsla(var(--bc-primary), 0.1)', 
                color: 'hsl(var(--bc-primary))' 
              }}
            >
              <Megaphone className="w-4 h-4" />
              Latest Updates
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: 'hsl(var(--bc-text))' }}>
              What's New at BLOX City
            </h1>
            <p className="text-lg" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              Stay up to date with the latest features, improvements, and announcements
            </p>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`bc-btn ${selectedCategory === null ? 'bc-btn-info' : 'bc-btn-secondary'} bc-btn-sm`}
            >
              All Updates
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`bc-btn ${selectedCategory === cat ? 'bc-btn-info' : 'bc-btn-secondary'} bc-btn-sm capitalize`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Updates List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bc-card animate-pulse">
                <div className="bc-card-body">
                  <div className="h-6 w-1/3 rounded" style={{ background: 'hsl(var(--bc-section-border))' }} />
                  <div className="h-4 w-full mt-4 rounded" style={{ background: 'hsl(var(--bc-section-border))' }} />
                  <div className="h-4 w-2/3 mt-2 rounded" style={{ background: 'hsl(var(--bc-section-border))' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="bc-card text-center py-16">
            <div className="bc-card-body">
              <Megaphone className="w-12 h-12 mx-auto mb-4" style={{ color: 'hsl(var(--bc-text-muted))' }} />
              <h3 className="text-lg font-medium" style={{ color: 'hsl(var(--bc-text))' }}>
                No updates yet
              </h3>
              <p className="mt-1" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                Check back soon for the latest news and updates!
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div 
              className="absolute left-6 top-0 bottom-0 w-0.5"
              style={{ background: 'hsl(var(--bc-section-border))' }}
            />
            
            <div className="space-y-6">
              {filteredUpdates.map((update) => {
                const config = categoryConfig[update.category] || categoryConfig.general;
                const Icon = config.icon;
                
                return (
                  <div key={update.id} className="relative pl-16">
                    {/* Timeline dot */}
                    <div 
                      className="absolute left-4 w-5 h-5 rounded-full border-4"
                      style={{ 
                        borderColor: 'hsl(var(--bc-body-bg))', 
                        background: 'hsl(var(--bc-primary))' 
                      }}
                    />
                    
                    <article className="bc-card overflow-hidden">
                      {/* Header */}
                      <div className="bc-card-header">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>
                                {update.title}
                              </h2>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize ${config.bgColor} ${config.color}`}>
                                  <Tag className="w-3 h-3" />
                                  {update.category}
                                </span>
                                <span className="flex items-center gap-1 text-xs" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(update.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="bc-card-body pt-0">
                        <p className="whitespace-pre-wrap" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                          {update.content}
                        </p>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8" style={{ borderTop: '1px solid hsl(var(--bc-section-border))' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
            © 2026 BLOX City, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
