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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Not authorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, ip_address, reason, expires_days, id } = await req.json();

    // List all blocked IPs
    if (action === 'list') {
      const { data: blockedIPs, error: listError } = await supabaseAdmin
        .from('blocked_ips')
        .select('*')
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('Error fetching blocked IPs:', listError);
        throw listError;
      }

      return new Response(
        JSON.stringify({ blockedIPs: blockedIPs || [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Block an IP
    if (action === 'block') {
      if (!ip_address) {
        return new Response(
          JSON.stringify({ error: 'IP address is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if already blocked
      const { data: existing } = await supabaseAdmin
        .from('blocked_ips')
        .select('id')
        .eq('ip_address', ip_address)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'This IP is already blocked' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate expiration date
      let expiresAt = null;
      if (expires_days) {
        const date = new Date();
        date.setDate(date.getDate() + expires_days);
        expiresAt = date.toISOString();
      }

      const { error: insertError } = await supabaseAdmin
        .from('blocked_ips')
        .insert({
          ip_address,
          reason: reason || null,
          blocked_by: user.id,
          expires_at: expiresAt,
        });

      if (insertError) {
        console.error('Error blocking IP:', insertError);
        throw insertError;
      }

      // Log the action
      await supabaseAdmin.from('admin_activity_logs').insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: 'block_ip',
        target_type: 'ip',
        target_id: ip_address,
        details: { ip_address, reason, expires_days }
      });

      console.log(`Admin ${user.email} blocked IP: ${ip_address}`);

      return new Response(
        JSON.stringify({ success: true, message: 'IP blocked successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unblock an IP
    if (action === 'unblock') {
      if (!id) {
        return new Response(
          JSON.stringify({ error: 'Block ID is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get IP before deleting for logging
      const { data: block } = await supabaseAdmin
        .from('blocked_ips')
        .select('ip_address')
        .eq('id', id)
        .single();

      const { error: deleteError } = await supabaseAdmin
        .from('blocked_ips')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('Error unblocking IP:', deleteError);
        throw deleteError;
      }

      // Log the action
      await supabaseAdmin.from('admin_activity_logs').insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: 'unblock_ip',
        target_type: 'ip',
        target_id: block?.ip_address || id,
        details: { ip_address: block?.ip_address }
      });

      console.log(`Admin ${user.email} unblocked IP: ${block?.ip_address}`);

      return new Response(
        JSON.stringify({ success: true, message: 'IP unblocked successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if an IP is blocked (for reservation flow)
    if (action === 'check') {
      if (!ip_address) {
        return new Response(
          JSON.stringify({ blocked: false }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: blocked } = await supabaseAdmin
        .from('blocked_ips')
        .select('id, expires_at')
        .eq('ip_address', ip_address)
        .single();

      // Check if blocked and not expired
      if (blocked) {
        if (blocked.expires_at && new Date(blocked.expires_at) < new Date()) {
          // Expired, clean up
          await supabaseAdmin.from('blocked_ips').delete().eq('id', blocked.id);
          return new Response(
            JSON.stringify({ blocked: false }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        return new Response(
          JSON.stringify({ blocked: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ blocked: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error managing blocked IPs:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
