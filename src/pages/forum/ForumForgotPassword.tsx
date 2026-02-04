import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import bloxcityLogo from '@/assets/bloxcity-logo.jpg';

export default function ForumForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
        <div className="w-full max-w-md">
          <div className="bc-card">
            <div className="bc-card-body text-center py-8">
              <div className="bc-section-icon mx-auto mb-4" style={{ background: 'hsla(var(--bc-success), 0.1)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: 'hsl(var(--bc-success))' }} />
              </div>
              <h1 className="text-2xl font-bold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Check Your Email</h1>
              <p className="mb-6" style={{ color: 'hsl(var(--bc-text-muted))' }}>
                We've sent a password reset link to <strong style={{ color: 'hsl(var(--bc-text))' }}>{email}</strong>
              </p>
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 hover:underline"
                style={{ color: 'hsl(var(--bc-primary))' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'hsl(var(--bc-body-bg))' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={bloxcityLogo} alt="BLOX City" className="w-16 h-16 rounded-xl mx-auto mb-4" />
            <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--bc-text))' }}>Reset Password</h1>
            <p style={{ color: 'hsl(var(--bc-text-muted))' }}>Enter your email to receive a reset link</p>
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
              <label className="block text-sm font-semibold mb-2" style={{ color: 'hsl(var(--bc-text))' }}>Email Address</label>
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

            <button
              type="submit"
              disabled={loading}
              className="bc-btn bc-btn-info bc-btn-block"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            <p className="text-center text-sm" style={{ color: 'hsl(var(--bc-text-muted))' }}>
              Remember your password?{' '}
              <Link to="/login" className="hover:underline" style={{ color: 'hsl(var(--bc-primary))' }}>
                Login here
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
