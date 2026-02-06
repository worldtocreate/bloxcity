import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useForumAuth } from '@/hooks/useForumAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useTheme } from '@/contexts/ThemeContext';
import ForumHeader from './ForumHeader';
import AppSidebar from './AppSidebar';
import { Heart, Gift, Sparkles } from 'lucide-react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2, Megaphone, X, Shield, Lock, Mail, Send, Calendar, Hammer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Inline Maintenance component to avoid module resolution issues
function Maintenance({ message }: { message?: string }) {
  const navigate = useNavigate();
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const { data, error: rpcError } = await supabase.rpc('verify_maintenance_password', {
      p_password: inputPassword
    });
    
    if (rpcError) {
      console.error('Verification error:', rpcError);
      setError('Verification failed. Please try again.');
    } else if (data === true) {
      sessionStorage.setItem('maintenance_bypass', 'true');
      navigate('/');
      window.location.reload();
    } else {
      setError('Incorrect password');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg-dark))] flex items-center justify-center p-4">
      <main className="max-w-[700px] w-full text-center">
        <Hammer className="w-20 h-20 mx-auto text-[hsl(var(--bc-text-muted))]" />
        
        <h1 className="text-4xl font-bold text-[hsl(var(--bc-text))] mt-4 mb-0">
          We'll be back soon!
        </h1>
        <p className="text-[hsl(var(--bc-text-muted))] mt-2 text-lg">
          {message || "We're performing some maintenance at the moment."}
        </p>
        
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch justify-center max-w-md mx-auto">
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => {
                setInputPassword(e.target.value);
                setError('');
              }}
              placeholder="Developer Password"
              className="flex-1 bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-lg px-4 py-2.5 text-[hsl(var(--bc-text))] placeholder:text-[hsl(var(--bc-text-muted))] focus:outline-none focus:border-[hsl(var(--bc-primary))] text-sm"
              disabled={loading}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-[hsl(var(--bc-success))] hover:opacity-90 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition text-sm flex items-center justify-center gap-2 min-w-[100px]"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Loading...' : 'Login'}
            </button>
          </div>
          {error && (
            <p className="text-[hsl(var(--bc-error))] text-sm mt-2 text-left max-w-md mx-auto">{error}</p>
          )}
        </form>
        
        <div className="flex justify-center gap-6 mt-8">
          <a
            href="https://x.com/bloxcity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a
            href="https://discord.gg/bloxcity"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))] transition"
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
        </div>
      </main>
    </div>
  );
}

