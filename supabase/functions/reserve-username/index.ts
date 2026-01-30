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

// Blocked usernames (case-insensitive)
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

    // Check if username is blocked
    if (BLOCKED_USERNAMES.includes(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'This username is reserved and cannot be claimed.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check for profanity/bad words
    if (containsBadWord(cleanUsername)) {
      return new Response(
        JSON.stringify({ error: 'This username contains inappropriate content and cannot be used.' }),
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
        JSON.stringify({ error: 'This username has already been reserved. Please choose another.' }),
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
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4e;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #00d9ff; font-size: 28px; margin: 0;">BLOX City</h1>
                <p style="color: #888; font-size: 14px; margin-top: 5px;">Est. March 2016</p>
              </div>
              
              <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px; text-align: center;">Username Reserved! 🎉</h2>
              
              <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Congratulations! You've successfully reserved the username:
              </p>
              
              <div style="background: #0d0d1a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <span style="color: #00d9ff; font-size: 24px; font-weight: bold;">${cleanUsername}</span>
              </div>
              
              <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                <p style="color: #ffffff; font-size: 14px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">⚠️ IMPORTANT - SAVE THIS CODE!</p>
                <p style="color: #ffffff; font-size: 14px; margin: 0 0 15px 0;">You'll need this reservation code to claim your username when BLOX City launches:</p>
                <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                  <code style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${code}</code>
                </div>
              </div>
              
              <p style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                Keep this email safe! You'll need your reservation code when we launch in <strong style="color: #00d9ff;">March 2026</strong>.
              </p>
              
              <hr style="border: none; border-top: 1px solid #2a2a4e; margin: 30px 0;">
              
              <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
                © 2026 BLOX City, Inc. All rights reserved.<br>
                <a href="https://bloxcity.net" style="color: #00d9ff; text-decoration: none;">bloxcity.net</a>
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
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 40px 20px; margin: 0;">
              <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4e;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #00d9ff; font-size: 28px; margin: 0;">BLOX City</h1>
                  <p style="color: #888; font-size: 14px; margin-top: 5px;">Est. March 2016</p>
                </div>

                <h2 style="color: #ffffff; font-size: 24px; margin-bottom: 20px; text-align: center;">Username Reserved! 🎉</h2>

                <p style="color: #cccccc; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                  Congratulations! You've successfully reserved the username:
                </p>

                <div style="background: #0d0d1a; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 25px;">
                  <span style="color: #00d9ff; font-size: 24px; font-weight: bold;">${cleanUsername}</span>
                </div>

                <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); border-radius: 8px; padding: 25px; margin-bottom: 25px;">
                  <p style="color: #ffffff; font-size: 14px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">⚠️ IMPORTANT - SAVE THIS CODE!</p>
                  <p style="color: #ffffff; font-size: 14px; margin: 0 0 15px 0;">You'll need this reservation code to claim your username when BLOX City launches:</p>
                  <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 15px; text-align: center;">
                    <code style="color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 2px;">${code}</code>
                  </div>
                </div>

                <p style="color: #888888; font-size: 14px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                  Keep this email safe! You'll need your reservation code when we launch in <strong style="color: #00d9ff;">March 2026</strong>.
                </p>

                <hr style="border: none; border-top: 1px solid #2a2a4e; margin: 30px 0;">

                <p style="color: #666666; font-size: 12px; text-align: center; margin: 0;">
                  © 2026 BLOX City, Inc. All rights reserved.<br>
                  <a href="https://bloxcity.net" style="color: #00d9ff; text-decoration: none;">bloxcity.net</a>
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
