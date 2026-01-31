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
    bgColor: 'bg-amber-800',
    textColor: 'text-amber-800',
    borderColor: 'border-amber-800',
    gradientFrom: 'from-amber-700',
    gradientTo: 'to-amber-900',
  },
  silver: {
    label: 'Silver',
    icon: Star,
    bgColor: 'bg-slate-400',
    textColor: 'text-slate-400',
    borderColor: 'border-slate-400',
    gradientFrom: 'from-slate-300',
    gradientTo: 'to-slate-500',
  },
  platinum: {
    label: 'Platinum',
    icon: Crown,
    bgColor: 'bg-zinc-900',
    textColor: 'text-zinc-900',
    borderColor: 'border-zinc-900',
    gradientFrom: 'from-zinc-800',
    gradientTo: 'to-black',
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
