import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import defaultAvatar from '@/assets/default-avatar.png';

export type AvatarEffect =
  | 'glow-gold'
  | 'glow-purple'
  | 'glow-rainbow'
  | 'pulse-blue'
  | 'pulse-green'
  | 'frame-crown'
  | 'frame-fire'
  | 'frame-stars'
  | 'frame-diamond'
  | 'frame-lightning'
  | null;

interface UserAvatarProps {
  avatarUrl: string | null;
  username: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  effect?: AvatarEffect | string | null;
  membershipTier?: 'bronze' | 'silver' | 'platinum' | null;
  className?: string;
  showEffects?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const frameSizes = {
  xs: 'w-8 h-8',
  sm: 'w-10 h-10',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

const effectStyles: Record<string, string> = {
  'glow-gold': 'ring-2 ring-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse',
  'glow-purple': 'ring-2 ring-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.6)] animate-pulse',
  'glow-rainbow': 'ring-2 ring-offset-2 ring-offset-transparent animate-rainbow-glow',
  'pulse-blue': 'ring-2 ring-blue-500 animate-pulse-ring-blue',
  'pulse-green': 'ring-2 ring-green-500 animate-pulse-ring-green',
};

const frameOverlays: Record<string, { emoji: string; position: string }> = {
  'frame-crown': { emoji: '👑', position: '-top-3 left-1/2 -translate-x-1/2' },
  'frame-fire': { emoji: '🔥', position: '-bottom-1 left-1/2 -translate-x-1/2' },
  'frame-stars': { emoji: '✨', position: '-top-2 -right-2' },
  'frame-diamond': { emoji: '💎', position: '-top-2 -right-2' },
  'frame-lightning': { emoji: '⚡', position: '-top-2 -right-2' },
};

const UserAvatar = forwardRef<HTMLDivElement, UserAvatarProps>(({ 
  avatarUrl, 
  username, 
  size = 'md', 
  effect, 
  membershipTier,
  className,
  showEffects = true,
}, ref) => {
  const hasEffect = showEffects && effect && membershipTier;
  const effectClass = hasEffect && effect in effectStyles ? effectStyles[effect] : '';
  const frameOverlay = hasEffect && effect && effect in frameOverlays ? frameOverlays[effect] : null;

  const avatarSrc = avatarUrl || defaultAvatar;

  return (
    <div ref={ref} className={cn('relative inline-flex items-center justify-center', frameSizes[size])}>
      <img 
        src={avatarSrc} 
        alt={username}
        className={cn(
          sizeClasses[size],
          'rounded-full object-cover bg-[hsl(var(--bc-gray-200))]',
          effectClass,
          className
        )}
      />
      
      
      {/* Frame Overlay */}
      {frameOverlay && (
        <span 
          className={cn(
            'absolute text-lg z-10 pointer-events-none animate-bounce-subtle',
            frameOverlay.position,
            size === 'xs' && 'text-xs',
            size === 'sm' && 'text-sm',
            size === 'lg' && 'text-xl',
            size === 'xl' && 'text-2xl',
          )}
        >
          {frameOverlay.emoji}
        </span>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar;

// Export the list of available effects for use in settings
export const AVATAR_EFFECTS: { value: AvatarEffect; label: string; category: 'glow' | 'pulse' | 'frame' }[] = [
  { value: 'glow-gold', label: 'Gold Glow', category: 'glow' },
  { value: 'glow-purple', label: 'Purple Glow', category: 'glow' },
  { value: 'glow-rainbow', label: 'Rainbow Glow', category: 'glow' },
  { value: 'pulse-blue', label: 'Blue Pulse', category: 'pulse' },
  { value: 'pulse-green', label: 'Green Pulse', category: 'pulse' },
  { value: 'frame-crown', label: 'Crown', category: 'frame' },
  { value: 'frame-fire', label: 'Fire', category: 'frame' },
  { value: 'frame-stars', label: 'Stars', category: 'frame' },
  { value: 'frame-diamond', label: 'Diamond', category: 'frame' },
  { value: 'frame-lightning', label: 'Lightning', category: 'frame' },
];
