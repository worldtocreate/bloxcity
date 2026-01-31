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
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get reservation stats
    const { data: reservations } = await supabaseAdmin
      .from("reserved_usernames")
      .select("status, created_at");

    const total = reservations?.length || 0;
    const pending = reservations?.filter(r => r.status === 'pending').length || 0;
    const approved = reservations?.filter(r => r.status === 'approved').length || 0;
    const denied = reservations?.filter(r => r.status === 'denied').length || 0;

    // Get today's reservations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = reservations?.filter(r => new Date(r.created_at) >= today).length || 0;

    // Get this week's reservations
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = reservations?.filter(r => new Date(r.created_at) >= weekAgo).length || 0;

    // Get newsletter stats
    const { data: subscribers } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("is_active, subscribed_at");

    const totalSubscribers = subscribers?.length || 0;
    const activeSubscribers = subscribers?.filter(s => s.is_active).length || 0;
    const todaySubscribers = subscribers?.filter(s => new Date(s.subscribed_at) >= today).length || 0;

    // Get banned words count
    const { count: bannedWordsCount } = await supabaseAdmin
      .from("banned_words")
      .select("*", { count: 'exact', head: true });

    const stats = {
      reservations: {
        total,
        pending,
        approved,
        denied,
        todayCount,
        weekCount,
        approvalRate: total > 0 ? Math.round((approved / (approved + denied || 1)) * 100) : 0
      },
      newsletter: {
        total: totalSubscribers,
        active: activeSubscribers,
        todayCount: todaySubscribers
      },
      bannedWords: bannedWordsCount || 0
    };

    console.log("Admin stats fetched successfully");

    return new Response(
      JSON.stringify({ stats }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error fetching admin stats:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch stats" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
