import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useForumAuth } from '@/hooks/useForumAuth';
import { Award, Loader2, Users, CheckCircle, Lock } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  color: string | null;
  owner_count: number;
  is_earned: boolean;
}

export default function Achievements() {
  const { forumUser } = useForumAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, [forumUser]);

  const fetchAchievements = async () => {
    const { data: achievementsData } = await supabase
      .from('forum_achievements')
      .select('*')
      .order('created_at', { ascending: false });

    if (achievementsData) {
      // Fetch user's earned achievements if logged in
      const userAchievementIds: Set<string> = new Set();
      if (forumUser) {
        const { data: userAchievements } = await supabase
          .from('forum_user_achievements')
          .select('achievement_id')
          .eq('forum_user_id', forumUser.id);
        if (userAchievements) {
          userAchievements.forEach((ua) => userAchievementIds.add(ua.achievement_id));
        }
      }

      // Fetch owner counts
      const achievementsWithCounts = await Promise.all(
        achievementsData.map(async (achievement) => {
          const { count } = await supabase
            .from('forum_user_achievements')
            .select('*', { count: 'exact', head: true })
            .eq('achievement_id', achievement.id);

          return {
            ...achievement,
            owner_count: count || 0,
            is_earned: userAchievementIds.has(achievement.id),
          };
        })
      );

      // Sort: earned first, then by name
      achievementsWithCounts.sort((a, b) => {
        if (a.is_earned !== b.is_earned) return a.is_earned ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

      setAchievements(achievementsWithCounts as Achievement[]);
    }
    setLoading(false);
  };

  const earnedCount = achievements.filter((a) => a.is_earned).length;

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
            Badges
          </h1>
          <p className="text-[hsl(var(--bc-text-muted))]">
            {forumUser ? (
              <>{earnedCount} of {achievements.length} badges collected</>
            ) : (
              <>{achievements.length} badges available</>
            )}
          </p>
        </div>
        {forumUser && earnedCount > 0 && achievements.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg" style={{ background: 'hsl(var(--bc-input-bg))' }}>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-[hsl(var(--bc-text))]">
              {Math.round((earnedCount / achievements.length) * 100)}% Complete
            </span>
          </div>
        )}
      </div>

      {/* Badges Grid */}
      {achievements.length === 0 ? (
        <div className="text-center py-12 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl">
          <Award className="w-12 h-12 text-[hsl(var(--bc-text-muted))] mx-auto mb-3" />
          <p className="text-[hsl(var(--bc-text-muted))]">No badges available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-4 rounded-xl border border-[hsl(var(--bc-border))] bg-[hsl(var(--bc-bg-card))] transition hover:scale-[1.02] ${
                !achievement.is_earned ? 'opacity-50 grayscale' : ''
              }`}
            >
              <div className="text-center">
                {/* Badge Image/Icon */}
                <div className="relative inline-block mb-3">
                  {achievement.image_url ? (
                    <img
                      src={achievement.image_url}
                      alt={achievement.name}
                      className="w-16 h-16 rounded-xl object-cover mx-auto"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto"
                      style={{ backgroundColor: achievement.color || '#FFD700' }}
                    >
                      <Award className="w-8 h-8 text-white" />
                    </div>
                  )}
                  {/* Earned/Locked indicator */}
                  {achievement.is_earned ? (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  ) : (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Badge Name */}
                <h3 className="font-semibold text-[hsl(var(--bc-text))] text-sm mb-2">
                  {achievement.name}
                </h3>

                {/* Full Description */}
                <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-3">
                  {achievement.description || 'No description available'}
                </p>

                {/* Owner Count */}
                <div className="flex items-center justify-center gap-1 text-xs text-[hsl(var(--bc-text-muted))] pt-2 border-t border-[hsl(var(--bc-border))]">
                  <Users className="w-3 h-3" />
                  <span>
                    {achievement.owner_count.toLocaleString()} {achievement.owner_count === 1 ? 'owner' : 'owners'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
