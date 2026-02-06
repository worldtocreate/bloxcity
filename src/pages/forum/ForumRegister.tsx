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
  const [acceptTos, setAcceptTos] = useState(false);
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

      // Check TOS acceptance
      if (!existingAuthUser && !acceptTos) {
        setError('You must agree to the terms of service');
        setLoading(false);
        return;
      }

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
        
        const defaultAvatarUrl = 'https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/default/default-avatar.png';
        
        const { data: forumUserData, error: profileError } = await supabase.from('forum_users').insert({
          user_id: authData.user.id,
          username: trimmedUsername,
          display_name: trimmedDisplayName,
          date_of_birth: dobString,
          dob_updated_at: new Date().toISOString(),
          avatar_url: defaultAvatarUrl
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
          const { data: refResult, error: refError } = await supabase.rpc('process_referral', {
            p_referral_code: referralCode.toUpperCase(),
            p_referred_user_id: forumUserData.id,
            p_ip_address: null
          });
          const result = refResult as { success?: boolean; coins_awarded?: number; error?: string } | null;
          if (refError) {
            console.log('Referral RPC error:', refError);
          } else if (result?.success) {
            console.log('Referral processed successfully:', result);
            toast.success(`🎉 Referral bonus applied! You helped earn ${result.coins_awarded} coins!`);
          } else if (result?.error) {
            console.log('Referral processing failed:', result.error);
          }
        }

        toast.success('Account created! Welcome to BloxCity.');
        navigate('/');
        setLoading(false);
        return;
      }

      // For existing auth users, just create forum profile
      const defaultAvatarUrl = 'https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/forum-avatars/default/default-avatar.png';
      
      const { data: forumUserData, error: profileError } = await supabase.from('forum_users').insert({
        user_id: userIdToUse,
        username: trimmedUsername,
        display_name: trimmedDisplayName,
        avatar_url: defaultAvatarUrl
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

      // Process referral if provided (for existing auth users)
      if (referralCode && forumUserData?.id) {
        const { data: refResult, error: refError } = await supabase.rpc('process_referral', {
          p_referral_code: referralCode.toUpperCase(),
          p_referred_user_id: forumUserData.id,
          p_ip_address: null
        });
        const result = refResult as { success?: boolean; coins_awarded?: number; error?: string } | null;
        if (refError) {
          console.log('Referral RPC error:', refError);
        } else if (result?.success) {
          console.log('Referral processed successfully:', result);
          toast.success(`🎉 Referral bonus applied!`);
        } else if (result?.error) {
          console.log('Referral processing failed:', result.error);
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

  const inputStyle = {
    background: '#fff',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '2px',
    padding: '6px 12px',
    marginBottom: '15px',
    width: '100%',
    height: '35px',
    boxSizing: 'border-box' as const
  };

  const selectStyle = {
    ...inputStyle,
    WebkitAppearance: 'menulist' as const,
    MozAppearance: 'menulist' as const,
    appearance: 'menulist' as const
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#ededed' }}>
      <div className="auth-container" style={{ width: '400px' }}>
        <div className="container" style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '2px', padding: '25px' }}>
          <h5 className="mb-25" style={{ fontSize: '1.64rem', lineHeight: '110%', marginBottom: '25px' }}>Register</h5>
          
          {existingAuthUser && (
            <div className="alert alert-warning" style={{ background: '#fa7b00', color: '#fff', fontSize: '14px', padding: '10px', marginBottom: '15px', borderRadius: '5px' }}>
              <p style={{ fontWeight: 500 }}>
                You're currently signed in as {existingAuthUser.email || 'your account'}.
              </p>
              <p style={{ fontSize: '12px', marginTop: '4px', opacity: 0.9 }}>
                The email field is locked while signed in. Sign out to register a new email.
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="button button-gray"
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
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
                <Link
                  to="/login"
                  className="button button-blue"
                  style={{ 
                    background: '#2196f3', 
                    color: '#fff', 
                    fontWeight: 500, 
                    border: 0, 
                    borderRadius: '2px', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    fontSize: '12px',
                    textDecoration: 'none'
                  }}
                >
                  Go to login
                </Link>
              </div>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ background: '#ed3737', color: '#fff', fontSize: '14px', padding: '10px', marginBottom: '15px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              className="form-input"
              style={inputStyle}
              disabled={!!existingAuthUser}
              required
            />

            {/* Username */}
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="form-input"
              style={inputStyle}
              required
            />

            {/* Display Name */}
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display Name (optional)"
              className="form-input"
              style={inputStyle}
              maxLength={30}
            />

            {/* Password - only for new users */}
            {!existingAuthUser && (
              <>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="form-input"
                  style={inputStyle}
                  required
                />

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Password (again)"
                  className="form-input"
                  style={inputStyle}
                  required
                />

                {/* Date of Birth */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#666', fontSize: '14px', marginBottom: '5px' }}>Date of Birth</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                    <select
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      className="form-input"
                      style={selectStyle}
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
                      className="form-input"
                      style={selectStyle}
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
                      className="form-input"
                      style={selectStyle}
                      required
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                  <p style={{ color: '#666', fontSize: '12px', marginTop: '5px' }}>You must be at least 13 years old to register</p>
                </div>

                {/* Terms checkbox */}
                <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={acceptTos}
                    onChange={(e) => setAcceptTos(e.target.checked)}
                    className="form-checkbox"
                    style={{
                      appearance: 'none',
                      outline: 'none',
                      border: '2px solid #5a5a5a',
                      borderRadius: '1px',
                      width: '18px',
                      height: '18px',
                      marginTop: '2px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  />
                  <label className="form-label" style={{ color: '#626262', fontSize: '14px' }}>
                    I agree to follow the <a href="/terms" style={{ color: '#039be5', textDecoration: 'none' }}>terms of service</a>
                  </label>
                </div>

                <div style={{ height: '15px' }}></div>
              </>
            )}

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
              Register
            </button>
          </form>

          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'center' }}>
            <span style={{ color: '#666', fontSize: '14px' }}>
              Already have an account? <Link to="/login" style={{ color: '#039be5', textDecoration: 'none' }}>Log in</Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
