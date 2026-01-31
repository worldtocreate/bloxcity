import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star, MessageSquare, CheckCircle, Heart, Trophy, Crown, Award } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  rarity: string;
  awarded_at: string;
}

interface UserAchievementsProps {
  forumUserId: string;
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  'star': Star,
  'message-square': MessageSquare,
  'check-circle': CheckCircle,
  'heart': Heart,
  'trophy': Trophy,
  'crown': Crown,
};

const rarityStyles: Record<string, string> = {
  'common': 'bg-gray-100 border-gray-300',
  'rare': 'bg-blue-50 border-blue-300',
  'epic': 'bg-purple-50 border-purple-300',
  'legendary': 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400',
};

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
          id, name, description, icon, color, rarity
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
        {achievements.slice(0, 5).map(achievement => {
          const IconComponent = iconMap[achievement.icon] || Award;
          return (
            <div
              key={achievement.id}
              className="group relative"
              title={achievement.name}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border ${rarityStyles[achievement.rarity] || rarityStyles.common}`}
              >
                <IconComponent className="w-3 h-3" style={{ color: achievement.color }} />
              </div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-[hsl(var(--bc-bg-dark))] text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                {achievement.name}
              </div>
            </div>
          );
        })}
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
        {achievements.map(achievement => {
          const IconComponent = iconMap[achievement.icon] || Award;
          return (
            <div
              key={achievement.id}
              className={`p-3 rounded-lg border ${rarityStyles[achievement.rarity] || rarityStyles.common}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <IconComponent className="w-5 h-5" style={{ color: achievement.color }} />
                <span className="font-medium text-sm text-[hsl(var(--bc-text))]">{achievement.name}</span>
              </div>
              {achievement.description && (
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">{achievement.description}</p>
              )}
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1 capitalize">{achievement.rarity}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
