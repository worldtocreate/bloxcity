import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NewsletterRequest {
  subject: string;
  content: string;
  imageUrl?: string;
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

    // Create client with user's auth token to check permissions
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Not authenticated" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
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

    const { subject, content, imageUrl }: NewsletterRequest = await req.json();

    if (!subject || !content) {
      return new Response(
        JSON.stringify({ error: "Subject and content are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch all active subscribers
    const { data: subscribers, error: fetchError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .select("email, unsubscribe_token")
      .eq("is_active", true);

    if (fetchError) {
      throw fetchError;
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active subscribers found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending newsletter to ${subscribers.length} subscribers`);

    let successCount = 0;
    let failCount = 0;

    // Send emails to each subscriber
    for (const subscriber of subscribers) {
      const unsubscribeUrl = `https://bloxcity.net/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
      
      const imageHtml = imageUrl 
        ? `<div style="margin: 20px 0; text-align: center;">
             <img src="${imageUrl}" alt="Newsletter Image" style="max-width: 100%; border-radius: 8px;" />
           </div>`
        : "";

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
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; overflow: hidden; border: 1px solid #2a2a4a;">
                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                      <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">BLOX City</h1>
                      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Newsletter</p>
                    </td>
                  </tr>
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">${subject}</h2>
                      ${imageHtml}
                      <div style="color: #b0b0b0; font-size: 16px; line-height: 1.8;">
                        ${content.replace(/\n/g, '<br>')}
                      </div>
                      <div style="text-align: center; margin-top: 30px;">
                        <a href="https://bloxcity.net" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Visit BLOX City</a>
                      </div>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid #2a2a4a;">
                      <p style="margin: 0 0 15px; color: #666; font-size: 12px; text-align: center;">
                        © 2026 BLOX City, Inc. All rights reserved.
                      </p>
                      <p style="margin: 0; text-align: center;">
                        <a href="${unsubscribeUrl}" style="color: #888; font-size: 12px; text-decoration: underline;">Unsubscribe from this newsletter</a>
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
        // Try primary domain first
        let emailResult;
        try {
          emailResult = await resend.emails.send({
            from: "BLOX City <noreply@bloxcity.net>",
            to: [subscriber.email],
            subject: subject,
            html: emailHtml,
          });
        } catch {
          // Fallback to resend test domain
          emailResult = await resend.emails.send({
            from: "BLOX City <onboarding@resend.dev>",
            to: [subscriber.email],
            subject: subject,
            html: emailHtml,
          });
        }

        if (emailResult.error) {
          console.error(`Failed to send to ${subscriber.email}:`, emailResult.error);
          failCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error(`Failed to send to ${subscriber.email}:`, err);
        failCount++;
      }
    }

    console.log(`Newsletter sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Newsletter sent to ${successCount} subscribers${failCount > 0 ? ` (${failCount} failed)` : ""}`,
        successCount,
        failCount
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending newsletter:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send newsletter" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
