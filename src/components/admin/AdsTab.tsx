import { useState, useEffect } from 'react';
import { Check, X, ExternalLink, MousePointer, Coins, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  destination_url: string;
  status: string;
  click_count: number;
  coins_earned: number;
  created_at: string;
  denial_reason: string | null;
  forum_user: { username: string };
}

export default function AdsTab() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'denied' | 'all'>('pending');
  const [denialReason, setDenialReason] = useState('');
  const [denyingId, setDenyingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => { fetchAds(); }, [filter]);

  const fetchAds = async () => {
    let query = supabase.from('forum_ads').select('*, forum_user:forum_user_id (username)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setAds((data as unknown as Ad[]) || []);
    setLoading(false);
  };

  const handleApprove = async (adId: string) => {
    const { error } = await supabase.from('forum_ads').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', adId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ad Approved', description: 'The ad is now live.' }); fetchAds(); }
  };

  const handleDeny = async (adId: string) => {
    if (!denialReason.trim()) { toast({ title: 'Error', description: 'Please provide a denial reason', variant: 'destructive' }); return; }
    const { error } = await supabase.from('forum_ads').update({ status: 'denied', denial_reason: denialReason, reviewed_at: new Date().toISOString() }).eq('id', adId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ad Denied', description: 'The user has been notified.' }); setDenyingId(null); setDenialReason(''); fetchAds(); }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    const { error } = await supabase.from('forum_ads').delete().eq('id', adId);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Ad Deleted', description: 'The ad has been removed.' }); fetchAds(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Advertisement Management</h2>
        <div className="flex gap-2">
          {(['pending', 'approved', 'denied', 'all'] as const).map(status => (
            <button key={status} onClick={() => setFilter(status)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition ${filter === status ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{status}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-32 rounded-lg bg-white/5" />)}</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No {filter === 'all' ? '' : filter} ads found</div>
      ) : (
        <div className="space-y-4">
          {ads.map(ad => (
            <div key={ad.id} className="rounded-xl border border-white/10 bg-[#12121a] p-4">
              <div className="flex gap-4">
                <img src={ad.image_url} alt={ad.title} className="w-40 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div><h3 className="font-semibold text-white">{ad.title}</h3><p className="text-sm text-gray-400">by {ad.forum_user?.username || 'Unknown'}</p></div>
                    <span className={`px-2 py-1 text-xs rounded-full ${ad.status === 'approved' ? 'bg-green-500/20 text-green-400' : ad.status === 'denied' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{ad.status}</span>
                  </div>
                  {ad.description && <p className="text-sm text-gray-300 mb-2">{ad.description}</p>}
                  <div className="flex items-center gap-4 text-sm">
                    <a href={ad.destination_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline"><ExternalLink className="w-3 h-3" />{new URL(ad.destination_url).hostname}</a>
                    <span className="flex items-center gap-1 text-gray-400"><MousePointer className="w-3 h-3" />{ad.click_count} clicks</span>
                    <span className="flex items-center gap-1 text-gray-400"><Coins className="w-3 h-3" />{ad.coins_earned} coins earned</span>
                  </div>
                  {ad.denial_reason && <p className="text-sm text-red-400 mt-2">Denial reason: {ad.denial_reason}</p>}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                {ad.status === 'pending' ? (
                  denyingId === ad.id ? (
                    <div className="flex gap-2">
                      <input type="text" value={denialReason} onChange={e => setDenialReason(e.target.value)} placeholder="Reason for denial..." className="flex-1 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white" />
                      <button onClick={() => handleDeny(ad.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition">Confirm Deny</button>
                      <button onClick={() => { setDenyingId(null); setDenialReason(''); }} className="px-4 py-2 rounded-lg bg-white/5 text-gray-300">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => handleApprove(ad.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition"><Check className="w-4 h-4" />Approve</button>
                      <button onClick={() => setDenyingId(ad.id)} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition"><X className="w-4 h-4" />Deny</button>
                      <button onClick={() => handleDelete(ad.id)} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition ml-auto"><Trash2 className="w-4 h-4" />Delete</button>
                    </div>
                  )
                ) : (
                  <button onClick={() => handleDelete(ad.id)} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 rounded-lg hover:bg-white/10 transition"><Trash2 className="w-4 h-4" />Delete Ad</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
