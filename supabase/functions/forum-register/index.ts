import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, username, recaptchaToken } = await req.json();

    if (action === 'verify') {
      // Verify reCAPTCHA
      const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
      
      if (recaptchaSecret && recaptchaToken) {
        const recaptchaResponse = await fetch(
          `https://www.google.com/recaptcha/api/siteverify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${recaptchaSecret}&response=${recaptchaToken}`
          }
        );

        const recaptchaResult = await recaptchaResponse.json();
        
        if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
          return new Response(
            JSON.stringify({ error: 'reCAPTCHA verification failed. Please try again.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check username availability
      if (username) {
        const supabaseAdmin = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        );

        const { data: existingUser } = await supabaseAdmin
          .from('forum_users')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (existingUser) {
          return new Response(
            JSON.stringify({ error: 'Username is already taken' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for profanity in username
        const profanityCheck = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/forum-check-profanity`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({ content: username })
          }
        );

        const profanityResult = await profanityCheck.json();
        if (profanityResult.hasProfanity) {
          return new Response(
            JSON.stringify({ error: 'Username contains inappropriate content' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in forum-register:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
