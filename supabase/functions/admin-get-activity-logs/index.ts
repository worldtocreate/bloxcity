import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    
    // Get the forum_user for current auth user
    const { data: forumUser } = await supabaseAdmin
      .from('forum_users')
      .select('id')
      .eq('user_id', user.id)
      .single();

    // Check if user has an admin account and if it's Ben's email
    const { data: userAdminAccount } = await supabaseAdmin
      .from('admin_accounts')
      .select('email')
      .eq('forum_user_id', forumUser?.id)
      .eq('is_active', true)
      .single();

    // Only Ben can view logs
    if (!userAdminAccount || userAdminAccount.email !== 'maxtorapple36@yahoo.co.uk') {
      return new Response(
        JSON.stringify({ error: "Not authorized - Only the primary administrator can view logs" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { filter, limit = 100 } = await req.json();

    let query = supabaseAdmin
      .from("admin_activity_logs")
      .select("id, admin_user_id, admin_email, action, target_type, target_id, details, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter by action type if provided
    if (filter && filter !== "all") {
      query = query.eq("action", filter);
    }

    const { data: logs, error: logsError } = await query;

    if (logsError) {
      throw logsError;
    }

    // Enrich logs with admin username from forum_users
    const enrichedLogs = await Promise.all((logs || []).map(async (log) => {
      let adminUsername = null;
      if (log.admin_user_id) {
        const { data: adminForumUser } = await supabaseAdmin
          .from('forum_users')
          .select('username')
          .eq('user_id', log.admin_user_id)
          .single();
        adminUsername = adminForumUser?.username || null;
      }
      return {
        ...log,
        admin_username: adminUsername,
      };
    }));

    console.log(`Fetched ${enrichedLogs.length} activity logs for Ben`);

    return new Response(
      JSON.stringify({ logs: enrichedLogs }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching activity logs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch activity logs" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
