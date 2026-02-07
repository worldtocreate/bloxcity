import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Loader2, Wrench } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ComingSoon from './ComingSoon';

function usePageMaintenance(pageKey: string) {
  const [isUnderMaintenance, setIsUnderMaintenance] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const check = async () => {
      try {
        const { data, error } = await supabase.from('admin_settings').select('value').eq('key', 'page_maintenance').single();
        if (error) setIsUnderMaintenance(false);
        else if (data?.value) setIsUnderMaintenance((data.value as Record<string, boolean>)[pageKey] === true);
      } catch { setIsUnderMaintenance(false); }
      finally { setLoading(false); }
    };
    check();
  }, [pageKey]);
  return { isUnderMaintenance, loading };
}

function PageMaintenance({ pageName }: { pageName: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-3">{pageName} Under Maintenance</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-6">We are currently performing scheduled maintenance. Please check back soon!</p>
      </div>
    </div>
  );
}

export default function Trading() {
  const { isUnderMaintenance, loading } = usePageMaintenance('trading');
  const context = useOutletContext<{ isAdmin?: boolean }>();
  const isAdmin = context?.isAdmin || false;
  
  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--bc-primary))]" /></div>;
  if (isUnderMaintenance && !isAdmin) return <PageMaintenance pageName="Trading" />;

  return <ComingSoon title="Trading" description="Trade items securely with other players! This feature is coming soon." />;
}
