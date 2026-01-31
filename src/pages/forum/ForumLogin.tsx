import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import TwoFactorVerify from '@/components/forum/TwoFactorVerify';

export default function ForumLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 2FA states
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'email'>('totp');
  const [pendingAuth, setPendingAuth] = useState<{ email: string; password: string } | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // First check if 2FA is enabled for this user
    const twoFAStatus = await check2FA(email);
    
    if (twoFAStatus.requires2FA && twoFAStatus.method !== 'none') {
      // Store credentials and show 2FA screen
      setPendingAuth({ email, password });
      setTwoFAMethod(twoFAStatus.method as 'totp' | 'email');
      setRequires2FA(true);
      setLoading(false);
      return;
    }

    // No 2FA, proceed with normal login
    await performLogin(email, password);
  };

  const performLogin = async (userEmail: string, userPassword: string) => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: userPassword
    });

    if (authError) {
      setError(authError.message);
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
            <p className="text-[hsl(var(--bc-text-muted))]">Login to the BLOX City Forum</p>
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
            <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
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
