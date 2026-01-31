import { useState, useEffect } from 'react';
import { ExternalLink, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  image_url: string;
  destination_url: string;
  title: string;
  forum_user_id: string;
  forum_user?: {
    username: string;
  };
}

export default function UserAdBanner() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [clicking, setClicking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRandomAd();
  }, []);

  const fetchRandomAd = async () => {
    const { data } = await supabase
      .from('forum_ads')
      .select('id, image_url, destination_url, title, forum_user_id, forum_user:forum_user_id(username)')
      .eq('status', 'approved')
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
      // Get IP for anti-bot (we'll use a placeholder, the function handles it server-side)
      const { data, error } = await supabase.rpc('click_ad', {
        ad_id: ad.id,
        clicker_ip: 'client', // Server will get real IP
        clicker_agent: navigator.userAgent
      });

      if (error) {
        console.error('Click error:', error);
      } else if (data && typeof data === 'object' && 'success' in data && !data.success) {
        // Silent fail for rate limits etc
        console.log((data as any).error);
      }
    } catch (err) {
      console.error('Click tracking error:', err);
    }
    
    // Open the link regardless
    window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
    setClicking(false);
  };

  if (!ad || dismissed) return null;

  return (
    <div className="relative bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg overflow-hidden mb-4">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 z-10 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition"
      >
        <X className="w-4 h-4" />
      </button>
      
      <div 
        className="cursor-pointer hover:opacity-95 transition"
        onClick={handleClick}
      >
        <img 
          src={ad.image_url} 
          alt={ad.title}
          className="w-full h-24 object-cover"
        />
        <div className="p-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[hsl(var(--bc-text-muted))]">
            <span>Ad by {ad.forum_user?.username || 'User'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[hsl(var(--bc-primary))]">
            <ExternalLink className="w-3 h-3" />
            <span>Visit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
