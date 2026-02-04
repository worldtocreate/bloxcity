import { useState } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { ForumUser } from '@/hooks/useForumAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, Filter, Heart, Star, Clock, TrendingUp, 
  Shirt, Sparkles, Crown, Palette, Box, 
  Grid3X3, List, Coins, Info
} from 'lucide-react';

// Categories for the market
const CATEGORIES = [
  { id: 'all', name: 'All Items', icon: Grid3X3 },
  { id: 'hats', name: 'Hats', icon: Crown },
  { id: 'faces', name: 'Faces', icon: Palette },
  { id: 'shirts', name: 'Shirts', icon: Shirt },
  { id: 't-shirts', name: 'T-Shirts', icon: Shirt },
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

// Placeholder items for demo
const PLACEHOLDER_ITEMS = [
  { id: '1', name: 'Classic Fedora', category: 'hats', price: 75, isLimited: false, thumbnail: null, creator: 'BLOX', favorites: 1250, sales: 5420 },
  { id: '2', name: 'Sparkle Time Fedora', category: 'hats', price: 15000, isLimited: true, limitedStock: 50, thumbnail: null, creator: 'BLOX', favorites: 8920, sales: 48 },
  { id: '3', name: 'Winning Smile', category: 'faces', price: 350, isLimited: false, thumbnail: null, creator: 'BLOX', favorites: 12500, sales: 45000 },
  { id: '4', name: 'Woman Face', category: 'faces', price: 25, isLimited: false, thumbnail: null, creator: 'BLOX', favorites: 89000, sales: 250000 },
  { id: '5', name: 'Classic Tee', category: 't-shirts', price: 5, isLimited: false, thumbnail: null, creator: 'Designer123', favorites: 2500, sales: 15000 },
  { id: '6', name: 'Adidas Hoodie', category: 'shirts', price: 50, isLimited: false, thumbnail: null, creator: 'Designer123', favorites: 3400, sales: 12000 },
  { id: '7', name: 'Blue Jeans', category: 'pants', price: 25, isLimited: false, thumbnail: null, creator: 'BLOX', favorites: 4500, sales: 28000 },
  { id: '8', name: 'Dominus Empyreus', category: 'hats', price: 1250000, isLimited: true, limitedStock: 13, thumbnail: null, creator: 'BLOX', favorites: 150000, sales: 13 },
  { id: '9', name: 'Royal Bundle', category: 'bundles', price: 2500, isLimited: true, limitedStock: 500, thumbnail: null, creator: 'BLOX', favorites: 4200, sales: 380 },
  { id: '10', name: 'Bucket Hat', category: 'hats', price: 50, isLimited: false, thumbnail: null, creator: 'HatMaker', favorites: 890, sales: 4500 },
  { id: '11', name: 'Chill Face', category: 'faces', price: 125, isLimited: false, thumbnail: null, creator: 'BLOX', favorites: 15600, sales: 67000 },
  { id: '12', name: 'Starter Bundle', category: 'bundles', price: 500, isLimited: false, thumbnail: null, creator: 'BLOX', favorites: 8200, sales: 15000 },
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
  
  const { forumUser } = context || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter items based on category and search
  const filteredItems = PLACEHOLDER_ITEMS.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return a.price - b.price;
      case 'price-high': return b.price - a.price;
      case 'best-selling': return b.sales - a.sales;
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
      {/* Development Notice */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <Alert className="bg-amber-500/10 border-amber-500/30">
          <Info className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            This page is currently for visual purposes only while we develop the full marketplace functionality.
          </AlertDescription>
        </Alert>
      </div>

      {/* Header */}
      <div className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))] mt-4">
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
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive 
                          ? 'bg-[hsl(var(--bc-primary))] text-white' 
                          : 'text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg))] hover:text-[hsl(var(--bc-text))]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {cat.name}
                    </button>
                  );
                })}
              </nav>

              {/* Price Filter Placeholder */}
              <div className="mt-6 pt-4 border-t border-[hsl(var(--bc-border))]">
                <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Price Range</h3>
                <div className="flex gap-2">
                  <Input placeholder="Min" className="bg-[hsl(var(--bc-bg))] text-sm" />
                  <Input placeholder="Max" className="bg-[hsl(var(--bc-bg))] text-sm" />
                </div>
              </div>

              {/* Creator Filter Placeholder */}
              <div className="mt-4">
                <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Creator</h3>
                <Input placeholder="Search creators..." className="bg-[hsl(var(--bc-bg))] text-sm" />
              </div>
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
                {/* Mobile filter toggle */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="lg:hidden"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>

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

            {/* Items Grid */}
            {viewMode === 'grid' ? (
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
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Box className="w-12 h-12 text-[hsl(var(--bc-primary))]/40" />
                        </div>
                        
                        {/* Limited badge */}
                        {item.isLimited && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-amber-500 text-white text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Limited
                            </Badge>
                          </div>
                        )}

                        {/* Favorite button */}
                        <button 
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.preventDefault(); }}
                        >
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      <CardContent className="p-3">
                        <h3 className="font-medium text-sm text-[hsl(var(--bc-text))] truncate group-hover:text-[hsl(var(--bc-primary))]">
                          {item.name}
                        </h3>
                        <p className="text-xs text-[hsl(var(--bc-text-muted))] truncate">
                          By {item.creator}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="font-bold text-[hsl(var(--bc-primary))] flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-yellow-500" />{formatPrice(item.price)}
                          </span>
                          <span className="text-xs text-[hsl(var(--bc-text-muted))] flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {formatNumber(item.favorites)}
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
                        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[hsl(var(--bc-primary))]/20 to-[hsl(var(--bc-primary))]/5 flex items-center justify-center flex-shrink-0">
                          <Box className="w-8 h-8 text-[hsl(var(--bc-primary))]/40" />
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[hsl(var(--bc-text))] truncate">
                              {item.name}
                            </h3>
                            {item.isLimited && (
                              <Badge className="bg-amber-500 text-white text-xs">Limited</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                            By {item.creator} • {CATEGORIES.find(c => c.id === item.category)?.name}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-6 text-sm text-[hsl(var(--bc-text-muted))]">
                          <span className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            {formatNumber(item.favorites)}
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            {formatNumber(item.sales)}
                          </span>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <span className="font-bold text-lg text-[hsl(var(--bc-primary))] flex items-center gap-1">
                            <Coins className="w-4 h-4 text-yellow-500" />{formatPrice(item.price)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}

            {sortedItems.length === 0 && (
              <div className="text-center py-16">
                <Box className="w-16 h-16 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-4" />
                <h3 className="text-lg font-medium text-[hsl(var(--bc-text))]">No items found</h3>
                <p className="text-[hsl(var(--bc-text-muted))]">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
