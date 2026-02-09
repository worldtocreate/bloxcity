import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, Loader2, AlertCircle, RefreshCw, User } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from "@/assets/bloxcity-logo.jpg";
import TwoFactorVerify, { getTrustedDeviceToken, clearTrustedDeviceToken } from '@/components/forum/TwoFactorVerify';
import WelcomeDialog from '@/components/forum/WelcomeDialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface DisabledAccountInfo {
  is_self_disabled: boolean;
  self_disabled_reason: string | null;
  self_disabled_until: string | null;
}

export default function ForumLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [sendingLoginLink, setSendingLoginLink] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState('');
  
  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'email'>('totp');
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);

  // Self-disabled account states
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [disabledAccountInfo, setDisabledAccountInfo] = useState<DisabledAccountInfo | null>(null);
  const [reactivating, setReactivating] = useState(false);

  // Forgot username states
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [forgotUsernameEmail, setForgotUsernameEmail] = useState('');
  const [sendingUsernameRecovery, setSendingUsernameRecovery] = useState(false);

  const [hasExistingSession, setHasExistingSession] = useState(false);

  // Avatar preview state
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasExistingSession(!!session);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Debounced avatar lookup
  useEffect(() => {
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setPreviewAvatarUrl(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setLoadingAvatar(true);
      try {
        const { data } = await supabase.functions.invoke('forum-register', {
          body: { action: 'get_avatar_by_username', username: trimmed }
        });
        setPreviewAvatarUrl(data?.avatar_url || null);
      } catch {
        setPreviewAvatarUrl(null);
      } finally {
        setLoadingAvatar(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const check2FA = async (userEmail: string): Promise<{ requires2FA: boolean; method: 'totp' | 'email' | 'none' }> => {
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-verify', {
        body: { action: 'check', email: userEmail }
      });
      
      if (error) return { requires2FA: false, method: 'none' };
      return data || { requires2FA: false, method: 'none' };
    } catch {
      return { requires2FA: false, method: 'none' };
    }
  };

  const checkTrustedDevice = async (userEmail: string): Promise<boolean> => {
    const deviceToken = getTrustedDeviceToken(userEmail);
    if (!deviceToken) return false;

    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-verify', {
        body: { action: 'check_trusted', email: userEmail, deviceToken }
      });
      
      if (error || !data?.trusted) {
        clearTrustedDeviceToken(userEmail);
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const checkSelfDisabled = async (): Promise<DisabledAccountInfo | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('forum_users')
      .select('is_self_disabled, self_disabled_reason, self_disabled_until')
      .eq('user_id', user.id)
      .single();

    if (data?.is_self_disabled) {
      return data as DisabledAccountInfo;
    }
    return null;
  };

  const handleReactivateAccount = async () => {
    setReactivating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Authentication error. Please try again.');
        setReactivating(false);
        return;
      }

      const { error } = await supabase
        .from('forum_users')
        .update({
          is_self_disabled: false,
          self_disabled_reason: null,
          self_disabled_until: null,
          self_disabled_at: null
        })
        .eq('user_id', user.id);

      if (error) {
        toast.error('Failed to reactivate account');
      } else {
        toast.success('Welcome back! Your account has been reactivated.');
        setShowReactivateModal(false);
        navigate('/');
      }
    } finally {
      setReactivating(false);
    }
  };

  const lookupEmailByUsername = async (usernameInput: string): Promise<string | null> => {
    const trimmedUsername = usernameInput.trim();
    
    // Use edge function to get email by username (bypasses RLS)
    const { data, error } = await supabase.functions.invoke('forum-register', {
      body: { action: 'get_email_by_username', username: trimmedUsername }
    });
    
    if (error || !data?.email) {
      return null;
    }
    
    return data.email;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotConfirmed(false);
    setLoading(true);

    // Look up email by username
    const email = await lookupEmailByUsername(username);
    
    if (!email) {
      setError('Username not found');
      setLoading(false);
      return;
    }
    
    setResolvedEmail(email);

    const twoFAStatus = await check2FA(email);
    
    if (twoFAStatus.requires2FA && twoFAStatus.method !== 'none') {
      const isTrusted = await checkTrustedDevice(email);
      
      if (isTrusted) {
        await performLogin(email, password);
        return;
      }
      
      setPendingAuth({ email, password });
      setTwoFAMethod(twoFAStatus.method as 'totp' | 'email');
      setRequires2FA(true);
      setLoading(false);
      return;
    }

    await performLogin(email, password);
  };

  const performLogin = async (userEmail: string, userPassword: string) => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    });

    if (authError) {
      const msg = authError.message || 'Login failed';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setEmailNotConfirmed(true);
      }
      setError(msg);
      setLoading(false);
      return;
    }

    const disabledInfo = await checkSelfDisabled();
    if (disabledInfo) {
      setDisabledAccountInfo(disabledInfo);
      setShowReactivateModal(true);
      setLoading(false);
      return;
    }

    toast.success('Welcome back!');
    navigate('/');
  };

  const handle2FAVerified = async () => {
    if (!pendingAuth) return;
    await performLogin(pendingAuth.email, pendingAuth.password);
  };

  const handleCancel2FA = () => {
    setRequires2FA(false);
    setPendingAuth(null);
    setPassword('');
  };

  const handleResendVerification = async () => {
    if (!resolvedEmail) {
      toast.error('Please try logging in first to resolve your email.');
      return;
    }

    setResendingVerification(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: resolvedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (resendError) {
        toast.error(resendError.message || 'Failed to resend verification email.');
        return;
      }

      toast.success('Verification email sent! Check your inbox.');
    } finally {
      setResendingVerification(false);
    }
  };

  const handleSendLoginLink = async () => {
    if (!resolvedEmail) {
      toast.error('Please try logging in first to resolve your email.');
      return;
    }

    setSendingLoginLink(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: resolvedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (otpError) {
        toast.error(otpError.message || 'Failed to send login link.');
        return;
      }

      toast.success('Login link sent! Open it from your email to sign in.');
    } finally {
      setSendingLoginLink(false);
    }
  };

  const handleCancelReactivation = async () => {
    await supabase.auth.signOut();
    setShowReactivateModal(false);
    setDisabledAccountInfo(null);
  };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = forgotUsernameEmail.trim();
    if (!trimmedEmail) {
      toast.error('Please enter your email address.');
      return;
    }

    setSendingUsernameRecovery(true);
    try {
      const { error } = await supabase.functions.invoke('forum-register', {
        body: { action: 'recover_username', email: trimmedEmail }
      });

      if (error) {
        toast.error('Failed to send recovery email. Please try again.');
        return;
      }

      toast.success('If an account exists with that email, we\'ve sent the username(s) to your inbox.');
      setShowForgotUsername(false);
      setForgotUsernameEmail('');
    } finally {
      setSendingUsernameRecovery(false);
    }
  };


  const getReasonText = (reason: string | null): string => {
    switch (reason) {
      case 'need_a_break': return 'You needed a break from the forum';
      case 'too_busy': return 'You were too busy';
      case 'privacy_concerns': return 'Privacy concerns';
      case 'not_using': return 'Not using the forum anymore';
      case 'other': return 'Other reason';
      default: return 'Personal reasons';
    }
  };

  // Show reactivation modal
  if (showReactivateModal && disabledAccountInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto mb-4" style={{ borderRadius: 'var(--bc-rounded-lg)' }} />
            </Link>
          </div>

          <div className="bc-card">
            <div className="bc-card-body">
              <h2 className="text-xl font-bold mb-4 text-center" style={{ color: 'hsl(var(--bc-text))' }}>Welcome Back!</h2>
              
              <div className="bc-alert bc-alert-warning mb-6">
                <p className="text-sm">Your account was disabled on your request.</p>
                <p className="text-xs mt-2 opacity-80">
                  Reason: {getReasonText(disabledAccountInfo.self_disabled_reason)}
                </p>
                {disabledAccountInfo.self_disabled_until && (
                  <p className="text-xs mt-1 opacity-80">
                    Scheduled until: {new Date(disabledAccountInfo.self_disabled_until).toLocaleDateString()}
                  </p>
                )}
              </div>

              <p className="text-sm mb-6 text-center" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                Would you like to reactivate your account and continue using the forum?
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleReactivateAccount}
                  disabled={reactivating}
                  className="bc-btn bc-btn-info bc-btn-block"
                >
                  {reactivating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Reactivating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      Reactivate My Account
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleCancelReactivation}
                  className="bc-btn bc-btn-gray bc-btn-block"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show forgot username form
  if (showForgotUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto mb-4" style={{ borderRadius: 'var(--bc-rounded-lg)' }} />
            </Link>
          </div>

          <form onSubmit={handleForgotUsername} className="bc-card">
            <div className="bc-card-body space-y-4">
              <div className="text-center mb-2">
                <div className="bc-section-icon mx-auto mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>Forgot Username?</h2>
                <p className="text-sm mt-1" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                  Enter your email and we'll send you the username(s) associated with it.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--bc-text-muted))' }} />
                  <input
                    type="email"
                    value={forgotUsernameEmail}
                    onChange={(e) => setForgotUsernameEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bc-input"
                    style={{ paddingLeft: '42px' }}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sendingUsernameRecovery}
                className="bc-btn bc-btn-info bc-btn-block"
              >
                {sendingUsernameRecovery ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Username Recovery Email'
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowForgotUsername(false);
                  setForgotUsernameEmail('');
                }}
                className="bc-btn bc-btn-gray bc-btn-block"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Show 2FA verification screen
  if (requires2FA && pendingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto mb-4" style={{ borderRadius: 'var(--bc-rounded-lg)' }} />
            </Link>
          </div>
          
          <TwoFactorVerify
            email={pendingAuth.email}
            method={twoFAMethod}
            onVerified={handle2FAVerified}
            onCancel={handleCancel2FA}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      {/* Welcome Dialog popup */}
      <WelcomeDialog isLoggedIn={false} />
      
      <div className="w-full max-w-md mt-12">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto mb-4" style={{ borderRadius: 'var(--bc-rounded-lg)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>Welcome Back</h1>
            <p style={{ color: 'hsl(var(--bc-text-muted))' }}>Login to BLOX City</p>
          </Link>
        </div>
        {hasExistingSession && (
          <div className="bc-alert bc-alert-warning mb-4">
            <p className="text-sm font-medium">You’re already signed in.</p>
            <p className="text-xs mt-1 opacity-80">If you meant to use a different account, sign out first.</p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="bc-btn bc-btn-info px-4"
              >
                Continue
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  setHasExistingSession(false);
                  toast.success('Signed out');
                }}
                className="bc-btn bc-btn-gray px-4"
              >
                Sign out
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bc-card relative">
          {/* Avatar circle at top of card */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-10">
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300"
              style={{ 
                background: 'hsl(var(--bc-card-bg))', 
                border: '4px solid hsl(var(--bc-section-border))',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              {loadingAvatar ? (
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(var(--bc-text-muted))' }} />
              ) : previewAvatarUrl ? (
                <Avatar className="w-full h-full">
                  <AvatarImage src={previewAvatarUrl} alt="User avatar" className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold" style={{ background: 'hsl(var(--bc-input-bg))', color: 'hsl(var(--bc-text-muted))' }}>
                    {username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="w-10 h-10" style={{ color: 'hsl(var(--bc-text-muted))' }} />
              )}
            </div>
          </div>

          <div className="bc-card-body space-y-4 pt-16">
            {error && (
              <div className="bc-alert bc-alert-danger flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {emailNotConfirmed && (
              <div className="p-3 space-y-2" style={{ background: 'hsl(var(--bc-input-bg))', border: '1px solid hsl(var(--bc-section-border))', borderRadius: 'var(--bc-rounded-lg)' }}>
                <p className="text-sm" style={{ color: 'hsl(var(--bc-text))' }}>
                  Your account email isn't verified yet. You can resend the verification email, or use a login link to get in.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resendingVerification || loading}
                    className="bc-btn bc-btn-info bc-btn-xs"
                  >
                    {resendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Resend verification
                  </button>
                  <button
                    type="button"
                    onClick={handleSendLoginLink}
                    disabled={sendingLoginLink || loading}
                    className="bc-btn bc-btn-gray bc-btn-xs"
                  >
                    {sendingLoginLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                    Send login link
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--bc-text-muted))' }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bc-input"
                  style={{ paddingLeft: '42px' }}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--bc-text-muted))' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="bc-input"
                  style={{ paddingLeft: '42px' }}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => setShowForgotUsername(true)}
                className="text-info hover:underline"
              >
                Forgot username?
              </button>
              <Link to="/forgot-password" className="text-info hover:underline">
                Forgot password?
              </Link>
            </div>


            <button
              type="submit"
              disabled={loading}
              className="bc-btn bc-btn-info bc-btn-block"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>


            <p className="text-center text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              Don't have an account?{' '}
              <Link to="/register" className="text-info hover:underline">
                Create one
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
