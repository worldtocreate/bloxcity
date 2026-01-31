import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Smartphone, Mail, Key, Loader2, Check, Copy, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorSettings {
  is_enabled: boolean;
  method: 'none' | 'totp' | 'email';
}

interface TwoFactorSetupProps {
  forumUserId: string;
}

export default function TwoFactorSetup({ forumUserId }: TwoFactorSetupProps) {
  const [settings, setSettings] = useState<TwoFactorSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState<'none' | 'totp' | 'email'>('none');
  const [totpSecret, setTotpSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [forumUserId]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('forum_2fa_settings')
      .select('is_enabled, method')
      .eq('forum_user_id', forumUserId)
      .single();

    if (data) {
      setSettings(data as TwoFactorSettings);
    } else {
      setSettings({ is_enabled: false, method: 'none' });
    }
    setLoading(false);
  };

  const initTOTP = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-setup', {
        body: { action: 'init_totp' }
      });

      if (error) throw error;

      setTotpSecret(data.secret);
      setOtpAuthUrl(data.otpAuthUrl);
      setBackupCodes(data.backupCodes);
      setSetupMode('totp');
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialize 2FA');
    }
    setProcessing(false);
  };

  const verifyTOTP = async () => {
    if (verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-setup', {
        body: { action: 'verify_totp', code: verificationCode }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success('Two-factor authentication enabled!');
      setShowBackupCodes(true);
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message || 'Invalid verification code');
    }
    setProcessing(false);
  };

  const enableEmailAuth = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-setup', {
        body: { action: 'enable_email' }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      toast.success('Email-based 2FA enabled!');
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to enable email 2FA');
    }
    setProcessing(false);
  };

  const disable2FA = async () => {
    if (!confirm('Are you sure you want to disable two-factor authentication?')) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-setup', {
        body: { action: 'disable' }
      });

      if (error) throw error;

      toast.success('Two-factor authentication disabled');
      setSetupMode('none');
      setTotpSecret('');
      setBackupCodes([]);
      fetchSettings();
    } catch (err: any) {
      toast.error(err.message || 'Failed to disable 2FA');
    }
    setProcessing(false);
  };

  const regenerateBackupCodes = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-setup', {
        body: { action: 'regenerate_backup' }
      });

      if (error) throw error;

      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      toast.success('Backup codes regenerated!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to regenerate backup codes');
    }
    setProcessing(false);
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    toast.success('Backup codes copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--bc-text-muted))]" />
      </div>
    );
  }

  // Show backup codes modal
  if (showBackupCodes && backupCodes.length > 0) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] flex items-center gap-2">
            <Key className="w-5 h-5 text-[hsl(var(--bc-accent))]" />
            Save Your Backup Codes
          </h2>
          <button
            onClick={() => setShowBackupCodes(false)}
            className="text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
          <p className="text-yellow-500 text-sm">
            <strong>Important:</strong> Save these backup codes in a secure location. Each code can only be used once. You'll need these if you lose access to your authentication method.
          </p>
        </div>

        <div className="bg-[hsl(var(--bc-bg-light))] rounded-lg p-4 mb-4">
          <div className="grid grid-cols-2 gap-2 font-mono text-sm">
            {backupCodes.map((code, i) => (
              <div key={i} className="text-[hsl(var(--bc-text))] bg-[hsl(var(--bc-bg-card))] rounded px-3 py-2">
                {code}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={copyBackupCodes}
          className="flex items-center justify-center gap-2 w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white px-4 py-2 rounded-lg transition"
        >
          <Copy className="w-4 h-4" />
          Copy All Codes
        </button>
      </div>
    );
  }

  // TOTP Setup Mode
  if (setupMode === 'totp' && totpSecret) {
    return (
      <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Set Up Google Authenticator
        </h2>

        <div className="space-y-4">
          <div className="bg-[hsl(var(--bc-bg-light))] rounded-lg p-4">
            <p className="text-sm text-[hsl(var(--bc-text-muted))] mb-3">
              1. Scan this QR code with Google Authenticator or any TOTP app:
            </p>
            <div className="flex justify-center mb-3">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpAuthUrl)}`}
                alt="QR Code"
                className="rounded-lg"
              />
            </div>
            <p className="text-xs text-[hsl(var(--bc-text-muted))] text-center">
              Or enter manually: <code className="bg-[hsl(var(--bc-bg-card))] px-2 py-1 rounded text-[hsl(var(--bc-text))]">{totpSecret}</code>
            </p>
          </div>

          <div>
            <label className="block text-sm text-[hsl(var(--bc-text-muted))] mb-2">
              2. Enter the 6-digit code from your app:
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.5em] bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))]"
              placeholder="000000"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setSetupMode('none'); setTotpSecret(''); }}
              className="flex-1 px-4 py-2 border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
            >
              Cancel
            </button>
            <button
              onClick={verifyTOTP}
              disabled={verificationCode.length !== 6 || processing}
              className="flex-1 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Verify & Enable
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main view - 2FA settings
  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-xl p-6">
      <h2 className="text-lg font-semibold text-[hsl(var(--bc-text))] mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5" />
        Two-Factor Authentication
      </h2>

      {settings?.is_enabled ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <Check className="w-6 h-6 text-green-500" />
            <div>
              <div className="text-green-500 font-medium">2FA is enabled</div>
              <div className="text-sm text-[hsl(var(--bc-text-muted))]">
                Method: {settings.method === 'totp' ? 'Google Authenticator' : 'Email verification'}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={regenerateBackupCodes}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 border border-[hsl(var(--bc-border))] text-[hsl(var(--bc-text))] rounded-lg hover:bg-[hsl(var(--bc-bg-light))] transition"
            >
              <RefreshCw className="w-4 h-4" />
              New Backup Codes
            </button>
            <button
              onClick={disable2FA}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disable 2FA'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[hsl(var(--bc-text-muted))] text-sm">
            Add an extra layer of security to your account. Choose your preferred method:
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={initTOTP}
              disabled={processing}
              className="flex flex-col items-center gap-3 p-4 border border-[hsl(var(--bc-border))] rounded-xl hover:border-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-bg-light))] transition group"
            >
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center group-hover:scale-110 transition">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-medium text-[hsl(var(--bc-text))]">Google Authenticator</div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">Use an authenticator app</div>
              </div>
            </button>

            <button
              onClick={enableEmailAuth}
              disabled={processing}
              className="flex flex-col items-center gap-3 p-4 border border-[hsl(var(--bc-border))] rounded-xl hover:border-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-bg-light))] transition group"
            >
              <div className="w-12 h-12 rounded-full bg-[hsl(var(--bc-accent))] flex items-center justify-center group-hover:scale-110 transition">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <div className="font-medium text-[hsl(var(--bc-text))]">Email Verification</div>
                <div className="text-xs text-[hsl(var(--bc-text-muted))]">Get codes via email</div>
              </div>
            </button>
          </div>

          {processing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--bc-primary))]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
