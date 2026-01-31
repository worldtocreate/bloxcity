import { BadgeCheck } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

export default function VerifiedBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <BadgeCheck 
            className={`${sizeClasses[size]} text-blue-500 flex-shrink-0 cursor-help ${className}`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>This user has been verified by BLOX City.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
