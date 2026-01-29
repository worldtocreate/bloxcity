import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get client IP from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const cfConnectingIp = req.headers.get('cf-connecting-ip');
    const clientIp = cfConnectingIp || (forwardedFor?.split(',')[0]?.trim()) || realIp || 'unknown';

    console.log('Request from IP:', clientIp);

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

    console.log(`Username "${cleanUsername}" reserved successfully for IP ${clientIp}, email ${cleanEmail}`);

    // TODO: Send confirmation email when RESEND_API_KEY is configured
    // For now, just return success

    return new Response(
      JSON.stringify({ 
        success: true, 
        username: cleanUsername, 
        reservationCode: code 
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
