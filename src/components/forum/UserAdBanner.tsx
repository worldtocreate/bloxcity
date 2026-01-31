import { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Ad {
  id: string;
  image_url: string;
  destination_url: string;
  title: string;
  ad_type: 'banner' | 'skyscraper';
  forum_user_id: string;
  forum_user?: {
    username: string;
  };
}

interface UserAdBannerProps {
  type?: 'banner' | 'skyscraper';
}

export default function UserAdBanner({ type = 'banner' }: UserAdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    fetchRandomAd();
  }, [type]);

  const fetchRandomAd = async () => {
    const { data } = await supabase
      .from('forum_ads')
      .select('id, image_url, destination_url, title, ad_type, forum_user_id, forum_user:forum_user_id(username)')
      .eq('status', 'approved')
      .eq('ad_type', type)
      .limit(10);

    if (data && data.length > 0) {
      // Pick a random ad
      const randomAd = data[Math.floor(Math.random() * data.length)];
      setAd(randomAd as unknown as Ad);
    }
  };

  const handleClick = async () => {
    if (!ad || clicking) return;
    
    setClicking(true);
    
    try {
      const { data, error } = await supabase.rpc('click_ad', {
        ad_id: ad.id,
        clicker_ip: 'client',
        clicker_agent: navigator.userAgent
      });

      if (error) {
        console.error('Click error:', error);
      } else if (data && typeof data === 'object' && 'success' in data && !data.success) {
        console.log((data as any).error);
      }
    } catch (err) {
      console.error('Click tracking error:', err);
    }
    
    window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
    setClicking(false);
  };

  if (!ad || dismissed) return null;

  // Banner ad (728x90)
  if (type === 'banner') {
    return (
      <div className="relative bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden mb-4">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
        >
          <X className="w-3 h-3" />
        </button>
        
        <div 
          className="cursor-pointer hover:opacity-95 transition"
          onClick={handleClick}
        >
          <img 
            src={ad.image_url} 
            alt={ad.title}
            className="w-full"
            style={{ aspectRatio: '728/90', objectFit: 'cover' }}
          />
          <div className="px-2 py-1 flex items-center justify-between bg-[hsl(var(--bc-bg-light))]">
            <span className="text-[10px] text-[hsl(var(--bc-text-muted))]">
              Ad by {ad.forum_user?.username || 'User'}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-[hsl(var(--bc-primary))]">
              <ExternalLink className="w-2.5 h-2.5" />
              <span>Visit</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Skyscraper ad (160x600)
  return (
    <div className="relative bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-1 right-1 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
      >
        <X className="w-3 h-3" />
      </button>
      
      <div 
        className="cursor-pointer hover:opacity-95 transition"
        onClick={handleClick}
      >
        <img 
          src={ad.image_url} 
          alt={ad.title}
          className="w-full"
          style={{ aspectRatio: '160/600', objectFit: 'cover' }}
        />
        <div className="px-2 py-1 text-center bg-[hsl(var(--bc-bg-light))]">
          <span className="text-[10px] text-[hsl(var(--bc-text-muted))]">
            Ad by {ad.forum_user?.username || 'User'}
          </span>
        </div>
      </div>
    </div>
  );
}
