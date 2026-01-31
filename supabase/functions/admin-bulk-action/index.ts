import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BulkActionRequest {
  action: "approve" | "deny";
  reservationIds: string[];
  denialReason?: string;
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

    const { action, reservationIds, denialReason }: BulkActionRequest = await req.json();

    if (!action || !reservationIds || !Array.isArray(reservationIds) || reservationIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch reservations
    const { data: reservations, error: fetchError } = await supabaseAdmin
      .from("reserved_usernames")
      .select("*")
      .in("id", reservationIds)
      .eq("status", "pending");

    if (fetchError) throw fetchError;

    if (!reservations || reservations.length === 0) {
      return new Response(
        JSON.stringify({ error: "No pending reservations found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let successCount = 0;
    let failCount = 0;

    for (const reservation of reservations) {
      try {
        if (action === "approve") {
          // Update status
          const { error: updateError } = await supabaseAdmin
            .from("reserved_usernames")
            .update({ status: "approved" })
            .eq("id", reservation.id);

          if (updateError) throw updateError;

          // Send approval email
          if (reservation.email) {
            try {
              await resend.emails.send({
                from: "BLOX City <onboarding@resend.dev>",
                to: [reservation.email],
                subject: "Your BLOX City Username Has Been Approved! 🎉",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333;">Congratulations!</h1>
                    <p>Your username reservation for <strong>${reservation.username}</strong> has been approved!</p>
                    <p>Your reservation code is: <strong style="font-size: 1.2em; color: #4a7cc9;">${reservation.reservation_code}</strong></p>
                    <p>Keep this code safe - you'll need it when BLOX City launches in 2026.</p>
                  </div>
                `,
              });
            } catch (emailError) {
              console.error("Email failed for:", reservation.email, emailError);
            }
          }

          successCount++;
        } else if (action === "deny") {
          // Update status with denial reason
          const { error: updateError } = await supabaseAdmin
            .from("reserved_usernames")
            .update({ 
              status: "denied",
              denial_reason: denialReason || null
            })
            .eq("id", reservation.id);

          if (updateError) throw updateError;

          // Send denial email
          if (reservation.email) {
            try {
              await resend.emails.send({
                from: "BLOX City <onboarding@resend.dev>",
                to: [reservation.email],
                subject: "BLOX City Username Reservation Update",
                html: `
                  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #333;">Reservation Update</h1>
                    <p>Unfortunately, your username reservation for <strong>${reservation.username}</strong> was not approved.</p>
                    ${denialReason ? `<p>Reason: ${denialReason}</p>` : ''}
                    <p>You can try reserving a different username at bloxcity.net</p>
                  </div>
                `,
              });
            } catch (emailError) {
              console.error("Email failed for:", reservation.email, emailError);
            }
          }

          successCount++;
        }
      } catch (err) {
        console.error("Failed to process reservation:", reservation.id, err);
        failCount++;
      }
    }

    console.log(`Bulk ${action}: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${successCount} reservations ${action === 'approve' ? 'approved' : 'denied'}${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        successCount,
        failCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in bulk action:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process bulk action" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
