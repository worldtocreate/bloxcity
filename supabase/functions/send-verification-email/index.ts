import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ error: "Email is already verified" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a magic link for email verification
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email!,
      options: {
        redirectTo: 'https://bloxcity.lovable.app/forum'
      }
    });

    if (linkError) {
      console.error("Failed to generate link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate verification link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const verificationUrl = linkData.properties?.action_link || '';
    
    if (!verificationUrl) {
      console.error("No action link in response");
      return new Response(
        JSON.stringify({ error: "Failed to generate verification link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try sending from bloxcity.net first, fall back to resend test domain
    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: "BLOX City <noreply@bloxcity.net>",
        to: [user.email!],
        subject: "Verify your email - BLOX City Forum",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <img src="https://mmugfnagubtmxetcpjkb.supabase.co/storage/v1/object/public/email-assets/bloxcity-logo.jpg?v=1" alt="BLOX City" style="width: 64px; height: 64px; border-radius: 12px;">
                  <h1 style="margin: 20px 0 0; color: #1a1a1a; font-size: 24px;">Verify Your Email</h1>
                </div>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Thanks for joining the BLOX City community! Click the button below to verify your email address and unlock all forum features.
                </p>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #FF6B35 0%, #FF8C5A 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; text-align: center;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 30px; color: #999; font-size: 12px;">
                © 2026 BLOX City, Inc. All rights reserved.
              </div>
            </div>
          </body>
          </html>
        `,
      });
    } catch (sendError: any) {
      console.log("Primary domain failed, trying fallback:", sendError.message);
      // Fallback to Resend test domain
      emailResponse = await resend.emails.send({
        from: "BLOX City <onboarding@resend.dev>",
        to: [user.email!],
        subject: "Verify your email - BLOX City Forum",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="margin: 20px 0 0; color: #1a1a1a; font-size: 24px;">BLOX City - Verify Your Email</h1>
                </div>
                
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                  Thanks for joining the BLOX City community! Click the button below to verify your email address and unlock all forum features.
                </p>
                
                <div style="text-align: center; margin-bottom: 30px;">
                  <a href="${verificationUrl}" style="display: inline-block; background: #FF6B35; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Verify Email Address
                  </a>
                </div>
                
                <p style="color: #999; font-size: 14px; text-align: center;">
                  If you didn't create an account, you can safely ignore this email.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
    }

    console.log("Verification email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-verification-email:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send verification email" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