// Inline DOBPrompt component
const DOB_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function DOBPrompt({ isOpen, onClose, forumUserId }: { isOpen: boolean; onClose: () => void; forumUserId: string }) {
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const handleSubmit = async () => {
    setError('');
    if (!dobMonth || !dobDay || !dobYear) {
      setError('Please select your full date of birth');
      return;
    }
    const birthDate = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    if (age < 13) { setError('You must be at least 13 years old'); return; }

    setSaving(true);
    const dateString = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`;
    const { error: updateError } = await supabase
      .from('forum_users')
      .update({ date_of_birth: dateString, dob_updated_at: new Date().toISOString() })
      .eq('id', forumUserId);

    if (updateError) { setError('Failed to save. Please try again.'); setSaving(false); return; }
    toast.success('Date of birth saved!');
    setSaving(false);
    onClose();
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[hsl(220,15%,13%)] border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Calendar className="w-5 h-5 text-[hsl(var(--bc-primary))]" />
            Confirm Your Date of Birth
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            We need to verify your age to ensure you can access all features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Month</Label>
              <select value={dobMonth} onChange={(e) => setDobMonth(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">Month</option>
                {DOB_MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Day</Label>
              <select value={dobDay} onChange={(e) => setDobDay(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">Day</option>
                {days.map((d) => <option key={d} value={String(d)}>{d}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Year</Label>
              <select value={dobYear} onChange={(e) => setDobYear(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-sm text-gray-600 dark:text-gray-400">
            Your date of birth is private and used for age verification only.
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Later</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Inline Valentine's Dialog Component - Shows periodically until claimed
function ValentinesDialog({ forumUserId, hasClaimedTheme, createdAt, onThemeClaimed }: { 
  forumUserId: string; hasClaimedTheme: boolean; createdAt: string; onThemeClaimed: () => void 
}) {
  const [open, setOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    // Don't show if already claimed
    if (hasClaimedTheme) return;
    
    // Check if user signed up before Feb 14, 2026
    const valentinesDate = new Date('2026-02-14T00:00:00Z');
    if (new Date(createdAt) >= valentinesDate) return;
    
    // Check when we last showed the dialog (show every 3 page loads or after 2 hours)
    // Changed key to reset for all users (v2)
    const storageKey = `valentines_dialog_v2_${forumUserId}`;
    const storedData = localStorage.getItem(storageKey);
    
    let showCount = 0;
    let lastShown = 0;
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        showCount = parsed.count || 0;
        lastShown = parsed.lastShown || 0;
      } catch (e) {
        // Invalid data, reset
      }
    }
    
    const now = Date.now();
    const twoHoursMs = 2 * 60 * 60 * 1000;
    const timeSinceLastShow = now - lastShown;
    
    // Show if: never shown, or 2+ hours passed, or every 5th page load
    const shouldShow = showCount === 0 || timeSinceLastShow > twoHoursMs || (showCount % 5 === 0 && timeSinceLastShow > 30000);
    
    if (shouldShow) {
      // Small delay so it doesn't pop up immediately
      const timer = setTimeout(() => {
        setOpen(true);
        localStorage.setItem(storageKey, JSON.stringify({ count: showCount + 1, lastShown: now }));
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      // Increment count even if not showing
      localStorage.setItem(storageKey, JSON.stringify({ count: showCount + 1, lastShown }));
    }
  }, [forumUserId, hasClaimedTheme, createdAt]);

  const handleClaim = async () => {
    setClaiming(true);
    const { error } = await supabase.from('forum_users').update({ 
      has_valentines_theme: true, valentines_theme_claimed_at: new Date().toISOString(), selected_theme: 'valentines'
    }).eq('id', forumUserId);
    if (!error) { toast.success('💕 Valentine\'s theme unlocked!'); onThemeClaimed(); setOpen(false); }
    else toast.error('Failed to claim theme');
    setClaiming(false);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && setOpen(false)}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-pink-50 to-red-50 border-pink-200">
        <div className="absolute top-4 right-4 text-pink-400 opacity-50"><Heart className="w-6 h-6 fill-current" /></div>
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" /> A Love Letter from BLOX City <Sparkles className="w-5 h-5 text-pink-500" />
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-white/80 rounded-xl p-5 border border-pink-200">
            <p className="text-gray-700 italic text-center">On this Valentine's Day, we want to gift you an exclusive <strong className="text-pink-600">Valentine's Theme</strong> — yours to keep forever! 💕</p>
          </div>
          <div className="bg-gradient-to-r from-pink-100 to-red-100 rounded-lg p-3 flex items-center gap-3 mt-4">
            <div className="bg-pink-500 rounded-full p-2"><Gift className="w-5 h-5 text-white" /></div>
            <div><p className="font-semibold text-pink-700 text-sm">Limited Time Gift!</p></div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleClaim} disabled={claiming} className="w-full bg-gradient-to-r from-pink-500 to-red-500 text-white">
            {claiming ? 'Claiming...' : <><Heart className="w-4 h-4 mr-2 fill-white" />Claim Valentine's Theme</>}
          </Button>
          <Button variant="ghost" onClick={() => setOpen(false)} className="w-full text-gray-500">Maybe Later</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ForumAnnouncement {
  enabled: boolean;
  message: string;
  type: 'info' | 'warning' | 'success';
}

interface TwoFASettings {
  is_enabled: boolean;
  method: string;
}

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
}

export default function ForumLayout() {
  const { user, forumUser, isAdmin, isModerator, loading, emailVerified, refreshEmailVerification } = useForumAuth();
  const { setHasValentinesTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState<ForumAnnouncement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFASettings | null>(null);
  const [checkingTwoFA, setCheckingTwoFA] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [showDOBPrompt, setShowDOBPrompt] = useState(false);
  const [maintenanceBypass, setMaintenanceBypass] = useState(false);
  
  // Valentine's theme tracking
  const [valentinesThemeClaimed, setValentinesThemeClaimed] = useState(false);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);

  // Track online status
  useOnlineStatus(forumUser?.id || null);

  useEffect(() => {
    fetchAnnouncement();
    fetchMaintenanceSettings();
    
    // Check for bypass in sessionStorage
    const bypass = sessionStorage.getItem('maintenance_bypass');
    setMaintenanceBypass(bypass === 'true');
    
    // Set forum-specific meta tags
    document.title = 'BLOX City - Community';
    
    const metaDescription = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    
    const originalDescription = metaDescription?.getAttribute('content') || '';
    const originalOgTitle = ogTitle?.getAttribute('content') || '';
    const originalOgDescription = ogDescription?.getAttribute('content') || '';
    
    metaDescription?.setAttribute('content', 'Join the BLOX City community - discuss updates, share ideas, and connect with other players.');
    ogTitle?.setAttribute('content', 'BLOX City - Community');
    ogDescription?.setAttribute('content', 'Join the BLOX City community - discuss updates, share ideas, and connect with other players.');
    
    return () => {
      // Restore original meta tags when leaving forum
      document.title = 'BLOX City';
      metaDescription?.setAttribute('content', originalDescription);
      ogTitle?.setAttribute('content', originalOgTitle);
      ogDescription?.setAttribute('content', originalOgDescription);
    };
  }, []);
  // Check 2FA status for admins
  useEffect(() => {
    if (!loading && isAdmin && forumUser) {
      checkTwoFAStatus();
    } else if (!loading) {
      setCheckingTwoFA(false);
    }
  }, [loading, isAdmin, forumUser]);

  // Check if user needs to enter DOB
  useEffect(() => {
    if (!loading && forumUser && !(forumUser as any).date_of_birth) {
      // Delay slightly to not overwhelm the user
      const timer = setTimeout(() => setShowDOBPrompt(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [loading, forumUser]);

  // Check if user just verified their email (coming back from verification link)
  useEffect(() => {
    if (user && emailVerified === false) {
      // Check periodically if user is verified
      const interval = setInterval(() => {
        refreshEmailVerification();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [user, emailVerified]);

  // Fetch Valentine's theme status for logged-in users
  useEffect(() => {
    if (!loading && forumUser) {
      fetchValentinesStatus();
    }
  }, [loading, forumUser]);

  const fetchValentinesStatus = async () => {
    if (!forumUser) return;
    const { data } = await supabase
      .from('forum_users')
      .select('has_valentines_theme, selected_theme, created_at')
      .eq('id', forumUser.id)
      .single();
    
    if (data) {
      setValentinesThemeClaimed(data.has_valentines_theme || false);
      setUserCreatedAt(data.created_at);
      setHasValentinesTheme(data.has_valentines_theme || false);
      
      // Apply saved theme
      if (data.selected_theme === 'valentines' && data.has_valentines_theme) {
        setTheme('valentines');
      }
    }
  };

  const handleValentinesThemeClaimed = () => {
    setValentinesThemeClaimed(true);
    setHasValentinesTheme(true);
    setTheme('valentines');
  };

  const checkTwoFAStatus = async () => {
    if (!forumUser) {
      setCheckingTwoFA(false);
      return;
    }
    
    try {
      const { data } = await supabase
        .from('forum_2fa_settings')
        .select('is_enabled, method')
        .eq('forum_user_id', forumUser.id)
        .maybeSingle();
      
      setTwoFAStatus(data as TwoFASettings | null);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setTwoFAStatus(null);
    } finally {
      setCheckingTwoFA(false);
    }
  };

  const fetchAnnouncement = async () => {
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'forum_announcement')
      .single();
    
    if (data?.value) {
      setAnnouncement(data.value as unknown as ForumAnnouncement);
    }
  };

  const fetchMaintenanceSettings = async () => {
    // Use secure RPC function that doesn't expose password
    const { data, error } = await supabase.rpc('get_maintenance_status');
    
    if (!error && data) {
      setMaintenanceSettings(data as unknown as MaintenanceSettings);
    }
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

  // Mask email for display
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local.charAt(0)}***@${domain}`;
  };

  // Check for maintenance mode (show to non-admin users who haven't bypassed)
  if (maintenanceSettings?.enabled && !maintenanceBypass && !isAdmin) {
    return <Maintenance message={maintenanceSettings.message} />;
  }

  // Check if user is suspended (only after loading completes) - show suspension page
  if (!loading && forumUser?.is_suspended) {
    const now = new Date();
    const endsAt = forumUser.suspension_ends_at ? new Date(forumUser.suspension_ends_at) : null;
    
    if (!endsAt || now < endsAt) {
      return (
        <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[hsl(var(--bc-bg-card))] border border-red-200 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-600 mb-2">Account Suspended</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-4">
              Your account has been suspended for violating our community guidelines.
            </p>
            {forumUser.suspension_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-left">
                <p className="text-sm font-medium text-red-700 mb-1">Reason:</p>
                <p className="text-sm text-red-600">{forumUser.suspension_reason}</p>
              </div>
            )}
            {endsAt && (
              <p className="text-sm text-[hsl(var(--bc-text-muted))]">
                Suspension ends: {endsAt.toLocaleDateString()} at {endsAt.toLocaleTimeString()}
              </p>
            )}
            {!endsAt && (
              <p className="text-sm text-red-600 font-medium">
                This suspension is permanent.
              </p>
            )}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
              className="mt-6 w-full bg-[hsl(var(--bc-bg-light))] hover:bg-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] font-medium py-2 rounded-lg transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }
  }

  // Check if user has a pending warning to accept
  if (!loading && forumUser && (forumUser as any).has_pending_warning) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg-light))]">
        <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
        <div className="flex items-center justify-center p-4 py-20">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 max-w-lg">
            <h1 className="text-2xl font-bold text-amber-600 mb-4 text-center">Account Warning</h1>
            <p className="text-[hsl(var(--bc-text))] mb-4 text-center">
              You have received a warning from the moderation team. Please review and acknowledge it to continue using the forum.
            </p>
            <div className="bg-white border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-[hsl(var(--bc-text))] whitespace-pre-wrap">{(forumUser as any).warning_content}</p>
              {(forumUser as any).warning_moderator_note && (
                <p className="text-sm text-[hsl(var(--bc-text-muted))] mt-3 pt-3 border-t">
                  <strong>Moderator Note:</strong> {(forumUser as any).warning_moderator_note}
                </p>
              )}
            </div>
            <button
              onClick={async () => {
                await supabase
                  .from('forum_users')
                  .update({ 
                    has_pending_warning: false, 
                    warning_accepted_at: new Date().toISOString() 
                  })
                  .eq('id', forumUser.id);
                window.location.reload();
              }}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 rounded-lg transition"
            >
              I Understand and Accept
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Block admin access if 2FA is not enabled (except on settings page to allow setup)
  const isSettingsPage = location.pathname.startsWith('/settings');
  const adminNeeds2FA = !loading && !checkingTwoFA && isAdmin && forumUser && (!twoFAStatus || !twoFAStatus.is_enabled);
  
  if (adminNeeds2FA && !isSettingsPage) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg-light))]">
        <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
        <div className="flex items-center justify-center p-4 py-20">
          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-8 max-w-md text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mb-2">Two-Factor Authentication Required</h1>
            <p className="text-[hsl(var(--bc-text-muted))] mb-6">
              As an administrator, you are required to enable two-factor authentication to protect your account and the community.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/settings')}
                className="w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-6 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <Lock className="w-5 h-5" />
                Set Up 2FA Now
              </button>
              <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                You can choose between Google Authenticator or Email codes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const bannerStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-green-50 border-green-200 text-green-800',
  };

  // Check if user needs to verify email
  const showEmailVerificationBanner = user && forumUser && emailVerified === false;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-[hsl(var(--bc-bg-light))]">
        <AppSidebar forumUser={forumUser} isLoggedIn={!!user} isAdmin={isAdmin} isModerator={isModerator} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} isModerator={isModerator} />
          
          {/* Email Verification Banner */}
          {showEmailVerificationBanner && (
            <div className="bg-amber-50 border-b border-amber-200">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                  <Mail className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-amber-800">
                    Verify your email <strong>{user.email}</strong> to access forum features like posting, replying, and direct messages.
                  </span>
                </div>
                {verificationEmailSent ? (
                  <span className="text-sm text-amber-700 font-medium">Email sent! Check your inbox.</span>
                ) : (
                  <button
                    onClick={handleSendVerificationEmail}
                    disabled={sendingVerification}
                    className="flex items-center gap-2 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg text-sm font-medium transition"
                  >
                    {sendingVerification ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Send Verification Email
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Admin 2FA Warning Banner on Settings Page */}
          {adminNeeds2FA && isSettingsPage && (
            <div className="bg-amber-50 border-b border-amber-200">
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
                <Shield className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span className="text-sm font-medium text-amber-800">
                  You must enable Two-Factor Authentication before you can access other forum features.
                </span>
              </div>
            </div>
          )}
          
          {/* Announcement Banner */}
          {announcement?.enabled && announcement.message && !bannerDismissed && (
            <div className={`border-b ${bannerStyles[announcement.type]}`}>
              <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <Megaphone className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{announcement.message}</span>
                </div>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="p-1 hover:bg-black/10 rounded transition"
                  aria-label="Dismiss announcement"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
            {loading || checkingTwoFA ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[hsl(var(--bc-primary))] animate-spin" />
              </div>
            ) : (
              <>
                {/* Valentine's Dialog for logged-in users */}
                {forumUser && userCreatedAt && !valentinesThemeClaimed && (
                  <ValentinesDialog
                    forumUserId={forumUser.id}
                    hasClaimedTheme={valentinesThemeClaimed}
                    createdAt={userCreatedAt}
                    onThemeClaimed={handleValentinesThemeClaimed}
                  />
                )}
                {/* DOB Prompt for existing users */}
                {forumUser && showDOBPrompt && (
                  <DOBPrompt
                    isOpen={showDOBPrompt}
                    onClose={() => setShowDOBPrompt(false)}
                    forumUserId={forumUser.id}
                  />
                )}
                <Outlet context={{ user, forumUser, isAdmin, loading, emailVerified }} />
              </>
            )}
          </main>
          
          <footer className="border-t border-[hsl(var(--bc-border))] py-6 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                <Link to="/terms-of-service" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold transition">TERMS OF SERVICE</Link>
                <Link to="/privacy-policy" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold transition">PRIVACY POLICY</Link>
                <Link to="/faq" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold transition">FAQ</Link>
                <Link to="/notes" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] font-semibold transition">NOTES</Link>
              </div>
              <p className="text-[hsl(var(--bc-text-muted))] text-sm">
                © 2026 BLOX City. All rights reserved.
              </p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
