import { useState } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { ForumUser } from '@/hooks/useForumAuth';
import { useMarketplaceItems, MarketplaceItem } from '@/hooks/useMarketplace';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, Heart, Clock, 
  Shirt, Sparkles, Crown, Palette, Box, 
  Grid3X3, List, Coins, Loader2, DollarSign, Wrench
} from 'lucide-react';

// Categories for the market
const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: Grid3X3 },
  { id: 'hats', name: 'Hats', icon: Crown },
  { id: 'faces', name: 'Faces', icon: Palette },
  { id: 'gear', name: 'Gear', icon: Wrench },
  { id: 'accessories', name: 'Accessories', icon: Sparkles },
  { id: 't-shirts', name: 'T-Shirts', icon: Shirt },
  { id: 'shirts', name: 'Shirts', icon: Shirt },
  { id: 'pants', name: 'Pants', icon: Box },
  { id: 'bundles', name: 'Bundles', icon: Sparkles },
];

const SORT_OPTIONS = [
  { id: 'relevance', name: 'Relevance' },
  { id: 'best-selling', name: 'Best Selling' },
  { id: 'recently-updated', name: 'Recently Updated' },
  { id: 'price-low', name: 'Price (Low to High)' },
  { id: 'price-high', name: 'Price (High to Low)' },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function formatPrice(price: number): string {
  return price.toLocaleString();
}

export default function Market() {
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { items, loading } = useMarketplaceItems(selectedCategory);

  // Filter items based on search
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price_coins - b.price_coins;
      case 'price-high': return b.price_coins - a.price_coins;
      case 'best-selling': return b.sales_count - a.sales_count;
      case 'recently-updated': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default: return 0;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (searchQuery) params.set('q', searchQuery);
    else params.delete('q');
    setSearchParams(params);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams);
    if (category !== 'all') params.set('category', category);
    else params.delete('category');
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      {/* Header */}
      <div className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))]">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Market</h1>
              <p className="text-[hsl(var(--bc-text-muted))]">
                Browse and buy items for your character
              </p>
            </div>
            
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search market..."
                  className="pl-10 bg-[hsl(var(--bc-bg))] border-[hsl(var(--bc-border))]"
                />
              </div>
              <Button type="submit" className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary))]/90">
                Search
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Categories */}
          <div className="hidden lg:block w-56 flex-shrink-0">
            <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 sticky top-4">
              <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Categories</h3>
              <nav className="space-y-1">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  const count = cat.id === 'all' ? items.length : items.filter(i => i.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive 
                          ? 'bg-[hsl(var(--bc-primary))] text-white' 
                          : 'text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg))] hover:text-[hsl(var(--bc-text))]'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        {cat.name}
                      </span>
                      <span className="text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--bc-text-muted))]">
                  {sortedItems.length} results
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 text-sm border border-[hsl(var(--bc-border))] rounded-lg bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text))]"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>

                {/* View toggle */}
                <div className="flex border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-[hsl(var(--bc-primary))] text-white' : 'bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text-muted))]'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-[hsl(var(--bc-primary))] text-white' : 'bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text-muted))]'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {sortedItems.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/market/item/${item.id}`}
                    className="group"
                  >
                    <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] overflow-hidden hover:border-[hsl(var(--bc-primary))] transition-all hover:shadow-lg">
                      {/* Thumbnail */}
                      <div className="aspect-square bg-gradient-to-br from-[hsl(var(--bc-primary))]/20 to-[hsl(var(--bc-primary))]/5 relative">
                        {item.thumbnail_url ? (
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Box className="w-12 h-12 text-[hsl(var(--bc-primary))]/40" />
                          </div>
                        )}
                        
                        {/* Limited badge */}
                        {item.is_limited && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-amber-500 text-white text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Limited
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))]">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[hsl(var(--bc-text-muted))] truncate">
                          By BLOX City
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-[hsl(var(--bc-primary))] flex items-center gap-1">
                            {item.payment_type === 'cash' ? (
                              <>
                                <DollarSign className="w-3.5 h-3.5 text-green-500" />
                                {formatPrice(item.price_cash)}
                              </>
                            ) : (
                              <>
                                <Coins className="w-3.5 h-3.5 text-yellow-500" />
                                {formatPrice(item.price_coins)}
                              </>
                            )}
                          </span>
                          <span className="text-xs text-[hsl(var(--bc-text-muted))] flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatNumber(item.favorites_count)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="space-y-2">
                {sortedItems.map((item) => (
                  <Link 
                    key={item.id} 
                    to={`/market/item/${item.id}`}
                    className="block"
                  >
                    <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-all">
                      <CardContent className="p-4 flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[hsl(var(--bc-primary))]/20 to-[hsl(var(--bc-primary))]/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-8 h-8 text-[hsl(var(--bc-primary))]/40" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[hsl(var(--bc-text))] truncate">
                              {item.name}
                            </h3>
                            {item.is_limited && (
                              <Badge className="bg-amber-500 text-white text-xs">Limited</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                            By BLOX City • {CATEGORIES.find(c => c.id === item.category)?.name}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-sm text-[hsl(var(--bc-text-muted))]">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatNumber(item.favorites_count)}
                          </span>
                          <span className="flex items-center gap-1">
                            {formatNumber(item.sales_count)} sold
                          </span>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="font-bold text-lg text-[hsl(var(--bc-primary))] flex items-center gap-1">
                            {item.payment_type === 'cash' ? (
                              <>
                                <DollarSign className="w-4 h-4 text-green-500" />
                                {formatPrice(item.price_cash)}
                              </>
                            ) : (
                              <>
                                <Coins className="w-4 h-4 text-yellow-500" />
                                {formatPrice(item.price_coins)}
                              </>
                            )}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {!loading && sortedItems.length === 0 && (
              <div className="text-center py-16">
                <Box className="w-16 h-16 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-4" />
                <h3 className="text-lg font-medium text-[hsl(var(--bc-text))]">No items found</h3>
                <p className="text-[hsl(var(--bc-text-muted))]">
                  {items.length === 0 ? 'Check back later for new items!' : 'Try adjusting your search or filters'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}