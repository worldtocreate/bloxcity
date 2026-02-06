import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Ban, Clock, Search, RefreshCw, Check, X, Shield, Image, BadgeCheck, ImageIcon, Star, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ForumUserData {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_suspended: boolean;
  is_verified: boolean;
  suspension_reason: string | null;
  suspension_ends_at: string | null;
  post_count: number;
  created_at: string;
  membership_tier: string | null;
}

interface AvatarRequest {
  id: string;
  forum_user_id: string;
  image_url: string;
  status: string;
  created_at: string;
  forum_user?: { username: string };
}

interface CoverRequest {
  id: string;
  forum_user_id: string;
  image_url: string;
  status: string;
  created_at: string;
  forum_user?: { username: string };
}

interface VerificationRequest {
  id: string;
  forum_user_id: string;
  status: string;
  reason: string | null;
  denial_reason: string | null;
  created_at: string;
  forum_user?: { username: string; avatar_url: string | null };
}

export default function ForumModTab() {
  const [forumUsers, setForumUsers] = useState<ForumUserData[]>([]);
  const [avatarRequests, setAvatarRequests] = useState<AvatarRequest[]>([]);
  const [coverRequests, setCoverRequests] = useState<CoverRequest[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAvatars, setLoadingAvatars] = useState(true);
  const [loadingCovers, setLoadingCovers] = useState(true);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const [search, setSearch] = useState('');
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspensionDays, setSuspensionDays] = useState('7');
  const [suspending, setSuspending] = useState(false);
  const [activeSection, setActiveSection] = useState<'users' | 'avatars' | 'covers' | 'verification' | 'memberships'>('users');
  const [processingAvatar, setProcessingAvatar] = useState<string | null>(null);
  const [processingCover, setProcessingCover] = useState<string | null>(null);
  const [processingVerification, setProcessingVerification] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null);
  const [showDenyCoverModal, setShowDenyCoverModal] = useState<string | null>(null);
  const [coverDenyReason, setCoverDenyReason] = useState('');
  const [showDenyVerificationModal, setShowDenyVerificationModal] = useState<string | null>(null);
  const [verifyDenyReason, setVerifyDenyReason] = useState('');
  const [showMembershipModal, setShowMembershipModal] = useState<string | null>(null);
  const [selectedMembership, setSelectedMembership] = useState<string>('');
  const [savingMembership, setSavingMembership] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState<string | null>(null);
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    fetchForumUsers();
    fetchAvatarRequests();
    fetchCoverRequests();
    fetchVerificationRequests();
  }, []);

  const fetchForumUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('forum_users').select('*').order('created_at', { ascending: false });
    if (data) setForumUsers(data);
    setLoading(false);
  };

  const fetchAvatarRequests = async () => {
    setLoadingAvatars(true);
    const { data } = await supabase.from('forum_avatar_requests').select('*, forum_user:forum_user_id (username)').eq('status', 'pending').order('created_at', { ascending: true });
    if (data) setAvatarRequests(data as AvatarRequest[]);
    setLoadingAvatars(false);
  };

  const fetchCoverRequests = async () => {
    setLoadingCovers(true);
    const { data } = await supabase.from('forum_cover_requests').select('*, forum_user:forum_user_id (username)').eq('status', 'pending').order('created_at', { ascending: true });
    if (data) setCoverRequests(data as CoverRequest[]);
    setLoadingCovers(false);
  };

  const fetchVerificationRequests = async () => {
    setLoadingVerifications(true);
    const { data } = await supabase.from('forum_verification_requests').select('*, forum_user:forum_user_id (username, avatar_url)').eq('status', 'pending').order('created_at', { ascending: true });
    if (data) setVerificationRequests(data as VerificationRequest[]);
    setLoadingVerifications(false);
  };

  const handleApproveAvatar = async (request: AvatarRequest) => {
    setProcessingAvatar(request.id);
    const { error: updateError } = await supabase.from('forum_avatar_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', request.id);
    if (updateError) { toast.error('Failed to approve avatar'); setProcessingAvatar(null); return; }
    const { error: userError } = await supabase.from('forum_users').update({ avatar_url: request.image_url }).eq('id', request.forum_user_id);
    if (userError) toast.error('Failed to update user avatar');
    else { toast.success('Avatar approved and updated'); fetchAvatarRequests(); fetchForumUsers(); }
    setProcessingAvatar(null);
  };

  const handleDenyAvatar = async (requestId: string) => {
    setProcessingAvatar(requestId);
    const { error } = await supabase.from('forum_avatar_requests').update({ status: 'denied', denial_reason: denyReason || 'Image does not meet community guidelines', reviewed_at: new Date().toISOString() }).eq('id', requestId);
    if (error) toast.error('Failed to deny avatar');
    else { toast.success('Avatar request denied'); fetchAvatarRequests(); setShowDenyModal(null); setDenyReason(''); }
    setProcessingAvatar(null);
  };

  const handleApproveCover = async (request: CoverRequest) => {
    setProcessingCover(request.id);
    const { error: updateError } = await supabase.from('forum_cover_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', request.id);
    if (updateError) { toast.error('Failed to approve cover'); setProcessingCover(null); return; }
    const { error: userError } = await supabase.from('forum_users').update({ cover_url: request.image_url }).eq('id', request.forum_user_id);
    if (userError) toast.error('Failed to update user cover');
    else { toast.success('Cover photo approved'); fetchCoverRequests(); fetchForumUsers(); }
    setProcessingCover(null);
  };

  const handleDenyCover = async (requestId: string) => {
    setProcessingCover(requestId);
    const { error } = await supabase.from('forum_cover_requests').update({ status: 'denied', denial_reason: coverDenyReason || 'Image does not meet community guidelines', reviewed_at: new Date().toISOString() }).eq('id', requestId);
    if (error) toast.error('Failed to deny cover');
    else { toast.success('Cover request denied'); fetchCoverRequests(); setShowDenyCoverModal(null); setCoverDenyReason(''); }
    setProcessingCover(null);
  };

  const handleApproveVerification = async (request: VerificationRequest) => {
    setProcessingVerification(request.id);
    const { error: updateError } = await supabase.from('forum_verification_requests').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', request.id);
    if (updateError) { toast.error('Failed to approve verification'); setProcessingVerification(null); return; }
    const { error: userError } = await supabase.from('forum_users').update({ is_verified: true }).eq('id', request.forum_user_id);
    if (userError) toast.error('Failed to update user verification');
    else { toast.success('User verified!'); fetchVerificationRequests(); fetchForumUsers(); }
    setProcessingVerification(null);
  };

  const handleDenyVerification = async (requestId: string) => {
    setProcessingVerification(requestId);
    const { error } = await supabase.from('forum_verification_requests').update({ status: 'denied', denial_reason: verifyDenyReason || 'Does not meet verification criteria', reviewed_at: new Date().toISOString() }).eq('id', requestId);
    if (error) toast.error('Failed to deny verification');
    else { toast.success('Verification request denied'); fetchVerificationRequests(); setShowDenyVerificationModal(null); setVerifyDenyReason(''); }
    setProcessingVerification(null);
  };

  const handleRemoveVerification = async (userId: string) => {
    const { error } = await supabase.from('forum_users').update({ is_verified: false }).eq('id', userId);
    if (error) toast.error('Failed to remove verification');
    else { toast.success('Verification removed'); fetchForumUsers(); }
  };

  const handleSuspend = async (userId: string) => {
    setSuspending(true);
    const expiresAt = suspensionDays === 'permanent' ? null : new Date(Date.now() + parseInt(suspensionDays) * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from('forum_users').update({ is_suspended: true, suspension_reason: suspensionReason || 'Violation of community guidelines', suspension_ends_at: expiresAt }).eq('id', userId);
    if (error) toast.error('Failed to suspend user');
    else { toast.success('User suspended'); fetchForumUsers(); setShowSuspendModal(null); setSuspensionReason(''); setSuspensionDays('7'); }
    setSuspending(false);
  };

  const handleUnsuspend = async (userId: string) => {
    const { error } = await supabase.from('forum_users').update({ is_suspended: false, suspension_reason: null, suspension_ends_at: null }).eq('id', userId);
    if (error) toast.error('Failed to unsuspend user');
    else { toast.success('User unsuspended'); fetchForumUsers(); }
  };

  const handleSetMembership = async (userId: string) => {
    setSavingMembership(true);
    const { error } = await supabase.from('forum_users').update({ membership_tier: selectedMembership || null }).eq('id', userId);
    if (error) toast.error('Failed to update membership');
    else { toast.success(selectedMembership ? `Membership set to ${selectedMembership}` : 'Membership removed'); fetchForumUsers(); setShowMembershipModal(null); setSelectedMembership(''); }
    setSavingMembership(false);
  };

  const handleResetPassword = async (userId: string) => {
    setResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', { body: { forumUserId: userId, sendEmail: sendPasswordEmail } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(data?.message || 'Password reset successfully');
      setShowPasswordResetModal(null);
      setSendPasswordEmail(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const getMembershipBadge = (tier: string | null) => {
    if (!tier) return null;
    const colors: Record<string, string> = { bronze: 'bg-amber-700 text-amber-100', silver: 'bg-gray-400 text-gray-900', platinum: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white' };
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colors[tier] || 'bg-gray-700 text-gray-300'}`}><Star className="w-3 h-3" />{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>;
  };

  const filteredUsers = forumUsers.filter(u => search.trim() === '' || u.username.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Forum Moderation</h2>
        <div className="flex items-center gap-3">
          {activeSection === 'users' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search username..." className="pl-10 pr-4 py-2.5 w-64 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50" />
            </div>
          )}
          <button onClick={() => { fetchForumUsers(); fetchAvatarRequests(); fetchCoverRequests(); fetchVerificationRequests(); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f18] border border-white/5 hover:border-white/10 text-gray-300 rounded-xl transition text-sm font-medium">
            <RefreshCw className="w-4 h-4" />Refresh
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['users', 'avatars', 'covers', 'verification', 'memberships'] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveSection(tab)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${activeSection === tab ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-[#0f0f18] border border-white/5 text-gray-400 hover:text-white hover:border-white/10'}`}>
            {tab === 'users' && <User className="w-4 h-4" />}
            {tab === 'avatars' && <Image className="w-4 h-4" />}
            {tab === 'covers' && <ImageIcon className="w-4 h-4" />}
            {tab === 'verification' && <BadgeCheck className="w-4 h-4" />}
            {tab === 'memberships' && <Star className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'avatars' && avatarRequests.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{avatarRequests.length}</span>}
            {tab === 'covers' && coverRequests.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{coverRequests.length}</span>}
            {tab === 'verification' && verificationRequests.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{verificationRequests.length}</span>}
          </button>
        ))}
      </div>

      {/* Users Section */}
      {activeSection === 'users' && (
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No users found</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredUsers.slice(0, 50).map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-xl" /> : <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"><User className="w-5 h-5 text-gray-500" /></div>}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{user.username}</span>
                        {user.is_verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                        {getMembershipBadge(user.membership_tier)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {user.is_suspended && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full">Suspended</span>}
                        <span className="text-xs text-gray-500">{user.post_count} posts</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setShowMembershipModal(user.id); setSelectedMembership(user.membership_tier || ''); }} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg"><Star className="w-4 h-4" />Tier</button>
                    <button onClick={() => setShowPasswordResetModal(user.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg"><KeyRound className="w-4 h-4" />Reset</button>
                    {user.is_verified ? (
                      <button onClick={() => handleRemoveVerification(user.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg"><X className="w-4 h-4" />Unverify</button>
                    ) : null}
                    {user.is_suspended ? (
                      <button onClick={() => handleUnsuspend(user.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg"><Check className="w-4 h-4" />Unsuspend</button>
                    ) : (
                      <button onClick={() => setShowSuspendModal(user.id)} className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg"><Ban className="w-4 h-4" />Suspend</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Avatars Section */}
      {activeSection === 'avatars' && (
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
          {loadingAvatars ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : avatarRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No pending avatar requests</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {avatarRequests.map(request => (
                <div key={request.id} className="bg-white/5 rounded-xl p-4 space-y-3">
                  <img src={request.image_url} alt="" className="w-full aspect-square rounded-xl object-cover" />
                  <div className="text-sm text-white font-medium">{request.forum_user?.username}</div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveAvatar(request)} disabled={processingAvatar === request.id} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                      {processingAvatar === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setShowDenyModal(request.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Covers Section */}
      {activeSection === 'covers' && (
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
          {loadingCovers ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : coverRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No pending cover requests</div>
          ) : (
            <div className="space-y-4 p-4">
              {coverRequests.map(request => (
                <div key={request.id} className="bg-white/5 rounded-xl overflow-hidden">
                  <img src={request.image_url} alt="" className="w-full h-32 object-cover" />
                  <div className="p-4 flex items-center justify-between">
                    <span className="text-sm text-white font-medium">{request.forum_user?.username}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveCover(request)} disabled={processingCover === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                        {processingCover === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Approve
                      </button>
                      <button onClick={() => setShowDenyCoverModal(request.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm"><X className="w-4 h-4" />Deny</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verification Section */}
      {activeSection === 'verification' && (
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
          {loadingVerifications ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : verificationRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No pending verification requests</div>
          ) : (
            <div className="divide-y divide-white/5">
              {verificationRequests.map(request => (
                <div key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {request.forum_user?.avatar_url ? <img src={request.forum_user.avatar_url} alt="" className="w-10 h-10 rounded-xl" /> : <div className="w-10 h-10 rounded-xl bg-white/5" />}
                    <div>
                      <span className="font-medium text-white">{request.forum_user?.username}</span>
                      {request.reason && <p className="text-sm text-gray-400 mt-1">{request.reason}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveVerification(request)} disabled={processingVerification === request.id} className="flex items-center gap-1 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-sm">
                      {processingVerification === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Verify
                    </button>
                    <button onClick={() => setShowDenyVerificationModal(request.id)} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm"><X className="w-4 h-4" />Deny</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Memberships Section */}
      {activeSection === 'memberships' && (
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
          ) : (
            <div className="divide-y divide-white/5">
              {forumUsers.filter(u => u.membership_tier).map(user => (
                <div key={user.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-xl" /> : <div className="w-10 h-10 rounded-xl bg-white/5" />}
                    <div>
                      <span className="font-medium text-white">{user.username}</span>
                      <div className="mt-1">{getMembershipBadge(user.membership_tier)}</div>
                    </div>
                  </div>
                  <button onClick={() => { setShowMembershipModal(user.id); setSelectedMembership(user.membership_tier || ''); }} className="flex items-center gap-1 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-lg text-sm"><Star className="w-4 h-4" />Edit</button>
                </div>
              ))}
              {forumUsers.filter(u => u.membership_tier).length === 0 && <div className="text-center py-12 text-gray-500">No users with memberships</div>}
            </div>
          )}
        </div>
      )}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Suspend User</h3>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Reason</label><textarea value={suspensionReason} onChange={(e) => setSuspensionReason(e.target.value)} placeholder="Reason for suspension..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500" rows={3} /></div>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Duration</label><select value={suspensionDays} onChange={(e) => setSuspensionDays(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"><option value="1">1 day</option><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="permanent">Permanent</option></select></div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowSuspendModal(null)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => handleSuspend(showSuspendModal)} disabled={suspending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">{suspending && <Loader2 className="w-4 h-4 animate-spin" />}Suspend</button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Avatar Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Deny Avatar Request</h3>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Reason</label><textarea value={denyReason} onChange={(e) => setDenyReason(e.target.value)} placeholder="Reason for denial..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500" rows={3} /></div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDenyModal(null); setDenyReason(''); }} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => handleDenyAvatar(showDenyModal)} disabled={processingAvatar === showDenyModal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">{processingAvatar === showDenyModal && <Loader2 className="w-4 h-4 animate-spin" />}Deny</button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Cover Modal */}
      {showDenyCoverModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Deny Cover Request</h3>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Reason</label><textarea value={coverDenyReason} onChange={(e) => setCoverDenyReason(e.target.value)} placeholder="Reason for denial..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500" rows={3} /></div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDenyCoverModal(null); setCoverDenyReason(''); }} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => handleDenyCover(showDenyCoverModal)} disabled={processingCover === showDenyCoverModal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">{processingCover === showDenyCoverModal && <Loader2 className="w-4 h-4 animate-spin" />}Deny</button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Verification Modal */}
      {showDenyVerificationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Deny Verification</h3>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Reason</label><textarea value={verifyDenyReason} onChange={(e) => setVerifyDenyReason(e.target.value)} placeholder="Reason for denial..." className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500" rows={3} /></div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDenyVerificationModal(null); setVerifyDenyReason(''); }} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => handleDenyVerification(showDenyVerificationModal)} disabled={processingVerification === showDenyVerificationModal} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl">{processingVerification === showDenyVerificationModal && <Loader2 className="w-4 h-4 animate-spin" />}Deny</button>
            </div>
          </div>
        </div>
      )}

      {/* Membership Modal */}
      {showMembershipModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Set Membership Tier</h3>
            <div><label className="block text-sm font-medium mb-2 text-gray-300">Tier</label><select value={selectedMembership} onChange={(e) => setSelectedMembership(e.target.value)} className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"><option value="">None</option><option value="bronze">Bronze</option><option value="silver">Silver</option><option value="platinum">Platinum</option></select></div>
            <div className="flex gap-3">
              <button onClick={() => setShowMembershipModal(null)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => handleSetMembership(showMembershipModal)} disabled={savingMembership} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl">{savingMembership && <Loader2 className="w-4 h-4 animate-spin" />}Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordResetModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#12121a] border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Reset Password</h3>
            <p className="text-gray-400 text-sm">This will generate a new random password for the user.</p>
            <label className="flex items-center gap-3"><input type="checkbox" checked={sendPasswordEmail} onChange={(e) => setSendPasswordEmail(e.target.checked)} className="w-4 h-4 rounded border-gray-600" /><span className="text-gray-300">Send password via email</span></label>
            <div className="flex gap-3">
              <button onClick={() => setShowPasswordResetModal(null)} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl">Cancel</button>
              <button onClick={() => handleResetPassword(showPasswordResetModal)} disabled={resettingPassword} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl">{resettingPassword && <Loader2 className="w-4 h-4 animate-spin" />}Reset</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
