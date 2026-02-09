import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle, RefreshCw, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';
import TwoFactorVerify, { getTrustedDeviceToken, clearTrustedDeviceToken } from '@/components/forum/TwoFactorVerify';
import WelcomeDialog from '@/components/forum/WelcomeDialog';

interface DisabledAccountInfo {
  is_self_disabled: boolean;
  self_disabled_reason: string | null;
  self_disabled_until: string | null;
}

export default function ForumLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [sendingLoginLink, setSendingLoginLink] = useState(false);
  
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'email'>('totp');
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);

  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [disabledAccountInfo, setDisabledAccountInfo] = useState<DisabledAccountInfo | null>(null);
  const [reactivating, setReactivating] = useState(false);

  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const [forgotUsernameEmail, setForgotUsernameEmail] = useState('');
  const [sendingUsernameRecovery, setSendingUsernameRecovery] = useState(false);

  const [hasExistingSession, setHasExistingSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setHasExistingSession(!!session);
    });
    return () => { mounted = false; };
  }, []);

  const check2FA = async (userEmail: string): Promise<{ requires2FA: boolean; method: 'totp' | 'email' | 'none' }> => {
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-verify', { body: { action: 'check', email: userEmail } });
      if (error) return { requires2FA: false, method: 'none' };
      return data || { requires2FA: false, method: 'none' };
    } catch { return { requires2FA: false, method: 'none' }; }
  };

  const checkTrustedDevice = async (userEmail: string): Promise<boolean> => {
    const deviceToken = getTrustedDeviceToken(userEmail);
    if (!deviceToken) return false;
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-verify', { body: { action: 'check_trusted', email: userEmail, deviceToken } });
      if (error || !data?.trusted) { clearTrustedDeviceToken(userEmail); return false; }
      return true;
    } catch { return false; }
  };

  const checkSelfDisabled = async (): Promise<DisabledAccountInfo | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('forum_users').select('is_self_disabled, self_disabled_reason, self_disabled_until').eq('user_id', user.id).single();
    if (data?.is_self_disabled) return data as DisabledAccountInfo;
    return null;
  };

  const handleReactivateAccount = async () => {
    setReactivating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Authentication error. Please try again.'); setReactivating(false); return; }
      const { error } = await supabase.from('forum_users').update({ is_self_disabled: false, self_disabled_reason: null, self_disabled_until: null, self_disabled_at: null }).eq('user_id', user.id);
      if (error) toast.error('Failed to reactivate account');
      else { toast.success('Welcome back! Your account has been reactivated.'); setShowReactivateModal(false); navigate('/'); }
    } finally { setReactivating(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setEmailNotConfirmed(false); setLoading(true);

    const twoFAStatus = await check2FA(email);
    if (twoFAStatus.requires2FA && twoFAStatus.method !== 'none') {
      const isTrusted = await checkTrustedDevice(email);
      if (isTrusted) { await performLogin(email, password); return; }
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
    const { error: authError } = await supabase.auth.signInWithPassword({ email: userEmail, password: userPassword });
    if (authError) {
      const msg = authError.message || 'Login failed';
      if (msg.toLowerCase().includes('email not confirmed')) setEmailNotConfirmed(true);
      setError(msg);
      setLoading(false);
      return;
    }
    const disabledInfo = await checkSelfDisabled();
    if (disabledInfo) { setDisabledAccountInfo(disabledInfo); setShowReactivateModal(true); setLoading(false); return; }
    toast.success('Welcome back!');
    navigate('/');
  };

  const handle2FAVerified = async () => { if (!pendingAuth) return; await performLogin(pendingAuth.email, pendingAuth.password); };
  const handleCancel2FA = () => { setRequires2FA(false); setPendingAuth(null); setPassword(''); };

  const handleResendVerification = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { toast.error('Please enter your email first.'); return; }
    setResendingVerification(true);
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: trimmedEmail, options: { emailRedirectTo: `${window.location.origin}/` } });
      if (resendError) { toast.error(resendError.message || 'Failed to resend verification email.'); return; }
      toast.success('Verification email sent! Check your inbox.');
    } finally { setResendingVerification(false); }
  };

  const handleSendLoginLink = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) { toast.error('Please enter your email first.'); return; }
    setSendingLoginLink(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: trimmedEmail, options: { emailRedirectTo: `${window.location.origin}/` } });
      if (otpError) { toast.error(otpError.message || 'Failed to send login link.'); return; }
      toast.success('Login link sent! Open it from your email to sign in.');
    } finally { setSendingLoginLink(false); }
  };

  const handleCancelReactivation = async () => { await supabase.auth.signOut(); setShowReactivateModal(false); setDisabledAccountInfo(null); };

  const handleForgotUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = forgotUsernameEmail.trim();
    if (!trimmedEmail) { toast.error('Please enter your email address.'); return; }
    setSendingUsernameRecovery(true);
    try {
      const { error } = await supabase.functions.invoke('forum-register', { body: { action: 'recover_username', email: trimmedEmail } });
      if (error) { toast.error('Failed to send recovery email. Please try again.'); return; }
      toast.success("If an account exists with that email, we've sent the username(s) to your inbox.");
      setShowForgotUsername(false);
      setForgotUsernameEmail('');
    } finally { setSendingUsernameRecovery(false); }
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

  // Reactivation modal
  if (showReactivateModal && disabledAccountInfo) {
    return (
      <div className="auth-page">
        <div className="w-full max-w-md px-4">
          <div className="auth-container">
            <div className="text-center mb-6">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-lg" />
            </div>
            <h5 className="text-xl font-bold mb-4 text-center" style={{ color: 'hsl(var(--bc-text))' }}>Welcome Back!</h5>
            <div className="bc-alert bc-alert-warning mb-4">
              <p className="text-sm">Your account was disabled on your request.</p>
              <p className="text-xs mt-1 opacity-80">Reason: {getReasonText(disabledAccountInfo.self_disabled_reason)}</p>
              {disabledAccountInfo.self_disabled_until && <p className="text-xs mt-1 opacity-80">Scheduled until: {new Date(disabledAccountInfo.self_disabled_until).toLocaleDateString()}</p>}
            </div>
            <p className="text-sm mb-6 text-center" style={{ color: 'hsl(var(--bc-text-muted))' }}>Would you like to reactivate your account?</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleReactivateAccount} disabled={reactivating} className="btn btn-primary w-full">
                {reactivating ? <><Loader2 className="w-5 h-5 animate-spin" />Reactivating...</> : <><RefreshCw className="w-5 h-5" />Reactivate My Account</>}
              </button>
              <button onClick={handleCancelReactivation} className="btn btn-gray w-full">Not Now</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Forgot username form
  if (showForgotUsername) {
    return (
      <div className="auth-page">
        <div className="w-full max-w-md px-4">
          <div className="auth-container">
            <div className="text-center mb-6">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-lg" />
            </div>
            <h5 className="text-xl font-bold mb-2 text-center" style={{ color: 'hsl(var(--bc-text))' }}>Forgot Username?</h5>
            <p className="text-sm text-center mb-6" style={{ color: 'hsl(var(--bc-text-muted))' }}>Enter your email and we'll send you the username(s) associated with it.</p>
            <form onSubmit={handleForgotUsername} className="space-y-4">
              <input type="email" value={forgotUsernameEmail} onChange={(e) => setForgotUsernameEmail(e.target.value)} placeholder="Email Address" className="form" required autoFocus />
              <button type="submit" disabled={sendingUsernameRecovery} className="btn btn-primary w-full">
                {sendingUsernameRecovery ? <><Loader2 className="w-5 h-5 animate-spin" />Sending...</> : 'Send Username Recovery Email'}
              </button>
              <button type="button" onClick={() => { setShowForgotUsername(false); setForgotUsernameEmail(''); }} className="btn btn-gray w-full">Back to Login</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 2FA verification
  if (requires2FA && pendingAuth) {
    return (
      <div className="auth-page">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-6">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto rounded-lg" />
          </div>
          <TwoFactorVerify email={pendingAuth.email} method={twoFAMethod} onVerified={handle2FAVerified} onCancel={handleCancel2FA} />
        </div>
      </div>
    );
  }

  // Main login form
  return (
    <div className="auth-page">
      <WelcomeDialog isLoggedIn={false} />
      <div className="w-full max-w-md px-4">
        <div className="auth-container">
          <h5 className="text-xl font-bold mb-6 text-center" style={{ color: 'hsl(var(--bc-text))' }}>Log in</h5>

          {hasExistingSession && (
            <div className="bc-alert bc-alert-warning mb-4">
              <p className="text-sm font-medium">You're already signed in.</p>
              <p className="text-xs mt-1 opacity-80">If you meant to use a different account, sign out first.</p>
              <div className="flex gap-2 mt-3">
                <button type="button" onClick={() => navigate('/')} className="btn btn-xs btn-primary">Continue</button>
                <button type="button" onClick={async () => { await supabase.auth.signOut(); setHasExistingSession(false); toast.success('Signed out'); }} className="btn btn-xs btn-gray">Sign out</button>
              </div>
            </div>
          )}

          {error && (
            <div className="bc-alert bc-alert-danger flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {emailNotConfirmed && (
            <div className="bc-alert bc-alert-warning mb-4">
              <p className="text-sm">Your account email isn't verified yet.</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <button type="button" onClick={handleResendVerification} disabled={resendingVerification || loading} className="btn btn-xs btn-primary">
                  {resendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Resend verification
                </button>
                <button type="button" onClick={handleSendLoginLink} disabled={sendingLoginLink || loading} className="btn btn-xs btn-gray">
                  {sendingLoginLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />} Send login link
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username or Email" className="form" required />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="form" required />
            <div className="flex items-center justify-between">
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</> : 'Log in'}
              </button>
              <Link to="/forgot-password" className="text-sm font-medium hover:underline" style={{ color: 'hsl(var(--bc-info))' }}>Forgot password?</Link>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'hsl(var(--bc-section-border))' }}>
            <p className="text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              Don't have an account?{' '}
              <Link to="/register" className="font-medium hover:underline" style={{ color: 'hsl(var(--bc-info))' }}>Register</Link>
            </p>
            <button type="button" onClick={() => setShowForgotUsername(true)} className="text-sm mt-2 hover:underline" style={{ color: 'hsl(var(--bc-text-muted))' }}>Forgot username?</button>
          </div>
        </div>
      </div>
    </div>
  );
}
