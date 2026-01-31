import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper to log admin activity
async function logActivity(
  supabaseAdmin: any,
  adminUserId: string,
  adminEmail: string | undefined,
  action: string,
  targetType: string,
  targetId: string | null,
  details: Record<string, unknown>
) {
  try {
    await supabaseAdmin.from("admin_activity_logs").insert({
      admin_user_id: adminUserId,
      admin_email: adminEmail,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}

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

    const { action, word, reason, wordId } = await req.json();

    if (action === "list") {
      const { data: words, error } = await supabaseAdmin
        .from("banned_words")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ words: words || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "add") {
      if (!word || typeof word !== "string") {
        return new Response(
          JSON.stringify({ error: "Word is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin
        .from("banned_words")
        .insert({ 
          word: word.toLowerCase().trim(), 
          reason: reason || null,
          created_by: user.id 
        });

      if (error) {
        if (error.code === '23505') {
          return new Response(
            JSON.stringify({ error: "This word is already banned" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        throw error;
      }

      await logActivity(supabaseAdmin, user.id, user.email, "add_banned_word", "banned_word", null, { word: word.toLowerCase().trim(), reason });
      console.log(`Banned word added: ${word}`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      if (!wordId) {
        return new Response(
          JSON.stringify({ error: "Word ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabaseAdmin
        .from("banned_words")
        .delete()
        .eq("id", wordId);

      if (error) throw error;

      await logActivity(supabaseAdmin, user.id, user.email, "delete_banned_word", "banned_word", wordId, {});
      console.log(`Banned word deleted: ${wordId}`);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error managing banned words:", error);
    return new Response(
      JSON.stringify({ error: "Failed to manage banned words" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
