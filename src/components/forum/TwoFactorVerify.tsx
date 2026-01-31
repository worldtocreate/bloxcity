import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Loader2, Key, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorVerifyProps {
  email: string;
  method: 'totp' | 'email';
  onVerified: () => void;
  onCancel: () => void;
}

export default function TwoFactorVerify({ email, method, onVerified, onCancel }: TwoFactorVerifyProps) {
  const [code, setCode] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const sendEmailCode = async () => {
    setSendingCode(true);
    try {
      const { error } = await supabase.functions.invoke('forum-2fa-verify', {
        body: { action: 'send_email_code', email }
      });

      if (error) throw error;

      setCodeSent(true);
      toast.success('Verification code sent to your email');
    } catch (err: any) {
      toast.error('Failed to send verification code');
    }
    setSendingCode(false);
  };

  const verify = async () => {
    if (!code) {
      toast.error('Please enter a code');
      return;
    }

    setVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('forum-2fa-verify', {
        body: { action: 'verify', email, code, useBackup }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.verified) {
        onVerified();
      } else {
        toast.error('Invalid code');
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid code');
    }
    setVerifying(false);
  };

  return (
    <div className="bg-[hsl(var(--bc-bg-card))] border border-[hsl(var(--bc-border))] rounded-2xl p-6 space-y-4">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[hsl(var(--bc-primary))] flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-[hsl(var(--bc-text))]">Two-Factor Authentication</h2>
        <p className="text-[hsl(var(--bc-text-muted))] text-sm mt-2">
          {useBackup 
            ? 'Enter one of your backup codes'
            : method === 'totp' 
              ? 'Enter the code from your authenticator app'
              : codeSent 
                ? 'Enter the code sent to your email'
                : 'Click below to receive a verification code'}
        </p>
      </div>

      {method === 'email' && !codeSent && !useBackup && (
        <button
          onClick={sendEmailCode}
          disabled={sendingCode}
          className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] text-white py-3 rounded-lg transition"
        >
          {sendingCode ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Mail className="w-5 h-5" />
              Send Code to Email
            </>
          )}
        </button>
      )}

      {(method === 'totp' || codeSent || useBackup) && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-2">
              {useBackup ? (
                <Key className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
              ) : method === 'totp' ? (
                <Smartphone className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
              ) : (
                <Mail className="w-4 h-4 text-[hsl(var(--bc-text-muted))]" />
              )}
              <label className="text-sm text-[hsl(var(--bc-text-muted))]">
                {useBackup ? 'Backup Code' : 'Verification Code'}
              </label>
            </div>
            <input
              type="text"
              inputMode={useBackup ? "text" : "numeric"}
              pattern={useBackup ? "[A-Z0-9-]*" : "[0-9]*"}
              maxLength={useBackup ? 9 : 6}
              value={code}
              onChange={(e) => setCode(useBackup ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ''))}
              className="w-full text-center text-2xl tracking-[0.3em] bg-[hsl(var(--bc-bg-light))] border border-[hsl(var(--bc-border))] rounded-lg p-3 text-[hsl(var(--bc-text))] focus:ring-2 focus:ring-[hsl(var(--bc-primary))] focus:border-transparent"
              placeholder={useBackup ? "XXXX-XXXX" : "000000"}
              autoFocus
            />
          </div>

          <button
            onClick={verify}
            disabled={verifying || (!useBackup && code.length !== 6) || (useBackup && code.length < 8)}
            className="w-full bg-[hsl(var(--bc-primary))] hover:bg-[hsl(var(--bc-primary-dark))] disabled:bg-[hsl(var(--bc-text-muted))] text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {verifying ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Verify'
            )}
          </button>
        </>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[hsl(var(--bc-border))]">
        <button
          onClick={() => setUseBackup(!useBackup)}
          className="text-sm text-[hsl(var(--bc-primary))] hover:underline"
        >
          {useBackup ? 'Use regular code' : 'Use backup code'}
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-text))]"
        >
          Cancel
        </button>
      </div>

      {method === 'email' && codeSent && !useBackup && (
        <button
          onClick={sendEmailCode}
          disabled={sendingCode}
          className="w-full text-sm text-[hsl(var(--bc-text-muted))] hover:text-[hsl(var(--bc-primary))]"
        >
          {sendingCode ? 'Sending...' : 'Resend code'}
        </button>
      )}
    </div>
  );
}
