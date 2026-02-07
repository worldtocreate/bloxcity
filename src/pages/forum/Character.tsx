import { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { ForumUser } from '@/hooks/useForumAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { User, Box, RefreshCw, X, Loader2, Wrench, Twitter, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Inline page maintenance hook
function usePageMaintenance(pageKey: string) {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkMaintenance = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('value')
          .eq('key', 'page_maintenance')
          .single();

        if (error) {
          setIsUnderMaintenance(false);
        } else if (data?.value) {
          const settings = data.value as Record<string, boolean>;
          setIsUnderMaintenance(settings[pageKey] === true);
        }
      } catch (err) {
        setIsUnderMaintenance(false);
      } finally {
        setLoading(false);
      }
    };
    checkMaintenance();
  }, [pageKey]);

  return { isUnderMaintenance, loading };
}

// Inline page maintenance component
function PageMaintenance({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-3">{pageName} Under Maintenance</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-6">We are currently performing scheduled maintenance on this page. Please check back soon!</p>
        <div className="flex items-center justify-center gap-4">
          <a href="https://twitter.com/bloxcity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] hover:border-[hsl(var(--bc-primary))] transition-all">
            <Twitter className="w-4 h-4" /><span className="text-sm">Twitter</span>
          </a>
          <a href="https://discord.gg/bloxcity" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] hover:border-[hsl(var(--bc-primary))] transition-all">
            <MessageCircle className="w-4 h-4" /><span className="text-sm">Discord</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// Item categories for avatar customization
const ITEM_CATEGORIES = [
  { id: 'hats', name: 'Hats' },
  { id: 'faces', name: 'Faces' },
  { id: 'heads', name: 'Heads' },
  { id: 'accessories', name: 'Accessories' },
  { id: 'shirts', name: 'Shirts' },
  { id: 'pants', name: 'Pants' },
  { id: 't-shirts', name: 'T-Shirts' },
  { id: 'gear', name: 'Gear' },
];

// Placeholder owned items
const PLACEHOLDER_OWNED_ITEMS = [
  { id: '1', name: 'Classic Fedora', category: 'hats', equipped: true, thumbnail: null },
  { id: '2', name: 'Cool Shades', category: 'accessories', equipped: true, thumbnail: null },
  { id: '3', name: 'Winning Smile', category: 'faces', equipped: true, thumbnail: null },
  { id: '4', name: 'Blue Hoodie', category: 'shirts', equipped: false, thumbnail: null },
  { id: '5', name: 'Jeans', category: 'pants', equipped: true, thumbnail: null },
  { id: '6', name: 'Sneakers', category: 'accessories', equipped: false, thumbnail: null },
  { id: '7', name: 'Wizard Hat', category: 'hats', equipped: false, thumbnail: null },
  { id: '8', name: 'Gold Chain', category: 'accessories', equipped: false, thumbnail: null },
];

// Body colors palette
const BODY_COLORS: Record<string, string> = {
  'White': '#FFFFFF',
  'Light Gray': '#D3D3D3',
  'Gray': '#A9A9A9',
  'Dark Gray': '#696969',
  'Black': '#1C1C1C',
  'Peach': '#FFCBA4',
  'Light Peach': '#FFE4C4',
  'Tan': '#D2B48C',
  'Brown': '#8B4513',
  'Dark Brown': '#3D2314',
  'Red': '#FF0000',
  'Bright Red': '#FF3333',
  'Dark Red': '#8B0000',
  'Maroon': '#800000',
  'Orange': '#FFA500',
  'Yellow': '#FFFF00',
  'Lime': '#00FF00',
  'Green': '#008000',
  'Dark Green': '#006400',
  'Teal': '#008080',
  'Cyan': '#00FFFF',
  'Light Blue': '#87CEEB',
  'Blue': '#0000FF',
  'Navy': '#000080',
  'Purple': '#800080',
  'Magenta': '#FF00FF',
  'Pink': '#FFC0CB',
  'Hot Pink': '#FF69B4',
};

// Body parts that can be colored
type BodyPart = 'head' | 'torso' | 'left_arm' | 'right_arm' | 'left_leg' | 'right_leg';

interface BodyColors {
  head: string;
  torso: string;
  left_arm: string;
  right_arm: string;
  left_leg: string;
  right_leg: string;
}

export default function Character() {
  const { isUnderMaintenance, loading: maintenanceLoading } = usePageMaintenance('character');
  
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { forumUser, isAdmin } = context || {};
  const [selectedCategory, setSelectedCategory] = useState('hats');
  const [selectedAngle, setSelectedAngle] = useState<'left' | 'right'>('right');
  const [selectedBodyPart, setSelectedBodyPart] = useState<BodyPart | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [ownedItems, setOwnedItems] = useState(PLACEHOLDER_OWNED_ITEMS);
  const [bodyColors, setBodyColors] = useState<BodyColors>({
    head: '#FFCBA4',
    torso: '#0000FF',
    left_arm: '#FFCBA4',
    right_arm: '#FFCBA4',
    left_leg: '#008000',
    right_leg: '#008000',
  });

  // Show maintenance page if page is under maintenance (unless admin)
  if (maintenanceLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" />
      </div>
    );
  }
  
  if (isUnderMaintenance && !isAdmin) {
    return <PageMaintenance pageName="Character" />;
  }

  // Filter items by category
  const filteredItems = ownedItems.filter(item => item.category === selectedCategory);
  const equippedItems = ownedItems.filter(item => item.equipped);

  const toggleEquip = (itemId: string) => {
    setOwnedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, equipped: !item.equipped } : item
      )
    );
  };

  const handleBodyPartClick = (part: BodyPart) => {
    setSelectedBodyPart(part);
    setShowColorPicker(true);
  };

  const handleColorSelect = (color: string) => {
    if (selectedBodyPart) {
      setBodyColors(prev => ({ ...prev, [selectedBodyPart]: color }));
    }
    setShowColorPicker(false);
    setSelectedBodyPart(null);
  };

  const handleRegenerate = () => {
    // Placeholder for regenerate functionality
    console.log('Regenerating avatar...');
  };

  if (!forumUser) {
    return (
      <div className="flex items-center justify-center p-4">
        <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))] max-w-md w-full">
          <CardContent className="p-6 sm:p-8 text-center">
            <User className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-4" />
            <h2 className="text-lg sm:text-xl font-bold text-[hsl(var(--bc-text))] mb-2">
              Sign in to customize your character
            </h2>
            <p className="text-sm sm:text-base text-[hsl(var(--bc-text-muted))] mb-4">
              Create an account or sign in to access the avatar editor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="w-full sm:w-auto">
                <Button className="w-full">Sign In</Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full">Create Account</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Color Picker Popup */}
      {showColorPicker && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-32"
          onClick={() => setShowColorPicker(false)}
        >
          <div 
            className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg p-4 shadow-xl max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-[hsl(var(--bc-text))]">
                {selectedBodyPart?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
              <button 
                onClick={() => setShowColorPicker(false)}
                className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1.5 max-w-[320px]">
              {Object.entries(BODY_COLORS).map(([name, hex]) => (
                <button
                  key={name}
                  onClick={() => handleColorSelect(hex)}
                  className="w-9 h-9 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] hover:scale-110 transition-all"
                  style={{ backgroundColor: hex }}
                  title={name}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column - Avatar & Colors */}
        <div className="lg:w-80 flex-shrink-0 space-y-4">
          {/* Avatar Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Avatar</h3>
              <Button 
                size="sm" 
                onClick={handleRegenerate}
                className="bg-[hsl(var(--bc-green))] hover:bg-[hsl(var(--bc-green))]/90"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Regenerate
              </Button>
            </div>
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
              <CardContent className="p-4">
                {/* Avatar Preview */}
                <div className="aspect-square bg-gradient-to-b from-[hsl(var(--bc-primary))]/10 to-[hsl(var(--bc-primary))]/5 rounded-lg flex items-center justify-center mb-3">
                  <User className="w-24 h-24 text-[hsl(var(--bc-primary))]/30" />
                </div>
                
                {/* Angle Buttons */}
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => setSelectedAngle('left')}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      selectedAngle === 'left'
                        ? 'bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text))] shadow'
                        : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
                    }`}
                  >
                    L
                  </button>
                  <button
                    onClick={() => setSelectedAngle('right')}
                    className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                      selectedAngle === 'right'
                        ? 'bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text))] shadow'
                        : 'text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]'
                    }`}
                  >
                    R
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colors Section */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Colors</h3>
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
              <CardContent className="p-4">
                {/* Body Part Diagram */}
                <div className="flex flex-col items-center gap-1">
                  {/* Head */}
                  <button
                    onClick={() => handleBodyPartClick('head')}
                    className="w-12 h-12 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors cursor-pointer"
                    style={{ backgroundColor: bodyColors.head }}
                    title="Head"
                  />
                  
                  {/* Arms + Torso Row */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleBodyPartClick('left_arm')}
                      className="w-6 h-20 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors cursor-pointer"
                      style={{ backgroundColor: bodyColors.left_arm }}
                      title="Left Arm"
                    />
                    <button
                      onClick={() => handleBodyPartClick('torso')}
                      className="w-16 h-20 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors cursor-pointer"
                      style={{ backgroundColor: bodyColors.torso }}
                      title="Torso"
                    />
                    <button
                      onClick={() => handleBodyPartClick('right_arm')}
                      className="w-6 h-20 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors cursor-pointer"
                      style={{ backgroundColor: bodyColors.right_arm }}
                      title="Right Arm"
                    />
                  </div>
                  
                  {/* Legs Row */}
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => handleBodyPartClick('left_leg')}
                      className="w-8 h-20 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors cursor-pointer"
                      style={{ backgroundColor: bodyColors.left_leg }}
                      title="Left Leg"
                    />
                    <button
                      onClick={() => handleBodyPartClick('right_leg')}
                      className="w-8 h-20 rounded border-2 border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] transition-colors cursor-pointer"
                      style={{ backgroundColor: bodyColors.right_leg }}
                      title="Right Leg"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column - Inventory & Wearing */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* Inventory Section */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Inventory</h3>
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
              <CardContent className="p-4">
                {/* Category Tabs */}
                <ScrollArea className="w-full mb-4">
                  <div className="flex gap-1 pb-2">
                    {ITEM_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-[hsl(var(--bc-primary))] text-white font-semibold'
                            : 'bg-[hsl(var(--bc-bg))] text-[hsl(var(--bc-text-muted))] hover:bg-[hsl(var(--bc-bg))]/80'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>

                {/* Items Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleEquip(item.id)}
                        className={`aspect-square rounded-lg border-2 flex items-center justify-center transition-all relative ${
                          item.equipped
                            ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10'
                            : 'border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg))] hover:border-[hsl(var(--bc-primary))]/50'
                        }`}
                        title={item.name}
                      >
                        <Box className={`w-8 h-8 ${item.equipped ? 'text-[hsl(var(--bc-primary))]' : 'text-[hsl(var(--bc-text-muted))]/40'}`} />
                        {item.equipped && (
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[hsl(var(--bc-primary))] text-white text-[10px] rounded-full flex items-center justify-center">
                            ✓
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Box className="w-12 h-12 mx-auto text-[hsl(var(--bc-text-muted))]/40 mb-2" />
                      <p className="text-sm text-[hsl(var(--bc-text-muted))]">No items in this category</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Currently Wearing Section */}
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Currently Wearing</h3>
            <Card className="bg-[hsl(var(--bc-bg-card))] border-[hsl(var(--bc-border))]">
              <CardContent className="p-4">
                {equippedItems.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {equippedItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleEquip(item.id)}
                        className="aspect-square rounded-lg border border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg))] flex items-center justify-center hover:border-[hsl(var(--bc-accent))] hover:bg-[hsla(var(--bc-accent),0.1)] transition-all group"
                        title={`${item.name} (click to remove)`}
                      >
                        <Box className="w-6 h-6 text-[hsl(var(--bc-primary))]/60 group-hover:hidden" />
                        <X className="w-5 h-5 text-[hsl(var(--bc-accent))] hidden group-hover:block" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-[hsl(var(--bc-text-muted))]">No items equipped</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
