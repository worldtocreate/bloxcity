import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit2, Save, Upload, Loader2, Shield, Ban, X, Clock, Lock, Eye, EyeOff, BadgeCheck, Pin, MessageSquare, ImageIcon, Moon, Sun, Trash2, LogOut, Monitor, Smartphone, Link2 } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { hashPin, isValidPin } from '@/lib/encryption';
import TwoFactorSetup from '@/components/forum/TwoFactorSetup';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { useTheme } from '@/contexts/ThemeContext';

interface CoverRequest {
  id: string;
  status: string;
  created_at: string;
  denial_reason: string | null;
}

interface BlockedUser {
  id: string;
  blocked_id: string;
  blocked_user: {
    username: string;
    avatar_url: string | null;
  };
}

interface AvatarRequest {
  id: string;
  status: string;
  created_at: string;
  denial_reason: string | null;
}

interface VerificationRequest {
  id: string;
  status: string;
  reason: string | null;
  denial_reason: string | null;
  created_at: string;
}

interface PinnedThread {
  id: string;
  thread_id: string;
  thread: {
    id: string;
    title: string;
  };
}

interface UserThread {
  id: string;
  title: string;
  created_at: string;
}

interface UserSession {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  user_agent: string | null;
  last_activity_at: string;
  created_at: string;
  is_current: boolean;
}

function maskEmail(email: string): string {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.charAt(0) + '***';
  return `${maskedLocal}@${domain}`;
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown Device', browser: 'Unknown Browser' };
  
  let device = 'Desktop';
  let browser = 'Browser';
  
  if (/iPhone|iPad|iPod/i.test(ua)) device = 'iOS Device';
  else if (/Android/i.test(ua)) device = 'Android Device';
  else if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/Mac/i.test(ua)) device = 'Mac';
  else if (/Linux/i.test(ua)) device = 'Linux';
  
  if (/Chrome/i.test(ua) && !/Edge/i.test(ua)) browser = 'Chrome';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Edge/i.test(ua)) browser = 'Edge';
  
  return { device, browser };
}

