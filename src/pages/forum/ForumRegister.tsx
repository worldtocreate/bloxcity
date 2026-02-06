import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertCircle } from 'lucide-react';
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
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setExistingAuthUser(null);
      setEmail('');
      toast.success('Signed out');
    } catch {
      toast.error('Failed to sign out');
    }
  };
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
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
    return () => { mounted = false; };
  }, []);

  const usernameSchema = z
    .string()
    .trim()
    .min(3, 'Username must be 3-20 characters')
    .max(20, 'Username must be 3-20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

  const emailSchema = z.string().trim().email('Please enter a valid email address');

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
    setLoading(true);
    setError('');

    try {
      const trimmedUsername = username.trim();
      const trimmedDisplayName = displayName.trim() || null;
      const trimmedEmail = email.trim();

      // Validate email format
      if (!existingAuthUser) {
        const emailResult = emailSchema.safeParse(trimmedEmail);
        if (!emailResult.success) {
          setError(emailResult.error.issues[0]?.message || 'Invalid email');
          setLoading(false);
          return;
        }
      }

      // Validate username
      const usernameResult = usernameSchema.safeParse(trimmedUsername);
      if (!usernameResult.success) {
        setError(usernameResult.error.issues[0]?.message || 'Invalid username');
        setLoading(false);
        return;
      }

      // Validate display name length
      if (trimmedDisplayName && trimmedDisplayName.length > 30) {
        setError('Display name must be 30 characters or less');
        setLoading(false);
        return;
      }

      // Validate password
      if (!existingAuthUser) {
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        // Validate date of birth
        const dayNum = parseInt(dobDay);
        const monthNum = parseInt(dobMonth);
        const yearNum = parseInt(dobYear);
        
        if (!dayNum || !monthNum || !yearNum) {
          setError('Please enter your date of birth');
          setLoading(false);
          return;
        }
        
        const birthDate = new Date(yearNum, monthNum - 1, dayNum);
        if (isNaN(birthDate.getTime())) {
          setError('Please enter a valid date of birth');
          setLoading(false);
          return;
        }
        
        if (!validateAge(birthDate)) {
          setError('You must be at least 13 years old to register');
          setLoading(false);
          return;
        }
      }

      let recaptchaToken = '';
      if (recaptchaLoaded && window.grecaptcha && siteKey) {
        recaptchaToken = await window.grecaptcha.execute(siteKey, { action: 'register' });
      }

      // Check profanity for display name if provided
      if (trimmedDisplayName) {
        const profanityCheck = await supabase.functions.invoke('forum-check-profanity', {
          body: { content: trimmedDisplayName }
        });
        if (profanityCheck.data?.hasProfanity) {
          setError('Display name contains inappropriate content');
          setLoading(false);
          return;
        }
      }

      // Verify username availability and profanity
      const verifyResponse = await supabase.functions.invoke('forum-register', {
        body: { 
          action: 'verify',
          username: trimmedUsername,
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
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) {
          const msg = authError.message || 'Sign up failed';
          if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('user already registered')) {
            setError('That email is already registered. Try logging in instead, or use a different email.');
          } else {
            setError(msg);
          }
          setLoading(false);
          return;
        }

        if (!authData.user) {
          setError('Failed to create account');
          setLoading(false);
          return;
        }

        const dobString = `${parseInt(dobYear)}-${String(parseInt(dobMonth)).padStart(2, '0')}-${String(parseInt(dobDay)).padStart(2, '0')}`;
        
        const { data: forumUserData, error: profileError } = await supabase.from('forum_users').insert({
          user_id: authData.user.id,
          username: trimmedUsername,
          display_name: trimmedDisplayName,
          date_of_birth: dobString,
          dob_updated_at: new Date().toISOString()
        }).select('id').single();

        if (profileError) {
          console.error('Profile creation error:', profileError);
          if (profileError.code === '23505') {
            setError('Username is already taken. Please choose a different one.');
          } else {
            setError(profileError.message || 'Failed to create profile. Please try again.');
          }
          setLoading(false);
          return;
        }

        // Process referral if provided
        if (referralCode && forumUserData?.id) {
          try {
            await supabase.rpc('process_referral', {
              p_referral_code: referralCode,
              p_referred_user_id: forumUserData.id,
              p_ip_address: null
            });
          } catch (refErr) {
            console.log('Referral processing failed:', refErr);
          }
        }

        toast.success('Account created! Welcome to BloxCity.');
        navigate('/');
        setLoading(false);
        return;
      }

      // For existing auth users, just create forum profile
      const { data: forumUserData, error: profileError } = await supabase.from('forum_users').insert({
        user_id: userIdToUse,
        username: trimmedUsername,
        display_name: trimmedDisplayName
      }).select('id').single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        if (profileError.code === '23505') {
          setError('Username is already taken. Please choose a different one.');
        } else {
          setError(profileError.message || 'Failed to create profile. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Process referral if provided
      if (referralCode && forumUserData?.id) {
        try {
          await supabase.rpc('process_referral', {
            p_referral_code: referralCode,
            p_referred_user_id: forumUserData.id,
            p_ip_address: null
          });
        } catch (refErr) {
          console.log('Referral processing failed:', refErr);
        }
      }

      toast.success('Forum profile created!');
      navigate('/');
    } catch (err) {
      setError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[hsl(var(--bc-background))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link to="/">
            <img src={bloxcityLogo} alt="BloxCity" className="w-24 h-24 mx-auto rounded-xl" />
          </Link>
          <h1 className="text-2xl font-bold text-[hsl(var(--bc-text))] mt-4">Create Account</h1>
          <p className="text-[hsl(var(--bc-text-muted))] text-sm mt-1">Join the BloxCity community</p>
        </div>

        <div className="bc-card">
          <div className="bc-card-body">
            {existingAuthUser && (
              <div className="p-3 mb-4 bg-[hsl(var(--bc-warning)/0.10)] border border-[hsl(var(--bc-warning)/0.35)] rounded-lg">
                <p className="text-sm text-[hsl(var(--bc-text))] font-medium">
                  You're currently signed in as <span className="font-bold">{existingAuthUser.email || 'your account'}</span>.
                </p>
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                  The email field is locked while signed in. Sign out to register a new email.
                </p>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={handleSignOut} className="bc-btn bc-btn-gray">
                    Sign out
                  </button>
                  <Link to="/login" className="bc-btn bc-btn-primary">
                    Go to login
                  </Link>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 mb-4 bg-[hsl(var(--bc-danger)/0.1)] border border-[hsl(var(--bc-danger)/0.3)] rounded-lg text-[hsl(var(--bc-danger))]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address..."
                  className="bc-input"
                  disabled={!!existingAuthUser}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username..."
                  className="bc-input"
                  required
                />
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-1">
                  Display Name <span className="font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display Name..."
                  className="bc-input"
                  maxLength={30}
                />
              </div>

              {/* Password - only for new users */}
              {!existingAuthUser && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password..."
                      className="bc-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-1">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm Password..."
                      className="bc-input"
                      required
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-1">
                      Date of Birth
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={dobMonth}
                        onChange={(e) => setDobMonth(e.target.value)}
                        className="bc-input"
                        required
                      >
                        <option value="">Month</option>
                        {months.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                      <select
                        value={dobDay}
                        onChange={(e) => setDobDay(e.target.value)}
                        className="bc-input"
                        required
                      >
                        <option value="">Day</option>
                        {days.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <select
                        value={dobYear}
                        onChange={(e) => setDobYear(e.target.value)}
                        className="bc-input"
                        required
                      >
                        <option value="">Year</option>
                        {years.map((y) => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                      You must be at least 13 years old to register
                    </p>
                  </div>
                </>
              )}

              {/* Terms notice */}
              <div className="text-xs text-[hsl(var(--bc-text-muted))] text-center">
                By signing up, you agree to our{' '}
                <Link to="/terms" className="text-[hsl(var(--bc-primary))] hover:underline">Terms of Service</Link>
                {' '}and{' '}
                <Link to="/privacy" className="text-[hsl(var(--bc-primary))] hover:underline">Privacy Policy</Link>
              </div>

              {recaptchaLoaded && (
                <p className="text-xs text-[hsl(var(--bc-success))] text-center">✓ reCAPTCHA ready</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bc-btn bc-btn-primary w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-[hsl(var(--bc-text-muted))]">
              Already have an account?{' '}
              <Link to="/login" className="text-[hsl(var(--bc-primary))] hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
