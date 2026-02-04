import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ForumUser } from '@/hooks/useForumAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  User, Shirt, Crown, Sparkles, Palette, Box, 
  Search, RotateCcw, Save, ShoppingBag, Heart,
  ChevronLeft, ChevronRight, Layers, 
  Trash2, Plus, Star
} from 'lucide-react';

// Placeholder categories for avatar customization
const BODY_CATEGORIES = [
  { id: 'recent', name: 'Recent', icon: Star },
  { id: 'hats', name: 'Hats', icon: Crown },
  { id: 'hair', name: 'Hair', icon: Sparkles },
  { id: 'faces', name: 'Faces', icon: Palette },
  { id: 'heads', name: 'Heads', icon: User },
  { id: 'torso', name: 'Torso', icon: Shirt },
  { id: 'shirts', name: 'Shirts', icon: Shirt },
  { id: 'pants', name: 'Pants', icon: Box },
  { id: 't-shirts', name: 'T-Shirts', icon: Shirt },
  { id: 'accessories', name: 'Accessories', icon: Box },
  { id: 'gear', name: 'Gear', icon: Box },
];

// Placeholder owned items
const PLACEHOLDER_OWNED_ITEMS = [
  { id: '1', name: 'Classic Fedora', category: 'hats', equipped: true, thumbnail: null },
  { id: '2', name: 'Shaggy 2.0', category: 'hair', equipped: true, thumbnail: null },
  { id: '3', name: 'Winning Smile', category: 'faces', equipped: true, thumbnail: null },
  { id: '4', name: 'Blue Hoodie', category: 'shirts', equipped: false, thumbnail: null },
  { id: '5', name: 'Jeans', category: 'pants', equipped: true, thumbnail: null },
  { id: '6', name: 'Sneakers', category: 'accessories', equipped: true, thumbnail: null },
  { id: '7', name: 'Cool Shades', category: 'accessories', equipped: false, thumbnail: null },
  { id: '8', name: 'Gold Chain', category: 'accessories', equipped: false, thumbnail: null },
];

// Placeholder costumes
const PLACEHOLDER_COSTUMES = [
  { id: '1', name: 'Default Look', items: 5, thumbnail: null },
  { id: '2', name: 'Party Outfit', items: 6, thumbnail: null },
  { id: '3', name: 'Casual Friday', items: 4, thumbnail: null },
];

// Placeholder body colors
const BODY_COLORS = [
  '#FFC0CB', '#FFD700', '#98FB98', '#87CEEB', '#DDA0DD',
  '#F0E68C', '#E6E6FA', '#FFA07A', '#20B2AA', '#778899',
  '#B0C4DE', '#FFDAB9', '#D2691E', '#8B4513', '#2F4F4F',
  '#FFFFFF', '#F5F5F5', '#DCDCDC', '#A9A9A9', '#696969',
];

