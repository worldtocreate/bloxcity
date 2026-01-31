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
    const { token } = await req.json();

    if (!token || typeof token !== "string" || token.length < 32) {
      return new Response(
        JSON.stringify({ error: "Invalid unsubscribe token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find subscriber by token
    const { data: subscriber, error: findError } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active")
      .eq("unsubscribe_token", token)
      .single();

    if (findError || !subscriber) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired unsubscribe link" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriber.is_active) {
      return new Response(
        JSON.stringify({ success: true, message: "You are already unsubscribed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Deactivate subscription
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({ is_active: false })
      .eq("id", subscriber.id);

    if (updateError) throw updateError;

    console.log("Newsletter unsubscribe successful for subscriber:", subscriber.id);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully unsubscribed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Newsletter unsubscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to unsubscribe. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
