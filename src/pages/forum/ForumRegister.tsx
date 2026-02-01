import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';
import { z } from 'zod';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function ForumRegister() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recaptchaLoaded, setRecaptchaLoaded] = useState(false);
  const [existingAuthUser, setExistingAuthUser] = useState<{ id: string; email?: string | null } | null>(null);

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (siteKey && !window.grecaptcha) {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      script.async = true;
      script.onload = () => setRecaptchaLoaded(true);
      document.body.appendChild(script);
    } else if (window.grecaptcha) {
      setRecaptchaLoaded(true);
    }
  }, [siteKey]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const u = data.session?.user;
      if (u) {
        setExistingAuthUser({ id: u.id, email: u.email });
        if (u.email) setEmail(u.email);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const usernameSchema = z
    .string()
    .trim()
    .min(3, 'Username must be 3-20 characters')
    .max(20, 'Username must be 3-20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      setError(parsedUsername.error.issues[0]?.message || 'Invalid username');
      return;
    }

    const normalizedUsername = parsedUsername.data.toLowerCase();

    // If the user is already signed in, we're just creating the missing forum profile
    if (!existingAuthUser) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);

    try {
      let recaptchaToken = '';
      if (recaptchaLoaded && window.grecaptcha && siteKey) {
        recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'register' });
      }

      const verifyResponse = await supabase.functions.invoke('forum-register', {
        body: { 
          action: 'verify',
          username: normalizedUsername,
          recaptchaToken
        }
      });

      if (verifyResponse.data?.error) {
        setError(verifyResponse.data.error);
        setLoading(false);
        return;
      }

      const userIdToUse = existingAuthUser?.id;

      // If not signed in, create auth account first
      if (!userIdToUse) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) {
          setError(authError.message);
          setLoading(false);
          return;
        }

        if (!authData.user) {
          setError('Failed to create account');
          setLoading(false);
          return;
        }

        // Create forum profile for newly created auth user
        const { error: profileError } = await supabase.from('forum_users').insert({
          user_id: authData.user.id,
          username: normalizedUsername
        });

        if (profileError) {
          setError('Username may already be taken');
          setLoading(false);
          return;
        }

        toast.success('Account created! Welcome to the forum.');
        navigate('/');
        setLoading(false);
        return;
      }

      // Signed in already: create missing forum profile
      const { error: profileError } = await supabase.from('forum_users').insert({
        user_id: userIdToUse,
        username: normalizedUsername
      });

      if (profileError) {
        setError('Username may already be taken');
        setLoading(false);
        return;
      }

      toast.success('Forum profile created!');
      navigate('/');
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-bg-light))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 rounded-xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))]">
              {existingAuthUser ? 'Create Forum Profile' : 'Create Account'}
            </h1>
            <p className="text-[hsl(var(--bc-text-muted))]">
              {existingAuthUser ? 'Pick a username to start posting' : 'Join the BLOX City community'}
            </p>
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
                placeholder="Choose a username"
                className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg pl-10 pr-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                required
              />
            </div>
            <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">3-20 characters, letters, numbers, underscores only</p>
          </div>

          {!existingAuthUser && (
            <>
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
                    placeholder="Create a password"
                    className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg pl-10 pr-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[hsl(var(--bc-text))] mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--bc-text-muted))]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="w-full bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg pl-10 pr-4 py-3 text-[hsl(var(--bc-text))] placeholder-[hsl(var(--bc-text-muted))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              existingAuthUser ? 'Create Forum Profile' : 'Create Account'
            )}
          </button>

          {!existingAuthUser && (
            <p className="text-center text-[hsl(var(--bc-text-muted))] text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline">
                Login here
              </Link>
            </p>
          )}

          <p className="text-xs text-[hsl(var(--bc-text-muted))] text-center">
            This site is protected by reCAPTCHA and the Google{' '}
            <a href="https://policies.google.com/privacy" className="text-[hsl(var(--bc-text))] hover:underline">Privacy Policy</a> and{' '}
            <a href="https://policies.google.com/terms" className="text-[hsl(var(--bc-text))] hover:underline">Terms of Service</a> apply.
          </p>
        </form>
      </div>
    </div>
  );
}
