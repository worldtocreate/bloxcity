import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Award, Loader2, Users, Star, Sparkles, Gem, Crown } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  rarity: string | null;
  owner_count: number;
}

const rarityConfig: Record<string, { label: string; bg: string; border: string; icon: any }> = {
  common: { label: 'Common', bg: 'bg-gray-100', border: 'border-gray-300', icon: Star },
  uncommon: { label: 'Uncommon', bg: 'bg-green-100', border: 'border-green-400', icon: Sparkles },
  rare: { label: 'Rare', bg: 'bg-blue-100', border: 'border-blue-400', icon: Gem },
  epic: { label: 'Epic', bg: 'bg-purple-100', border: 'border-purple-400', icon: Crown },
  legendary: { label: 'Legendary', bg: 'bg-amber-100', border: 'border-amber-400', icon: Award },
};

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    // Fetch all achievements with owner counts
    const { data: achievementsData } = await supabase
      .from('forum_achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (achievementsData) {
      // Get owner counts for each achievement
      const achievementsWithCounts = await Promise.all(
        achievementsData.map(async (achievement) => {
          const { count } = await supabase
            .from('forum_user_achievements')
            .select('*', { count: 'exact', head: true })
            .eq('achievement_id', achievement.id);
          
          return {
            ...achievement,
            owner_count: count || 0
          };
        })
      );

      setAchievements(achievementsWithCounts);
    }
    setLoading(false);
  };

  const filteredAchievements = filter === 'all' 
    ? achievements 
    : achievements.filter(a => a.rarity === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Achievements
          </h1>
          <p className="text-[hsl(var(--bc-text-muted))]">
            {achievements.length} total achievements to collect
          </p>
        </div>
      </div>

      {/* Rarity Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-[hsl(var(--bc-primary))] text-white'
              : 'bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
          }`}
        >
          All ({achievements.length})
        </button>
        {Object.entries(rarityConfig).map(([key, config]) => {
          const count = achievements.filter(a => a.rarity === key).length;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                filter === key
                  ? 'bg-[hsl(var(--bc-primary))] text-white'
                  : 'bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Achievements Grid */}
      {filteredAchievements.length === 0 ? (
        <div className="text-center py-12 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
          <Award className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--bc-text-muted))]">
            No achievements found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map((achievement) => {
            const rarity = rarityConfig[achievement.rarity || 'common'];
            const IconComponent = rarity.icon;
            
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 ${rarity.bg} ${rarity.border} transition hover:scale-[1.02]`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: achievement.color || '#FFD700' }}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[hsl(var(--bc-text))] truncate">
                      {achievement.name}
                    </h3>
                    <p className="text-sm text-[hsl(var(--bc-text-muted))] line-clamp-2">
                      {achievement.description || 'No description'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-black/10 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-[hsl(var(--bc-text-muted))]">
                    <IconComponent className="w-4 h-4" />
                    <span className="capitalize">{rarity.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-[hsl(var(--bc-text-muted))]">
                    <Users className="w-4 h-4" />
                    <span>{achievement.owner_count.toLocaleString()} {achievement.owner_count === 1 ? 'owner' : 'owners'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
