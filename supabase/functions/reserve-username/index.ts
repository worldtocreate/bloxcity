import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const generateReservationCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Banned users - completely blocked from signing up
const BANNED_USERS = [
  'lordclassified', 'lord_classified'
];

// Blocked usernames (case-insensitive) - reserved names
const BLOCKED_USERNAMES = [
  'josh', 'alex', 'isaac', 'brennan', 'kyle', 'logan', 
  'bloxcity', 'blox city', 'insdel'
];

// Profanity/bad words filter (common variations included)
const BAD_WORDS = [
  // Explicit profanity
  'fuck', 'fck', 'fuk', 'fuq', 'fux', 'f4ck', 'phuck', 'phuk',
  'shit', 'sh1t', 'sht', 'shyt', 's4it',
  'ass', 'a55', 'azz', 'arse',
  'bitch', 'b1tch', 'biatch', 'bytch',
  'bastard', 'b4stard',
  'damn', 'd4mn', 'dammit',
  'crap',
  'dick', 'd1ck', 'dik', 'dyck',
  'cock', 'c0ck', 'kok',
  'pussy', 'puss', 'pu55y',
  'cunt', 'c4nt', 'kunt',
  'whore', 'wh0re', 'hore',
  'slut', 's1ut',
  'porn', 'p0rn', 'pr0n',
  'xxx', 'xxxx',
  'sex', 's3x', 'sexx',
  'nude', 'nudes', 'nud3',
  'naked', 'nak3d',
  'penis', 'pen1s', 'p3nis',
  'vagina', 'vag1na', 'v4gina',
  'boob', 'b00b', 'boobs', 'tits', 't1ts',
  'anal', 'an4l',
  'anus', 'an4s',
  'fag', 'f4g', 'faggot', 'f4ggot',
  'nigger', 'n1gger', 'nigga', 'n1gga',
  'retard', 'r3tard', 'retarded',
  'spic', 'sp1c',
  'chink', 'ch1nk',
  'kike', 'k1ke',
  'wetback',
  'beaner',
  // Drug references
  'cocaine', 'coke', 'heroin', 'meth',
  // Violence
  'kill', 'murder', 'rape', 'r4pe',
  // Other offensive
  'nazi', 'n4zi', 'hitler', 'h1tler',
  'kkk', 'klan',
  'terrorist', 'terror',
  'pedophile', 'pedo', 'p3do',
  'molest', 'm0lest'
];

