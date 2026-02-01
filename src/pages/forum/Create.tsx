import { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { 
  Megaphone, Users, Plus, Upload, X, AlertCircle, 
  Link as LinkIcon, Clock, Check, Loader2
} from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const BLOCKED_DOMAINS = [
  'porn', 'xxx', 'adult', 'sex', 'nude', 'naked', 'erotic',
  'gambling', 'casino', 'betting', 'drugs', 'weed', 'marijuana'
];

export default function Create() {
  const navigate = useNavigate();
  const context = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
  }>();
  
  const { user, forumUser } = context || {};

  // Group creation state
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [groupIconFile, setGroupIconFile] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState<string | null>(null);
  const groupFileInputRef = useRef<HTMLInputElement>(null);

  // Ad creation state
  const [canSubmitAd, setCanSubmitAd] = useState(false);
  const [loadingAdStatus, setLoadingAdStatus] = useState(true);
  const [submittingAd, setSubmittingAd] = useState(false);
  const [myAds, setMyAds] = useState<any[]>([]);
  const [adType, setAdType] = useState<'banner' | 'skyscraper'>('banner');
  const [adFormData, setAdFormData] = useState({
    title: '',
    description: '',
    destination_url: '',
  });
  const [adImageFile, setAdImageFile] = useState<File | null>(null);
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const adFileInputRef = useRef<HTMLInputElement>(null);

  // Ad type configurations (Roblox-style)
  const AD_TYPES = {
    banner: { 
      name: 'Banner Ad', 
      description: 'Displayed at the top of pages',
      width: 728, 
      height: 90 
    },
    skyscraper: { 
      name: 'Skyscraper Ad', 
      description: 'Displayed on the side of pages',
      width: 160, 
      height: 600 
    }
  } as const;

  // Check ad submission eligibility on mount
  useEffect(() => {
    if (forumUser) {
      checkCanSubmitAd();
      fetchMyAds();
    }
  }, [forumUser]);

  const checkCanSubmitAd = async () => {
    const { data } = await supabase.rpc('can_submit_ad');
    setCanSubmitAd(data ?? false);
    setLoadingAdStatus(false);
  };

  const fetchMyAds = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_ads')
      .select('*')
      .eq('forum_user_id', forumUser.id)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (data) setMyAds(data);
  };

  // Group handlers
  const handleGroupIconSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      setGroupIconFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setGroupIconPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreateGroup = async () => {
    if (!forumUser || !newGroupName.trim()) return;
    
    const GROUP_CREATION_COST = 25;
    if ((forumUser.coins || 0) < GROUP_CREATION_COST) {
      toast.error(`You need ${GROUP_CREATION_COST} coins to create a group. You have ${forumUser.coins || 0}.`);
      return;
    }
    
    setCreatingGroup(true);
    try {
      const { error: coinError } = await supabase
        .from('forum_users')
        .update({ coins: (forumUser.coins || 0) - GROUP_CREATION_COST })
        .eq('id', forumUser.id);

      if (coinError) {
        toast.error('Failed to process payment');
        setCreatingGroup(false);
        return;
      }

      const slug = newGroupName.trim().toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      const { data: group, error } = await supabase
        .from('forum_groups')
        .insert({
          name: newGroupName.trim(),
          slug,
          description: newGroupDescription.trim() || null,
          owner_id: forumUser.id
        })
        .select()
        .single();

      if (error) {
        await supabase
          .from('forum_users')
          .update({ coins: forumUser.coins })
          .eq('id', forumUser.id);
          
        if (error.message.includes('unique')) {
          toast.error('A group with this name already exists');
        } else {
          toast.error('Failed to create group');
        }
        setCreatingGroup(false);
        return;
      }

      if (groupIconFile) {
        const fileExt = groupIconFile.name.split('.').pop();
        const filePath = `group-icons/${group.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('forum-avatars')
          .upload(filePath, groupIconFile);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('forum-avatars')
            .getPublicUrl(filePath);

          await supabase
            .from('forum_group_media_requests')
            .insert({
              group_id: group.id,
              media_type: 'icon',
              image_url: publicUrl
            });
        }
      }

      await supabase
        .from('forum_group_roles')
        .insert({
          group_id: group.id,
          name: 'Member',
          is_default: true,
          rank: 0
        });

      await supabase
        .from('forum_group_members')
        .insert({
          group_id: group.id,
          forum_user_id: forumUser.id
        });

      toast.success(groupIconFile ? 'Group created! Icon pending review.' : 'Group created!');
      navigate(`/group/${slug}`);
    } catch {
      toast.error('Failed to create group');
    }
    setCreatingGroup(false);
  };

  // Ad handlers
  const validateUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      const domain = parsed.hostname.toLowerCase();
      for (const blocked of BLOCKED_DOMAINS) {
        if (domain.includes(blocked)) return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleAdImageUpload = async (file: File) => {
    if (!forumUser) throw new Error('Not logged in');
    const fileExt = file.name.split('.').pop();
    const fileName = `${forumUser.id}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('forum-avatars')
      .upload(`ads/${fileName}`, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('forum-avatars')
      .getPublicUrl(`ads/${fileName}`);

    return publicUrl;
  };

  const handleAdImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    // Read image to check dimensions
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const requiredWidth = AD_TYPES[adType].width;
        const requiredHeight = AD_TYPES[adType].height;

        setImageDimensions({ width: img.width, height: img.height });
        
        if (img.width !== requiredWidth || img.height !== requiredHeight) {
          toast.error(`Image must be exactly ${requiredWidth}x${requiredHeight} pixels. Your image is ${img.width}x${img.height}.`);
          setAdImageFile(null);
          setAdImagePreview(null);
          return;
        }

        setAdImageFile(file);
        setAdImagePreview(event.target?.result as string);
        toast.success('Image dimensions verified!');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitAd = async (e: FormEvent) => {
    e.preventDefault();
    if (!forumUser) return;
    
    if (!validateUrl(adFormData.destination_url)) {
      toast.error('The destination URL is not allowed. Please use a different link.');
      return;
    }

    if (!adImageFile) {
      toast.error('Please upload an ad image');
      return;
    }

    setSubmittingAd(true);

    try {
      const imageUrl = await handleAdImageUpload(adImageFile);

      const { error } = await supabase
        .from('forum_ads')
        .insert({
          forum_user_id: forumUser.id,
          title: adFormData.title,
          description: adFormData.description,
          destination_url: adFormData.destination_url,
          image_url: imageUrl,
          ad_type: adType,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Ad submitted for review!");
      setAdFormData({ title: '', description: '', destination_url: '' });
      setAdImageFile(null);
      setAdImagePreview(null);
      setImageDimensions(null);
      setCanSubmitAd(false);
      fetchMyAds();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingAd(false);
    }
  };

  if (!user || !forumUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <Plus className="w-16 h-16 text-[hsl(var(--bc-text-muted))] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Create Something New</h1>
        <p className="text-[hsl(var(--bc-text-muted))] mb-6">Log in to create groups or submit advertisements</p>
        <Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline">
          Log in to continue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Create</h1>
        <p className="text-[hsl(var(--bc-text-muted))]">Create a new group or submit an advertisement</p>
      </div>

      <Tabs defaultValue="group">
        <TabsList>
          <TabsTrigger value="group" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Create Group
          </TabsTrigger>
          <TabsTrigger value="ad" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Submit Ad
          </TabsTrigger>
        </TabsList>

        {/* Create Group Tab */}
        <TabsContent value="group" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))]">Create New Group</h2>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                Cost: <span className="font-semibold text-amber-600">25 coins</span>
                <span className="ml-2">(You have {forumUser.coins?.toLocaleString() || 0})</span>
              </div>
            </div>

            {/* Group Icon Upload */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Group Icon
              </label>
              <div className="flex items-center gap-4">
                {groupIconPreview ? (
                  <div className="relative">
                    <img 
                      src={groupIconPreview} 
                      alt="Preview" 
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <button
                      onClick={() => {
                        setGroupIconFile(null);
                        setGroupIconPreview(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => groupFileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[hsl(var(--bc-border))] flex flex-col items-center justify-center gap-1 hover:border-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-bg-light))] transition"
                  >
                    <Upload className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                    <span className="text-xs text-[hsl(var(--bc-text-muted))]">Upload</span>
                  </button>
                )}
                <input
                  ref={groupFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGroupIconSelect}
                  className="hidden"
                />
                <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                  Optional. Max 2MB. Requires admin approval.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Group Name
              </label>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value.slice(0, 50))}
                placeholder="Enter group name"
                className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{newGroupName.length}/50</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Description
              </label>
              <textarea
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value.slice(0, 500))}
                placeholder="What is your group about?"
                rows={3}
                className="w-full px-4 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{newGroupDescription.length}/500</p>
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={creatingGroup || !newGroupName.trim() || (forumUser.coins || 0) < 25}
              className="w-full py-3 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {creatingGroup ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create Group (25 coins)
                </>
              )}
            </button>
          </div>
        </TabsContent>

        {/* Submit Ad Tab */}
        <TabsContent value="ad" className="mt-6">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Submit an Advertisement</h2>
            
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

            {!canSubmitAd && !loadingAdStatus ? (
              <div className="text-center py-6">
                <Clock className="w-12 h-12 mx-auto text-[hsl(var(--bc-text-muted))] mb-3" />
                <p className="text-[hsl(var(--bc-text-muted))]">
                  You can submit a new ad in 24 hours
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitAd} className="space-y-4">
                {/* Ad Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                    Ad Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {(Object.entries(AD_TYPES) as [keyof typeof AD_TYPES, typeof AD_TYPES[keyof typeof AD_TYPES]][]).map(([type, config]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setAdType(type);
                          // Clear image when changing type
                          setAdImageFile(null);
                          setAdImagePreview(null);
                          setImageDimensions(null);
                          if (adFileInputRef.current) {
                            adFileInputRef.current.value = '';
                          }
                        }}
                        className={`p-4 rounded-lg border-2 text-left transition ${
                          adType === type
                            ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/10'
                            : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]/50'
                        }`}
                      >
                        <div className="font-medium text-[hsl(var(--bc-text))]">{config.name}</div>
                        <div className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">{config.description}</div>
                        <div className="text-xs font-mono text-[hsl(var(--bc-primary))] mt-2">
                          {config.width} × {config.height} px
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-1">
                    Ad Title
                  </label>
                  <input
                    type="text"
                    value={adFormData.title}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))]"
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
                    value={adFormData.description}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))] resize-none"
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
                    value={adFormData.destination_url}
                    onChange={(e) => setAdFormData(prev => ({ ...prev, destination_url: e.target.value }))}
                    className="w-full px-3 py-2 bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg text-[hsl(var(--bc-text))]"
                    placeholder="https://example.com"
                    required
                  />
                </div>

                {/* Ad Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                    <Upload className="w-4 h-4 inline mr-1" />
                    Ad Image
                  </label>
                  
                  {/* Preview and size guide */}
                  <div className={`relative border-2 border-dashed rounded-lg p-4 transition mb-3 ${
                    adImagePreview 
                      ? 'border-green-500 bg-green-500/5' 
                      : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]'
                  }`}>
                    {adImagePreview ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-center">
                          <img 
                            src={adImagePreview} 
                            alt="Ad preview" 
                            className="max-w-full rounded border border-[hsl(var(--bc-border))]"
                            style={{ 
                              maxWidth: adType === 'banner' ? '100%' : '160px',
                            }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-green-600">
                            <Check className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {imageDimensions?.width} × {imageDimensions?.height} px ✓
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAdImageFile(null);
                              setAdImagePreview(null);
                              setImageDimensions(null);
                              if (adFileInputRef.current) {
                                adFileInputRef.current.value = '';
                              }
                            }}
                            className="text-red-500 hover:text-red-600 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="text-center cursor-pointer"
                        onClick={() => adFileInputRef.current?.click()}
                      >
                        <div className={`mx-auto border-2 border-dashed border-[hsl(var(--bc-primary))]/30 rounded flex items-center justify-center bg-[hsl(var(--bc-bg-light))] mb-3 ${
                          adType === 'banner' ? 'w-full aspect-[728/90]' : 'w-40 aspect-[160/600]'
                        }`}>
                          <div className="text-center p-2">
                            <Upload className="w-6 h-6 text-[hsl(var(--bc-text-muted))] mx-auto mb-1" />
                            <span className="text-xs text-[hsl(var(--bc-text-muted))]">
                              {AD_TYPES[adType].width} × {AD_TYPES[adType].height}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                          Click to upload your ad image
                        </p>
                        <p className="text-xs text-[hsl(var(--bc-primary))] mt-1 font-medium">
                          Must be exactly {AD_TYPES[adType].width} × {AD_TYPES[adType].height} pixels
                        </p>
                      </div>
                    )}
                  </div>

                  <input
                    ref={adFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif"
                    onChange={handleAdImageSelect}
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAd}
                  className="w-full py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg font-medium disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {submittingAd ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Ad for Review'
                  )}
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
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          ad.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                          ad.status === 'denied' ? 'bg-red-500/20 text-red-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {ad.status}
                        </span>
                        <button
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this ad? You still need to wait 24 hours before submitting a new one.')) return;
                            const { error } = await supabase
                              .from('forum_ads')
                              .delete()
                              .eq('id', ad.id);
                            if (error) {
                              toast.error('Failed to delete ad');
                            } else {
                              toast.success('Ad deleted');
                              fetchMyAds();
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                          title="Delete ad"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
