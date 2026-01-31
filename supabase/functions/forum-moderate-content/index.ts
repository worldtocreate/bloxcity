import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ModerateRequest {
  action: "delete" | "restore";
  targetType: "post" | "thread";
  targetId: string;
  reason?: string;
}

async function sendDeletionNotification(
  email: string, 
  username: string, 
  contentType: string, 
  contentTitle: string,
  reason: string
): Promise<boolean> {
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
              <tr>
                <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">BLOX City Forum</h1>
                  <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Content Moderation Notice</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="color: #ffffff; font-size: 16px; margin: 0 0 20px;">Hi ${username},</p>
                  <p style="color: #b0b0b0; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    We're writing to inform you that your ${contentType} has been removed by our moderation team.
                  </p>
                  
                  <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="color: #ffffff; font-size: 14px; margin: 0 0 10px;"><strong>Content:</strong> ${contentTitle}</p>
                    <p style="color: #b0b0b0; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${reason}</p>
                  </div>
                  
                  <p style="color: #b0b0b0; font-size: 14px; line-height: 1.6; margin: 20px 0 0;">
                    If you believe this was done in error, please contact our support team. Repeated violations may result in account suspension.
                  </p>
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
        from: "BLOX City Moderation <noreply@bloxcity.net>",
        to: [email],
        subject: `Your ${contentType} has been removed - BLOX City Forum`,
        html: emailHtml,
      });
    } catch {
      result = await resend.emails.send({
        from: "BLOX City Moderation <onboarding@resend.dev>",
        to: [email],
        subject: `Your ${contentType} has been removed - BLOX City Forum`,
        html: emailHtml,
      });
    }
    return !result.error;
  } catch (err) {
    console.error("Failed to send moderation email:", err);
    return false;
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

    // Check if user is admin or moderator
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    const { data: isModerator } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "moderator",
    });

    if (!isAdmin && !isModerator) {
      return new Response(
        JSON.stringify({ error: "Not authorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, targetType, targetId, reason }: ModerateRequest = await req.json();

    if (!action || !targetType || !targetId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const table = targetType === "post" ? "forum_posts" : "forum_threads";
    
    if (action === "delete") {
      // Get content info before deleting
      const { data: content } = await supabaseAdmin
        .from(table)
        .select('*, author:author_id (id, user_id, username)')
        .eq('id', targetId)
        .single();

      if (!content) {
        return new Response(
          JSON.stringify({ error: "Content not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Soft delete
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
          deletion_reason: reason || "Violation of community guidelines"
        })
        .eq('id', targetId);

      if (updateError) {
        console.error("Delete error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to delete content" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log moderation action
      await supabaseAdmin
        .from('forum_moderation_logs')
        .insert({
          moderator_id: user.id,
          target_type: targetType,
          target_id: targetId,
          action: 'delete',
          reason: reason || "Violation of community guidelines"
        });

      // Get author's email and send notification
      if (content.author) {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        const authorAuth = authUsers?.users?.find(u => u.id === content.author.user_id);
        
        if (authorAuth?.email) {
          const contentTitle = targetType === 'thread' 
            ? (content as any).title 
            : `Reply in thread`;
          
          await sendDeletionNotification(
            authorAuth.email,
            content.author.username,
            targetType,
            contentTitle,
            reason || "Violation of community guidelines"
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: `${targetType} deleted successfully` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "restore") {
      const { error: updateError } = await supabaseAdmin
        .from(table)
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          deletion_reason: null
        })
        .eq('id', targetId);

      if (updateError) {
        console.error("Restore error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to restore content" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log moderation action
      await supabaseAdmin
        .from('forum_moderation_logs')
        .insert({
          moderator_id: user.id,
          target_type: targetType,
          target_id: targetId,
          action: 'restore',
          reason: 'Restored by moderator'
        });

      return new Response(
        JSON.stringify({ success: true, message: `${targetType} restored successfully` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in moderation:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
