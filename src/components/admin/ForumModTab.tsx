import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Ban, Clock, Search, RefreshCw, Check, X, Shield, Image, BadgeCheck, ImageIcon } from 'lucide-react';
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
  forum_user?: {
    username: string;
  };
}

interface CoverRequest {
  id: string;
  forum_user_id: string;
  image_url: string;
  status: string;
  created_at: string;
  forum_user?: {
    username: string;
  };
}

interface VerificationRequest {
  id: string;
  forum_user_id: string;
  status: string;
  reason: string | null;
  denial_reason: string | null;
  created_at: string;
  forum_user?: {
    username: string;
    avatar_url: string | null;
  };
}

interface ForumModTabProps {
  darkMode: boolean;
}

export default function ForumModTab({ darkMode }: ForumModTabProps) {
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
  const [activeSection, setActiveSection] = useState<'users' | 'avatars' | 'covers' | 'verification'>('users');
  const [processingAvatar, setProcessingAvatar] = useState<string | null>(null);
  const [processingCover, setProcessingCover] = useState<string | null>(null);
  const [processingVerification, setProcessingVerification] = useState<string | null>(null);
  const [denyReason, setDenyReason] = useState('');
  const [showDenyModal, setShowDenyModal] = useState<string | null>(null);
  const [showDenyCoverModal, setShowDenyCoverModal] = useState<string | null>(null);
  const [coverDenyReason, setCoverDenyReason] = useState('');
  const [showDenyVerificationModal, setShowDenyVerificationModal] = useState<string | null>(null);
  const [verifyDenyReason, setVerifyDenyReason] = useState('');

  useEffect(() => {
    fetchForumUsers();
    fetchAvatarRequests();
    fetchCoverRequests();
    fetchVerificationRequests();
  }, []);

  const fetchForumUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('forum_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setForumUsers(data);
    }
    setLoading(false);
  };

  const fetchAvatarRequests = async () => {
    setLoadingAvatars(true);
    const { data, error } = await supabase
      .from('forum_avatar_requests')
      .select('*, forum_user:forum_user_id (username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (data) {
      setAvatarRequests(data as AvatarRequest[]);
    }
    setLoadingAvatars(false);
  };

  const fetchCoverRequests = async () => {
    setLoadingCovers(true);
    const { data } = await supabase
      .from('forum_cover_requests')
      .select('*, forum_user:forum_user_id (username)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (data) {
      setCoverRequests(data as CoverRequest[]);
    }
    setLoadingCovers(false);
  };

  const fetchVerificationRequests = async () => {
    setLoadingVerifications(true);
    const { data } = await supabase
      .from('forum_verification_requests')
      .select('*, forum_user:forum_user_id (username, avatar_url)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (data) {
      setVerificationRequests(data as VerificationRequest[]);
    }
    setLoadingVerifications(false);
  };

  const handleApproveAvatar = async (request: AvatarRequest) => {
    setProcessingAvatar(request.id);

    // Update the avatar request status
    const { error: updateError } = await supabase
      .from('forum_avatar_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (updateError) {
      toast.error('Failed to approve avatar');
      setProcessingAvatar(null);
      return;
    }

    // Update the user's avatar
    const { error: userError } = await supabase
      .from('forum_users')
      .update({ avatar_url: request.image_url })
      .eq('id', request.forum_user_id);

    if (userError) {
      toast.error('Failed to update user avatar');
    } else {
      toast.success('Avatar approved and updated');
      fetchAvatarRequests();
      fetchForumUsers();
    }
    setProcessingAvatar(null);
  };

  const handleDenyAvatar = async (requestId: string) => {
    setProcessingAvatar(requestId);

    const { error } = await supabase
      .from('forum_avatar_requests')
      .update({ 
        status: 'denied',
        denial_reason: denyReason || 'Image does not meet community guidelines',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to deny avatar');
    } else {
      toast.success('Avatar request denied');
      fetchAvatarRequests();
      setShowDenyModal(null);
      setDenyReason('');
    }
    setProcessingAvatar(null);
  };

  const handleApproveCover = async (request: CoverRequest) => {
    setProcessingCover(request.id);

    const { error: updateError } = await supabase
      .from('forum_cover_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (updateError) {
      toast.error('Failed to approve cover');
      setProcessingCover(null);
      return;
    }

    const { error: userError } = await supabase
      .from('forum_users')
      .update({ cover_url: request.image_url })
      .eq('id', request.forum_user_id);

    if (userError) {
      toast.error('Failed to update user cover');
    } else {
      toast.success('Cover photo approved and updated');
      fetchCoverRequests();
      fetchForumUsers();
    }
    setProcessingCover(null);
  };

  const handleDenyCover = async (requestId: string) => {
    setProcessingCover(requestId);

    const { error } = await supabase
      .from('forum_cover_requests')
      .update({ 
        status: 'denied',
        denial_reason: coverDenyReason || 'Image does not meet community guidelines',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to deny cover');
    } else {
      toast.success('Cover request denied');
      fetchCoverRequests();
      setShowDenyCoverModal(null);
      setCoverDenyReason('');
    }
    setProcessingCover(null);
  };

  const handleApproveVerification = async (request: VerificationRequest) => {
    setProcessingVerification(request.id);

    // Update verification request status
    const { error: updateError } = await supabase
      .from('forum_verification_requests')
      .update({ 
        status: 'approved',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', request.id);

    if (updateError) {
      toast.error('Failed to approve verification');
      setProcessingVerification(null);
      return;
    }

    // Update user's verified status
    const { error: userError } = await supabase
      .from('forum_users')
      .update({ is_verified: true })
      .eq('id', request.forum_user_id);

    if (userError) {
      toast.error('Failed to update user verification');
    } else {
      // Send notification email to the user
      try {
        // Get user's email
        const { data: forumUserData } = await supabase
          .from('forum_users')
          .select('user_id, username')
          .eq('id', request.forum_user_id)
          .single();
        
        if (forumUserData) {
          // Get auth user email
          const { data } = await supabase.functions.invoke('send-verification-notification', {
            body: {
              forumUserId: request.forum_user_id,
              email: '', // Will be fetched server-side
              username: forumUserData.username
            }
          });
        }
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        // Don't block the success flow
      }
      
      toast.success('User verified!');
      fetchVerificationRequests();
      fetchForumUsers();
    }
    setProcessingVerification(null);
  };

  const handleDenyVerification = async (requestId: string) => {
    setProcessingVerification(requestId);

    const { error } = await supabase
      .from('forum_verification_requests')
      .update({ 
        status: 'denied',
        denial_reason: verifyDenyReason || 'Does not meet verification criteria',
        reviewed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (error) {
      toast.error('Failed to deny verification');
    } else {
      toast.success('Verification request denied');
      fetchVerificationRequests();
      setShowDenyVerificationModal(null);
      setVerifyDenyReason('');
    }
    setProcessingVerification(null);
  };

  const handleRemoveVerification = async (userId: string) => {
    const { error } = await supabase
      .from('forum_users')
      .update({ is_verified: false })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to remove verification');
    } else {
      toast.success('Verification removed');
      fetchForumUsers();
    }
  };

  const handleSuspend = async (userId: string) => {
    setSuspending(true);

    const expiresAt = suspensionDays === 'permanent' 
      ? null 
      : new Date(Date.now() + parseInt(suspensionDays) * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from('forum_users')
      .update({
        is_suspended: true,
        suspension_reason: suspensionReason || 'Violation of community guidelines',
        suspension_ends_at: expiresAt
      })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to suspend user');
    } else {
      toast.success('User suspended');
      fetchForumUsers();
      setShowSuspendModal(null);
      setSuspensionReason('');
      setSuspensionDays('7');
    }
    setSuspending(false);
  };

  const handleUnsuspend = async (userId: string) => {
    const { error } = await supabase
      .from('forum_users')
      .update({
        is_suspended: false,
        suspension_reason: null,
        suspension_ends_at: null
      })
      .eq('id', userId);

    if (error) {
      toast.error('Failed to unsuspend user');
    } else {
      toast.success('User unsuspended');
      fetchForumUsers();
    }
  };

  const filteredUsers = forumUsers.filter(u => 
    search.trim() === '' || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const mutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-xl font-semibold ${textClass}`}>Forum Moderation</h2>
        <div className="flex items-center gap-3">
          {activeSection === 'users' && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username..."
                className={`pl-9 pr-4 py-2 w-64 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm ${inputClass}`}
              />
            </div>
          )}
          <button
            onClick={() => { fetchForumUsers(); fetchAvatarRequests(); fetchCoverRequests(); fetchVerificationRequests(); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${
              darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeSection === 'users'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <User className="w-4 h-4" />
          Users
        </button>
        <button
          onClick={() => setActiveSection('avatars')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeSection === 'avatars'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Image className="w-4 h-4" />
          Avatar Requests
          {avatarRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {avatarRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('covers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeSection === 'covers'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Cover Requests
          {coverRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {coverRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSection('verification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            activeSection === 'verification'
              ? 'bg-blue-600 text-white'
              : darkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          Verification
          {verificationRequests.length > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {verificationRequests.length}
            </span>
          )}
        </button>
      </div>

      {activeSection === 'users' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${textClass}`}>{forumUsers.length}</div>
                  <div className={`text-sm ${mutedClass}`}>Total Users</div>
                </div>
              </div>
            </div>
            <div className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${textClass}`}>
                    {forumUsers.filter(u => u.is_suspended).length}
                  </div>
                  <div className={`text-sm ${mutedClass}`}>Suspended</div>
                </div>
              </div>
            </div>
            <div className={`${cardClass} border rounded-xl p-4`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className={`text-2xl font-bold ${textClass}`}>
                    {forumUsers.filter(u => !u.is_suspended).length}
                  </div>
                  <div className={`text-sm ${mutedClass}`}>Active</div>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <tr>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>User</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Status</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Posts</th>
                    <th className={`text-left px-6 py-4 text-sm font-semibold ${mutedClass}`}>Joined</th>
                    <th className={`text-right px-6 py-4 text-sm font-semibold ${mutedClass}`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className={`px-6 py-12 text-center ${mutedClass}`}>
                        Loading...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={`px-6 py-12 text-center ${mutedClass}`}>
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className={`border-b ${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <span className={`font-medium ${textClass}`}>{user.username}</span>
                              {user.is_verified && (
                                <BadgeCheck className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {user.is_suspended ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                <Ban className="w-3 h-3" />
                                Suspended
                              </span>
                              {user.suspension_ends_at && (
                                <div className={`text-xs mt-1 ${mutedClass}`}>
                                  Until: {new Date(user.suspension_ends_at).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 ${mutedClass}`}>{user.post_count}</td>
                        <td className={`px-6 py-4 text-sm ${mutedClass}`}>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {user.is_verified && (
                              <button
                                onClick={() => handleRemoveVerification(user.id)}
                                className="flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-xs rounded transition"
                                title="Remove verification"
                              >
                                <X className="w-3 h-3" />
                                Unverify
                              </button>
                            )}
                            {user.is_suspended ? (
                              <button
                                onClick={() => handleUnsuspend(user.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                              >
                                <Check className="w-4 h-4" />
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                onClick={() => setShowSuspendModal(user.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                              >
                                <Ban className="w-4 h-4" />
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeSection === 'avatars' ? (
        /* Avatar Requests Section */
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loadingAvatars ? (
            <div className={`px-6 py-12 text-center ${mutedClass}`}>Loading...</div>
          ) : avatarRequests.length === 0 ? (
            <div className={`px-6 py-12 text-center ${mutedClass}`}>
              <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending avatar requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {avatarRequests.map((request) => (
                <div 
                  key={request.id} 
                  className={`border rounded-xl p-4 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="aspect-square w-full mb-3 rounded-lg overflow-hidden bg-gray-200">
                    <img 
                      src={request.image_url} 
                      alt="Avatar request"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mb-3">
                    <div className={`font-medium ${textClass}`}>
                      {request.forum_user?.username || 'Unknown User'}
                    </div>
                    <div className={`text-xs ${mutedClass}`}>
                      Submitted: {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveAvatar(request)}
                      disabled={processingAvatar === request.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowDenyModal(request.id)}
                      disabled={processingAvatar === request.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      <X className="w-4 h-4" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSection === 'covers' ? (
        /* Cover Requests Section */
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loadingCovers ? (
            <div className={`px-6 py-12 text-center ${mutedClass}`}>Loading...</div>
          ) : coverRequests.length === 0 ? (
            <div className={`px-6 py-12 text-center ${mutedClass}`}>
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending cover requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {coverRequests.map((request) => (
                <div 
                  key={request.id} 
                  className={`border rounded-xl p-4 ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="aspect-[4/1] w-full mb-3 rounded-lg overflow-hidden bg-gray-200">
                    <img 
                      src={request.image_url} 
                      alt="Cover request"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="mb-3">
                    <div className={`font-medium ${textClass}`}>
                      {request.forum_user?.username || 'Unknown User'}
                    </div>
                    <div className={`text-xs ${mutedClass}`}>
                      Submitted: {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveCover(request)}
                      disabled={processingCover === request.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowDenyCoverModal(request.id)}
                      disabled={processingCover === request.id}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      <X className="w-4 h-4" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : activeSection === 'verification' ? (
        /* Verification Requests Section */
        <div className={`rounded-xl shadow-sm border overflow-hidden ${cardClass}`}>
          {loadingVerifications ? (
            <div className={`px-6 py-12 text-center ${mutedClass}`}>Loading...</div>
          ) : verificationRequests.length === 0 ? (
            <div className={`px-6 py-12 text-center ${mutedClass}`}>
              <BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No pending verification requests</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {verificationRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-start gap-4">
                  {request.forum_user?.avatar_url ? (
                    <img 
                      src={request.forum_user.avatar_url} 
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className={`font-medium ${textClass}`}>
                      {request.forum_user?.username || 'Unknown User'}
                    </div>
                    <div className={`text-sm mt-1 ${mutedClass}`}>
                      <strong>Reason:</strong> {request.reason || 'No reason provided'}
                    </div>
                    <div className={`text-xs mt-1 ${mutedClass}`}>
                      Submitted: {new Date(request.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveVerification(request)}
                      disabled={processingVerification === request.id}
                      className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      <Check className="w-4 h-4" />
                      Verify
                    </button>
                    <button
                      onClick={() => setShowDenyVerificationModal(request.id)}
                      disabled={processingVerification === request.id}
                      className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      <X className="w-4 h-4" />
                      Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} border rounded-2xl p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Suspend User</h3>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Reason</label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="Reason for suspension..."
                  className={`w-full px-4 py-2 border rounded-lg resize-none ${inputClass}`}
                  rows={3}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Duration</label>
                <select
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg ${inputClass}`}
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="14">14 days</option>
                  <option value="30">30 days</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowSuspendModal(null)}
                className={`px-4 py-2 ${mutedClass} hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(showSuspendModal)}
                disabled={suspending}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                <Ban className="w-4 h-4" />
                {suspending ? 'Suspending...' : 'Suspend User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Avatar Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} border rounded-2xl p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Deny Avatar Request</h3>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Reason (optional)</label>
              <textarea
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Reason for denial..."
                className={`w-full px-4 py-2 border rounded-lg resize-none ${inputClass}`}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDenyModal(null); setDenyReason(''); }}
                className={`px-4 py-2 ${mutedClass} hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDenyAvatar(showDenyModal)}
                disabled={processingAvatar === showDenyModal}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Deny Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Verification Modal */}
      {showDenyVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} border rounded-2xl p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Deny Verification Request</h3>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Reason (optional)</label>
              <textarea
                value={verifyDenyReason}
                onChange={(e) => setVerifyDenyReason(e.target.value)}
                placeholder="Reason for denial..."
                className={`w-full px-4 py-2 border rounded-lg resize-none ${inputClass}`}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDenyVerificationModal(null); setVerifyDenyReason(''); }}
                className={`px-4 py-2 ${mutedClass} hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDenyVerification(showDenyVerificationModal)}
                disabled={processingVerification === showDenyVerificationModal}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Deny Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Cover Modal */}
      {showDenyCoverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-xl p-6 ${cardClass}`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>Deny Cover Request</h3>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${mutedClass}`}>Reason (optional)</label>
              <textarea
                value={coverDenyReason}
                onChange={(e) => setCoverDenyReason(e.target.value)}
                placeholder="Reason for denial..."
                className={`w-full px-4 py-2 border rounded-lg resize-none ${inputClass}`}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowDenyCoverModal(null); setCoverDenyReason(''); }}
                className={`px-4 py-2 ${mutedClass} hover:opacity-80`}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDenyCover(showDenyCoverModal)}
                disabled={processingCover === showDenyCoverModal}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
              >
                <X className="w-4 h-4" />
                Deny Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
