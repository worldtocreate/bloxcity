import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, is_active, unsubscribe_token")
      .eq("email", email.toLowerCase().trim())
      .single();

    let unsubscribeToken: string;

    if (existing) {
      if (existing.is_active) {
        return new Response(
          JSON.stringify({ error: "This email is already subscribed!" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      // Reactivate subscription
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({ is_active: true })
        .eq("id", existing.id);

      if (updateError) throw updateError;
      unsubscribeToken = existing.unsubscribe_token;
    } else {
      // Create new subscription
      const { data: newSub, error: insertError } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.toLowerCase().trim() })
        .select("unsubscribe_token")
        .single();

      if (insertError) throw insertError;
      unsubscribeToken = newSub.unsubscribe_token;
    }

    // Send confirmation email
    const unsubscribeUrl = `https://bloxcity.net/newsletter/unsubscribe?token=${unsubscribeToken}`;
    
    // Try primary domain first, fallback to Resend test domain
    let emailResult;
    try {
      emailResult = await resend.emails.send({
        from: "BLOX City <noreply@bloxcity.net>",
        to: [email],
        subject: "Welcome to the BLOX City Newsletter! 🎉",
        html: `
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
                        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Est. March 2016</p>
                      </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">You're Subscribed! 🎮</h2>
                        <p style="margin: 0 0 20px; color: #b0b0b0; font-size: 16px; line-height: 1.6;">
                          Thank you for subscribing to the BLOX City newsletter! You'll be the first to know about:
                        </p>
                        <ul style="margin: 0 0 20px; padding-left: 20px; color: #b0b0b0; font-size: 16px; line-height: 1.8;">
                          <li>Launch updates and announcements</li>
                          <li>Development progress</li>
                          <li>Exclusive sneak peeks</li>
                          <li>Community events</li>
                        </ul>
                        <p style="margin: 0 0 30px; color: #b0b0b0; font-size: 16px; line-height: 1.6;">
                          We're working hard to bring back the classic BLOX City experience in 2026. Stay tuned!
                        </p>
                        <div style="text-align: center;">
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
        `,
      });
    } catch (primaryError) {
      console.log("Primary domain failed, trying fallback:", primaryError);
      emailResult = await resend.emails.send({
        from: "BLOX City <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to the BLOX City Newsletter! 🎉",
        html: `
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
                    <tr>
                      <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: bold;">BLOX City</h1>
                        <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Est. March 2016</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="margin: 0 0 20px; color: #ffffff; font-size: 24px;">You're Subscribed! 🎮</h2>
                        <p style="margin: 0 0 20px; color: #b0b0b0; font-size: 16px; line-height: 1.6;">
                          Thank you for subscribing to the BLOX City newsletter!
                        </p>
                        <p style="margin: 0; text-align: center;">
                          <a href="${unsubscribeUrl}" style="color: #888; font-size: 12px; text-decoration: underline;">Unsubscribe</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      });
    }

    if (emailResult.error) {
      console.error("Email send error:", emailResult.error);
    }

    console.log("Newsletter subscription successful for:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully subscribed!" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Newsletter subscribe error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to subscribe. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
