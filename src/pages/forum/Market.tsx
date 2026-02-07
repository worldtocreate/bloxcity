import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useSearchParams, useOutletContext } from 'react-router-dom';
import { ForumUser } from '@/hooks/useForumAuth';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search, Heart, Clock,
  ChevronDown, Plus, Box,
  Grid3X3, List, Coins, Loader2, DollarSign,
  Crown, Palette, Wrench, Sparkles, Shirt
} from 'lucide-react';

// Categories matching blade template structure
const CATEGORY_SECTIONS = [
  {
    id: 'crates',
    name: 'Crates',
    isCollapsible: false,
    items: []
  },
  {
    id: 'accessories',
    name: 'Accessories',
    isCollapsible: true,
    items: [
      { id: 'hats', name: 'Hats', icon: Crown },
      { id: 'gadgets', name: 'Gadgets', icon: Wrench },
    ]
  },
  {
    id: 'clothing',
    name: 'Clothing',
    isCollapsible: true,
    items: [
      { id: 'shirts', name: 'Shirts', icon: Shirt },
      { id: 't-shirts', name: 'T-Shirts', icon: Shirt },
      { id: 'pants', name: 'Pants', icon: Box },
    ]
  },
  {
    id: 'body',
    name: 'Body',
    isCollapsible: true,
    items: [
      { id: 'faces', name: 'Faces', icon: Palette },
      { id: 'heads', name: 'Heads', icon: Box },
      { id: 'body-parts', name: 'Body Parts', icon: Box },
    ]
  },
  {
    id: 'other',
    name: 'Other',
    isCollapsible: true,
    items: [
      { id: 'bundles', name: 'Bundles', icon: Sparkles },
    ]
  },
];

const SORT_OPTIONS = [
  { id: 'relevance', name: 'Advanced Sorting...' },
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

type MarketplaceItem = {
  id: string;
  name: string;
  category: string;
  created_at: string;
  is_limited: boolean;
  thumbnail_url: string | null;
  favorites_count: number;
  sales_count: number;
  payment_type: 'coins' | 'cash' | 'both';
  price_coins: number;
  price_cash: number;
  is_on_sale: boolean;
};

function useMarketplaceItems(category: string) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      let query = supabase
        .from('marketplace_items')
        .select('id,name,category,created_at,is_limited,thumbnail_url,favorites_count,sales_count,payment_type,price_coins,price_cash,is_on_sale')
        .order('created_at', { ascending: false });

      if (category && category !== 'all') {
        query = query.eq('category', category as any);
      }

      const { data, error } = await query;
      if (!cancelled) {
        setItems((!error && data ? (data as MarketplaceItem[]) : []) as MarketplaceItem[]);
        setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [category]);

  return { items, loading };
}

// Collapsible section component
function CollapsibleSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg))] hover:text-[hsl(var(--bc-text))] transition-colors"
      >
        <span>{title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="ml-2 mt-1 space-y-1">
          {children}
        </div>
      )}
    </div>
  );
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

  const handleSearch = (e: FormEvent) => {
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

  const getCategoryItemCount = (catId: string) => {
    if (catId === 'all') return items.length;
    return items.filter(i => i.category === catId).length;
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Categories - matching blade template structure */}
          <div className="hidden lg:block w-52 flex-shrink-0">
            <div className="sticky top-4">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">Market</h2>
                <Link
                  to="/create"
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
                  title="Create"
                >
                  <Plus className="w-4 h-4" />
                </Link>
              </div>
              
              <nav className="space-y-1">
                {/* All Items */}
                <button
                  onClick={() => handleCategoryChange('all')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[hsl(var(--bc-primary))] text-white'
                      : 'text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-card))] hover:text-[hsl(var(--bc-text))]'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  All Items
                </button>

                {/* Crates - Non-collapsible */}
                <button
                  onClick={() => handleCategoryChange('crates')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === 'crates'
                      ? 'bg-[hsl(var(--bc-primary))] text-white'
                      : 'text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-card))] hover:text-[hsl(var(--bc-text))]'
                  }`}
                >
                  Crates
                </button>

                {/* Collapsible sections */}
                {CATEGORY_SECTIONS.filter(s => s.isCollapsible).map(section => (
                  <CollapsibleSection key={section.id} title={section.name}>
                    {section.items.map(item => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleCategoryChange(item.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                            selectedCategory === item.id
                              ? 'bg-[hsl(var(--bc-primary))] text-white'
                              : 'text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg-card))] hover:text-[hsl(var(--bc-text))]'
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </CollapsibleSection>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header with search - matching blade template */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
              <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))]">
                Recent Items
              </h3>
              
              <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full sm:w-48 h-9 text-sm bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]"
                />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-9 px-3 text-sm border border-[hsl(var(--bc-border))] rounded-lg bg-[hsl(var(--bc-bg-card))] text-[hsl(var(--bc-text))]"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.name}</option>
                  ))}
                </select>
                <Button type="submit" size="sm" className="bg-green-500 hover:bg-green-600 text-white h-9">
                  Search
                </Button>
                <Link 
                  to="/upgrade"
                  className="h-9 px-4 inline-flex items-center justify-center rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
                >
                  Buy Currency
                </Link>
              </form>
            </div>

            {/* View toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[hsl(var(--bc-text-muted))]">
                {sortedItems.length} results
              </span>
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
                      <div className="aspect-square bg-[hsl(var(--bc-bg))] relative">
                        {item.thumbnail_url ? (
                          <img 
                            src={item.thumbnail_url} 
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Box className="w-12 h-12 text-[hsl(var(--bc-text-muted))]/40" />
                          </div>
                        )}
                        
                        {/* Offsale badge */}
                        {!item.is_on_sale && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-gray-500 text-white text-xs">
                              Offsale
                            </Badge>
                          </div>
                        )}
                        
                        {/* Limited badge */}
                        {item.is_limited && item.is_on_sale && (
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-amber-500 text-white text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              Rare
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
                        <div className="w-16 h-16 rounded-lg bg-[hsl(var(--bc-bg))] flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.thumbnail_url ? (
                            <img src={item.thumbnail_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-8 h-8 text-[hsl(var(--bc-text-muted))]/40" />
                          )}
                        </div>
                        
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-[hsl(var(--bc-text))] truncate">
                              {item.name}
                            </h3>
                            {!item.is_on_sale && (
                              <Badge className="bg-gray-500 text-white text-xs">Offsale</Badge>
                            )}
                            {item.is_limited && item.is_on_sale && (
                              <Badge className="bg-amber-500 text-white text-xs">Rare</Badge>
                            )}
                          </div>
                          <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                            By BLOX City
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