export default function ForumSettings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, forumUser, isAdmin, loading, emailVerified } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
    loading?: boolean;
    emailVerified?: boolean;
  }>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [signature, setSignature] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<AvatarRequest | null>(null);
  const [pendingCover, setPendingCover] = useState<CoverRequest | null>(null);
  
  // Social Links
  const [socialDiscord, setSocialDiscord] = useState('');
  const [socialX, setSocialX] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);
  
  // Sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  
  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // New states
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  const [allowDms, setAllowDms] = useState(true);
  const [hideThreads, setHideThreads] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null);
  const [verificationReason, setVerificationReason] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [pinnedThreads, setPinnedThreads] = useState<PinnedThread[]>([]);
  const [userThreads, setUserThreads] = useState<UserThread[]>([]);
  const [loadingThreads, setLoadingThreads] = useState(true);

  useEffect(() => {
    if (forumUser && !initialized) {
      setSignature(forumUser.signature || '');
      setAllowDms(forumUser.allow_dms);
      setHideThreads(forumUser.hide_threads);
      setSocialDiscord((forumUser as any).social_discord || '');
      setSocialX((forumUser as any).social_x || '');
      setInitialized(true);
    }
  }, [forumUser, initialized]);

  useEffect(() => {
    if (forumUser) {
      fetchBlockedUsers();
      fetchPendingAvatar();
      fetchPendingCover();
      fetchVerificationRequest();
      fetchPinnedThreads();
      fetchSessions();
    }
  }, [forumUser]);

  const fetchBlockedUsers = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_blocked_users')
      .select('id, blocked_id, blocked_user:blocked_id (username, avatar_url)')
      .eq('blocker_id', forumUser.id);
    
    setBlockedUsers((data || []) as any);
    setLoadingBlocked(false);
  };

  const fetchPendingAvatar = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_avatar_requests')
      .select('*')
      .eq('forum_user_id', forumUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data && (data.status === 'pending' || data.status === 'denied')) {
      setPendingAvatar(data as AvatarRequest);
    } else {
      setPendingAvatar(null);
    }
  };

  const fetchPendingCover = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_cover_requests')
      .select('*')
      .eq('forum_user_id', forumUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data && (data.status === 'pending' || data.status === 'denied')) {
      setPendingCover(data as CoverRequest);
    } else {
      setPendingCover(null);
    }
  };

  const fetchVerificationRequest = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_verification_requests')
      .select('*')
      .eq('forum_user_id', forumUser.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (data) {
      setVerificationRequest(data as VerificationRequest);
    }
  };

  const fetchPinnedThreads = async () => {
    if (!forumUser) return;
    setLoadingThreads(true);

    const { data: pinned } = await supabase
      .from('forum_pinned_threads')
      .select('id, thread_id, thread:thread_id (id, title)')
      .eq('forum_user_id', forumUser.id);
    
    if (pinned) {
      setPinnedThreads(pinned as unknown as PinnedThread[]);
    }

    const { data: threads } = await supabase
      .from('forum_threads')
      .select('id, title, created_at')
      .eq('author_id', forumUser.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (threads) {
      setUserThreads(threads);
    }
    setLoadingThreads(false);
  };

  const fetchSessions = async () => {
    if (!forumUser) return;
    setLoadingSessions(true);
    
    const { data } = await supabase
      .from('forum_user_sessions')
      .select('*')
      .eq('forum_user_id', forumUser.id)
      .order('last_activity_at', { ascending: false });
    
    setSessions((data || []) as UserSession[]);
    setLoadingSessions(false);
  };

  const handleSaveSignature = async () => {
    if (!forumUser) return;
    setSaving(true);

    const { error } = await supabase
      .from('forum_users')
      .update({ signature: signature.trim() || null })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to save signature');
    } else {
      toast.success('Signature saved!');
    }
    setSaving(false);
  };

  const handleSaveSocialLinks = async () => {
    if (!forumUser) return;
    setSavingSocial(true);

    // Clean up X username (remove @ if present)
    const cleanX = socialX.trim().replace(/^@/, '');

    const { error } = await supabase
      .from('forum_users')
      .update({ 
        social_discord: socialDiscord.trim() || null,
        social_x: cleanX || null
      })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to save social links');
    } else {
      toast.success('Social links saved!');
    }
    setSavingSocial(false);
  };

  const handleLogoutOtherSessions = async () => {
    if (!forumUser) return;
    setLoggingOutOthers(true);

    // Delete all non-current sessions
    const { error } = await supabase
      .from('forum_user_sessions')
      .delete()
      .eq('forum_user_id', forumUser.id)
      .eq('is_current', false);

    if (error) {
      toast.error('Failed to log out other sessions');
    } else {
      toast.success('Logged out of all other sessions');
      fetchSessions();
    }
    setLoggingOutOthers(false);
  };

  const handleDeleteAccount = async () => {
    if (!forumUser || !user || deleteConfirmText !== 'DELETE') return;
    setDeleting(true);

    // Create deletion request
    const { error } = await supabase
      .from('forum_account_deletion_requests')
      .insert({
        forum_user_id: forumUser.id,
        user_id: user.id,
        status: 'pending'
      });

    if (error) {
      if (error.message.includes('duplicate')) {
        toast.error('You already have a pending deletion request');
      } else {
        toast.error('Failed to submit deletion request');
      }
    } else {
      toast.success('Account deletion requested. An admin will process this shortly.');
      setShowDeleteModal(false);
      setDeleteConfirmText('');
    }
    setDeleting(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !forumUser || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      const filePath = `${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('forum-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error('Failed to upload avatar');
        setUploadingAvatar(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('forum-avatars')
        .getPublicUrl(filePath);

      const { error: requestError } = await supabase
        .from('forum_avatar_requests')
        .insert({
          forum_user_id: forumUser.id,
          image_url: urlData.publicUrl,
          status: 'pending'
        });

      if (requestError) {
        toast.error('Failed to submit avatar for review');
      } else {
        toast.success('Avatar submitted for admin approval!');
        fetchPendingAvatar();
      }
    } catch (err) {
      toast.error('Failed to upload avatar');
    }

    setUploadingAvatar(false);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !forumUser || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Cover image must be less than 5MB');
      return;
    }

    setUploadingCover(true);

    try {
      const filePath = `covers/${user.id}/${Date.now()}.${file.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from('forum-avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error('Failed to upload cover');
        setUploadingCover(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('forum-avatars')
        .getPublicUrl(filePath);

      const { error: requestError } = await supabase
        .from('forum_cover_requests')
        .insert({
          forum_user_id: forumUser.id,
          image_url: urlData.publicUrl,
          status: 'pending'
        });

      if (requestError) {
        toast.error('Failed to submit cover for review');
      } else {
        toast.success('Cover photo submitted for admin approval!');
        fetchPendingCover();
      }
    } catch (err) {
      toast.error('Failed to upload cover');
    }

    setUploadingCover(false);
  };

  const handleUnblock = async (blockedId: string) => {
    if (!forumUser) return;

    const { error } = await supabase
      .from('forum_blocked_users')
      .delete()
      .eq('blocker_id', forumUser.id)
      .eq('blocked_id', blockedId);

    if (error) {
      toast.error('Failed to unblock user');
    } else {
      toast.success('User unblocked');
      fetchBlockedUsers();
    }
  };

  const handleSetPin = async () => {
    if (!forumUser) return;
    
    if (!isValidPin(pin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    setSettingPin(true);
    const hashedPin = await hashPin(pin);

    const { error } = await supabase
      .from('forum_users')
      .update({ dm_encryption_pin_hash: hashedPin })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to set PIN');
    } else {
      toast.success('Encryption PIN set! You can now use direct messages.');
      setPin('');
      setConfirmPin('');
    }
    setSettingPin(false);
  };

  const handleSavePrivacy = async () => {
    if (!forumUser) return;
    setSavingPrivacy(true);

    const { error } = await supabase
      .from('forum_users')
      .update({ 
        allow_dms: allowDms,
        hide_threads: hideThreads
      })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to save privacy settings');
    } else {
      toast.success('Privacy settings saved!');
    }
    setSavingPrivacy(false);
  };

  const handleSubmitVerification = async () => {
    if (!forumUser || !verificationReason.trim()) return;
    setSubmittingVerification(true);

    const { error } = await supabase
      .from('forum_verification_requests')
      .insert({
        forum_user_id: forumUser.id,
        reason: verificationReason.trim(),
        status: 'pending'
      });

    if (error) {
      if (error.message?.toLowerCase().includes('pending') || error.message?.toLowerCase().includes('exists')) {
        toast.error('You already have a pending verification request');
      } else {
        toast.error(`Failed to submit verification request: ${error.message}`);
      }
    } else {
      toast.success('Verification request submitted!');
      setVerificationReason('');
      fetchVerificationRequest();
    }
    setSubmittingVerification(false);
  };

  const handlePinThread = async (threadId: string) => {
    if (!forumUser) return;

    const isPinned = pinnedThreads.some(p => p.thread_id === threadId);

    if (isPinned) {
      const { error } = await supabase
        .from('forum_pinned_threads')
        .delete()
        .eq('forum_user_id', forumUser.id)
        .eq('thread_id', threadId);

      if (error) {
        toast.error('Failed to unpin thread');
      } else {
        toast.success('Thread unpinned');
        fetchPinnedThreads();
      }
    } else {
      if (pinnedThreads.length >= 3) {
        toast.error('You can only pin up to 3 threads');
        return;
      }

      const { error } = await supabase
        .from('forum_pinned_threads')
        .insert({
          forum_user_id: forumUser.id,
          thread_id: threadId
        });

      if (error) {
        toast.error('Failed to pin thread');
      } else {
        toast.success('Thread pinned to profile');
        fetchPinnedThreads();
      }
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!forumUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Forum Settings</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mt-2">
            Your account is signed in, but you don't have a forum profile yet.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/register')}
              className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-4 py-2 rounded-lg transition font-medium"
            >
              Create forum profile
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 rounded-lg border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))] transition"
            >
              Back to forums
            </button>
          </div>
        </div>
      </div>
    );
  }

  const membershipTier = (forumUser as any).membership_tier as 'bronze' | 'silver' | 'platinum' | null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Forum Settings</h1>

      {/* Profile Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </h2>

        <div className="flex items-start gap-6">
          <div className="flex flex-col items-center gap-2">
            {forumUser.avatar_url ? (
              <img
                src={forumUser.avatar_url}
                alt={forumUser.username}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
            {pendingAvatar?.status === 'pending' ? (
              <div className="flex items-center gap-1 text-sm text-yellow-500">
                <Clock className="w-4 h-4" />
                Pending review
              </div>
            ) : pendingAvatar?.status === 'denied' ? (
              <div className="text-center">
                <div className="text-xs text-red-400 mb-1">Denied: {pendingAvatar.denial_reason || 'Not appropriate'}</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-1 text-sm text-[hsl(var(--bc-primary))] hover:opacity-80 transition"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingAvatar ? 'Uploading...' : 'Try Again'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="flex items-center gap-1 text-sm text-[hsl(var(--bc-primary))] hover:opacity-80 transition"
              >
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
              </button>
            )}
          </div>

          <div className="flex-1">
            <div className="mb-3">
              <label className="text-sm text-[hsl(var(--bc-text-muted))]">Username</label>
              <div className="text-[hsl(var(--bc-text))] font-medium flex items-center gap-2 flex-wrap">
                {forumUser.username}
                {forumUser.is_verified && <BadgeCheck className="w-4 h-4 text-blue-500" />}
                {isAdmin && <Shield className="w-4 h-4 text-[hsl(var(--bc-accent))]" />}
                {membershipTier && <MembershipBadge tier={membershipTier} size="sm" />}
              </div>
            </div>
            <div>
              <label className="text-sm text-[hsl(var(--bc-text-muted))]">Email</label>
              <div className="text-[hsl(var(--bc-text))] flex items-center gap-2">
                {maskEmail(user.email || '')}
                {emailVerified ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Not Verified</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          Appearance
        </h2>
        
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[hsl(var(--bc-text))] font-medium">Theme</div>
            <div className="text-sm text-[hsl(var(--bc-text-muted))]">Choose light or dark mode</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                theme === 'light'
                  ? 'bg-[hsl(var(--bc-primary))] text-white'
                  : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-border))]'
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                theme === 'dark'
                  ? 'bg-[hsl(var(--bc-primary))] text-white'
                  : 'bg-[hsl(var(--bc-bg-light))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-border))]'
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          Social Links
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
          Add your social media links to display on your profile.
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[hsl(var(--bc-text-muted))] block mb-1">Discord Username</label>
            <input
              type="text"
              value={socialDiscord}
              onChange={(e) => setSocialDiscord(e.target.value)}
              placeholder="username#0000 or just username"
              className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
              maxLength={100}
            />
          </div>
          <div>
            <label className="text-sm text-[hsl(var(--bc-text-muted))] block mb-1">X (Twitter) Username</label>
            <div className="flex items-center">
              <span className="bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text-muted))] px-3 py-3 rounded-l-lg border border-r-0 border-[hsl(var(--bc-border))]">@</span>
              <input
                type="text"
                value={socialX}
                onChange={(e) => setSocialX(e.target.value.replace(/^@/, ''))}
                placeholder="username"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-r-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))]"
                maxLength={50}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveSocialLinks}
          disabled={savingSocial}
          className="mt-4 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition text-sm"
        >
          {savingSocial ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Social Links'}
        </button>
      </div>

      {/* Cover Photo Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Profile Cover
        </h2>
        
        <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
          Add a custom cover photo to personalize your profile. Recommended size: 1200x300 pixels.
        </p>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverUpload}
          className="hidden"
        />

        {pendingCover?.status === 'pending' ? (
          <div className="flex items-center gap-2 text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Your cover photo is pending admin review</span>
          </div>
        ) : pendingCover?.status === 'denied' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <X className="w-4 h-4" />
              <span className="text-sm">Denied: {pendingCover.denial_reason || 'Does not meet guidelines'}</span>
            </div>
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition text-sm"
            >
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingCover ? 'Uploading...' : 'Upload New Cover'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition text-sm"
          >
            {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploadingCover ? 'Uploading...' : (forumUser.cover_url ? 'Change Cover Photo' : 'Upload Cover Photo')}
          </button>
        )}
      </div>

      {/* Active Sessions */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          Active Sessions
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
          See where you're logged in and manage your sessions.
        </p>

        {loadingSessions ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[hsl(var(--bc-text-muted))] text-center py-4">No active sessions tracked</p>
        ) : (
          <div className="space-y-3 mb-4">
            {sessions.map((session) => {
              const { device, browser } = parseUserAgent(session.user_agent);
              const isPhone = device.includes('iOS') || device.includes('Android');
              return (
                <div 
                  key={session.id}
                  className={`flex items-center justify-between bg-[hsl(var(--bc-bg-light))] rounded-lg p-3 ${session.is_current ? 'border-2 border-[hsl(var(--bc-primary))]' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isPhone ? (
                      <Smartphone className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                    ) : (
                      <Monitor className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                    )}
                    <div>
                      <div className="text-[hsl(var(--bc-text))] font-medium flex items-center gap-2">
                        {device} - {browser}
                        {session.is_current && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Current</span>
                        )}
                      </div>
                      <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                        Last active: {new Date(session.last_activity_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {sessions.length > 1 && (
          <button
            onClick={handleLogoutOtherSessions}
            disabled={loggingOutOthers}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-secondary))] hover:opacity-90 text-white rounded-lg transition text-sm"
          >
            {loggingOutOthers ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Log Out of All Other Sessions
          </button>
        )}
      </div>

      {!forumUser.is_verified && (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-blue-500" />
            Verification
          </h2>
          
          {verificationRequest?.status === 'pending' ? (
            <div className="flex items-center gap-2 text-yellow-500">
              <Clock className="w-5 h-5" />
              <span>Your verification request is pending review</span>
            </div>
          ) : verificationRequest?.status === 'denied' ? (
            <div>
              <div className="flex items-center gap-2 text-red-400 mb-3">
                <X className="w-5 h-5" />
                <span>Request denied: {verificationRequest.denial_reason || 'Does not meet criteria'}</span>
              </div>
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                You can submit a new request after addressing the feedback.
              </p>
            </div>
          ) : (
            <>
              <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-3">
                Get a blue checkmark on your profile. Explain why you should be verified.
              </p>
              <textarea
                value={verificationReason}
                onChange={(e) => setVerificationReason(e.target.value)}
                placeholder="Why should you be verified? (e.g., notable community member, content creator, etc.)"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[hsl(var(--bc-text-muted))]">{verificationReason.length}/500</span>
                <button
                  onClick={handleSubmitVerification}
                  disabled={!verificationReason.trim() || submittingVerification}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition text-sm"
                >
                  {submittingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Verification'}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Two-Factor Authentication */}
      <TwoFactorSetup forumUserId={forumUser.id} emailVerified={emailVerified} />

      {/* Encryption PIN */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Message Encryption PIN
        </h2>
        
        {forumUser.dm_encryption_pin_hash ? (
          <div className="flex items-center gap-2 text-green-500">
            <Shield className="w-5 h-5" />
            <span>Encryption PIN is set. Your messages are end-to-end encrypted.</span>
          </div>
        ) : (
          <>
            <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
              Set a 4-digit PIN to encrypt your direct messages. This PIN is required to view your messages.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <div>
                <label className="text-xs text-[hsl(var(--bc-text-muted))] block mb-1">PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-24 text-center text-lg tracking-widest bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-2 text-[hsl(var(--bc-text))]"
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="text-xs text-[hsl(var(--bc-text-muted))] block mb-1">Confirm PIN</label>
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  className="w-24 text-center text-lg tracking-widest bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-2 text-[hsl(var(--bc-text))]"
                  placeholder="••••"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSetPin}
                  disabled={pin.length !== 4 || confirmPin.length !== 4 || settingPin}
                  className="bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition"
                >
                  {settingPin ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set PIN'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Privacy Settings */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          {hideThreads ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          Privacy Settings
        </h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-[hsl(var(--bc-text))] font-medium">Allow Direct Messages</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Let other users send you messages</div>
            </div>
            <button
              onClick={() => setAllowDms(!allowDms)}
              className={`w-12 h-6 rounded-full transition ${allowDms ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-text-muted))]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition ${allowDms ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <div className="text-[hsl(var(--bc-text))] font-medium">Hide Threads from Profile</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Others won't see your threads on your profile</div>
            </div>
            <button
              onClick={() => setHideThreads(!hideThreads)}
              className={`w-12 h-6 rounded-full transition ${hideThreads ? 'bg-[hsl(var(--bc-primary))]' : 'bg-[hsl(var(--bc-text-muted))]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transform transition ${hideThreads ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>

        <button
          onClick={handleSavePrivacy}
          disabled={savingPrivacy}
          className="mt-4 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition text-sm"
        >
          {savingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Privacy Settings'}
        </button>
      </div>

      {/* Pinned Threads */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Pin className="w-5 h-5" />
          Pinned Threads ({pinnedThreads.length}/3)
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
          Pin up to 3 threads to showcase on your profile.
        </p>

        {loadingThreads ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
          </div>
        ) : userThreads.length === 0 ? (
          <p className="text-[hsl(var(--bc-text-muted))] text-center py-4">You haven't created any threads yet.</p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {userThreads.map((thread) => {
              const isPinned = pinnedThreads.some(p => p.thread_id === thread.id);
              return (
                <div 
                  key={thread.id}
                  className="flex items-center justify-between bg-[hsl(var(--bc-bg-light))] rounded-lg p-3"
                >
                  <span className="text-[hsl(var(--bc-text))] truncate flex-1 mr-3">{thread.title}</span>
                  <button
                    onClick={() => handlePinThread(thread.id)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition ${
                      isPinned
                        ? 'bg-[hsl(var(--bc-primary))] text-white'
                        : 'bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-text-muted))]'
                    }`}
                  >
                    <Pin className="w-3 h-3" />
                    {isPinned ? 'Pinned' : 'Pin'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Edit2 className="w-5 h-5" />
          Signature
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-3">
          This will appear at the bottom of your posts.
        </p>
        <textarea
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Enter your signature (max 200 characters)..."
          className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
          rows={3}
          maxLength={200}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[hsl(var(--bc-text-muted))]">{signature.length}/200</span>
          <button
            onClick={handleSaveSignature}
            disabled={saving}
            className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition text-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Signature'}
          </button>
        </div>
      </div>

      {/* Blocked Users Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Ban className="w-5 h-5" />
          Blocked Users
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-4">
          Blocked users' posts will be hidden from your view.
        </p>

        {loadingBlocked ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-[hsl(var(--bc-text-muted))] text-center py-4">No blocked users</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((block) => (
              <div 
                key={block.id}
                className="flex items-center justify-between bg-[hsl(var(--bc-bg-light))] rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  {block.blocked_user?.avatar_url ? (
                    <img 
                      src={block.blocked_user.avatar_url}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-text-muted))] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-[hsl(var(--bc-text))]">{block.blocked_user?.username}</span>
                </div>
                <button
                  onClick={() => handleUnblock(block.blocked_id)}
                  className="text-[hsl(var(--bc-secondary))] hover:opacity-80 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Danger Zone - Account Deletion */}
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
          <Trash2 className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-red-600 dark:text-red-400 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Delete Account</h3>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">
              This action cannot be undone. Your account, posts, and all associated data will be permanently deleted.
            </p>
            <p className="text-[hsl(var(--bc-text))] mb-4">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] mb-4"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 text-[hsl(var(--bc-text-muted))] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
