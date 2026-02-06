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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailNotConfirmed(false);
    setLoading(true);

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
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Please enter your email first.');
      return;
    }

    setResendingVerification(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: trimmedEmail,
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
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error('Please enter your email first.');
      return;
    }

    setSendingLoginLink(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
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
        <div className="auth-container">
          <div className="container" style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '2px', padding: '25px' }}>
            <h5 className="mb-25" style={{ fontSize: '1.64rem', lineHeight: '110%', marginBottom: '25px' }}>Welcome Back!</h5>
            
            <div className="alert alert-warning" style={{ background: '#fa7b00', color: '#fff', fontSize: '16px', padding: '10px', marginBottom: '25px', borderRadius: '5px' }}>
              <p>Your account was disabled on your request.</p>
              <p style={{ fontSize: '14px', marginTop: '8px', opacity: 0.9 }}>
                Reason: {getReasonText(disabledAccountInfo.self_disabled_reason)}
              </p>
              {disabledAccountInfo.self_disabled_until && (
                <p style={{ fontSize: '14px', marginTop: '4px', opacity: 0.9 }}>
                  Scheduled until: {new Date(disabledAccountInfo.self_disabled_until).toLocaleDateString()}
                </p>
              )}
            </div>

            <p style={{ color: '#666', marginBottom: '25px', textAlign: 'center' }}>
              Would you like to reactivate your account and continue using the forum?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                onClick={handleReactivateAccount}
                disabled={reactivating}
                className="button button-blue"
                style={{ 
                  background: '#2196f3', 
                  color: '#fff', 
                  fontWeight: 500, 
                  border: 0, 
                  borderRadius: '2px', 
                  padding: '8px', 
                  cursor: reactivating ? 'not-allowed' : 'pointer',
                  opacity: reactivating ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
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
                className="button button-gray"
                style={{ 
                  background: '#5b6069', 
                  color: '#fff', 
                  fontWeight: 500, 
                  border: 0, 
                  borderRadius: '2px', 
                  padding: '8px', 
                  cursor: 'pointer'
                }}
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show forgot username form
  if (showForgotUsername) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#ededed' }}>
        <div className="auth-container" style={{ width: '400px' }}>
          <div className="container" style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '2px', padding: '25px' }}>
            <h5 className="mb-25" style={{ fontSize: '1.64rem', lineHeight: '110%', marginBottom: '25px' }}>Forgot Username?</h5>
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
              Enter your email and we'll send you the username(s) associated with it.
            </p>
            
            <form onSubmit={handleForgotUsername}>
              <input
                type="email"
                value={forgotUsernameEmail}
                onChange={(e) => setForgotUsernameEmail(e.target.value)}
                placeholder="Email Address"
                className="form-input"
                style={{
                  background: '#fff',
                  color: '#333',
                  border: '1px solid #ccc',
                  borderRadius: '2px',
                  padding: '6px 12px',
                  marginBottom: '15px',
                  width: '100%',
                  height: '35px',
                  boxSizing: 'border-box'
                }}
                required
                autoFocus
              />

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  disabled={sendingUsernameRecovery}
                  className="button button-blue"
                  style={{ 
                    background: '#2196f3', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '8px', 
                    cursor: sendingUsernameRecovery ? 'not-allowed' : 'pointer',
                    opacity: sendingUsernameRecovery ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    flex: 1
                  }}
                >
                  {sendingUsernameRecovery ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Email'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForgotUsername(false);
                    setForgotUsernameEmail('');
                  }}
                  className="button button-gray"
                  style={{ 
                    background: '#5b6069', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '8px', 
                    cursor: 'pointer'
                  }}
                >
                  Back
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show 2FA verification screen
  if (requires2FA && pendingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#ededed' }}>
        <div className="auth-container" style={{ width: '400px' }}>
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#ededed' }}>
      {/* Welcome Dialog popup */}
      <WelcomeDialog isLoggedIn={false} />
      
      <div className="auth-container" style={{ width: '400px' }}>
        <div className="container" style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '2px', padding: '25px' }}>
          <h5 className="mb-25" style={{ fontSize: '1.64rem', lineHeight: '110%', marginBottom: '25px' }}>Log in</h5>
          
          {hasExistingSession && (
            <div className="alert alert-warning" style={{ background: '#fa7b00', color: '#fff', fontSize: '14px', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
              <p style={{ fontWeight: 500 }}>You're already signed in.</p>
              <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>If you meant to use a different account, sign out first.</p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="button button-blue"
                  style={{ 
                    background: '#2196f3', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
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
                  className="button button-gray"
                  style={{ 
                    background: '#5b6069', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ background: '#ed3737', color: '#fff', fontSize: '14px', padding: '10px', marginBottom: '15px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {emailNotConfirmed && (
            <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: '2px', padding: '10px', marginBottom: '15px' }}>
              <p style={{ color: '#333', fontSize: '14px', marginBottom: '10px' }}>
                Your account email isn't verified yet. You can resend the verification email, or use a login link to get in.
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification || loading}
                  className="button button-blue"
                  style={{ 
                    background: '#2196f3', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '6px 12px', 
                    cursor: (resendingVerification || loading) ? 'not-allowed' : 'pointer',
                    opacity: (resendingVerification || loading) ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}
                >
                  {resendingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Resend verification
                </button>
                <button
                  type="button"
                  onClick={handleSendLoginLink}
                  disabled={sendingLoginLink || loading}
                  className="button button-gray"
                  style={{ 
                    background: '#5b6069', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '6px 12px', 
                    cursor: (sendingLoginLink || loading) ? 'not-allowed' : 'pointer',
                    opacity: (sendingLoginLink || loading) ? 0.8 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}
                >
                  {sendingLoginLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Send login link
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Username"
              className="form-input"
              style={{
                background: '#fff',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '2px',
                padding: '6px 12px',
                marginBottom: '15px',
                width: '100%',
                height: '35px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loading}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="form-input"
              style={{
                background: '#fff',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '2px',
                padding: '6px 12px',
                marginBottom: '15px',
                width: '100%',
                height: '35px',
                boxSizing: 'border-box'
              }}
              required
              disabled={loading}
            />
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                type="submit"
                disabled={loading}
                className="button button-blue"
                style={{ 
                  background: '#2196f3', 
                  color: '#fff', 
                  fontWeight: 500, 
                  border: 0, 
                  borderRadius: '2px', 
                  padding: '8px 16px', 
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.8 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Log in
              </button>
              <a 
                href="/forgot-password" 
                style={{ color: '#039be5', textDecoration: 'none', fontSize: '14px' }}
              >
                Forgot password?
              </a>
            </div>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'center' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              Don't have an account? <Link to="/register" style={{ color: '#039be5', textDecoration: 'none' }}>Register</Link>
            </span>
          </div>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowForgotUsername(true)}
              style={{ 
                color: '#757575', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline'
              }}
            >
              Forgot username?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
