import { Crown, Medal, Star } from 'lucide-react';

interface MembershipBadgeProps {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    icon: Medal,
    bgColor: '#8B4513', // Brown
    gradientFrom: '#A0522D',
    gradientTo: '#6B3E0A',
  },
  silver: {
    label: 'Silver',
    icon: Star,
    bgColor: '#A8A8A8', // Silver
    gradientFrom: '#C0C0C0',
    gradientTo: '#808080',
  },
  gold: {
    label: 'Gold',
    icon: Crown,
    bgColor: '#FFD700',
    gradientFrom: '#FFD700',
    gradientTo: '#B8860B',
  },
  platinum: {
    label: 'Premium',
    icon: Crown,
    bgColor: '#1a1a1a',
    gradientFrom: '#2d2d2d',
    gradientTo: '#000000',
  },
};

const sizeConfig = {
  sm: { iconSize: 'w-3 h-3', padding: 'px-1.5 py-0.5', fontSize: 'text-xs' },
  md: { iconSize: 'w-4 h-4', padding: 'px-2 py-1', fontSize: 'text-sm' },
  lg: { iconSize: 'w-5 h-5', padding: 'px-3 py-1.5', fontSize: 'text-base' },
};

export default function MembershipBadge({ tier, size = 'sm', showLabel = true }: MembershipBadgeProps) {
  if (!tier || !tierConfig[tier]) return null;

  const config = tierConfig[tier];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span 
      className={`inline-flex items-center gap-1 ${sizes.padding} rounded-full text-white font-medium ${sizes.fontSize} shadow-sm`}
      style={{ background: `linear-gradient(135deg, ${config.gradientFrom}, ${config.gradientTo})` }}
      title={`${config.label} Member`}
    >
      <Icon className={sizes.iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
