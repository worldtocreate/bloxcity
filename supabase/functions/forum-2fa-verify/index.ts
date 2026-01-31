import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  action: "check" | "send_email_code" | "verify";
  email?: string;
  code?: string;
  useBackup?: boolean;
}

async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyTOTP(secret: string, code: string): Promise<boolean> {
  const time = Math.floor(Date.now() / 1000 / 30);
  
  for (const offset of [-1, 0, 1]) {
    const expectedCode = await generateTOTPCode(secret, time + offset);
    if (expectedCode === code) {
      return true;
    }
  }
  return false;
}

async function generateTOTPCode(secret: string, time: number): Promise<string> {
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
  
  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setUint32(4, time, false);
  
  const key = await crypto.subtle.importKey(
    'raw',
    new Uint8Array(secretBytes),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, timeBuffer);
  const hmac = new Uint8Array(signature);
  
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary = 
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  
  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

function generateEmailCode(): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const code = Array.from(bytes).map(b => b % 10).join('') + 
               Array.from(crypto.getRandomValues(new Uint8Array(3))).map(b => b % 10).join('');
  return code;
}

async function sendVerificationEmail(email: string, code: string, username: string): Promise<boolean> {
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="500" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">BLOX City</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Two-Factor Authentication</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px; text-align: center;">
                  <p style="color: #b0b0b0; font-size: 16px; margin: 0 0 20px;">Hi ${username},</p>
                  <p style="color: #b0b0b0; font-size: 16px; margin: 0 0 30px;">Your verification code is:</p>
                  <div style="background: rgba(102, 126, 234, 0.2); border: 2px solid #667eea; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                    <span style="color: #ffffff; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</span>
                  </div>
                  <p style="color: #888; font-size: 14px; margin: 0;">This code expires in 10 minutes.</p>
                  <p style="color: #888; font-size: 14px; margin: 15px 0 0;">If you didn't request this code, please ignore this email.</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 20px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid #2a2a4a;">
                  <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                    © 2026 BLOX City, Inc. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    let result;
    try {
      result = await resend.emails.send({
        from: "BLOX City Security <noreply@bloxcity.net>",
        to: [email],
        subject: `${code} is your BLOX City verification code`,
        html: emailHtml,
      });
    } catch {
      result = await resend.emails.send({
        from: "BLOX City Security <onboarding@resend.dev>",
        to: [email],
        subject: `${code} is your BLOX City verification code`,
        html: emailHtml,
      });
    }
    return !result.error;
  } catch (err) {
    console.error("Failed to send 2FA email:", err);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { action, email, code, useBackup }: VerifyRequest = await req.json();

    if (action === "check") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email
      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!authUser) {
        // Don't reveal if user exists
        return new Response(
          JSON.stringify({ requires2FA: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: forumUser } = await supabaseAdmin
        .from('forum_users')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (!forumUser) {
        return new Response(
          JSON.stringify({ requires2FA: false }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: settings } = await supabaseAdmin
        .from('forum_2fa_settings')
        .select('is_enabled, method')
        .eq('forum_user_id', forumUser.id)
        .single();

      return new Response(
        JSON.stringify({ 
          requires2FA: settings?.is_enabled || false,
          method: settings?.method || 'none'
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "send_email_code") {
      if (!email) {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!authUser) {
        return new Response(
          JSON.stringify({ success: true }), // Don't reveal
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: forumUser } = await supabaseAdmin
        .from('forum_users')
        .select('id, username')
        .eq('user_id', authUser.id)
        .single();

      if (!forumUser) {
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate and store code
      const verificationCode = generateEmailCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

      // Delete old codes
      await supabaseAdmin
        .from('forum_2fa_codes')
        .delete()
        .eq('forum_user_id', forumUser.id)
        .eq('type', 'email');

      // Insert new code
      await supabaseAdmin
        .from('forum_2fa_codes')
        .insert({
          forum_user_id: forumUser.id,
          code: await hashCode(verificationCode),
          type: 'email',
          expires_at: expiresAt
        });

      // Send email
      await sendVerificationEmail(email, verificationCode, forumUser.username);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      if (!email || !code) {
        return new Response(
          JSON.stringify({ error: "Email and code are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
      const authUser = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
      
      if (!authUser) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: forumUser } = await supabaseAdmin
        .from('forum_users')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      if (!forumUser) {
        return new Response(
          JSON.stringify({ error: "Invalid credentials" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: settings } = await supabaseAdmin
        .from('forum_2fa_settings')
        .select('*')
        .eq('forum_user_id', forumUser.id)
        .single();

      if (!settings || !settings.is_enabled) {
        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if using backup code
      if (useBackup) {
        const cleanCode = code.replace('-', '').toUpperCase();
        const hashedCode = await hashCode(cleanCode);
        
        const backupCodes = settings.backup_codes || [];
        const backupCodesUsed = settings.backup_codes_used || [];
        
        const codeIndex = backupCodes.findIndex((bc: string, i: number) => 
          bc === hashedCode && !backupCodesUsed[i]
        );

        if (codeIndex === -1) {
          return new Response(
            JSON.stringify({ error: "Invalid backup code" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Mark code as used
        backupCodesUsed[codeIndex] = true;
        await supabaseAdmin
          .from('forum_2fa_settings')
          .update({ backup_codes_used: backupCodesUsed })
          .eq('forum_user_id', forumUser.id);

        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify based on method
      if (settings.method === 'totp') {
        if (!settings.totp_secret) {
          return new Response(
            JSON.stringify({ error: "2FA not configured properly" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const isValid = await verifyTOTP(settings.totp_secret, code);
        
        if (!isValid) {
          return new Response(
            JSON.stringify({ error: "Invalid verification code" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (settings.method === 'email') {
        const hashedCode = await hashCode(code);
        
        const { data: storedCode } = await supabaseAdmin
          .from('forum_2fa_codes')
          .select('*')
          .eq('forum_user_id', forumUser.id)
          .eq('code', hashedCode)
          .eq('type', 'email')
          .is('used_at', null)
          .gte('expires_at', new Date().toISOString())
          .single();

        if (!storedCode) {
          return new Response(
            JSON.stringify({ error: "Invalid or expired code" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Mark code as used
        await supabaseAdmin
          .from('forum_2fa_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', storedCode.id);

        return new Response(
          JSON.stringify({ verified: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Invalid 2FA method" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in 2FA verify:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