const containsBadWord = (username: string): boolean => {
  const lower = username.toLowerCase();
  return BAD_WORDS.some(word => lower.includes(word));
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || (forwardedFor?.split(',')[0]?.trim()) || realIp || 'unknown';

     console.log(`[${requestId}] Request from IP:`, clientIp);

    const { username, email } = await req.json();

    if (!username || typeof username !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return new Response(
        JSON.stringify({ error: 'Username must be between 3 and 20 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if username contains only valid characters
    if (!/^[a-z0-9_]+$/.test(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'Username can only contain letters, numbers, and underscores' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is banned
    if (BANNED_USERS.includes(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'This user is banned from reserving on BLOX City.', errorType: 'banned' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if username is blocked/reserved
    if (BLOCKED_USERNAMES.includes(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'This username is reserved.', errorType: 'reserved' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for profanity/bad words
    if (containsBadWord(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'This username contains inappropriate content and cannot be used.', errorType: 'profanity' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this IP has already reserved a username
    const { data: existingIpReservation, error: ipCheckError } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('ip_address', clientIp)
      .maybeSingle();

    if (ipCheckError) {
      console.error('IP check error:', ipCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to check reservation status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingIpReservation) {
      return new Response(
        JSON.stringify({ 
          error: `You have already reserved the username "${existingIpReservation.username}". Only one reservation per person is allowed.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if username is already taken
    const { data: existingUsername, error: usernameCheckError } = await supabase
      .from('reserved_usernames')
      .select('username')
      .eq('username', cleanUsername)
      .maybeSingle();

    if (usernameCheckError) {
      console.error('Username check error:', usernameCheckError);
      return new Response(
        JSON.stringify({ error: 'Failed to check username availability' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (existingUsername) {
      return new Response(
        JSON.stringify({ error: 'This username is reserved.', errorType: 'taken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate code and save reservation
    const code = generateReservationCode();
    const { error: insertError } = await supabase
      .from('reserved_usernames')
      .insert({
        username: cleanUsername,
        reservation_code: code,
        ip_address: clientIp,
        email: cleanEmail
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to reserve username. Please try again.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

     console.log(`[${requestId}] Username "${cleanUsername}" reserved successfully for IP ${clientIp}, email ${cleanEmail}`);

    // Send confirmation email with reservation code
     let emailSent = false;
    try {
       const fromPrimary = 'BLOX City <noreply@bloxcity.net>';
       const fromFallback = 'BLOX City <onboarding@resend.dev>';

       const primaryResponse = await resend.emails.send({
         from: fromPrimary,
        to: [cleanEmail],
        subject: 'Your BLOX City Username Reservation',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f0f4ff; color: #2d3748; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%); border-radius: 24px; padding: 40px; border: 2px solid #e0e7ff; box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <img src="https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/email-assets/bloxcity-logo.jpg" alt="BLOX City Logo" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h1 style="color: #4f46e5; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">BLOX City</h1>
                <p style="color: #818cf8; font-size: 14px; margin-top: 5px; font-weight: 600;">Est. March 2016</p>
              </div>
              
              <h2 style="color: #2d3748; font-size: 24px; margin-bottom: 20px; text-align: center; font-weight: 700;">Username Reserved! 🎉</h2>
              
              <p style="color: #6b7280; font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: center;">
                Congratulations! You've successfully reserved the username:
              </p>
              
              <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 2px solid #c7d2fe; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <span style="color: #4f46e5; font-size: 28px; font-weight: bold;">${cleanUsername}</span>
              </div>
              
              <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 3px dashed #f59e0b; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                <p style="color: #d97706; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">⚠️ KEEP THIS CODE SAFE!</p>
                <p style="color: #78716c; font-size: 14px; margin: 0 0 15px 0; text-align: center;">You'll need this reservation code to claim your username when BLOX City launches:</p>
                <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 18px; text-align: center;">
                  <code style="color: #1f2937; font-size: 28px; font-weight: 700; letter-spacing: 0.1em; font-family: 'Courier New', monospace;">${code}</code>
                </div>
                <p style="color: #dc2626; font-size: 13px; margin-top: 12px; text-align: center; font-weight: 600;">Write it down or take a screenshot. This code will not be shown again.</p>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                Keep this email safe! You'll need your reservation code when we launch in <strong style="color: #4f46e5;">2026</strong>.
              </p>
              
              <hr style="border: none; border-top: 2px solid #e0e7ff; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © 2026 BLOX City, Inc. All rights reserved.<br>
                <a href="https://bloxcity.net" style="color: #4f46e5; text-decoration: none; font-weight: 600;">bloxcity.net</a>
              </p>
            </div>
          </body>
          </html>
        `,
      });

       // Resend returns either { data } or { error }
       if ((primaryResponse as any)?.error) {
         console.error(`[${requestId}] Email send error (primary from=${fromPrimary}):`, (primaryResponse as any).error);

         // Try fallback sender to determine whether the issue is domain/from verification
         const fallbackResponse = await resend.emails.send({
           from: fromFallback,
           to: [cleanEmail],
           subject: 'Your BLOX City Username Reservation',
           html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f0f4ff; color: #2d3748; padding: 40px 20px; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ffffff 0%, #f8faff 100%); border-radius: 24px; padding: 40px; border: 2px solid #e0e7ff; box-shadow: 0 8px 32px rgba(99, 102, 241, 0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/email-assets/bloxcity-logo.jpg" alt="BLOX City Logo" style="width: 80px; height: 80px; border-radius: 16px; margin-bottom: 15px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  <h1 style="color: #4f46e5; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">BLOX City</h1>
                  <p style="color: #818cf8; font-size: 14px; margin-top: 5px; font-weight: 600;">Est. March 2016</p>
                </div>
                
                <h2 style="color: #2d3748; font-size: 24px; margin-bottom: 20px; text-align: center; font-weight: 700;">Username Reserved! 🎉</h2>
                
                <p style="color: #6b7280; font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: center;">
                  Congratulations! You've successfully reserved the username:
                </p>
                
                <div style="background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%); border: 2px solid #c7d2fe; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 25px;">
                  <span style="color: #4f46e5; font-size: 28px; font-weight: bold;">${cleanUsername}</span>
                </div>
                
                <div style="background: linear-gradient(135deg, #fefce8 0%, #fef3c7 100%); border: 3px dashed #f59e0b; border-radius: 16px; padding: 25px; margin-bottom: 25px;">
                  <p style="color: #d97706; font-size: 18px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">⚠️ KEEP THIS CODE SAFE!</p>
                  <p style="color: #78716c; font-size: 14px; margin: 0 0 15px 0; text-align: center;">You'll need this reservation code to claim your username when BLOX City launches:</p>
                  <div style="background: #ffffff; border: 2px solid #e5e7eb; border-radius: 12px; padding: 18px; text-align: center;">
                    <code style="color: #1f2937; font-size: 28px; font-weight: 700; letter-spacing: 0.1em; font-family: 'Courier New', monospace;">${code}</code>
                  </div>
                  <p style="color: #dc2626; font-size: 13px; margin-top: 12px; text-align: center; font-weight: 600;">Write it down or take a screenshot. This code will not be shown again.</p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                  Keep this email safe! You'll need your reservation code when we launch in <strong style="color: #4f46e5;">2026</strong>.
                </p>
                
                <hr style="border: none; border-top: 2px solid #e0e7ff; margin: 30px 0;">
                
                <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                  © 2026 BLOX City, Inc. All rights reserved.<br>
                  <a href="https://bloxcity.net" style="color: #4f46e5; text-decoration: none; font-weight: 600;">bloxcity.net</a>
                </p>
              </div>
            </body>
            </html>
           `,
         });

         if ((fallbackResponse as any)?.error) {
           console.error(`[${requestId}] Email send error (fallback from=${fromFallback}):`, (fallbackResponse as any).error);
         } else {
           emailSent = true;
           console.log(`[${requestId}] Confirmation email sent to ${cleanEmail} (fallback sender)`);
         }
       } else {
         emailSent = true;
         console.log(`[${requestId}] Confirmation email sent to ${cleanEmail} (primary sender)`);
       }
    } catch (emailErr) {
       console.error(`[${requestId}] Email send exception:`, emailErr);
      // Don't fail the reservation if email fails
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        username: cleanUsername, 
         reservationCode: code,
         emailSent
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
