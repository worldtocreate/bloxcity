import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit2, Save, Upload, Loader2, Shield, Ban, X, Clock, Lock, Eye, EyeOff, BadgeCheck, Pin, MessageSquare, ImageIcon, Moon, Sun, Trash2, LogOut, Monitor, Smartphone, Link2, Mail, Send, Sparkles } from 'lucide-react';
import { ForumUser } from '@/hooks/useForumAuth';
import { toast } from 'sonner';
import { hashPin, isValidPin } from '@/lib/encryption';
import TwoFactorSetup from '@/components/forum/TwoFactorSetup';
import MembershipBadge from '@/components/forum/MembershipBadge';
import { useTheme } from '@/contexts/ThemeContext';
import UserAvatar, { AVATAR_EFFECTS, AvatarEffect } from '@/components/forum/UserAvatar';
import UserLevelBadge from '@/components/forum/UserLevelBadge';
import ImageCropper from '@/components/forum/ImageCropper';

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
  
  // Account disable states
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableReason, setDisableReason] = useState('');
  const [disableDuration, setDisableDuration] = useState('7');
  const [disabling, setDisabling] = useState(false);
  
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
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [selectedAvatarEffect, setSelectedAvatarEffect] = useState<AvatarEffect>(null);
  const [savingEffect, setSavingEffect] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  
  // Username change
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);
  
  // Email change
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);
  
  // Clear avatar/cover
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [clearingCover, setClearingCover] = useState(false);
  
  // Image cropper
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'cover'>('avatar');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  useEffect(() => {
    if (forumUser && !initialized) {
      setSignature(forumUser.signature || '');
      setAllowDms(forumUser.allow_dms);
      setHideThreads(forumUser.hide_threads);
      setSocialDiscord((forumUser as any).social_discord || '');
      setSocialX((forumUser as any).social_x || '');
      setSelectedAvatarEffect((forumUser as any).avatar_effect || null);
      setStatusText((forumUser as any).status_text || '');
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

  const handleSaveStatus = async () => {
    if (!forumUser) return;
    setSavingStatus(true);

    const { error } = await supabase
      .from('forum_users')
      .update({ 
        status_text: statusText.trim() || null,
        status_updated_at: statusText.trim() ? new Date().toISOString() : null
      })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to save status');
    } else {
      toast.success('Status updated!');
    }
    setSavingStatus(false);
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

  const handleDisableAccount = async () => {
    if (!forumUser || !disableReason) return;
    setDisabling(true);

    let disabledUntil: string | null = null;
    if (disableDuration !== 'permanent') {
      const daysToAdd = parseInt(disableDuration);
      disabledUntil = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase
      .from('forum_users')
      .update({
        is_self_disabled: true,
        self_disabled_reason: disableReason,
        self_disabled_until: disabledUntil,
        self_disabled_at: new Date().toISOString()
      })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to disable account');
    } else {
      toast.success('Account disabled. You can reactivate it when you log back in.');
      setShowDisableModal(false);
      // Sign out the user
      await supabase.auth.signOut();
      navigate('/login');
    }
    setDisabling(false);
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

    // Create a URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setCropperType('avatar');
    setPendingFile(file);
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
    }
    
    setPendingFile(null);
  };

  const handleCropCancel = () => {
    if (cropperImage) {
      URL.revokeObjectURL(cropperImage);
    }
    setCropperImage(null);
    setPendingFile(null);
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

    // Create a URL for the cropper
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setCropperType('cover');
    setPendingFile(file);
    
    // Reset the input
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  const handleSaveAvatarEffect = async (effect: AvatarEffect) => {
    if (!forumUser) return;
    setSavingEffect(true);
    
    const { error } = await supabase
      .from('forum_users')
      .update({ avatar_effect: effect })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to save avatar effect');
    } else {
      setSelectedAvatarEffect(effect);
      toast.success(effect ? 'Avatar effect applied!' : 'Avatar effect removed');
    }
    setSavingEffect(false);
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

  const canChangeUsername = () => {
    if (!forumUser) return false;
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

    // Check if username is already taken
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

    // Check banned words
    const { data: profanityCheck, error: profanityError } = await supabase.functions.invoke('forum-check-profanity', {
      body: { text: newUsername }
    });

    if (profanityCheck?.hasProfanity) {
      toast.error('Username contains inappropriate words');
      setChangingUsername(false);
      return;
    }

    const { error } = await supabase
      .from('forum_users')
      .update({
        username: newUsername.toLowerCase(),
        last_username_change_at: new Date().toISOString()
      })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to change username');
    } else {
      toast.success('Username changed successfully!');
      setShowUsernameModal(false);
      setNewUsername('');
      // Reload the page to update the forumUser data
      window.location.reload();
    }
    setChangingUsername(false);
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (newEmail.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('This is already your current email');
      return;
    }

    setChangingEmail(true);

    const { error } = await supabase.auth.updateUser({
      email: newEmail
    });

    if (error) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already in use');
      } else {
        toast.error(error.message || 'Failed to change email');
      }
    } else {
      toast.success('Confirmation email sent! Check both your old and new email addresses.');
      setShowEmailModal(false);
      setNewEmail('');
    }
    setChangingEmail(false);
  };

  const handleClearAvatar = async () => {
    if (!forumUser) return;
    setClearingAvatar(true);

    const { error } = await supabase
      .from('forum_users')
      .update({ avatar_url: null })
      .eq('id', forumUser.id);

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

    const { error } = await supabase
      .from('forum_users')
      .update({ cover_url: null })
      .eq('id', forumUser.id);

    if (error) {
      toast.error('Failed to clear cover photo');
    } else {
      toast.success('Cover photo cleared!');
      window.location.reload();
    }
    setClearingCover(false);
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
              onChange={handleAvatarSelect}
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
              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="flex items-center gap-1 text-sm text-[hsl(var(--bc-primary))] hover:opacity-80 transition"
                >
                  {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                </button>
                {forumUser.avatar_url && (
                  <button
                    onClick={handleClearAvatar}
                    disabled={clearingAvatar}
                    className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 transition"
                  >
                    {clearingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    Clear
                  </button>
                )}
              </div>
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
              {canChangeUsername() ? (
                <button
                  onClick={() => setShowUsernameModal(true)}
                  className="flex items-center gap-1 text-sm text-[hsl(var(--bc-primary))] hover:opacity-80 transition mt-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Change Username
                </button>
              ) : (
                <div className="text-xs text-[hsl(var(--bc-text-muted))] mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Next change available: {getNextUsernameChangeDate()?.toLocaleDateString()}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-[hsl(var(--bc-text-muted))]">Email</label>
              <div className="text-[hsl(var(--bc-text))] flex items-center gap-2 flex-wrap">
                {maskEmail(user.email || '')}
                {emailVerified ? (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Verified</span>
                ) : (
                  <>
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Not Verified</span>
                    {verificationEmailSent ? (
                      <span className="text-xs text-green-600">Email sent!</span>
                    ) : (
                      <button
                        onClick={handleSendVerificationEmail}
                        disabled={sendingVerification}
                        className="flex items-center gap-1 text-xs text-[hsl(var(--bc-primary))] hover:underline disabled:opacity-50"
                      >
                        {sendingVerification ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        Resend verification email
                      </button>
                    )}
                  </>
                )}
              </div>
              <button
                onClick={() => setShowEmailModal(true)}
                className="text-xs text-[hsl(var(--bc-primary))] hover:underline mt-1 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                Change email address
              </button>
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
          onChange={handleCoverSelect}
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
            {forumUser.cover_url && (
              <button
                onClick={handleClearCover}
                disabled={clearingCover}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm"
              >
                {clearingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Clear Cover
              </button>
            )}
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => coverInputRef.current?.click()}
              disabled={uploadingCover}
              className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white rounded-lg transition text-sm"
            >
              {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingCover ? 'Uploading...' : (forumUser.cover_url ? 'Change Cover Photo' : 'Upload Cover Photo')}
            </button>
            {forumUser.cover_url && (
              <button
                onClick={handleClearCover}
                disabled={clearingCover}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition text-sm"
              >
                {clearingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                Clear Cover
              </button>
            )}
          </div>
        )}
      </div>

      {/* Avatar Effects Section - Members Only */}
      {(forumUser as any).membership_tier && (
        <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
            Avatar Effects
            <MembershipBadge tier={(forumUser as any).membership_tier} size="sm" showLabel={false} />
          </h2>
          
          <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
            As a member, you can add special effects to your profile picture!
          </p>

          {/* Preview */}
          <div className="flex items-center gap-4 mb-6 p-4 bg-[hsl(var(--bc-bg-light))] rounded-xl">
            <UserAvatar
              avatarUrl={forumUser.avatar_url}
              username={forumUser.username}
              size="lg"
              effect={selectedAvatarEffect}
              membershipTier={(forumUser as any).membership_tier}
            />
            <div>
              <div className="font-semibold text-[hsl(var(--bc-text))]">{forumUser.username}</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                {selectedAvatarEffect ? AVATAR_EFFECTS.find(e => e.value === selectedAvatarEffect)?.label : 'No effect'}
              </div>
            </div>
          </div>

          {/* Effect Categories */}
          <div className="space-y-4">
            {/* Glow Effects */}
            <div>
              <h3 className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Glow Effects</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVATAR_EFFECTS.filter(e => e.category === 'glow').map((effect) => (
                  <button
                    key={effect.value}
                    onClick={() => handleSaveAvatarEffect(effect.value)}
                    disabled={savingEffect}
                    className={`p-3 rounded-lg border transition text-sm flex items-center gap-2 ${
                      selectedAvatarEffect === effect.value
                        ? 'border-[hsl(var(--bc-primary))] bg-[hsla(var(--bc-primary),0.1)] text-[hsl(var(--bc-primary))]'
                        : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-text))]'
                    }`}
                  >
                    <UserAvatar
                      avatarUrl={forumUser.avatar_url}
                      username={forumUser.username}
                      size="xs"
                      effect={effect.value}
                      membershipTier={(forumUser as any).membership_tier}
                    />
                    {effect.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pulse Effects */}
            <div>
              <h3 className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Pulse Effects</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVATAR_EFFECTS.filter(e => e.category === 'pulse').map((effect) => (
                  <button
                    key={effect.value}
                    onClick={() => handleSaveAvatarEffect(effect.value)}
                    disabled={savingEffect}
                    className={`p-3 rounded-lg border transition text-sm flex items-center gap-2 ${
                      selectedAvatarEffect === effect.value
                        ? 'border-[hsl(var(--bc-primary))] bg-[hsla(var(--bc-primary),0.1)] text-[hsl(var(--bc-primary))]'
                        : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-text))]'
                    }`}
                  >
                    <UserAvatar
                      avatarUrl={forumUser.avatar_url}
                      username={forumUser.username}
                      size="xs"
                      effect={effect.value}
                      membershipTier={(forumUser as any).membership_tier}
                    />
                    {effect.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Effects */}
            <div>
              <h3 className="text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Frames & Overlays</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVATAR_EFFECTS.filter(e => e.category === 'frame').map((effect) => (
                  <button
                    key={effect.value}
                    onClick={() => handleSaveAvatarEffect(effect.value)}
                    disabled={savingEffect}
                    className={`p-3 rounded-lg border transition text-sm flex items-center gap-2 ${
                      selectedAvatarEffect === effect.value
                        ? 'border-[hsl(var(--bc-primary))] bg-[hsla(var(--bc-primary),0.1)] text-[hsl(var(--bc-primary))]'
                        : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))] text-[hsl(var(--bc-text))]'
                    }`}
                  >
                    <UserAvatar
                      avatarUrl={forumUser.avatar_url}
                      username={forumUser.username}
                      size="xs"
                      effect={effect.value}
                      membershipTier={(forumUser as any).membership_tier}
                    />
                    {effect.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Remove Effect Button */}
          {selectedAvatarEffect && (
            <button
              onClick={() => handleSaveAvatarEffect(null)}
              disabled={savingEffect}
              className="mt-4 text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
            >
              Remove effect
            </button>
          )}
        </div>
      )}

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

      {/* Status Update Section */}
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Status
        </h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-3">
          Share what you're thinking. This shows on your profile and your friends' dashboard.
        </p>
        <textarea
          value={statusText}
          onChange={(e) => setStatusText(e.target.value)}
          placeholder="What's on your mind? (max 280 characters)..."
          className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] resize-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
          rows={2}
          maxLength={280}
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-[hsl(var(--bc-text-muted))]">{statusText.length}/280</span>
          <button
            onClick={handleSaveStatus}
            disabled={savingStatus}
            className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition text-sm"
          >
            {savingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {savingStatus ? 'Saving...' : 'Update Status'}
          </button>
        </div>
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

      {/* Account Controls */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-yellow-700 dark:text-yellow-400 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Take a Break
        </h2>
        <p className="text-yellow-600 dark:text-yellow-400 text-sm mb-4">
          Need some time away? Disable your account temporarily. You can reactivate it anytime by logging in.
        </p>
        <button
          onClick={() => setShowDisableModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition text-sm"
        >
          <Clock className="w-4 h-4" />
          Disable Account
        </button>
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

      {/* Disable Account Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Disable Account</h3>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">
              Your account will be temporarily disabled. You can reactivate it anytime by logging back in.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  Why are you taking a break?
                </label>
                <select
                  value={disableReason}
                  onChange={(e) => setDisableReason(e.target.value)}
                  className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))]"
                >
                  <option value="">Select a reason...</option>
                  <option value="need_a_break">I need a break from the forum</option>
                  <option value="too_busy">I'm too busy right now</option>
                  <option value="privacy_concerns">Privacy concerns</option>
                  <option value="not_using">Not using the forum anymore</option>
                  <option value="other">Other reason</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                  How long?
                </label>
                <select
                  value={disableDuration}
                  onChange={(e) => setDisableDuration(e.target.value)}
                  className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))]"
                >
                  <option value="7">1 week</option>
                  <option value="14">2 weeks</option>
                  <option value="30">1 month</option>
                  <option value="90">3 months</option>
                  <option value="180">6 months</option>
                  <option value="permanent">Until I reactivate</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDisableModal(false);
                  setDisableReason('');
                  setDisableDuration('7');
                }}
                className="px-4 py-2 text-[hsl(var(--bc-text-muted))] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleDisableAccount}
                disabled={!disableReason || disabling}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
                Disable Account
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Username Change Modal */}
      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 max-w-md w-full">
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
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
                maxLength={20}
              />
              <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                3-20 characters, lowercase letters, numbers, and underscores only
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUsernameModal(false);
                  setNewUsername('');
                }}
                className="px-4 py-2 text-[hsl(var(--bc-text-muted))] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeUsername}
                disabled={!newUsername.trim() || changingUsername}
                className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                {changingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Change Username
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Change Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-2">Change Email Address</h3>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Enter your new email address. You'll need to verify both your old and new email addresses.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                Current Email
              </label>
              <div className="text-[hsl(var(--bc-text-muted))] bg-[hsl(var(--bc-bg-light))] rounded-lg p-3 border border-[hsl(var(--bc-border))]">
                {user?.email}
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Enter new email address"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--bc-primary))]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                }}
                className="px-4 py-2 text-[hsl(var(--bc-text-muted))] hover:opacity-80"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeEmail}
                disabled={!newEmail.trim() || changingEmail}
                className="flex items-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition"
              >
                {changingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Change Email
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
