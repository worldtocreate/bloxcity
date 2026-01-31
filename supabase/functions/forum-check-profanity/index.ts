import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Simple profanity word list - in production, use a more comprehensive list
const PROFANITY_LIST = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'crap', 'bastard', 'dick', 'cock',
  'pussy', 'cunt', 'fag', 'nigger', 'nigga', 'retard', 'whore', 'slut'
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(
        JSON.stringify({ hasProfanity: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch custom banned words from database
    const { data: bannedWords } = await supabaseAdmin
      .from('banned_words')
      .select('word');

    const customBannedWords = (bannedWords || []).map(w => w.word.toLowerCase());
    const allBannedWords = [...PROFANITY_LIST, ...customBannedWords];

    // Check content for profanity
    const contentLower = content.toLowerCase();
    const hasProfanity = allBannedWords.some(word => {
      // Check for word boundaries to avoid false positives
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(contentLower);
    });

    return new Response(
      JSON.stringify({ 
        hasProfanity,
        message: hasProfanity ? 'Content contains inappropriate language' : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking profanity:', error);
    return new Response(
      JSON.stringify({ hasProfanity: false, error: 'Check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
