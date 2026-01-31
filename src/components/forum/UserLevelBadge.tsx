import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserLevelBadgeProps {
  level: number;
  xp?: number;
  size?: 'sm' | 'md' | 'lg';
  showXp?: boolean;
}

// Calculate XP required for next level
function getXpForLevel(level: number): number {
  // Inverse of the level formula: xp = 50 * level^2 + 50 * level - 100
  return 50 * level * level + 50 * level - 100;
}

function getXpProgress(currentXp: number, currentLevel: number): number {
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  const xpIntoLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  return Math.min(100, Math.max(0, (xpIntoLevel / xpNeeded) * 100));
}

export default function UserLevelBadge({ level, xp = 0, size = 'sm', showXp = false }: UserLevelBadgeProps) {
  const progress = getXpProgress(xp, level);
  const nextLevelXp = getXpForLevel(level + 1);
  
  const sizeStyles = {
    sm: 'text-xs px-1.5 py-0.5 gap-0.5',
    md: 'text-sm px-2 py-1 gap-1',
    lg: 'text-base px-3 py-1.5 gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Color based on level tiers
  const getLevelColor = () => {
    if (level >= 50) return 'from-purple-500 to-pink-500 text-white'; // Legendary
    if (level >= 30) return 'from-amber-400 to-amber-600 text-white'; // Epic
    if (level >= 15) return 'from-blue-400 to-blue-600 text-white'; // Rare
    if (level >= 5) return 'from-green-400 to-green-600 text-white'; // Uncommon
    return 'from-gray-400 to-gray-500 text-white'; // Common
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <span 
        className={cn(
          'inline-flex items-center rounded-full font-semibold bg-gradient-to-r shadow-sm',
          sizeStyles[size],
          getLevelColor()
        )}
        title={`Level ${level} • ${xp.toLocaleString()} XP`}
      >
        <Star className={cn(iconSizes[size], 'fill-current')} />
        Lv.{level}
      </span>
      
      {showXp && (
        <div className="w-full">
          <div className="h-1.5 bg-[hsl(var(--bc-bg-light))] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[hsl(var(--bc-primary))] to-[hsl(var(--bc-accent))] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-[hsl(var(--bc-text-muted))] mt-0.5">
            {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
          </div>
        </div>
      )}
    </div>
  );
}
