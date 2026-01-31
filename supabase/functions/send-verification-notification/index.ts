import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  forumUserId: string;
  username: string;
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

    // Verify the caller is an admin
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

    // Check if user is admin
    const { data: hasAdminRole } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { forumUserId, username }: NotificationRequest = await req.json();

    if (!forumUserId || !username) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the forum user's auth user_id
    const { data: forumUserData } = await supabaseAdmin
      .from('forum_users')
      .select('user_id')
      .eq('id', forumUserId)
      .single();

    if (!forumUserData) {
      return new Response(
        JSON.stringify({ error: "Forum user not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the user's email from auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers?.users?.find(u => u.id === forumUserData.user_id);
    
    if (!authUser?.email) {
      return new Response(
        JSON.stringify({ error: "User email not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const email = authUser.email;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="500" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);">
                    <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 28px;">✓</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">You're Verified!</h1>
                    <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">BLOX City Verification</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px; text-align: center;">
                    <p style="color: #ffffff; font-size: 18px; margin: 0 0 20px;">Congratulations, ${username}! 🎉</p>
                    <p style="color: #b0b0b0; font-size: 16px; margin: 0 0 30px;">Your BLOX City account has been verified. You now have the official verification checkmark next to your username!</p>
                    <div style="background: rgba(59, 130, 246, 0.2); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                      <p style="color: #ffffff; font-size: 16px; margin: 0;">
                        <span style="color: #3b82f6; font-size: 24px; vertical-align: middle;">☑️</span>
                        Your profile now shows the verified badge
                      </p>
                    </div>
                    <p style="color: #888; font-size: 14px; margin: 0;">This badge lets others know that your account is authentic and trusted by BLOX City.</p>
                    <a href="https://bloxcity.net/forum" style="display: inline-block; margin-top: 30px; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">Visit the Forum</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid #2a2a4a;">
                    <p style="margin: 0; color: #666; font-size: 12px; text-align: center;">
                      © 2026 BLOX City, Inc. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    try {
      let result;
      try {
        result = await resend.emails.send({
          from: "BLOX City Verification <verification@bloxcity.net>",
          to: [email],
          subject: "🎉 Congratulations! Your BLOX City account has been verified",
          html: emailHtml,
        });
      } catch {
        // Fallback to Resend test domain
        result = await resend.emails.send({
          from: "BLOX City Verification <onboarding@resend.dev>",
          to: [email],
          subject: "🎉 Congratulations! Your BLOX City account has been verified",
          html: emailHtml,
        });
      }

      console.log("Verification notification email sent:", result);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (emailError: any) {
      console.error("Failed to send verification email:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error: any) {
    console.error("Error in send-verification-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
