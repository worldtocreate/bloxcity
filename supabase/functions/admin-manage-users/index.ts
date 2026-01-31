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

    const { action, targetUserId, role, email } = await req.json();

    // List all admin users
    if (action === "list") {
      const { data: adminRoles, error: listError } = await supabaseAdmin
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });

      if (listError) {
        throw listError;
      }

      // Get profile info for each admin
      const userIds = adminRoles?.map(r => r.user_id) || [];
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, email")
        .in("user_id", userIds);

      const adminsWithEmail = adminRoles?.map(role => ({
        ...role,
        email: profiles?.find(p => p.user_id === role.user_id)?.email || "Unknown"
      }));

      console.log(`Fetched ${adminsWithEmail?.length || 0} admin users`);

      return new Response(
        JSON.stringify({ users: adminsWithEmail || [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Add admin role to user by email
    if (action === "add") {
      if (!email || !role) {
        return new Response(
          JSON.stringify({ error: "Email and role are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Find user by email in profiles
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("email", email.toLowerCase().trim())
        .single();

      if (profileError || !profile) {
        return new Response(
          JSON.stringify({ error: "User not found. They must sign up first." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if role already exists
      const { data: existingRole } = await supabaseAdmin
        .from("user_roles")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("role", role)
        .single();

      if (existingRole) {
        return new Response(
          JSON.stringify({ error: "User already has this role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add role
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: profile.user_id, role });

      if (insertError) {
        throw insertError;
      }

      // Log the action
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: "add_role",
        target_type: "user",
        target_id: profile.user_id,
        details: { email, role }
      });

      console.log(`Admin ${user.email} added ${role} role to ${email}`);

      return new Response(
        JSON.stringify({ success: true, message: `Added ${role} role to ${email}` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove role from user
    if (action === "remove") {
      if (!targetUserId) {
        return new Response(
          JSON.stringify({ error: "Target user ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Prevent removing yourself
      if (targetUserId === user.id) {
        return new Response(
          JSON.stringify({ error: "You cannot remove your own admin role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the email before deleting for logging
      const { data: targetProfile } = await supabaseAdmin
        .from("profiles")
        .select("email")
        .eq("user_id", targetUserId)
        .single();

      const { error: deleteError } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", targetUserId)
        .eq("role", role || "admin");

      if (deleteError) {
        throw deleteError;
      }

      // Log the action
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: "remove_role",
        target_type: "user",
        target_id: targetUserId,
        details: { email: targetProfile?.email, role: role || "admin" }
      });

      console.log(`Admin ${user.email} removed ${role || "admin"} role from ${targetProfile?.email}`);

      return new Response(
        JSON.stringify({ success: true, message: "Role removed successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error managing admin users:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
