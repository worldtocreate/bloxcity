import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useForumAuth } from '@/hooks/useForumAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import ForumHeader from './ForumHeader';
import AppSidebar from './AppSidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2, Megaphone, X, Shield, Lock, Mail, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Maintenance from '@/pages/Maintenance';

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
  password: string;
  message: string;
}

export default function ForumLayout() {
  const { user, forumUser, isAdmin, loading, emailVerified, refreshEmailVerification } = useForumAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState<ForumAnnouncement | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [twoFAStatus, setTwoFAStatus] = useState<TwoFASettings | null>(null);
  const [checkingTwoFA, setCheckingTwoFA] = useState(true);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings | null>(null);
  const [maintenanceBypass, setMaintenanceBypass] = useState(false);

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

  const checkTwoFAStatus = async () => {
    if (!forumUser) return;
    
    const { data } = await supabase
      .from('forum_2fa_settings')
      .select('is_enabled, method')
      .eq('forum_user_id', forumUser.id)
      .single();
    
    setTwoFAStatus(data as TwoFASettings | null);
    setCheckingTwoFA(false);
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
    const { data } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'maintenance_mode')
      .single();
    
    if (data?.value) {
      setMaintenanceSettings(data.value as unknown as MaintenanceSettings);
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
    return <Maintenance message={maintenanceSettings.message} password={maintenanceSettings.password} />;
  }

  // Check if user is suspended (only after loading completes)
  if (!loading && forumUser?.is_suspended) {
    const now = new Date();
    const endsAt = forumUser.suspension_ends_at ? new Date(forumUser.suspension_ends_at) : null;
    const reviewDate = (forumUser as any).suspension_review_date ? new Date((forumUser as any).suspension_review_date) : null;
    
    if (!endsAt || now < endsAt) {
      return (
        <div className="min-h-screen bg-[hsl(var(--bc-bg-light))]">
          <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
          <div className="flex items-center justify-center p-4 py-20">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
              <h1 className="text-2xl font-bold text-red-600 mb-4">Account Suspended</h1>
              <p className="text-[hsl(var(--bc-text))] mb-4">
                Your forum account has been suspended.
              </p>
              {forumUser.suspension_reason && (
                <p className="text-[hsl(var(--bc-text-muted))] mb-4">
                  <strong>Reason:</strong> {forumUser.suspension_reason}
                </p>
              )}
              {endsAt && (
                <p className="text-[hsl(var(--bc-text-muted))] mb-2">
                  <strong>Ends:</strong> {endsAt.toLocaleDateString()} at {endsAt.toLocaleTimeString()}
                </p>
              )}
              {reviewDate && (
                <p className="text-[hsl(var(--bc-text-muted))]">
                  <strong>Review Date:</strong> {reviewDate.toLocaleDateString()}
                </p>
              )}
            </div>
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
  const isSettingsPage = location.pathname === '/settings';
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
        <AppSidebar forumUser={forumUser} isLoggedIn={!!user} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <ForumHeader user={user} forumUser={forumUser} isAdmin={isAdmin} />
          
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
              <Outlet context={{ user, forumUser, isAdmin, loading, emailVerified }} />
            )}
          </main>
          
          <footer className="border-t border-[hsl(var(--bc-border))] py-6 mt-auto">
            <div className="max-w-6xl mx-auto px-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
                <Link to="/users" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition">Members</Link>
                <Link to="/staff" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition">Staff</Link>
                <Link to="/faq" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition">FAQ</Link>
                <Link to="/terms" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition">Terms of Service</Link>
                <Link to="/privacy" className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))] transition">Privacy Policy</Link>
              </div>
              <p className="text-[hsl(var(--bc-text-muted))] text-sm">
                © 2026 BLOX City, Inc. All rights reserved.
              </p>
              <p className="text-xs text-[hsl(var(--bc-text-muted))]">
                Looking for where BLOX City is now? Isaac is over at{" "}
                <a href="https://brickplanet.com" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--bc-primary))] hover:underline">brickplanet.com</a>
                {" "}& Kyle is over at{" "}
                <a href="https://www.truworlds.net/" target="_blank" rel="noopener noreferrer" className="text-[hsl(var(--bc-primary))] hover:underline">truworlds.net</a>
              </p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
}
