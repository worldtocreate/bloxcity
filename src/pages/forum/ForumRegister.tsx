import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Mail, Lock, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';
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
  const [dobMonth, setDobMonth] = useState('');
  const [dobDay, setDobDay] = useState('');
  const [dobYear, setDobYear] = useState('');
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

  const validateAge = (birthDate: Date): boolean => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const dayDiff = today.getDate() - birthDate.getDate();
    
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      return age - 1 >= 13;
    }
    return age >= 13;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const parsedUsername = usernameSchema.safeParse(username);
    if (!parsedUsername.success) {
      setError(parsedUsername.error.issues[0]?.message || 'Invalid username');
      return;
    }

    const normalizedUsername = parsedUsername.data.toLowerCase();

    if (!existingAuthUser) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const dayNum = parseInt(dobDay);
      const monthNum = parseInt(dobMonth);
      const yearNum = parseInt(dobYear);
      
      if (!dayNum || !monthNum || !yearNum) {
        setError('Please enter your date of birth');
        return;
      }
      
      const birthDate = new Date(yearNum, monthNum - 1, dayNum);
      if (isNaN(birthDate.getTime())) {
        setError('Please enter a valid date of birth');
        return;
      }
      
      if (!validateAge(birthDate)) {
        setError('You must be at least 13 years old to register');
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
          email: email.trim(),
          recaptchaToken
        }
      });

      if (verifyResponse.data?.error) {
        setError(verifyResponse.data.error);
        setLoading(false);
        return;
      }

      const userIdToUse = existingAuthUser?.id;

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

        const dobString = `${parseInt(dobYear)}-${String(parseInt(dobMonth)).padStart(2, '0')}-${String(parseInt(dobDay)).padStart(2, '0')}`;
        
        const { error: profileError } = await supabase.from('forum_users').insert({
          user_id: authData.user.id,
          username: normalizedUsername,
          date_of_birth: dobString,
          dob_updated_at: new Date().toISOString()
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 mx-auto mb-4" style={{ borderRadius: 'var(--bc-rounded-lg)' }} />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>
              {existingAuthUser ? 'Create Forum Profile' : 'Create Account'}
            </h1>
            <p style={{ color: 'hsl(var(--bc-text-muted))' }}>
              {existingAuthUser ? 'Pick a username to start posting' : 'Join the BLOX City community'}
            </p>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="bc-card">
          <div className="bc-card-body space-y-4">
            {error && (
              <div className="bc-alert bc-alert-danger flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
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
                  placeholder="Choose a username"
                  className="bc-input"
                  style={{ paddingLeft: '42px' }}
                  required
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'hsl(var(--bc-text-muted))' }}>3-20 characters, letters, numbers, underscores only</p>
            </div>

            {!existingAuthUser && (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--bc-text-muted))' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bc-input"
                      style={{ paddingLeft: '42px' }}
                      required
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
                      placeholder="Create a password"
                      className="bc-input"
                      style={{ paddingLeft: '42px' }}
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--bc-text-muted))' }} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      className="bc-input"
                      style={{ paddingLeft: '42px' }}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>
                    <span className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of Birth
                    </span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                        placeholder="MM"
                        className="bc-input text-center"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                        placeholder="DD"
                        className="bc-input text-center"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min="1900"
                        max={new Date().getFullYear()}
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                        placeholder="YYYY"
                        className="bc-input text-center"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'hsl(var(--bc-text-muted))' }}>You must be at least 13 years old</p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bc-btn bc-btn-info bc-btn-block"
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
              <p className="text-center text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                Already have an account?{' '}
                <Link to="/login" className="text-info hover:underline">
                  Login here
                </Link>
              </p>
            )}

            <p className="text-xs text-center" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" className="hover:underline" style={{ color: 'hsl(var(--bc-text))' }}>Privacy Policy</a> and{' '}
              <a href="https://policies.google.com/terms" className="hover:underline" style={{ color: 'hsl(var(--bc-text))' }}>Terms of Service</a> apply.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
