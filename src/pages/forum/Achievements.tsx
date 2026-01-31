import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Award, Loader2, Users } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  color: string | null;
  owner_count: number;
}

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    const { data: achievementsData } = await supabase
      .from('forum_achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (achievementsData) {
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

      setAchievements(achievementsWithCounts as Achievement[]);
    }
    setLoading(false);
  };

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

      {/* Achievements Grid */}
      {achievements.length === 0 ? (
        <div className="text-center py-12 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
          <Award className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--bc-text-muted))]">
            No achievements found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className="p-4 rounded-xl border border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-card))] transition hover:scale-[1.02]"
            >
              <div className="flex items-start gap-3">
                {achievement.image_url ? (
                  <img 
                    src={achievement.image_url} 
                    alt={achievement.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: achievement.color || '#FFD700' }}
                  >
                    <Award className="w-6 h-6 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[hsl(var(--bc-text))] truncate">
                    {achievement.name}
                  </h3>
                  <p className="text-sm text-[hsl(var(--bc-text-muted))] line-clamp-2">
                    {achievement.description || 'No description'}
                  </p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-[hsl(var(--bc-border))] flex items-center justify-end">
                <div className="flex items-center gap-1 text-sm text-[hsl(var(--bc-text-muted))]">
                  <Users className="w-4 h-4" />
                  <span>{achievement.owner_count.toLocaleString()} {achievement.owner_count === 1 ? 'owner' : 'owners'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}