import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base32Encode } from "https://deno.land/std@0.208.0/encoding/base32.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SetupRequest {
  action: "init_totp" | "verify_totp" | "enable_email" | "disable" | "regenerate_backup";
  code?: string;
}

// Generate a random TOTP secret
function generateTOTPSecret(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes).replace(/=/g, '');
}

// Generate backup codes
function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const code = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

// Hash a backup code
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify TOTP code using HMAC-based algorithm
async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000 / 30);
  
  // Check current and adjacent time windows
  for (const offset of [-1, 0, 1]) {
    const expectedCode = await generateTOTPCode(secret, time + offset);
    if (expectedCode === code) {
      return true;
    }
  }
  return false;
}

async function generateTOTPCode(secret: string, time: number): Promise<string> {
  // Decode base32 secret
  const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const secretBytes: number[] = [];
  let bits = 0;
  let value = 0;
  
  for (const char of secret.toUpperCase()) {
    const index = base32Chars.indexOf(char);
    if (index === -1) continue;
    value = (value << 5) | index;
    bits += 5;
    if (bits >= 8) {
      secretBytes.push((value >> (bits - 8)) & 0xFF);
      bits -= 8;
    }
  }
  
  // Create time buffer
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);
  
  // Import key
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(secretBytes),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  // Generate HMAC
  const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
  const hmac = new Uint8Array(signature);
  
  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = 
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get forum user
    const { data: forumUser } = await supabaseAdmin
      .from('forum_users')
      .select('id, username')
      .eq('user_id', user.id)
      .single();

    if (!forumUser) {
      return new Response(
        JSON.stringify({ error: "Forum user not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, code }: SetupRequest = await req.json();

    if (action === "init_totp") {
      // Generate new TOTP secret
      const secret = generateTOTPSecret();
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await Promise.all(backupCodes.map(c => hashCode(c.replace('-', ''))));

      // Upsert 2FA settings (not enabled yet)
      await supabaseAdmin
        .from('forum_2fa_settings')
        .upsert({
          forum_user_id: forumUser.id,
          totp_secret: secret,
          backup_codes: hashedBackupCodes,
          backup_codes_used: Array(10).fill(false),
          method: 'none',
          is_enabled: false,
          updated_at: new Date().toISOString()
        }, { onConflict: 'forum_user_id' });

      // Generate QR code URL for Google Authenticator
      const issuer = 'BLOX City Forum';
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(user.email || forumUser.username)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

      return new Response(
        JSON.stringify({ 
          success: true,
          secret,
          otpAuthUrl,
          backupCodes // Return plain backup codes for user to save
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify_totp") {
      if (!code || code.length !== 6) {
        return new Response(
          JSON.stringify({ error: "Invalid code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get current settings
      const { data: settings } = await supabaseAdmin
        .from('forum_2fa_settings')
        .select('*')
        .eq('forum_user_id', forumUser.id)
        .single();

      if (!settings || !settings.totp_secret) {
        return new Response(
          JSON.stringify({ error: "2FA not initialized. Please set up first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify the TOTP code
      const isValid = await verifyTOTP(settings.totp_secret, code);

      if (!isValid) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Enable 2FA
      await supabaseAdmin
        .from('forum_2fa_settings')
        .update({
          is_enabled: true,
          method: 'totp',
          updated_at: new Date().toISOString()
        })
        .eq('forum_user_id', forumUser.id);

      return new Response(
        JSON.stringify({ success: true, message: "Two-factor authentication enabled!" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "enable_email") {
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await Promise.all(backupCodes.map(c => hashCode(c.replace('-', ''))));

      await supabaseAdmin
        .from('forum_2fa_settings')
        .upsert({
          forum_user_id: forumUser.id,
          method: 'email',
          is_enabled: true,
          totp_secret: null,
          backup_codes: hashedBackupCodes,
          backup_codes_used: Array(10).fill(false),
          updated_at: new Date().toISOString()
        }, { onConflict: 'forum_user_id' });

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "Email-based 2FA enabled!",
          backupCodes
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "disable") {
      await supabaseAdmin
        .from('forum_2fa_settings')
        .update({
          is_enabled: false,
          method: 'none',
          totp_secret: null,
          updated_at: new Date().toISOString()
        })
        .eq('forum_user_id', forumUser.id);

      return new Response(
        JSON.stringify({ success: true, message: "Two-factor authentication disabled" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "regenerate_backup") {
      const backupCodes = generateBackupCodes();
      const hashedBackupCodes = await Promise.all(backupCodes.map(c => hashCode(c.replace('-', ''))));

      await supabaseAdmin
        .from('forum_2fa_settings')
        .update({
          backup_codes: hashedBackupCodes,
          backup_codes_used: Array(10).fill(false),
          updated_at: new Date().toISOString()
        })
        .eq('forum_user_id', forumUser.id);

      return new Response(
        JSON.stringify({ 
          success: true,
          backupCodes
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in 2FA setup:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
