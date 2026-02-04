import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit2, Save, Upload, Loader2, Shield, Clock, Lock, BadgeCheck, Moon, Sun, Send, Sparkles, Users, Award, Calendar, Check, X, Trash2, LogOut, Monitor, Smartphone, Link2, MessageSquare, Ban, ImageIcon } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { hashPin, isValidPin } from '@/lib/encryption';
import TwoFactorSetup from '@/components/forum/TwoFactorSetup';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { useTheme } from '@/contexts/ThemeContext';
import UserAvatar, { AVATAR_EFFECTS, AvatarEffect } from '@/components/forum/UserAvatar';
import ImageCropper from '@/components/forum/ImageCropper';
import { GoldBadge } from '@/components/forum/VerifiedBadge';

type SettingsTab = 'general' | 'security' | 'billing';

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

interface CoverRequest {
  id: string;
  status: string;
  created_at: string;
  denial_reason: string | null;
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

export default function ForumSettings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, forumUser, isAdmin, emailVerified } = useOutletContext<{
    user: any;
    forumUser: ForumUser | null;
    isAdmin: boolean;
    emailVerified?: boolean;
  }>();

  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [signature, setSignature] = useState('');
  const [savingBio, setSavingBio] = useState(false);
  const [savingSignature, setSavingSignature] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<AvatarRequest | null>(null);
  const [pendingCover, setPendingCover] = useState<CoverRequest | null>(null);
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [clearingCover, setClearingCover] = useState(false);
  
  // Image cropper
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'cover'>('avatar');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  // Privacy settings
  const [allowDms, setAllowDms] = useState(true);
  const [allowFriends, setAllowFriends] = useState(true);
  const [allowTrades, setAllowTrades] = useState(true);
  const [publicInventory, setPublicInventory] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  
  // Username change
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);
  
  // Email verification
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  
  // Sessions
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  
  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loadingBlocked, setLoadingBlocked] = useState(true);
  
  // 2FA & PIN
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [settingPin, setSettingPin] = useState(false);
  
  // Avatar effects
  const [selectedAvatarEffect, setSelectedAvatarEffect] = useState<AvatarEffect>(null);
  const [savingEffect, setSavingEffect] = useState(false);
  
  // Social links
  const [socialDiscord, setSocialDiscord] = useState('');
  const [socialX, setSocialX] = useState('');
  const [savingSocial, setSavingSocial] = useState(false);
  
  // DOB
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [savingDob, setSavingDob] = useState(false);
  
  // Gold checkmark
  const [hasGoldCheckmark, setHasGoldCheckmark] = useState(false);
  
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (forumUser && !initialized) {
      setUsername(forumUser.username || '');
      setDisplayName((forumUser as any).display_name || forumUser.username || '');
      setBio((forumUser as any).bio || '');
      setSignature(forumUser.signature || '');
      setAllowDms(forumUser.allow_dms);
      setSocialDiscord((forumUser as any).social_discord || '');
      setSocialX((forumUser as any).social_x || '');
      setSelectedAvatarEffect((forumUser as any).avatar_effect || null);
      
      const userDob = (forumUser as any).date_of_birth;
      if (userDob) {
        const [year, month, day] = userDob.split('-');
        setDobYear(year);
        setDobMonth(String(parseInt(month)));
        setDobDay(String(parseInt(day)));
      }
      
      setInitialized(true);
    }
  }, [forumUser, initialized]);

  useEffect(() => {
    if (forumUser) {
      fetchPendingAvatar();
      fetchPendingCover();
      fetchSessions();
      fetchBlockedUsers();
      fetchGoldCheckmark();
    }
  }, [forumUser]);

  const fetchGoldCheckmark = async () => {
    if (!forumUser) return;
    const { data } = await supabase.rpc('has_gold_checkmark', { _forum_user_id: forumUser.id });
    setHasGoldCheckmark(data || false);
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
    }
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

  const fetchBlockedUsers = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_blocked_users')
      .select('id, blocked_id, blocked_user:blocked_id (username, avatar_url)')
      .eq('blocker_id', forumUser.id);
    setBlockedUsers((data || []) as any);
    setLoadingBlocked(false);
  };

  const handleSendVerificationEmail = async () => {
    setSendingVerification(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-email');
      if (error) {
        toast.error('Failed to send verification email');
      } else {
        toast.success('Verification email sent! Check your inbox.');
        setVerificationEmailSent(true);
      }
    } catch (err) {
      toast.error('Failed to send verification email');
    }
    setSendingVerification(false);
  };

  const handleSaveBio = async () => {
    if (!forumUser) return;
    setSavingBio(true);
    const { error } = await supabase
      .from('forum_users')
      .update({ bio: bio.trim() || null })
      .eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to save');
    } else {
      setSuccessMessage('Bio Updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setSavingBio(false);
  };

  const handleSaveSignature = async () => {
    if (!forumUser) return;
    setSavingSignature(true);
    const { error } = await supabase
      .from('forum_users')
      .update({ signature: signature.trim() || null })
      .eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to save');
    } else {
      setSuccessMessage('Forum Signature Updated');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
    setSavingSignature(false);
  };

  const handleSavePrivacy = async () => {
    if (!forumUser) return;
    setSavingPrivacy(true);
    const { error } = await supabase
      .from('forum_users')
      .update({ allow_dms: allowDms })
      .eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to save privacy settings');
    } else {
      toast.success('Privacy settings saved!');
    }
    setSavingPrivacy(false);
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setCropperType('avatar');
    setPendingFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setCropperType('cover');
    setPendingFile(file);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!forumUser || !user) return;
    setCropperImage(null);
    
    if (cropperType === 'avatar') {
      setUploadingAvatar(true);
      try {
        const filePath = `${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('forum-avatars')
          .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
        if (uploadError) {
          toast.error('Failed to upload avatar');
          setUploadingAvatar(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('forum-avatars').getPublicUrl(filePath);
        const { error: requestError } = await supabase
          .from('forum_avatar_requests')
          .insert({ forum_user_id: forumUser.id, image_url: urlData.publicUrl, status: 'pending' });
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
    } else {
      setUploadingCover(true);
      try {
        const filePath = `covers/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('forum-avatars')
          .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
        if (uploadError) {
          toast.error('Failed to upload cover');
          setUploadingCover(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('forum-avatars').getPublicUrl(filePath);
        const { error: requestError } = await supabase
          .from('forum_cover_requests')
          .insert({ forum_user_id: forumUser.id, image_url: urlData.publicUrl, status: 'pending' });
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
    }
    setPendingFile(null);
  };

  const handleCropCancel = () => {
    if (cropperImage) URL.revokeObjectURL(cropperImage);
    setCropperImage(null);
    setPendingFile(null);
  };

  const handleClearAvatar = async () => {
    if (!forumUser) return;
    setClearingAvatar(true);
    const { error } = await supabase.from('forum_users').update({ avatar_url: null }).eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to clear profile picture');
    } else {
      toast.success('Profile picture cleared!');
      window.location.reload();
    }
    setClearingAvatar(false);
  };

  const handleClearCover = async () => {
    if (!forumUser) return;
    setClearingCover(true);
    const { error } = await supabase.from('forum_users').update({ cover_url: null }).eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to clear cover photo');
    } else {
      toast.success('Cover photo cleared!');
      window.location.reload();
    }
    setClearingCover(false);
  };

  const canChangeUsername = () => {
    if (!forumUser) return false;
    if (forumUser.username.startsWith('purged_')) return true;
    const lastChange = (forumUser as any).last_username_change_at;
    if (!lastChange) return true;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(lastChange) < sevenDaysAgo;
  };

  const getNextUsernameChangeDate = () => {
    if (!forumUser) return null;
    const lastChange = (forumUser as any).last_username_change_at;
    if (!lastChange) return null;
    return new Date(new Date(lastChange).getTime() + 7 * 24 * 60 * 60 * 1000);
  };

  const handleChangeUsername = async () => {
    if (!forumUser || !newUsername.trim()) return;
    const usernameRegex = /^[a-z0-9_]{3,20}$/;
    if (!usernameRegex.test(newUsername.toLowerCase())) {
      toast.error('Username must be 3-20 characters, lowercase letters, numbers, and underscores only');
      return;
    }
    if (!canChangeUsername()) {
      toast.error('You can only change your username once every 7 days');
      return;
    }
    setChangingUsername(true);
    const { data: existingUser } = await supabase
      .from('forum_users')
      .select('id')
      .ilike('username', newUsername)
      .neq('id', forumUser.id)
      .single();
    if (existingUser) {
      toast.error('Username is already taken');
      setChangingUsername(false);
      return;
    }
    const { data: profanityCheck } = await supabase.functions.invoke('forum-check-profanity', {
      body: { text: newUsername }
    });
    if (profanityCheck?.hasProfanity) {
      toast.error('Username contains inappropriate words');
      setChangingUsername(false);
      return;
    }
    const { error } = await supabase
      .from('forum_users')
      .update({ username: newUsername.toLowerCase(), last_username_change_at: new Date().toISOString() })
      .eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to change username');
    } else {
      setSuccessMessage('Username Successfully Changed');
      setShowUsernameModal(false);
      setNewUsername('');
      window.location.reload();
    }
    setChangingUsername(false);
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
    const { error } = await supabase.from('forum_users').update({ dm_encryption_pin_hash: hashedPin }).eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to set PIN');
    } else {
      toast.success('Encryption PIN set!');
      setPin('');
      setConfirmPin('');
    }
    setSettingPin(false);
  };

  const handleLogoutOtherSessions = async () => {
    if (!forumUser) return;
    setLoggingOutOthers(true);
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

  if (!user) {
    navigate('/login');
    return null;
  }

  if (!forumUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card card-body">
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Settings</h1>
          <p className="text-[hsl(var(--bc-text-muted))] mt-2">
            Your account is signed in, but you don't have a forum profile yet.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => navigate('/register')}
              className="btn btn-success"
            >
              Create forum profile
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary"
            >
              Back to forums
            </button>
          </div>
        </div>
      </div>
    );
  }

  const membershipTier = (forumUser as any).membership_tier as 'bronze' | 'silver' | 'platinum' | null;

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Account Information Card */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Account Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* User ID */}
          <div>
            <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">
              User ID
            </label>
            <div className="mt-1 font-semibold text-[hsl(var(--bc-text))]">
              #{(forumUser as any).serial_id || '—'}
            </div>
          </div>
          
          {/* Username */}
          <div>
            <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">
              Username
            </label>
            <div className="mt-1">
              <div className="card card-body card-inner flex items-center justify-between">
                <span className="font-semibold text-[hsl(var(--bc-text))]">{forumUser.username}</span>
                {canChangeUsername() ? (
                  <button
                    onClick={() => setShowUsernameModal(true)}
                    className="text-[hsl(var(--bc-primary))] hover:opacity-80 text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-xs text-[hsl(var(--bc-text-muted))] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getNextUsernameChangeDate()?.toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Display Name */}
          <div>
            <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">
              Display Name
            </label>
            <div className="mt-1">
              <div className="card card-body card-inner">
                <span className="font-semibold text-[hsl(var(--bc-text))]">{displayName || forumUser.username}</span>
              </div>
            </div>
          </div>
          
          {/* Email */}
          <div>
            <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase tracking-wide flex items-center gap-2">
              Email Address
              {emailVerified ? (
                <span className="text-[10px] text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />Verified
                </span>
              ) : (
                <span className="text-[10px] text-red-500 flex items-center gap-1">
                  <X className="w-3 h-3" />Unverified
                </span>
              )}
            </label>
            <div className="mt-1">
              <div className="card card-body card-inner flex items-center justify-between">
                <span className="font-semibold text-[hsl(var(--bc-text))]">{maskEmail(user.email || '')}</span>
                {!emailVerified && !verificationEmailSent && (
                  <button
                    onClick={handleSendVerificationEmail}
                    disabled={sendingVerification}
                    className="text-[hsl(var(--bc-primary))] hover:opacity-80 text-xs flex items-center gap-1"
                  >
                    {sendingVerification ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    Verify
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About You */}
        <div className="mb-4">
          <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">
            About You
          </label>
          <div className="relative mt-1">
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form w-full resize-none pr-20"
              rows={4}
              placeholder={`Hi there, my name is ${forumUser.username}!`}
              maxLength={500}
            />
            <button
              onClick={handleSaveBio}
              disabled={savingBio}
              className="btn btn-success btn-sm absolute bottom-2 right-2"
            >
              {savingBio ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </button>
          </div>
        </div>

        {/* Forum Signature */}
        <div>
          <label className="text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase tracking-wide">
            Forum Signature
          </label>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              className="form form-sm flex-1"
              placeholder="Forum Signature"
              maxLength={200}
            />
            <button
              onClick={handleSaveSignature}
              disabled={savingSignature}
              className="btn btn-success btn-sm"
            >
              {savingSignature ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
            </button>
          </div>
        </div>
      </div>

      {/* Website Theme Card */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Website Theme</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Light Theme */}
          <button
            onClick={() => setTheme('light')}
            className={`card card-body card-inner p-4 transition cursor-pointer ${
              theme === 'light' ? 'ring-2 ring-[hsl(var(--bc-primary))]' : 'hover:border-[hsl(var(--bc-primary))]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full border-2 ${
                theme === 'light' 
                  ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]' 
                  : 'border-[hsl(var(--bc-border))]'
              }`}>
                {theme === 'light' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-300 border-2 border-gray-200" />
                <span className="font-semibold text-lg text-[hsl(var(--bc-text))]">Light Theme</span>
              </div>
            </div>
          </button>

          {/* Dark Theme */}
          <button
            onClick={() => setTheme('dark')}
            className={`card card-body card-inner p-4 transition cursor-pointer ${
              theme === 'dark' ? 'ring-2 ring-[hsl(var(--bc-primary))]' : 'hover:border-[hsl(var(--bc-primary))]'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full border-2 ${
                theme === 'dark' 
                  ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]' 
                  : 'border-[hsl(var(--bc-border))]'
              }`}>
                {theme === 'dark' && <Check className="w-3 h-3 text-white" />}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border-2 border-gray-600" />
                <span className="font-semibold text-lg text-[hsl(var(--bc-text))]">Dark Theme</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Profile Picture & Cover */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Profile Picture</h3>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Note:</strong> Profile pictures will be replaced with in-game avatars after BLOX City launches.
          </p>
        </div>

        <div className="flex items-center gap-4">
          {forumUser.avatar_url ? (
            <img src={forumUser.avatar_url} alt={forumUser.username} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            {pendingAvatar?.status === 'pending' ? (
              <span className="text-sm text-yellow-600 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pending review
              </span>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="btn btn-primary btn-sm"
              >
                {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingAvatar ? 'Uploading...' : 'Change'}
              </button>
            )}
            {forumUser.avatar_url && (
              <button onClick={handleClearAvatar} disabled={clearingAvatar} className="text-xs text-red-500 hover:text-red-600">
                {clearingAvatar ? 'Clearing...' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Two-Factor Authentication */}
      <TwoFactorSetup forumUserId={forumUser.id} emailVerified={emailVerified} />

      {/* Privacy Settings */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Privacy Settings</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div className="font-medium text-[hsl(var(--bc-text))]">Accept Messages</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Allow other users to send you direct messages</div>
            </div>
            <input
              type="checkbox"
              checked={allowDms}
              onChange={(e) => setAllowDms(e.target.checked)}
              className="form-check-input"
            />
          </label>
          
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div className="font-medium text-[hsl(var(--bc-text))]">Accept Friends</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Allow other users to send you friend requests</div>
            </div>
            <input
              type="checkbox"
              checked={allowFriends}
              onChange={(e) => setAllowFriends(e.target.checked)}
              className="form-check-input"
            />
          </label>
          
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div className="font-medium text-[hsl(var(--bc-text))]">Accept Trades</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Allow other users to send you trade requests</div>
            </div>
            <input
              type="checkbox"
              checked={allowTrades}
              onChange={(e) => setAllowTrades(e.target.checked)}
              className="form-check-input"
            />
          </label>
          
          <label className="flex items-center justify-between py-2 cursor-pointer">
            <div>
              <div className="font-medium text-[hsl(var(--bc-text))]">Public Inventory</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Allow other users to view your inventory</div>
            </div>
            <input
              type="checkbox"
              checked={publicInventory}
              onChange={(e) => setPublicInventory(e.target.checked)}
              className="form-check-input"
            />
          </label>
        </div>

        <button
          onClick={handleSavePrivacy}
          disabled={savingPrivacy}
          className="btn btn-success mt-4"
        >
          {savingPrivacy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
        </button>
      </div>

      {/* Active Sessions */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Active Sessions</h3>
        
        {loadingSessions ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-[hsl(var(--bc-text-muted))] text-center py-4">No active sessions tracked</p>
        ) : (
          <div className="space-y-2 mb-4">
            {sessions.map((session) => {
              const { device, browser } = parseUserAgent(session.user_agent);
              const isPhone = device.includes('iOS') || device.includes('Android');
              return (
                <div 
                  key={session.id}
                  className={`card card-body card-inner flex items-center justify-between ${
                    session.is_current ? 'ring-2 ring-[hsl(var(--bc-primary))]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isPhone ? <Smartphone className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" /> : <Monitor className="w-5 h-5 text-[hsl(var(--bc-text-muted))]" />}
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
          <button onClick={handleLogoutOtherSessions} disabled={loggingOutOthers} className="btn btn-secondary">
            {loggingOutOthers ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Log Out of All Other Sessions
          </button>
        )}
      </div>

      {/* Blocked Users */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Blocked Users</h3>
        
        {loadingBlocked ? (
          <div className="text-center py-4">
            <Loader2 className="w-6 h-6 text-[hsl(var(--bc-text-muted))] animate-spin mx-auto" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <p className="text-[hsl(var(--bc-text-muted))] text-center py-4">No blocked users</p>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((block) => (
              <div key={block.id} className="card card-body card-inner flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {block.blocked_user?.avatar_url ? (
                    <img src={block.blocked_user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-text-muted))] flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-[hsl(var(--bc-text))]">{block.blocked_user?.username}</span>
                </div>
                <button onClick={() => handleUnblock(block.blocked_id)} className="text-red-500 hover:text-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderBillingTab = () => (
    <div className="space-y-6">
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Membership</h3>
        
        {membershipTier ? (
          <div className="flex items-center gap-3 mb-4">
            <MembershipBadge tier={membershipTier} size="lg" />
            <div>
              <div className="font-semibold text-[hsl(var(--bc-text))] capitalize">{membershipTier} Member</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">Your current membership tier</div>
            </div>
          </div>
        ) : (
          <p className="text-[hsl(var(--bc-text-muted))]">You don't have an active membership. Visit the shop to upgrade!</p>
        )}
        
        <button onClick={() => navigate('/shop')} className="btn btn-primary">
          View Membership Options
        </button>
      </div>

      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Transaction History</h3>
        <p className="text-[hsl(var(--bc-text-muted))] text-center py-8">No transactions yet</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left Sidebar */}
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-3">Account Settings</h2>
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${
                  activeTab === 'general'
                    ? 'bg-[hsl(var(--bc-primary))] text-white'
                    : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                General
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${
                  activeTab === 'security'
                    ? 'bg-[hsl(var(--bc-primary))] text-white'
                    : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                Security & Privacy
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full text-left px-4 py-2.5 rounded-lg transition font-medium ${
                  activeTab === 'billing'
                    ? 'bg-[hsl(var(--bc-primary))] text-white'
                    : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                Billing
              </button>
            </li>
          </ul>
        </div>

        {/* Main Content */}
        <div className="md:col-span-3">
          {/* Success Alert */}
          {successMessage && (
            <div className="bg-green-100 border border-green-300 text-green-700 font-semibold text-center py-3 px-4 rounded-lg mb-4">
              {successMessage}
            </div>
          )}

          {/* Tab Title */}
          <h1 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4 capitalize">{activeTab}</h1>

          {/* Tab Content */}
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'security' && renderSecurityTab()}
          {activeTab === 'billing' && renderBillingTab()}
        </div>
      </div>

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card card-body max-w-md w-full">
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Change Username</h3>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              You can change your username once every 7 days. Choose wisely!
            </p>
            <div className="mb-4">
              <label className="block text-sm text-[hsl(var(--bc-text-muted))] mb-1">New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                placeholder="Enter new username..."
                className="form w-full"
                maxLength={20}
              />
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                3-20 characters, lowercase letters, numbers, and underscores only
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowUsernameModal(false); setNewUsername(''); }} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleChangeUsername} disabled={!newUsername.trim() || changingUsername} className="btn btn-success">
                {changingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Change Username
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {cropperImage && (
        <ImageCropper
          imageUrl={cropperImage}
          aspectRatio={cropperType === 'avatar' ? 1 : 3}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          type={cropperType}
        />
      )}
    </div>
  );
}
