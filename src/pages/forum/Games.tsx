import { useState, useEffect } from 'react';
import { Link, useOutletContext, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Gamepad2, Plus, Users, Star, Lock, Globe, Loader2, Heart, Search } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';

interface Game {
  id: string;
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
  };
  is_favorited?: boolean;
}

const GAME_CATEGORIES = [
  'Action',
  'Adventure',
  'RPG',
  'Simulation',
  'Strategy',
  'Puzzle',
  'Racing',
  'Sports',
  'Other'
];

export default function Games() {
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { user, forumUser, isAdmin } = context || {};
  const navigate = useNavigate();
  
  const [games, setGames] = useState<Game[]>([]);
  const [myGames, setMyGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Create form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [maxPlayers, setMaxPlayers] = useState(1);
  const [isPrivate, setIsPrivate] = useState(false);

  useEffect(() => {
    fetchGames();
    if (forumUser) fetchMyGames();
  }, [forumUser]);

  const fetchGames = async () => {
    const { data } = await supabase
      .from('forum_games')
      .select(`
        *,
        creator:creator_id (username, avatar_url)
      `)
      .eq('is_private', false)
      .order('created_at', { ascending: false });
    
    if (data && forumUser) {
      // Check favorites
      const { data: favorites } = await supabase
        .from('forum_game_favorites')
        .select('game_id')
        .eq('forum_user_id', forumUser.id);
      
      const favSet = new Set(favorites?.map(f => f.game_id) || []);
      setGames(data.map((g: any) => ({ ...g, is_favorited: favSet.has(g.id) })));
    } else {
      setGames(data || []);
    }
    
    setLoading(false);
  };

  const fetchMyGames = async () => {
    if (!forumUser) return;
    
    const { data } = await supabase
      .from('forum_games')
      .select('*')
      .eq('creator_id', forumUser.id)
      .order('created_at', { ascending: false });
    
    setMyGames(data || []);
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forumUser || !title.trim()) return;
    
    if (myGames.length >= 2 && !isAdmin) {
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
      setCategory('Other');
      setMaxPlayers(1);
      setIsPrivate(false);
      fetchGames();
      fetchMyGames();
    }
    
    setCreating(false);
  };

  const handleFavorite = async (gameId: string, isFavorited: boolean) => {
    if (!forumUser) {
      toast.error('Please log in to favorite games');
      return;
    }
    
    if (isFavorited) {
      await supabase
        .from('forum_game_favorites')
        .delete()
        .eq('game_id', gameId)
        .eq('forum_user_id', forumUser.id);
    } else {
      await supabase
        .from('forum_game_favorites')
        .insert({ game_id: gameId, forum_user_id: forumUser.id });
    }
    
    fetchGames();
  };

  const filteredGames = games.filter(game => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || game.category === selectedCategory;
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
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-[hsl(var(--bc-primary))]" />
            Games
          </h1>
          <p className="text-[hsl(var(--bc-text-muted))]">{games.length} games available</p>
        </div>
        {forumUser && (myGames.length < 2 || isAdmin) && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            Create Game
          </button>
        )}
      </div>

      {/* Create Game Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateGame} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 w-full max-w-lg space-y-4">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Create New Game</h2>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Game title"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2 text-[hsl(var(--bc-text))]"
                required
                maxLength={50}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your game..."
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2 text-[hsl(var(--bc-text))] resize-none"
                rows={3}
                maxLength={500}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2 text-[hsl(var(--bc-text))]"
                >
                  {GAME_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Max Players</label>
                <input
                  type="number"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2 text-[hsl(var(--bc-text))]"
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
              <span className="text-sm text-[hsl(var(--bc-text))]">Make game private</span>
            </label>
            
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !title.trim()}
                className="px-6 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2"
              >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Game'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
              !selectedCategory
                ? 'bg-[hsl(var(--bc-primary))] text-white'
                : 'bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-light))]'
            }`}
          >
            All
          </button>
          {GAME_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-[hsl(var(--bc-primary))] text-white'
                  : 'bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-light))]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* My Games */}
      {forumUser && myGames.length > 0 && (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4">
          <h2 className="font-semibold text-[hsl(var(--bc-text))] mb-4">My Games ({myGames.length}/2)</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {myGames.map(game => (
              <div key={game.id} className="bg-[hsl(var(--bc-bg-light))] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-[hsl(var(--bc-text))]">{game.title}</span>
                  {game.is_private ? <Lock className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" /> : <Globe className="w-4 h-4 text-green-500" />}
                </div>
                <p className="text-sm text-[hsl(var(--bc-text-muted))]">{game.category} • {game.max_players} max players</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Games Grid */}
      {filteredGames.length === 0 ? (
        <div className="text-center py-12 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
          <Gamepad2 className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--bc-text-muted))]">No games found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map(game => (
            <Link
              key={game.id}
              to={`/game/${game.id}`}
              className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl overflow-hidden hover:border-[hsl(var(--bc-primary))] transition block"
            >
              <div className="h-32 bg-gradient-to-br from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] flex items-center justify-center overflow-hidden">
                {game.thumbnail_url ? (
                  <img src={game.thumbnail_url} alt={game.title} className="w-full h-full object-cover" />
                ) : (
                  <Gamepad2 className="w-12 h-12 text-white/50" />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-[hsl(var(--bc-text))]">{game.title}</h3>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFavorite(game.id, game.is_favorited || false);
                    }}
                    className={`p-1.5 rounded-lg transition ${
                      game.is_favorited
                        ? 'text-red-500'
                        : 'text-[hsl(var(--bc-text-muted))] hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${game.is_favorited ? 'fill-current' : ''}`} />
                  </button>
                </div>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] line-clamp-2 mb-3">
                  {game.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-xs text-[hsl(var(--bc-text-muted))]">
                  <span className="px-2 py-1 bg-[hsl(var(--bc-bg-light))] rounded">{game.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {game.max_players}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5" />
                      {game.favorite_count}
                    </span>
                  </div>
                </div>
                {game.creator && (
                  <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-2">
                    by {game.creator.username}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
