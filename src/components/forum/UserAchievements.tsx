import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  color: string;
  awarded_at: string;
}

interface UserAchievementsProps {
  forumUserId: string;
  compact?: boolean;
}

export default function UserAchievements({ forumUserId, compact = false }: UserAchievementsProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [forumUserId]);

  const fetchAchievements = async () => {
    const { data } = await supabase
      .from('forum_user_achievements')
      .select(`
        awarded_at,
        achievement:achievement_id (
          id, name, description, image_url, color
        )
      `)
      .eq('forum_user_id', forumUserId)
      .order('awarded_at', { ascending: false });

    if (data) {
      setAchievements(data.map((item: any) => ({
        ...item.achievement,
        awarded_at: item.awarded_at
      })));
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="w-8 h-8 rounded-full bg-[hsl(var(--bc-bg-light))]" />
        ))}
      </div>
    );
  }

  if (achievements.length === 0) {
    return compact ? null : (
      <div className="text-sm text-[hsl(var(--bc-text-muted))]">No achievements yet</div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {achievements.slice(0, 5).map(achievement => (
          <div
            key={achievement.id}
            className="group relative"
            title={achievement.name}
          >
            {achievement.image_url ? (
              <img 
                src={achievement.image_url} 
                alt={achievement.name}
                className="w-6 h-6 rounded-full object-cover border border-[hsl(var(--bc-border))]"
              />
            ) : (
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center border border-[hsl(var(--bc-border))]"
                style={{ backgroundColor: `${achievement.color}20` }}
              >
                <Award className="w-3 h-3" style={{ color: achievement.color }} />
              </div>
            )}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[hsl(var(--bc-bg-dark))] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
              {achievement.name}
            </div>
          </div>
        ))}
        {achievements.length > 5 && (
          <div className="w-6 h-6 rounded-full bg-[hsl(var(--bc-bg-light))] flex items-center justify-center text-xs text-[hsl(var(--bc-text-muted))]">
            +{achievements.length - 5}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
        <Award className="w-4 h-4" />
        Achievements ({achievements.length})
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {achievements.map(achievement => (
          <div
            key={achievement.id}
            className="p-3 rounded-lg border border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-light))]"
          >
            <div className="flex items-center gap-2 mb-1">
              {achievement.image_url ? (
                <img 
                  src={achievement.image_url} 
                  alt={achievement.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${achievement.color}20` }}
                >
                  <Award className="w-4 h-4" style={{ color: achievement.color }} />
                </div>
              )}
              <span className="font-medium text-sm text-[hsl(var(--bc-text))]">{achievement.name}</span>
            </div>
            {achievement.description && (
              <p className="text-xs text-[hsl(var(--bc-text-muted))]">{achievement.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}