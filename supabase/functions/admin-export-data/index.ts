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

    const { type, filter } = await req.json();

    let csv = '';
    let count = 0;

    if (type === 'reservations') {
      // Fetch reservations
      let query = supabaseAdmin
        .from('reserved_usernames')
        .select('id, username, email, status, created_at, ip_address, denial_reason')
        .order('created_at', { ascending: false });

      if (filter && filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: reservations, error } = await query;
      if (error) throw error;

      count = reservations?.length || 0;
      
      // Generate CSV
      csv = 'ID,Username,Email,Status,Created At,IP Address,Denial Reason\n';
      reservations?.forEach(r => {
        csv += `"${r.id}","${r.username}","${r.email}","${r.status}","${r.created_at}","${r.ip_address || ''}","${r.denial_reason || ''}"\n`;
      });

    } else if (type === 'subscribers') {
      // Fetch newsletter subscribers
      const { data: subscribers, error } = await supabaseAdmin
        .from('newsletter_subscribers')
        .select('id, email, subscribed_at, is_active')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;

      count = subscribers?.length || 0;
      
      csv = 'ID,Email,Subscribed At,Is Active\n';
      subscribers?.forEach(s => {
        csv += `"${s.id}","${s.email}","${s.subscribed_at}","${s.is_active}"\n`;
      });

    } else if (type === 'logs') {
      // Fetch activity logs
      const { data: logs, error } = await supabaseAdmin
        .from('admin_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      count = logs?.length || 0;
      
      csv = 'ID,Admin Email,Action,Target Type,Target ID,Details,Created At\n';
      logs?.forEach(l => {
        csv += `"${l.id}","${l.admin_email || ''}","${l.action}","${l.target_type}","${l.target_id || ''}","${JSON.stringify(l.details || {})}","${l.created_at}"\n`;
      });

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid export type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the export
    await supabaseAdmin.from('admin_activity_logs').insert({
      admin_user_id: user.id,
      admin_email: user.email,
      action: 'export_data',
      target_type: type,
      details: { type, filter, count }
    });

    console.log(`Admin ${user.email} exported ${count} ${type} records`);

    return new Response(
      JSON.stringify({ csv, count }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Error exporting data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Export failed';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
