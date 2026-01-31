import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useTheme } from '@/contexts/ThemeContext';
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
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';

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
  const { theme } = useTheme();
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
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[hsl(var(--bc-bg))]' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-40 ${theme === 'dark' ? 'bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src={bloxcityLogo} alt="BLOX City" className="w-10 h-10 rounded-xl" />
            <span className={`text-xl font-bold ${theme === 'dark' ? 'text-[hsl(var(--bc-text))]' : 'text-gray-900'}`}>
              BLOX City
            </span>
          </Link>
          <Link
            to="/"
            className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]' : 'text-gray-500 hover:text-gray-700'} transition`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Forum
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className={`text-center mb-12 relative overflow-hidden rounded-2xl p-8 ${theme === 'dark' ? 'bg-gradient-to-br from-[hsl(var(--bc-primary))/20] via-[hsl(var(--bc-bg-card))] to-[hsl(var(--bc-accent))/20]' : 'bg-gradient-to-br from-orange-100 via-white to-blue-100'}`}>
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${theme === 'dark' ? 'bg-[hsl(var(--bc-primary))/20] text-[hsl(var(--bc-primary))]' : 'bg-orange-100 text-orange-600'}`}>
              <Megaphone className="w-4 h-4" />
              Latest Updates
            </div>
            <h1 className={`text-4xl font-bold mb-3 ${theme === 'dark' ? 'text-[hsl(var(--bc-text))]' : 'text-gray-900'}`}>
              What's New at BLOX City
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-[hsl(var(--bc-text-muted))]' : 'text-gray-600'}`}>
              Stay up to date with the latest features, improvements, and announcements
            </p>
          </div>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === null
                  ? theme === 'dark' ? 'bg-[hsl(var(--bc-primary))] text-white' : 'bg-orange-500 text-white'
                  : theme === 'dark' ? 'bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]' : 'bg-white text-gray-600 hover:text-gray-900'
              }`}
            >
              All Updates
            </button>
            {categories.map(cat => {
              const config = categoryConfig[cat] || categoryConfig.general;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition capitalize ${
                    selectedCategory === cat
                      ? theme === 'dark' ? 'bg-[hsl(var(--bc-primary))] text-white' : 'bg-orange-500 text-white'
                      : theme === 'dark' ? 'bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]' : 'bg-white text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Updates List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`rounded-xl p-6 animate-pulse ${theme === 'dark' ? 'bg-[hsl(var(--bc-bg-card))]' : 'bg-white'}`}>
                <div className={`h-6 w-1/3 rounded ${theme === 'dark' ? 'bg-[hsl(var(--bc-border))]' : 'bg-gray-200'}`} />
                <div className={`h-4 w-full mt-4 rounded ${theme === 'dark' ? 'bg-[hsl(var(--bc-border))]' : 'bg-gray-200'}`} />
                <div className={`h-4 w-2/3 mt-2 rounded ${theme === 'dark' ? 'bg-[hsl(var(--bc-border))]' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className={`text-center py-16 rounded-xl ${theme === 'dark' ? 'bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))]' : 'bg-white border border-gray-200'}`}>
            <Megaphone className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-[hsl(var(--bc-text-muted))]' : 'text-gray-400'}`} />
            <h3 className={`text-lg font-medium ${theme === 'dark' ? 'text-[hsl(var(--bc-text))]' : 'text-gray-900'}`}>
              No updates yet
            </h3>
            <p className={`mt-1 ${theme === 'dark' ? 'text-[hsl(var(--bc-text-muted))]' : 'text-gray-500'}`}>
              Check back soon for the latest news and updates!
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${theme === 'dark' ? 'bg-[hsl(var(--bc-border))]' : 'bg-gray-200'}`} />
            
            <div className="space-y-6">
              {filteredUpdates.map((update, index) => {
                const config = categoryConfig[update.category] || categoryConfig.general;
                const Icon = config.icon;
                
                return (
                  <div key={update.id} className="relative pl-16">
                    {/* Timeline dot */}
                    <div className={`absolute left-4 w-5 h-5 rounded-full border-4 ${theme === 'dark' ? 'border-[hsl(var(--bc-bg))] bg-[hsl(var(--bc-primary))]' : 'border-gray-50 bg-orange-500'}`} />
                    
                    <article className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))]' : 'bg-white border border-gray-200 shadow-sm'}`}>
                      {/* Header */}
                      <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-[hsl(var(--bc-border))]' : 'border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <Icon className={`w-5 h-5 ${config.color}`} />
                            </div>
                            <div>
                              <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-[hsl(var(--bc-text))]' : 'text-gray-900'}`}>
                                {update.title}
                              </h2>
                              <div className="flex items-center gap-3 mt-1">
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full capitalize ${config.bgColor} ${config.color}`}>
                                  <Tag className="w-3 h-3" />
                                  {update.category}
                                </span>
                                <span className={`flex items-center gap-1 text-xs ${theme === 'dark' ? 'text-[hsl(var(--bc-text-muted))]' : 'text-gray-500'}`}>
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(update.created_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className={`px-6 py-4 prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert text-[hsl(var(--bc-text-muted))]' : 'text-gray-600'}`}>
                        <p className="whitespace-pre-wrap">{update.content}</p>
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
      <footer className={`mt-16 py-8 border-t ${theme === 'dark' ? 'border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-card))]' : 'border-gray-200 bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className={`text-sm ${theme === 'dark' ? 'text-[hsl(var(--bc-text-muted))]' : 'text-gray-500'}`}>
            © 2026 BLOX City, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}