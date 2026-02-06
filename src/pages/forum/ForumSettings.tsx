import { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Edit2, Save, Upload, Loader2, Shield, Clock, Lock, BadgeCheck, Moon, Sun, Send, Sparkles, Users, Award, Calendar, Check, X, Trash2, LogOut, Monitor, Smartphone, Link2, MessageSquare, Ban, ImageIcon, Heart } from 'lucide-react';
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
  const { theme, setTheme, hasValentinesTheme, setHasValentinesTheme } = useTheme();
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
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [pendingAvatar, setPendingAvatar] = useState<AvatarRequest | null>(null);
  const [pendingCover, setPendingCover] = useState<CoverRequest | null>(null);
  const [clearingAvatar, setClearingAvatar] = useState(false);
  const [clearingCover, setClearingCover] = useState(false);
  const [clearingBackground, setClearingBackground] = useState(false);
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState<string | null>(null);
  
  // Image cropper
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [cropperType, setCropperType] = useState<'avatar' | 'cover' | 'background'>('avatar');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  
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
  const [hideAffiliates, setHideAffiliates] = useState(false);
  const [savingAffiliateVisibility, setSavingAffiliateVisibility] = useState(false);
  const [currentAffiliates, setCurrentAffiliates] = useState<Array<{ id: string; username: string; avatar_url: string | null }>>([]);
  const [newAffiliateUsername, setNewAffiliateUsername] = useState('');
  const [addingAffiliate, setAddingAffiliate] = useState(false);
  const [removingAffiliateId, setRemovingAffiliateId] = useState<string | null>(null);
  
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
      setCustomBackgroundUrl((forumUser as any).custom_background_url || null);
      
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
      fetchAffiliates();
      fetchValentinesTheme();
    }
  }, [forumUser]);

  const fetchValentinesTheme = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_users')
      .select('has_valentines_theme, selected_theme')
      .eq('id', forumUser.id)
      .single();
    
    if (data) {
      setHasValentinesTheme(data.has_valentines_theme || false);
      if (data.selected_theme === 'valentines' && data.has_valentines_theme) {
        setTheme('valentines');
      }
    }
  };

  // Check if Valentine's Day has arrived
  const isValentinesDayOrAfter = () => {
    const now = new Date();
    const valentinesDay = new Date('2026-02-14T00:00:00');
    return now >= valentinesDay;
  };

  const isValentinesUnlocked = hasValentinesTheme && isValentinesDayOrAfter();

  const handleThemeChange = async (newTheme: 'light' | 'valentines') => {
    // Valentine's theme only available if claimed AND it's Valentine's Day or after
    if (newTheme === 'valentines' && !isValentinesUnlocked) return;
    
    setTheme(newTheme);
    
    // Save to database
    if (forumUser) {
      await supabase
        .from('forum_users')
        .update({ selected_theme: newTheme })
        .eq('id', forumUser.id);
    }
  };

  const fetchGoldCheckmark = async () => {
    if (!forumUser) return;
   const { data: hasGold } = await supabase.rpc('has_gold_checkmark', { _forum_user_id: forumUser.id });
   setHasGoldCheckmark(hasGold || false);
   
   if (hasGold) {
     const { data: goldData } = await supabase
       .from('forum_gold_checkmarks')
       .select('hide_affiliates')
       .eq('forum_user_id', forumUser.id)
       .single();
     if (goldData) {
       setHideAffiliates(goldData.hide_affiliates || false);
     }
   }
  };

  const fetchAffiliates = async () => {
    if (!forumUser) return;
    const { data: hasGold } = await supabase.rpc('has_gold_checkmark', { _forum_user_id: forumUser.id });
    if (!hasGold) return;
    
    const { data: affiliatesData } = await supabase
      .from('forum_affiliates')
      .select('affiliate_user_id')
      .eq('gold_user_id', forumUser.id);
    
    if (affiliatesData && affiliatesData.length > 0) {
      const affiliateIds = affiliatesData.map(a => a.affiliate_user_id);
      const { data: users } = await supabase
        .from('forum_users')
        .select('id, username, avatar_url')
        .in('id', affiliateIds);
      if (users) {
        setCurrentAffiliates(users);
      }
    } else {
      setCurrentAffiliates([]);
    }
  };

  const handleAddAffiliate = async () => {
    if (!forumUser || !newAffiliateUsername.trim()) return;
    setAddingAffiliate(true);
    
    // Find the user
    const { data: targetUser, error: userError } = await supabase
      .from('forum_users')
      .select('id, username')
      .ilike('username', newAffiliateUsername.trim())
      .single();
    
    if (userError || !targetUser) {
      toast.error('User not found');
      setAddingAffiliate(false);
      return;
    }
    
    // Check if already an affiliate
    const { data: existingAffiliate } = await supabase
      .from('forum_affiliates')
      .select('id')
      .eq('gold_user_id', forumUser.id)
      .eq('affiliate_user_id', targetUser.id)
      .single();
    
    if (existingAffiliate) {
      toast.error('User is already an affiliate');
      setAddingAffiliate(false);
      return;
    }
    
    // Check if user has gold checkmark (can't be affiliate)
    const { data: hasGold } = await supabase.rpc('has_gold_checkmark', { 
      _forum_user_id: targetUser.id 
    });
    
    if (hasGold) {
      toast.error('Cannot add gold checkmark users as affiliates');
      setAddingAffiliate(false);
      return;
    }
    
    // Add affiliate directly (for gold checkmark users)
    const { error: insertError } = await supabase
      .from('forum_affiliates')
      .insert({
        gold_user_id: forumUser.id,
        affiliate_user_id: targetUser.id
      });
    
    if (insertError) {
      toast.error('Failed to add affiliate');
    } else {
      toast.success(`${targetUser.username} added as affiliate!`);
      setNewAffiliateUsername('');
      fetchAffiliates();
    }
    
    setAddingAffiliate(false);
  };

  const handleRemoveAffiliate = async (affiliateUserId: string) => {
    if (!forumUser) return;
    setRemovingAffiliateId(affiliateUserId);
    
    const { error } = await supabase
      .from('forum_affiliates')
      .delete()
      .eq('gold_user_id', forumUser.id)
      .eq('affiliate_user_id', affiliateUserId);
    
    if (error) {
      toast.error('Failed to remove affiliate');
    } else {
      toast.success('Affiliate removed');
      fetchAffiliates();
    }
    
    setRemovingAffiliateId(null);
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

  const handleBackgroundSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !forumUser || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Background image must be less than 5MB');
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setCropperImage(imageUrl);
    setCropperType('background');
    setPendingFile(file);
    if (backgroundInputRef.current) backgroundInputRef.current.value = '';
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
    } else if (cropperType === 'cover') {
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
    } else if (cropperType === 'background') {
      setUploadingBackground(true);
      try {
        const filePath = `backgrounds/${user.id}/${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('forum-avatars')
          .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/jpeg' });
        if (uploadError) {
          toast.error('Failed to upload background');
          setUploadingBackground(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('forum-avatars').getPublicUrl(filePath);
        // Custom backgrounds don't need review - they're only visible to the user
        const { error: updateError } = await supabase
          .from('forum_users')
          .update({ custom_background_url: urlData.publicUrl })
          .eq('id', forumUser.id);
        if (updateError) {
          toast.error('Failed to save background');
        } else {
          toast.success('Custom background set!');
          setCustomBackgroundUrl(urlData.publicUrl);
        }
      } catch (err) {
        toast.error('Failed to upload background');
      }
      setUploadingBackground(false);
    }
    setPendingFile(null);
  };

  const handleClearBackground = async () => {
    if (!forumUser) return;
    setClearingBackground(true);
    const { error } = await supabase.from('forum_users').update({ custom_background_url: null }).eq('id', forumUser.id);
    if (error) {
      toast.error('Failed to clear background');
    } else {
      toast.success('Background cleared!');
      setCustomBackgroundUrl(null);
    }
    setClearingBackground(false);
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
   const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
   if (!usernameRegex.test(newUsername)) {
     toast.error('Username must be 3-20 characters, letters, numbers, and underscores only');
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
   const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
     body: { content: newUsername }
    });
   if (profanityCheck.data?.hasProfanity) {
      toast.error('Username contains inappropriate words');
      setChangingUsername(false);
      return;
    }
    const { error } = await supabase
      .from('forum_users')
     .update({ username: newUsername.trim(), last_username_change_at: new Date().toISOString() })
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

      {/* Website Theme */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Website Theme</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme */}
          <button
            onClick={() => handleThemeChange('light')}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              theme === 'light' 
                ? 'border-[hsl(var(--bc-primary))] bg-[hsl(var(--bc-primary))]/5' 
                : 'border-[hsl(var(--bc-border))] hover:border-[hsl(var(--bc-primary))]/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center">
                <Sun className="w-6 h-6 text-blue-500" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-[hsl(var(--bc-text))]">Light</div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">Default theme</div>
              </div>
            </div>
            {theme === 'light' && (
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
              </div>
            )}
          </button>

          {/* Valentine's Theme */}
          <button
            onClick={() => isValentinesUnlocked && handleThemeChange('valentines')}
            disabled={!isValentinesUnlocked}
            className={`relative p-4 rounded-xl border-2 transition-all ${
              !isValentinesUnlocked 
                ? 'border-[hsl(var(--bc-border))] opacity-60 cursor-not-allowed'
                : theme === 'valentines' 
                  ? 'border-pink-500 bg-pink-500/5' 
                  : 'border-[hsl(var(--bc-border))] hover:border-pink-500/50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-200 to-red-100 border border-pink-300 flex items-center justify-center">
                <Heart className={`w-6 h-6 ${isValentinesUnlocked ? 'text-pink-500' : 'text-gray-400'}`} />
              </div>
              <div className="text-left">
                <div className={`font-semibold ${isValentinesUnlocked ? 'text-[hsl(var(--bc-text))]' : 'text-gray-400'}`}>
                  Valentine's
                </div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">
                  {isValentinesUnlocked ? 'Limited edition' : (
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3" /> 
                      {hasValentinesTheme ? 'Unlocks Feb 14' : 'Locked'}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {theme === 'valentines' && isValentinesUnlocked && (
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-pink-500" />
              </div>
            )}
            {!isValentinesUnlocked && (
              <div className="absolute top-2 right-2">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            )}
          </button>
        </div>

        {!isValentinesUnlocked && (
          <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-4 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-400" />
            {hasValentinesTheme 
              ? "You've claimed this theme! It will unlock on February 14th, 2026."
              : "The Valentine's theme is a limited-time exclusive available during Valentine's Day 2026."
            }
          </p>
        )}
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

      {/* Cover Photo */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Cover Photo</h3>
        
        <div className="flex items-start gap-4">
          {(forumUser as any).cover_url ? (
            <div className="w-40 h-20 rounded-lg overflow-hidden bg-[hsl(var(--bc-bg-light))]">
              <img src={(forumUser as any).cover_url} alt="Cover" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-40 h-20 rounded-lg bg-[hsl(var(--bc-bg-light))] flex items-center justify-center border-2 border-dashed border-[hsl(var(--bc-border))]">
              <ImageIcon className="w-8 h-8 text-[hsl(var(--bc-text-muted))]" />
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
            {pendingCover?.status === 'pending' ? (
              <span className="text-sm text-yellow-600 flex items-center gap-1">
                <Clock className="w-4 h-4" /> Pending review
              </span>
            ) : pendingCover?.status === 'denied' ? (
              <div className="space-y-1">
                <span className="text-sm text-red-600 flex items-center gap-1">
                  <X className="w-4 h-4" /> Denied
                </span>
                {pendingCover.denial_reason && (
                  <p className="text-xs text-[hsl(var(--bc-text-muted))]">Reason: {pendingCover.denial_reason}</p>
                )}
                <button
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploadingCover}
                  className="btn btn-primary btn-sm"
                >
                  {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingCover ? 'Uploading...' : 'Try Again'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="btn btn-primary btn-sm"
              >
                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingCover ? 'Uploading...' : (forumUser as any).cover_url ? 'Change' : 'Upload'}
              </button>
            )}
            {(forumUser as any).cover_url && (
              <button onClick={handleClearCover} disabled={clearingCover} className="text-xs text-red-500 hover:text-red-600">
                {clearingCover ? 'Clearing...' : 'Remove'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Site Background */}
      <div className="card card-body">
        <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))] mb-4">Custom Site Background</h3>
        
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 mb-4">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            <strong>Personal Background:</strong> This background is only visible to you while browsing the site. Other users will not see your custom background.
          </p>
        </div>

        <div className="flex items-start gap-4">
          {customBackgroundUrl ? (
            <div className="w-40 h-24 rounded-lg overflow-hidden bg-[hsl(var(--bc-bg-light))]">
              <img src={customBackgroundUrl} alt="Background" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-40 h-24 rounded-lg bg-[hsl(var(--bc-bg-light))] flex items-center justify-center border-2 border-dashed border-[hsl(var(--bc-border))]">
              <ImageIcon className="w-8 h-8 text-[hsl(var(--bc-text-muted))]" />
            </div>
          )}
          
          <div className="flex flex-col gap-2">
            <input ref={backgroundInputRef} type="file" accept="image/*" onChange={handleBackgroundSelect} className="hidden" />
            <button
              onClick={() => backgroundInputRef.current?.click()}
              disabled={uploadingBackground}
              className="btn btn-primary btn-sm"
            >
              {uploadingBackground ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingBackground ? 'Uploading...' : customBackgroundUrl ? 'Change' : 'Upload'}
            </button>
            {customBackgroundUrl && (
              <button onClick={handleClearBackground} disabled={clearingBackground} className="text-xs text-red-500 hover:text-red-600">
                {clearingBackground ? 'Clearing...' : 'Remove'}
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

     {/* Gold Checkmark Settings */}
     {hasGoldCheckmark && (
       <div className="card card-body">
         <div className="flex items-center gap-2 mb-4">
           <GoldBadge size="md" />
           <h3 className="text-xl font-semibold text-[hsl(var(--bc-text))]">Gold Checkmark Settings</h3>
         </div>
         
         <div className="space-y-4">
           <label className="flex items-center justify-between py-2 cursor-pointer">
             <div>
               <div className="font-medium text-[hsl(var(--bc-text))]">Hide Affiliates</div>
               <div className="text-sm text-[hsl(var(--bc-text-muted))]">Hide your affiliates from being displayed on your profile</div>
             </div>
             <input
               type="checkbox"
               checked={hideAffiliates}
               onChange={async (e) => {
                 const newValue = e.target.checked;
                 setHideAffiliates(newValue);
                 setSavingAffiliateVisibility(true);
                 const { error } = await supabase
                   .from('forum_gold_checkmarks')
                   .update({ hide_affiliates: newValue })
                   .eq('forum_user_id', forumUser.id);
                 if (error) {
                   toast.error('Failed to update setting');
                   setHideAffiliates(!newValue);
                 } else {
                   toast.success('Setting updated');
                 }
                 setSavingAffiliateVisibility(false);
               }}
               disabled={savingAffiliateVisibility}
               className="form-check-input"
             />
           </label>
         </div>

          {/* Manage Affiliates */}
          <div className="mt-6 pt-6 border-t border-[hsl(var(--bc-border))]">
            <h4 className="font-semibold text-[hsl(var(--bc-text))] mb-3">Manage Affiliates</h4>
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-4">
              Add users as your affiliates. They will receive a blue checkmark linked to your profile.
            </p>
            
            {/* Add New Affiliate */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newAffiliateUsername}
                onChange={(e) => setNewAffiliateUsername(e.target.value)}
                placeholder="Enter username..."
                className="form flex-1"
                onKeyDown={(e) => e.key === 'Enter' && handleAddAffiliate()}
              />
              <button
                onClick={handleAddAffiliate}
                disabled={addingAffiliate || !newAffiliateUsername.trim()}
                className="btn btn-primary"
              >
                {addingAffiliate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                Add
              </button>
            </div>
            
            {/* Current Affiliates List */}
            {currentAffiliates.length > 0 ? (
              <div className="space-y-2">
                {currentAffiliates.map((affiliate) => (
                  <div key={affiliate.id} className="card card-body card-inner flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {affiliate.avatar_url ? (
                        <img src={affiliate.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <span className="text-[hsl(var(--bc-text))]">{affiliate.username}</span>
                    </div>
                    <button 
                      onClick={() => handleRemoveAffiliate(affiliate.id)}
                      disabled={removingAffiliateId === affiliate.id}
                      className="text-red-500 hover:text-red-600 p-1"
                    >
                      {removingAffiliateId === affiliate.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--bc-text-muted))] text-center py-4">
                No affiliates yet. Add your first affiliate above.
              </p>
            )}
          </div>
       </div>
     )}

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
    <div className="max-w-5xl mx-auto py-4 px-4">
      {/* Mobile Tab Selector */}
      <div className="md:hidden mb-4">
        <select 
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
          className="w-full p-3 rounded-lg bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] font-medium"
        >
          <option value="general">General</option>
          <option value="security">Security & Privacy</option>
          <option value="billing">Billing</option>
        </select>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar - Desktop only */}
        <div className="hidden md:block w-56 flex-shrink-0">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-4 sticky top-20">
            <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4">Account Settings</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('general')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeTab === 'general'
                    ? 'bg-[hsl(var(--bc-primary))] text-white'
                    : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                <User className="w-5 h-5" />
                <span>General</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeTab === 'security'
                    ? 'bg-[hsl(var(--bc-primary))] text-white'
                    : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                <Shield className="w-5 h-5" />
                <span>Security & Privacy</span>
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                  activeTab === 'billing'
                    ? 'bg-[hsl(var(--bc-primary))] text-white'
                    : 'text-[hsl(var(--bc-text))] hover:bg-[hsl(var(--bc-bg-light))]'
                }`}
              >
                <Award className="w-5 h-5" />
                <span>Billing</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Success Alert */}
          {successMessage && (
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-300 font-semibold text-center py-3 px-4 rounded-lg mb-4">
              {successMessage}
            </div>
          )}

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
