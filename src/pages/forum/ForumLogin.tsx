import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
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
        <div className="auth-container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src={bloxcityLogo} alt="BLOX City" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
          </div>
          <h5>Welcome Back!</h5>
          <div className="alert alert-warning" style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '14px', marginBottom: '5px' }}>Your account was disabled on your request.</p>
            <p style={{ fontSize: '12px', opacity: 0.8 }}>Reason: {getReasonText(disabledAccountInfo.self_disabled_reason)}</p>
            {disabledAccountInfo.self_disabled_until && <p style={{ fontSize: '12px', opacity: 0.8 }}>Scheduled until: {new Date(disabledAccountInfo.self_disabled_until).toLocaleDateString()}</p>}
          </div>
          <p style={{ fontSize: '14px', marginBottom: '20px', textAlign: 'center', color: '#666' }}>Would you like to reactivate your account?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleReactivateAccount} disabled={reactivating} className="button button-blue" style={{ width: '100%' }}>
              {reactivating ? <><Loader2 className="w-4 h-4 animate-spin" style={{ marginRight: '6px' }} />Reactivating...</> : 'Reactivate My Account'}
            </button>
            <button onClick={handleCancelReactivation} className="button button-gray" style={{ width: '100%' }}>Not Now</button>
          </div>
        </div>
      </div>
    );
  }

  // Forgot username form
  if (showForgotUsername) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img src={bloxcityLogo} alt="BLOX City" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
          </div>
          <h5 style={{ textAlign: 'center' }}>Forgot Username?</h5>
          <p style={{ fontSize: '14px', textAlign: 'center', marginBottom: '20px', color: '#666' }}>Enter your email and we'll send you the username(s) associated with it.</p>
          <form onSubmit={handleForgotUsername}>
            <input type="email" value={forgotUsernameEmail} onChange={(e) => setForgotUsernameEmail(e.target.value)} placeholder="Email Address" className="form-input" required autoFocus />
            <button type="submit" disabled={sendingUsernameRecovery} className="button button-blue" style={{ width: '100%', marginBottom: '15px' }}>
              {sendingUsernameRecovery ? <><Loader2 className="w-4 h-4 animate-spin" style={{ marginRight: '6px' }} />Sending...</> : 'Send Username Recovery Email'}
            </button>
            <button type="button" onClick={() => { setShowForgotUsername(false); setForgotUsernameEmail(''); }} className="button button-gray" style={{ width: '100%' }}>Back to Login</button>
          </form>
        </div>
      </div>
    );
  }

  // 2FA verification
  if (requires2FA && pendingAuth) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img src={bloxcityLogo} alt="BLOX City" style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
        </div>
        <TwoFactorVerify email={pendingAuth.email} method={twoFAMethod} onVerified={handle2FAVerified} onCancel={handleCancel2FA} />
      </div>
    );
  }

  // Main login form (EXACT Blade Match)
  return (
    <div className="auth-page">
      <WelcomeDialog isLoggedIn={false} />
      <div className="grid-x">
        <div className="cell medium-6 medium-offset-4">
          <div className="auth-container">
            <h5 className="mb-25">Log in</h5>

            {hasExistingSession && (
              <div className="alert alert-warning" style={{ marginBottom: '15px' }}>
                <p style={{ fontSize: '14px', fontWeight: 500 }}>You're already signed in.</p>
                <p style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>If you meant to use a different account, sign out first.</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={() => navigate('/')} className="button button-blue" style={{ fontSize: '12px', padding: '4px 10px' }}>Continue</button>
                  <button type="button" onClick={async () => { await supabase.auth.signOut(); setHasExistingSession(false); toast.success('Signed out'); }} className="button button-gray" style={{ fontSize: '12px', padding: '4px 10px' }}>Sign out</button>
                </div>
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{error}</span>
              </div>
            )}

            {emailNotConfirmed && (
              <div className="alert alert-warning" style={{ marginBottom: '15px' }}>
                <p style={{ fontSize: '14px' }}>Your account email isn't verified yet.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                  <button type="button" onClick={handleResendVerification} disabled={resendingVerification || loading} className="button button-blue" style={{ fontSize: '12px', padding: '4px 10px' }}>
                    {resendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Resend verification
                  </button>
                  <button type="button" onClick={handleSendLoginLink} disabled={sendingLoginLink || loading} className="button button-gray" style={{ fontSize: '12px', padding: '4px 10px' }}>
                    {sendingLoginLink ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Send login link
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Username" className="form-input" required />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="form-input" required />
              <div className="grid-x align-middle">
                <div className="cell auto">
                  <button type="submit" disabled={loading} className="button button-blue">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" style={{ marginRight: '6px' }} />Loading...</> : 'Log in'}
                  </button>
                </div>
                <div className="cell shrink">
                  <Link to="/forgot-password">Forgot password?</Link>
                </div>
              </div>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Don't have an account?{' '}
                <Link to="/register">Register</Link>
              </p>
              <button type="button" onClick={() => setShowForgotUsername(true)} style={{ fontSize: '14px', marginTop: '10px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Forgot username?</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
