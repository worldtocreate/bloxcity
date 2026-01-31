import { Crown, Medal, Star } from 'lucide-react';

interface MembershipBadgeProps {
  tier: 'bronze' | 'silver' | 'platinum' | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  bronze: {
    label: 'Bronze',
    icon: Medal,
    bgColor: 'bg-amber-600',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-600',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-amber-700',
  },
  silver: {
    label: 'Silver',
    icon: Star,
    bgColor: 'bg-gray-400',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-400',
    gradientFrom: 'from-gray-300',
    gradientTo: 'to-gray-500',
  },
  platinum: {
    label: 'Platinum',
    icon: Crown,
    bgColor: 'bg-purple-500',
    textColor: 'text-purple-500',
    borderColor: 'border-purple-500',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-purple-600',
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
      className={`inline-flex items-center gap-1 ${sizes.padding} rounded-full bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} text-white font-medium ${sizes.fontSize} shadow-sm`}
      title={`${config.label} Member`}
    >
      <Icon className={sizes.iconSize} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
