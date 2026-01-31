import { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, AlertCircle, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AdSubmissionFormProps {
  forumUserId: string;
}

const BLOCKED_DOMAINS = [
  'porn', 'xxx', 'adult', 'sex', 'nude', 'naked', 'erotic',
  'gambling', 'casino', 'betting', 'drugs', 'weed', 'marijuana'
];

export default function AdSubmissionForm({ forumUserId }: AdSubmissionFormProps) {
  const [canSubmit, setCanSubmit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [myAds, setMyAds] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    destination_url: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkCanSubmit();
    fetchMyAds();
  }, [forumUserId]);

  const checkCanSubmit = async () => {
    const { data } = await supabase.rpc('can_submit_ad');
    setCanSubmit(data ?? false);
    setLoading(false);
  };

  const fetchMyAds = async () => {
    const { data } = await supabase
      .from('forum_ads')
      .select('*')
      .eq('forum_user_id', forumUserId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setMyAds(data);
  };

  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.toLowerCase();
      
      // Check for blocked domains
      for (const blocked of BLOCKED_DOMAINS) {
        if (domain.includes(blocked)) {
          return false;
        }
      }
      
      return true;
    } catch {
      return false;
    }
  };

  const handleImageUpload = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${forumUserId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('forum-avatars')
      .upload(`ads/${fileName}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('forum-avatars')
      .getPublicUrl(`ads/${fileName}`);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(formData.destination_url)) {
      toast({
        title: "Invalid URL",
        description: "The destination URL is not allowed. Please use a different link.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = formData.image_url;
      
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
      }

      if (!imageUrl) {
        throw new Error('Please provide an image');
      }

      const { error } = await supabase
        .from('forum_ads')
        .insert({
          forum_user_id: forumUserId,
          title: formData.title,
          description: formData.description,
          destination_url: formData.destination_url,
          image_url: imageUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Ad Submitted!",
        description: "Your ad is pending review. You'll be notified when it's approved."
      });

      setFormData({ title: '', description: '', destination_url: '', image_url: '' });
      setImageFile(null);
      setCanSubmit(false);
      fetchMyAds();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-40 bg-[hsl(var(--bc-bg-light))] rounded-xl" />;
  }

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
      <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Submit an Advertisement</h3>
      
      <div className="bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[hsl(var(--bc-primary))] mt-0.5" />
          <div className="text-sm text-[hsl(var(--bc-text-muted))]">
            <p className="font-medium text-[hsl(var(--bc-text))] mb-1">Ad Guidelines:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>You can submit one ad every 24 hours</li>
              <li>Earn 5 coins per unique click on your ad</li>
              <li>No adult, gambling, or illegal content</li>
              <li>Ads must be reviewed before going live</li>
            </ul>
          </div>
        </div>
      </div>

      {!canSubmit ? (
        <div className="text-center py-6">
          <Clock className="w-12 h-12 mx-auto text-[hsl(var(--bc-text-muted))] mb-3" />
          <p className="text-[hsl(var(--bc-text-muted))]">
            You can submit a new ad in 24 hours
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">
              Ad Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-[hsl(var(--bc-bg))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))]"
              placeholder="Enter a catchy title"
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-[hsl(var(--bc-bg))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] resize-none"
              placeholder="Brief description of your ad"
              rows={2}
              maxLength={200}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">
              <LinkIcon className="w-4 h-4 inline mr-1" />
              Destination URL
            </label>
            <input
              type="url"
              value={formData.destination_url}
              onChange={(e) => setFormData(prev => ({ ...prev, destination_url: e.target.value }))}
              className="w-full px-3 py-2 bg-[hsl(var(--bc-bg))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))]"
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">
              <Upload className="w-4 h-4 inline mr-1" />
              Ad Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 bg-[hsl(var(--bc-bg))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))]"
            />
            <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
              Recommended size: 728x90 or 300x250
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg font-medium disabled:opacity-50 transition"
          >
            {submitting ? 'Submitting...' : 'Submit Ad for Review'}
          </button>
        </form>
      )}

      {/* My Ads History */}
      {myAds.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[hsl(var(--bc-border))]">
          <h4 className="text-sm font-medium text-[hsl(var(--bc-text))] mb-3">Your Ads</h4>
          <div className="space-y-2">
            {myAds.map((ad) => (
              <div key={ad.id} className="flex items-center justify-between p-3 bg-[hsl(var(--bc-bg-light))] rounded-lg">
                <div className="flex items-center gap-3">
                  <img src={ad.image_url} alt="" className="w-12 h-8 object-cover rounded" />
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--bc-text))]">{ad.title}</p>
                    <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                      {ad.click_count} clicks • {ad.coins_earned} coins earned
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  ad.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  ad.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                  'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {ad.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
