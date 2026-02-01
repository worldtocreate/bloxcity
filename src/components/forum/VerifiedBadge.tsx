import { useState, useEffect } from 'react';
import { BadgeCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Link } from 'react-router-dom';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface AffiliateInfo {
  is_affiliate: boolean;
  gold_user_id: string;
  gold_username: string;
  gold_avatar_url: string | null;
}

const sizeClasses = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-6 h-6',
};

const avatarSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

// Hook to fetch verification status
export function useVerificationStatus(forumUserId: string | undefined) {
  const [hasGold, setHasGold] = useState(false);
  const [affiliateInfo, setAffiliateInfo] = useState<AffiliateInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!forumUserId) {
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      // Check for gold checkmark
      const { data: goldData } = await supabase.rpc('has_gold_checkmark', { 
        _forum_user_id: forumUserId 
      });
      setHasGold(goldData === true);

      // Check for affiliate status
      if (!goldData) {
        const { data: affData } = await supabase.rpc('get_affiliate_info', { 
          _forum_user_id: forumUserId 
        });
        if (affData && affData.length > 0) {
          setAffiliateInfo(affData[0] as AffiliateInfo);
        }
      }

      setLoading(false);
    };

    fetchStatus();
  }, [forumUserId]);

  return { hasGold, affiliateInfo, loading };
}

// Simple verified badge (blue checkmark for is_verified users)
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

// Gold checkmark badge
export function GoldBadge({ size = 'md', className = '' }: VerifiedBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <BadgeCheck 
            className={`${sizeClasses[size]} text-yellow-500 flex-shrink-0 cursor-help ${className}`}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>This user has been verified by BLOX City.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Affiliate badge with gold user avatar
export function AffiliateBadge({ 
  size = 'md', 
  goldUsername, 
  goldAvatarUrl,
  className = '' 
}: VerifiedBadgeProps & { goldUsername: string; goldAvatarUrl: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className={`inline-flex items-center gap-0.5 flex-shrink-0 cursor-pointer focus:outline-none ${className}`}
          onClick={() => setOpen(true)}
        >
          <BadgeCheck 
            className={`${sizeClasses[size]} text-blue-500`}
          />
          {goldAvatarUrl ? (
            <img 
              src={goldAvatarUrl} 
              alt={goldUsername}
              className={`${avatarSizes[size]} rounded-full object-cover border border-blue-500`}
            />
          ) : (
            <div className={`${avatarSizes[size]} rounded-full bg-blue-500 flex items-center justify-center`}>
              <span className="text-white text-[8px] font-bold">
                {goldUsername.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))]">
        <div className="flex items-center gap-3 mb-3">
          {goldAvatarUrl ? (
            <img 
              src={goldAvatarUrl} 
              alt={goldUsername}
              className="w-10 h-10 rounded-full object-cover border-2 border-yellow-500"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center">
              <span className="text-white font-bold">
                {goldUsername.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[hsl(var(--bc-text))]">@{goldUsername}</span>
              <BadgeCheck className="w-4 h-4 text-yellow-500" />
            </div>
            <span className="text-xs text-[hsl(var(--bc-text-muted))]">Verified User</span>
          </div>
        </div>
        <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-3">
          This account is verified because it's an affiliate of <strong className="text-[hsl(var(--bc-text))]">@{goldUsername}</strong> on BLOX City.
        </p>
        <Link
          to={`/user/${goldUsername}`}
          className="block text-center text-sm bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white py-2 rounded-lg transition"
          onClick={() => setOpen(false)}
        >
          View Profile
        </Link>
      </PopoverContent>
    </Popover>
  );
}

// Combined badge that shows gold, affiliate, or regular verified badge
export function VerificationBadge({ 
  size = 'md', 
  className = '',
  forumUserId,
  isVerified = false
}: VerifiedBadgeProps & { forumUserId?: string; isVerified?: boolean }) {
  const { hasGold, affiliateInfo, loading } = useVerificationStatus(forumUserId);

  if (loading) return null;

  // Gold checkmark takes priority
  if (hasGold) {
    return <GoldBadge size={size} className={className} />;
  }

  // Affiliate badge (blue + gold user avatar)
  if (affiliateInfo) {
    return (
      <AffiliateBadge 
        size={size} 
        className={className}
        goldUsername={affiliateInfo.gold_username}
        goldAvatarUrl={affiliateInfo.gold_avatar_url}
      />
    );
  }

  // Regular verified badge (for is_verified users)
  if (isVerified) {
    return <VerifiedBadge size={size} className={className} />;
  }

  return null;
}
