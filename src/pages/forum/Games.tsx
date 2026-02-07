import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Loader2, Search, Gamepad2, Wrench } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';

// Inline page maintenance hook
function usePageMaintenance(pageKey: string) {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const check = async () => {
      try {
        const { data, error } = await supabase.from('admin_settings').select('value').eq('key', 'page_maintenance').single();
        if (error) setIsUnderMaintenance(false);
        else if (data?.value) setIsUnderMaintenance((data.value as Record<string, boolean>)[pageKey] === true);
      } catch { setIsUnderMaintenance(false); }
      finally { setLoading(false); }
    };
    check();
  }, [pageKey]);
  return { isUnderMaintenance, loading };
}

function PageMaintenance({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-3">{pageName} Under Maintenance</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-6">We are currently performing scheduled maintenance. Please check back soon!</p>
      </div>
    </div>
  );
}

interface Game {
  id: string;
  serial_id: number;
  title: string;
  description: string | null;
  category: string;
  max_players: number;
  is_private: boolean;
  thumbnail_url: string | null;
  creator_id: string;
  play_count: number;
  favorite_count: number;
  creator?: {
    username: string;
    avatar_url: string | null;
    serial_id: number;
  };
}

function getGameUrl(game: Game): string {
  const slug = game.title.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `/game/${game.serial_id}/${slug}`;
}

const GAME_CATEGORIES = [
  { id: 'recent', label: 'Recent' },
  { id: 'Action', label: 'Action' },
  { id: 'Survival', label: 'Survival' },
  { id: 'Racing', label: 'Racing' },
  { id: 'Horror', label: 'Horror' },
  { id: 'Open-World', label: 'Open-World' },
  { id: 'Multiplayer', label: 'Multiplayer' },
  { id: 'Competitive', label: 'Competitive' },
  { id: 'Experimental', label: 'Experimental' },
];

export default function Games() {
  const { isUnderMaintenance, loading: maintenanceLoading } = usePageMaintenance('games');
  
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { forumUser, isAdmin } = context || {};
  
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('recent');
  
  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Action');
  const [maxPlayers, setMaxPlayers] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    fetchGames();
  }, [forumUser]);
  
  // Show maintenance page if page is under maintenance (unless admin)
  if (maintenanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }
  
  if (isUnderMaintenance && !isAdmin) {
    return <PageMaintenance pageName="Games" />;
  }

  const fetchGames = async () => {
    const { data } = await supabase
      .from('forum_games')
      .select(`
        *,
        creator:creator_id (username, avatar_url, serial_id)
      `)
      .eq('is_private', false)
      .order('created_at', { ascending: false });
    
    setGames((data || []) as Game[]);
    setLoading(false);
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumUser || !title.trim()) return;
    
    // Check game limit
    const { count } = await supabase
      .from('forum_games')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', forumUser.id);
    
    if ((count || 0) >= 2 && !isAdmin) {
      toast.error('You can only create up to 2 games');
      return;
    }
    
    setCreating(true);
    
    const { error } = await supabase
      .from('forum_games')
      .insert({
        creator_id: forumUser.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        max_players: maxPlayers,
        is_private: isPrivate
      });
    
    if (error) {
      toast.error('Failed to create game');
    } else {
      toast.success('Game created!');
      setShowCreate(false);
      setTitle('');
      setDescription('');
      setCategory('Action');
      setMaxPlayers(1);
      setIsPrivate(false);
      fetchGames();
    }
    
    setCreating(false);
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'recent' || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Client Status Banner */}
      <div className="bc-alert" style={{ background: 'hsl(var(--bc-success))', color: 'white', textAlign: 'center', padding: '0.75rem' }}>
        <p className="font-semibold">
          We're working on finalizing a few things before we release the client for download. Stay tuned for more updates!
        </p>
      </div>

      <div className="games-layout">
        {/* Sidebar */}
        <div className="games-sidebar">
          <div className="games-sidebar-title">
            <span className="text-xl font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>Games</span>
            {forumUser && (
              <button
                onClick={() => setShowCreate(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'hsl(var(--bc-success))', color: 'white' }}
                title="Create Game"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {GAME_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`games-category-item ${selectedCategory === cat.id ? 'active' : ''}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main Content */}
        <div className="games-main">
          <div className="games-header-row">
            <div className="text-xl font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>
              {GAME_CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Recent'}
            </div>
            <div className="games-filters">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="bc-input"
              />
              <select className="bc-input" style={{ maxWidth: '180px' }}>
                <option value="" disabled>Advanced Sorting...</option>
                <option value="newest">Newest</option>
                <option value="popular">Most Popular</option>
                <option value="favorites">Most Favorites</option>
              </select>
              <button className="bc-btn bc-btn-success" style={{ whiteSpace: 'nowrap' }}>
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </div>

          {/* Games Grid */}
          {filteredGames.length === 0 ? (
            <div className="text-center py-12 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
              <Gamepad2 className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
              <p className="text-[hsl(var(--bc-text-muted))]">No games found</p>
            </div>
          ) : (
            <div className="games-grid">
              {filteredGames.map(game => (
                <Link key={game.id} to={getGameUrl(game)} className="game-card">
                  {game.thumbnail_url ? (
                    <img
                      src={game.thumbnail_url}
                      alt={game.title}
                      className="game-thumbnail"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="game-thumbnail flex items-center justify-center">
                      <Gamepad2 className="w-10 h-10 text-[hsl(var(--bc-text-muted))]" />
                    </div>
                  )}
                  <div className="game-card-title">{game.title}</div>
                  {game.creator && (
                    <div className="game-card-creator">
                      By <Link to={`/${game.creator.serial_id}/${game.creator.username}/profile`} onClick={(e) => e.stopPropagation()}>@{game.creator.username}</Link>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Game Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateGame} className="bc-card w-full max-w-lg">
            <div className="bc-card-body space-y-4">
              <h2 className="text-lg font-semibold" style={{ color: 'hsl(var(--bc-text))' }}>Create New Game</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Game title"
                  className="bc-input"
                  required
                  maxLength={50}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your game..."
                  className="bc-input resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bc-input"
                  >
                    {GAME_CATEGORIES.filter(c => c.id !== 'recent').map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Max Players</label>
                  <input
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    className="bc-input"
                  />
                </div>
              </div>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: 'hsl(var(--bc-text))' }}>Make game private</span>
              </label>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="bc-btn bc-btn-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !title.trim()}
                  className="bc-btn bc-btn-success"
                >
                  {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Game'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
