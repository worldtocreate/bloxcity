const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ inappropriate: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.log('LOVABLE_API_KEY not configured, skipping moderation');
      return new Response(
        JSON.stringify({ inappropriate: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use Lovable AI to analyze the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a content moderation system for profile pictures. Analyze the image and determine if it is inappropriate for a family-friendly gaming platform.

Inappropriate content includes:
- Nudity or sexual content
- Extreme violence or gore
- Hate symbols (swastikas, confederate flags, etc.)
- Drug paraphernalia
- Offensive gestures

Respond with ONLY "APPROPRIATE" or "INAPPROPRIATE" followed by a brief reason.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageBase64 }
              },
              {
                type: 'text',
                text: 'Is this image appropriate for a profile picture on a family-friendly gaming platform?'
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('AI moderation failed:', await response.text());
      return new Response(
        JSON.stringify({ inappropriate: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const aiResponse = result.choices?.[0]?.message?.content || '';
    const isInappropriate = aiResponse.toUpperCase().includes('INAPPROPRIATE');

    console.log('AI moderation result:', aiResponse, '-> Inappropriate:', isInappropriate);

    return new Response(
      JSON.stringify({ 
        inappropriate: isInappropriate,
        reason: isInappropriate ? aiResponse : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error moderating avatar:', error);
    return new Response(
      JSON.stringify({ inappropriate: false, error: 'Moderation check failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