export default function Character() {
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { forumUser } = context || {};
  const [selectedCategory, setSelectedCategory] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('wardrobe');
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);
  const [ownedItems, setOwnedItems] = useState(PLACEHOLDER_OWNED_ITEMS);

  // Filter items by category and search
  const filteredItems = ownedItems.filter(item => {
    const matchesCategory = selectedCategory === 'recent' || item.category === selectedCategory;
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const equippedItems = ownedItems.filter(item => item.equipped);

  const toggleEquip = (itemId: string) => {
    setOwnedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, equipped: !item.equipped } : item
      )
    );
  };

  if (!forumUser) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg))] flex items-center justify-center">
        <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-4" />
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-2">
              Sign in to customize your character
            </h2>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">
              Create an account or sign in to access the avatar editor.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/login">
                <Button>Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="outline">Create Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg))]">
      {/* Header */}
      <div className="bg-[hsl(var(--bc-bg-card))] border-b border-[hsl(var(--bc-border))]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Avatar</h1>
              <p className="text-[hsl(var(--bc-text-muted))]">Customize your character</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary))]/90">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left: Avatar Preview */}
          <div className="lg:col-span-1">
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] sticky top-4">
              {/* 3D Avatar Preview Placeholder */}
              <div className="aspect-[3/4] bg-gradient-to-b from-[hsl(var(--bc-primary))]/10 to-[hsl(var(--bc-primary))]/5 rounded-t-xl flex items-center justify-center relative">
                <div className="text-center">
                  <User className="w-32 h-32 text-[hsl(var(--bc-primary))]/40 mx-auto" />
                  <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-4">
                    3D Avatar Preview
                  </p>
                  <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                    Coming Soon
                  </p>
                </div>

                {/* Rotation controls placeholder */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Currently Wearing */}
                <h3 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Currently Wearing</h3>
                <div className="grid grid-cols-4 gap-2">
                  {equippedItems.slice(0, 8).map((item) => (
                    <div
                      key={item.id}
                      className="aspect-square bg-[hsl(var(--bc-bg))] rounded-lg border border-[hsl(var(--bc-border))] flex items-center justify-center relative group cursor-pointer"
                      title={item.name}
                    >
                      <Box className="w-6 h-6 text-[hsl(var(--bc-primary))]/40" />
                      <button 
                        onClick={() => toggleEquip(item.id)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  {equippedItems.length < 8 && (
                    <div className="aspect-square bg-[hsl(var(--bc-bg))] rounded-lg border-2 border-dashed border-[hsl(var(--bc-border))] flex items-center justify-center">
                      <Plus className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Link to="/market">
                    <Button variant="outline" className="w-full" size="sm">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      Get More
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm">
                    <Heart className="w-4 h-4 mr-2" />
                    Favorites
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Customization Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-[hsl(var(--bc-bg))] w-full justify-start">
                <TabsTrigger value="wardrobe">Wardrobe</TabsTrigger>
                <TabsTrigger value="costumes">Costumes</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="animations">Animations</TabsTrigger>
              </TabsList>

              {/* Wardrobe Tab */}
              <TabsContent value="wardrobe" className="mt-4">
                <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
                  <CardContent className="p-4">
                    {/* Category Tabs + Search */}
                    <div className="flex flex-col lg:flex-row gap-4 mb-4">
                      <div className="flex-1 overflow-x-auto">
                        <div className="flex gap-1 pb-2">
                          {BODY_CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            const isActive = selectedCategory === cat.id;
                            return (
                              <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                                  isActive 
                                    ? 'bg-[hsl(var(--bc-primary))] text-white' 
                                    : 'bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg))]/80'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="relative w-full lg:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search items..."
                          className="pl-10 bg-[hsl(var(--bc-bg))] border-[hsl(var(--bc-border))]"
                        />
                      </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                      {filteredItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => toggleEquip(item.id)}
                          className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center p-2 transition-all relative ${
                            item.equipped
                              ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10'
                              : 'border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg))] hover:border-[hsl(var(--bc-primary))]/50'
                          }`}
                          title={item.name}
                        >
                          <Box className={`w-8 h-8 ${item.equipped ? 'text-[hsl(var(--bc-primary))]' : 'text-[hsl(var(--bc-text-muted))]/40'}`} />
                          {item.equipped && (
                            <Badge className="absolute -top-1 -right-1 w-4 h-4 p-0 flex items-center justify-center bg-[hsl(var(--bc-primary))]">
                              ✓
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>

                    {filteredItems.length === 0 && (
                      <div className="text-center py-12">
                        <Box className="w-16 h-16 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-4" />
                        <h3 className="text-lg font-medium text-[hsl(var(--bc-text))]">No items found</h3>
                        <p className="text-[hsl(var(--bc-text-muted))]">
                          {searchQuery ? 'Try a different search term' : 'Visit the catalog to get items'}
                        </p>
                        <Link to="/market" className="mt-4 inline-block">
                          <Button>
                            <ShoppingBag className="w-4 h-4 mr-2" />
                            Browse Catalog
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Costumes Tab */}
              <TabsContent value="costumes" className="mt-4">
                <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Saved Costumes</CardTitle>
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {PLACEHOLDER_COSTUMES.map((costume) => (
                        <div
                          key={costume.id}
                          className="bg-[hsl(var(--bc-bg))] border border-[hsl(var(--bc-border))] rounded-xl p-4 cursor-pointer hover:border-[hsl(var(--bc-primary))] transition-colors"
                        >
                          <div className="aspect-square bg-gradient-to-br from-[hsl(var(--bc-primary))]/20 to-[hsl(var(--bc-primary))]/5 rounded-lg flex items-center justify-center mb-3">
                            <User className="w-12 h-12 text-[hsl(var(--bc-primary))]/40" />
                          </div>
                          <h4 className="font-medium text-[hsl(var(--bc-text))] truncate">
                            {costume.name}
                          </h4>
                          <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                            {costume.items} items
                          </p>
                        </div>
                      ))}

                      {/* Create New Costume */}
                      <div className="bg-[hsl(var(--bc-bg))] border-2 border-dashed border-[hsl(var(--bc-border))] rounded-xl p-4 cursor-pointer hover:border-[hsl(var(--bc-primary))] transition-colors flex flex-col items-center justify-center min-h-[180px]">
                        <Plus className="w-8 h-8 text-[hsl(var(--bc-text-muted))] mb-2" />
                        <span className="text-sm text-[hsl(var(--bc-text-muted))]">Create New</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Body Tab */}
              <TabsContent value="body" className="mt-4">
                <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
                  <CardHeader>
                    <CardTitle className="text-lg">Body Colors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      {/* Body Part Selector */}
                      <div>
                        <h4 className="font-medium text-[hsl(var(--bc-text))] mb-3">Select Body Part</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Head', 'Torso', 'Left Arm', 'Right Arm', 'Left Leg', 'Right Leg'].map((part) => (
                            <button
                              key={part}
                              onClick={() => setSelectedBodyPart(part)}
                              className={`px-4 py-3 rounded-lg text-sm transition-colors ${
                                selectedBodyPart === part
                                  ? 'bg-[hsl(var(--bc-primary))] text-white'
                                  : 'bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg))]/80'
                              }`}
                            >
                              {part}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Color Picker */}
                      <div>
                        <h4 className="font-medium text-[hsl(var(--bc-text))] mb-3">Choose Color</h4>
                        <div className="grid grid-cols-5 gap-2">
                          {BODY_COLORS.map((color) => (
                            <button
                              key={color}
                              className="aspect-square rounded-lg border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Proportions */}
                    <div className="mt-6 pt-6 border-t border-[hsl(var(--bc-border))]">
                      <h4 className="font-medium text-[hsl(var(--bc-text))] mb-3">Body Proportions</h4>
                      <div className="grid grid-cols-3 gap-4">
                        {['Height', 'Width', 'Head Size'].map((prop) => (
                          <div key={prop}>
                            <label className="text-sm text-[hsl(var(--bc-text-muted))] block mb-2">{prop}</label>
                            <input
                              type="range"
                              min="50"
                              max="150"
                              defaultValue="100"
                              className="w-full"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Animations Tab */}
              <TabsContent value="animations" className="mt-4">
                <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
                  <CardHeader>
                    <CardTitle className="text-lg">Animations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Layers className="w-16 h-16 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-4" />
                      <h3 className="text-lg font-medium text-[hsl(var(--bc-text))]">
                        Animation Editor Coming Soon
                      </h3>
                      <p className="text-[hsl(var(--bc-text-muted))] max-w-md mx-auto">
                        Customize your character's walk, run, jump, and idle animations.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
