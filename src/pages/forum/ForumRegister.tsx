import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Loader2, AlertCircle, ScrollText, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import bloxcityLogo from '@/assets/IMG_2412_Original-1.png';
import { z } from 'zod';
import { Progress } from '@/components/ui/progress';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

const STEPS = [
  { id: 1, title: 'Email', progress: 10 },
  { id: 2, title: 'Username', progress: 30 },
  { id: 3, title: 'Password', progress: 60 },
  { id: 4, title: 'Age Verification', progress: 80 },
  { id: 5, title: 'Terms', progress: 100 },
];

export default function ForumRegister() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
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
        // Skip to username step for existing users
        setCurrentStep(1);
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

  const validateCurrentStep = (): boolean => {
    setError('');

    switch (currentStep) {
      case 0: // Email
        if (!existingAuthUser) {
          const parsed = emailSchema.safeParse(email);
          if (!parsed.success) {
            setError(parsed.error.issues[0]?.message || 'Invalid email');
            return false;
          }
        }
        return true;

      case 1: // Username
        const parsedUsername = usernameSchema.safeParse(username);
        if (!parsedUsername.success) {
          setError(parsedUsername.error.issues[0]?.message || 'Invalid username');
          return false;
        }
        return true;

      case 2: // Password
        if (!existingAuthUser) {
          if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return false;
          }
          if (password !== confirmPassword) {
            setError('Passwords do not match');
            return false;
          }
        }
        return true;

      case 3: // Date of Birth
        if (!existingAuthUser) {
          const dayNum = parseInt(dobDay);
          const monthNum = parseInt(dobMonth);
          const yearNum = parseInt(dobYear);
          
          if (!dayNum || !monthNum || !yearNum) {
            setError('Please enter your date of birth');
            return false;
          }
          
          const birthDate = new Date(yearNum, monthNum - 1, dayNum);
          if (isNaN(birthDate.getTime())) {
            setError('Please enter a valid date of birth');
            return false;
          }
          
          if (!validateAge(birthDate)) {
            setError('You must be at least 13 years old to register');
            return false;
          }
        }
        return true;

      case 4: // Terms - always valid, just informational
        return true;

      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const normalizedUsername = username.trim().toLowerCase();

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

        toast.success('Account created! Welcome to BloxCity.');
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

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex justify-center">
              <img src={bloxcityLogo} alt="BloxCity" className="w-32 h-32 md:w-full md:h-auto max-w-[180px] rounded-xl" />
            </div>
            <div className="md:col-span-9 space-y-4">
              <h2 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">
                Welcome to BloxCity!
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  I am BloxCity! I will be guiding you through the sign up process.
                </p>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  For starters, what is your e-mail? We need this so we can contact you!
                </p>
              </div>
              
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
                />
              </div>

              <div className="border-t border-[hsl(var(--bc-border))] pt-4">
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  <span className="mr-2">•</span>
                  Please verify you're not a robot before proceeding to the next step
                </p>
                {recaptchaLoaded && (
                  <p className="text-xs text-green-600 mt-2">✓ reCAPTCHA ready</p>
                )}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex justify-center">
              <img src={bloxcityLogo} alt="BloxCity" className="w-32 h-32 md:w-full md:h-auto max-w-[180px] rounded-xl" />
            </div>
            <div className="md:col-span-9 space-y-4">
              <h2 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">
                Great! Now, what should we call you?
              </h2>
              
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
                />
                <p className="text-xs text-[hsl(var(--bc-text-muted))] mt-1">
                  3-20 characters, letters, numbers, and underscores only
                </p>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex justify-center">
              <img src={bloxcityLogo} alt="BloxCity" className="w-32 h-32 md:w-full md:h-auto max-w-[180px] rounded-xl" />
            </div>
            <div className="md:col-span-9 space-y-4">
              <h2 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">
                Choose your password.
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  Your password is the way you will be able to access your account and change your settings. Please use a password you do not use anywhere else.
                </p>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-bold">
                  Do not share your password with anybody.
                </p>
              </div>
              
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
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex justify-center">
              <img src={bloxcityLogo} alt="BloxCity" className="w-32 h-32 md:w-full md:h-auto max-w-[180px] rounded-xl" />
            </div>
            <div className="md:col-span-9 space-y-4">
              <h2 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">
                When were you born?
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  We need to verify your age to comply with COPPA regulations. You must be at least 13 years old to create an account.
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[hsl(var(--bc-text-muted))] uppercase mb-2">
                  Date of Birth
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={dobMonth}
                      onChange={(e) => setDobMonth(e.target.value)}
                      placeholder="MM"
                      className="bc-input text-center"
                    />
                    <p className="text-xs text-center text-[hsl(var(--bc-text-muted))] mt-1">Month</p>
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
                    />
                    <p className="text-xs text-center text-[hsl(var(--bc-text-muted))] mt-1">Day</p>
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
                    />
                    <p className="text-xs text-center text-[hsl(var(--bc-text-muted))] mt-1">Year</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="grid md:grid-cols-12 gap-6">
            <div className="md:col-span-3 flex justify-center">
              <img src={bloxcityLogo} alt="BloxCity" className="w-32 h-32 md:w-full md:h-auto max-w-[180px] rounded-xl" />
            </div>
            <div className="md:col-span-9 space-y-4">
              <h2 className="text-2xl font-semibold text-[hsl(var(--bc-text))]">
                Legal Mumbo Jumbo™
              </h2>
              <div className="space-y-2">
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  By clicking the "Sign Me Up!" button below, you agree to our Terms of Service and Privacy Policy.
                </p>
                <p className="text-sm text-[hsl(var(--bc-text-muted))] font-medium">
                  You can review our Terms of Service and/or Privacy Policy below.
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                <Link to="/terms" className="bc-btn bc-btn-secondary flex items-center justify-center gap-2">
                  <ScrollText className="w-4 h-4" />
                  Terms of Service
                </Link>
                <Link to="/privacy" className="bc-btn bc-btn-secondary flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Skip password and DOB steps for existing users
  const getEffectiveSteps = () => {
    if (existingAuthUser) {
      return [STEPS[0], STEPS[1], STEPS[4]]; // Email, Username, Terms
    }
    return STEPS;
  };

  const effectiveSteps = getEffectiveSteps();
  const isLastStep = currentStep === STEPS.length - 1 || (existingAuthUser && currentStep === 1);
  const isFirstStep = currentStep === 0 || (existingAuthUser && currentStep === 1);

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-3xl">
        {/* Step Card */}
        <div className="bc-card">
          <div className="bc-card-body">
            {/* Progress Bar */}
            <Progress 
              value={STEPS[currentStep]?.progress || 0} 
              className="h-2 mb-6"
            />

            {/* Error Message */}
            {error && (
              <div className="bc-alert bc-alert-danger flex items-center gap-2 mb-6">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Step Content */}
            {renderStep()}

            {/* Navigation */}
            <div className="border-t border-[hsl(var(--bc-border))] mt-6 pt-4 flex justify-between">
              <button
                onClick={prevStep}
                disabled={isFirstStep || loading}
                className={`bc-btn px-6 ${isFirstStep ? 'bc-btn-secondary opacity-50 cursor-not-allowed' : 'bc-btn-danger'}`}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              
              <button
                onClick={nextStep}
                disabled={loading}
                className="bc-btn bc-btn-success px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    Creating...
                  </>
                ) : isLastStep || (existingAuthUser && currentStep === 1) ? (
                  'Sign Me Up!'
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {STEPS.map((step, index) => (
            <span
              key={step.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep 
                  ? 'bg-[hsl(var(--bc-info))]' 
                  : index < currentStep 
                    ? 'bg-green-500' 
                    : 'bg-[hsl(var(--bc-border))]'
              }`}
            />
          ))}
        </div>

        {/* Google Sign Up */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: 'hsl(var(--bc-border))' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-[hsl(var(--bc-body-bg))]" style={{ color: 'hsl(var(--bc-text-muted))' }}>Or sign up with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={async () => {
              setLoading(true);
              setError('');
              try {
                const { error } = await lovable.auth.signInWithOAuth('google', {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  setError(error.message || 'Google sign up failed');
                }
              } catch (err: any) {
                setError(err.message || 'Google sign up failed');
              }
              setLoading(false);
            }}
            disabled={loading}
            className="bc-btn bc-btn-block flex items-center justify-center gap-2"
            style={{ background: 'hsl(var(--bc-section-bg))', border: '1px solid hsl(var(--bc-border))', color: 'hsl(var(--bc-text))' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm mt-4" style={{ color: 'hsl(var(--bc-text-muted))' }}>
          Already have an account?{' '}
          <Link to="/login" className="text-[hsl(var(--bc-info))] hover:underline font-medium">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
