import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Lock, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import TwoFactorVerify, { getTrustedDeviceToken, clearTrustedDeviceToken } from '@/components/forum/TwoFactorVerify';

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
  
  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'email'>('totp');
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);

  // Self-disabled account states
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [disabledAccountInfo, setDisabledAccountInfo] = useState<DisabledAccountInfo | null>(null);
  const [reactivating, setReactivating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/');
    });
  }, [navigate]);

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
    setLoading(true);

    // First, look up the user's email by username
    const { data: forumUserData, error: lookupError } = await supabase
      .from('forum_users')
      .select('user_id')
      .eq('username', username.toLowerCase())
      .single();

    if (lookupError || !forumUserData) {
      setError('Invalid username or password');
      setLoading(false);
      return;
    }

    // Get the email from auth.users via edge function or profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('email')
      .eq('user_id', forumUserData.user_id)
      .single();

    if (!profileData?.email) {
      setError('Invalid username or password');
      setLoading(false);
      return;
    }

    const userEmail = profileData.email;

    // Check if 2FA is enabled for this user
    const twoFAStatus = await check2FA(userEmail);
    
    if (twoFAStatus.requires2FA && twoFAStatus.method !== 'none') {
      const isTrusted = await checkTrustedDevice(userEmail);
      
      if (isTrusted) {
        await performLogin(userEmail, password);
        return;
      }
      
      setPendingAuth({ email: userEmail, password });
      setTwoFAMethod(twoFAStatus.method as 'totp' | 'email');
      setRequires2FA(true);
      setLoading(false);
      return;
    }

    await performLogin(userEmail, password);
  };

  const performLogin = async (userEmail: string, userPassword: string) => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    });

    if (authError) {
      setError('Invalid username or password');
      setLoading(false);
      return;
    }

    // Check if account is self-disabled
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

  const handleCancelReactivation = async () => {
    await supabase.auth.signOut();
    setShowReactivateModal(false);
    setDisabledAccountInfo(null);
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
      <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 rounded-xl mx-auto mb-4" />
            </Link>
          </div>

          <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6">
            <h2 className="text-xl font-bold text-[hsl(var(--bc-text))] mb-4 text-center">Welcome Back!</h2>
            
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
              <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                Your account was disabled on your request.
              </p>
              <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-2">
                Reason: {getReasonText(disabledAccountInfo.self_disabled_reason)}
              </p>
              {disabledAccountInfo.self_disabled_until && (
                <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
                  Scheduled until: {new Date(disabledAccountInfo.self_disabled_until).toLocaleDateString()}
                </p>
              )}
            </div>

            <p className="text-[hsl(var(--bc-text-muted))] text-sm mb-6 text-center">
              Would you like to reactivate your account and continue using the forum?
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleReactivateAccount}
                disabled={reactivating}
                className="w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
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
                className="w-full border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text-muted))] font-medium py-3 rounded-lg transition hover:bg-[hsl(var(--bc-bg-light))]"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show 2FA verification screen
  if (requires2FA && pendingAuth) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block">
              <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 rounded-xl mx-auto mb-4" />
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
    <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 rounded-xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">Welcome Back</h1>
            <p className="text-[hsl(var(--bc-text-muted))]">Login to BLOX City</p>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg pl-10 pr-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg pl-10 pr-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-[hsl(var(--bc-primary))] hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
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

          <p className="text-center text-[hsl(var(--bc-text-muted))] text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-[hsl(var(--bc-primary))] hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}