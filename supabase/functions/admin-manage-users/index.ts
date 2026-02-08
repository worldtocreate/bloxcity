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

    const { action, targetUserId, role, email, requestId, forumUserId, requestType, approved, reason } = await req.json();

    // ========== SEND VERIFICATION REQUEST EMAIL ==========
    if (action === "send_verification_email") {
      if (!forumUserId || !requestType) {
        return new Response(
          JSON.stringify({ error: "forumUserId and requestType are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Sending verification email for ${requestType} to forum user ${forumUserId}`);

      // Get forum user details
      const { data: forumUser } = await supabaseAdmin
        .from("forum_users")
        .select("id, username, user_id")
        .eq("id", forumUserId)
        .single();

      if (!forumUser) {
        return new Response(
          JSON.stringify({ error: "Forum user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the user's email from auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
        forumUser.user_id
      );

      if (authError || !authUser?.user?.email) {
        return new Response(
          JSON.stringify({ error: "Could not find user email" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const checkmarkType = requestType === "gold" ? "Gold" : "Blue";
      const checkmarkEmoji = requestType === "gold" ? "👑" : "✓";
      const checkmarkColor = requestType === "gold" ? "#fbbf24" : "#3b82f6";

      let emailHtml = "";
      let subject = "";

      if (approved) {
        subject = `🎉 Your ${checkmarkType} Checkmark Request Has Been Approved!`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: #1a1a1d; border-radius: 12px; padding: 32px; }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 24px; font-weight: bold; color: #ffffff; margin: 0; }
              .content { color: #d1d5db; line-height: 1.6; }
              .badge { display: inline-flex; align-items: center; gap: 8px; background: ${requestType === "gold" ? "#422006" : "#1e3a5f"}; padding: 12px 20px; border-radius: 9999px; color: ${checkmarkColor}; font-size: 18px; font-weight: bold; margin: 16px 0; }
              .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
              .footer { color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">🎉 Congratulations!</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${forumUser.username}</strong>,</p>
                
                <p>Great news! Your request for a <strong>${checkmarkType} Checkmark</strong> has been approved!</p>
                
                <p style="text-align: center;">
                  <span class="badge">${checkmarkEmoji} ${checkmarkType} Verified</span>
                </p>
                
                <p>Your checkmark is now visible on your profile and next to your username across BLOX City.</p>
                
                <p style="text-align: center;">
                  <a href="https://bloxcity.lovable.app/user/${forumUser.username}" class="button">View Your Profile</a>
                </p>
              </div>
              
              <div class="footer">
                <p>Thank you for being a valued member of BLOX City!</p>
              </div>
            </div>
          </body>
          </html>
        `;
      } else {
        subject = `Update on Your ${checkmarkType} Checkmark Request`;
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: #1a1a1d; border-radius: 12px; padding: 32px; }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 24px; font-weight: bold; color: #ffffff; margin: 0; }
              .content { color: #d1d5db; line-height: 1.6; }
              .reason-box { background: #2d1f1f; border: 1px solid #7f1d1d; border-radius: 8px; padding: 16px; margin: 16px 0; }
              .footer { color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">Request Update</h1>
              </div>
              
              <div class="content">
                <p>Hi <strong>${forumUser.username}</strong>,</p>
                
                <p>We've reviewed your request for a <strong>${checkmarkType} Checkmark</strong>. Unfortunately, we're unable to approve it at this time.</p>
                
                <div class="reason-box">
                  <strong>Reason:</strong><br/>
                  ${reason || "Your request does not meet our current criteria for verification."}
                </div>
                
                <p>You may submit a new request in the future if your circumstances change.</p>
                
                <p>If you have any questions, please reach out to our support team.</p>
              </div>
              
              <div class="footer">
                <p>Thank you for your understanding.</p>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      // Send the email
      const emailResponse = await resend.emails.send({
        from: "BLOX City <verify@bloxcity.net>",
        to: [authUser.user.email],
        subject,
        html: emailHtml,
      });

      console.log("Verification email sent:", emailResponse);

      // Log the action
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: approved ? "approve_verification" : "deny_verification",
        target_type: "verification_request",
        target_id: forumUserId,
        details: { username: forumUser.username, requestType, approved, reason }
      });

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== SEND AFFILIATE EMAIL ==========
    if (action === "send_affiliate_email") {
      if (!requestId) {
        return new Response(
          JSON.stringify({ error: "Request ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Processing affiliate email for request: ${requestId}`);

      // Fetch the request
      const { data: requestData, error: requestError } = await supabaseAdmin
        .from("forum_affiliate_requests")
        .select("id, affiliate_user_id, gold_user_id, admin_approved, email_sent_at")
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        return new Response(
          JSON.stringify({ error: "Affiliate request not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!requestData.admin_approved) {
        return new Response(
          JSON.stringify({ error: "Request not yet approved by admin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get affiliate user details
      const { data: affiliateUser } = await supabaseAdmin
        .from("forum_users")
        .select("id, username, user_id")
        .eq("id", requestData.affiliate_user_id)
        .single();

      if (!affiliateUser) {
        return new Response(
          JSON.stringify({ error: "Affiliate user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the affiliate's email from auth.users
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(
        affiliateUser.user_id
      );

      if (authError || !authUser?.user?.email) {
        return new Response(
          JSON.stringify({ error: "Could not find user email" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get gold user details
      const { data: goldUser } = await supabaseAdmin
        .from("forum_users")
        .select("id, username")
        .eq("id", requestData.gold_user_id)
        .single();

      if (!goldUser) {
        return new Response(
          JSON.stringify({ error: "Gold user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Generate a unique token
      const emailToken = crypto.randomUUID();

      // Update the request with the token
      const { error: updateError } = await supabaseAdmin
        .from("forum_affiliate_requests")
        .update({
          email_token: emailToken,
          email_sent_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Failed to update request with token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Build the acceptance URL
      const baseUrl = "https://bloxcity.lovable.app";
      const acceptUrl = `${baseUrl}/accept-affiliate?token=${emailToken}`;

      // Send the email
      const emailResponse = await resend.emails.send({
        from: "BLOX City <verify@bloxcity.net>",
        to: [authUser.user.email],
        subject: `You've been invited to become an affiliate of @${goldUser.username}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 20px; }
              .container { max-width: 500px; margin: 0 auto; background: #1a1a1d; border-radius: 12px; padding: 32px; }
              .header { text-align: center; margin-bottom: 24px; }
              .title { font-size: 24px; font-weight: bold; color: #ffffff; margin: 0; }
              .subtitle { color: #9ca3af; margin-top: 8px; }
              .content { color: #d1d5db; line-height: 1.6; }
              .highlight { color: #fbbf24; font-weight: bold; }
              .button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 24px 0; }
              .footer { color: #6b7280; font-size: 12px; margin-top: 24px; text-align: center; }
              .badge { display: inline-flex; align-items: center; gap: 4px; background: #1e3a5f; padding: 4px 12px; border-radius: 9999px; color: #60a5fa; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 class="title">🎉 Affiliate Invitation</h1>
                <p class="subtitle">You've been selected!</p>
              </div>
              
              <div class="content">
                <p>Hi <strong>${affiliateUser.username}</strong>,</p>
                
                <p><span class="highlight">@${goldUser.username}</span> has invited you to become their affiliate on BLOX City.</p>
                
                <p>As an affiliate, you'll receive:</p>
                <ul>
                  <li>A <span class="badge">✓ Blue Checkmark</span> next to your username</li>
                  <li>Recognition as an official affiliate of @${goldUser.username}</li>
                </ul>
                
                <p style="text-align: center;">
                  <a href="${acceptUrl}" class="button">Accept Invitation</a>
                </p>
                
                <p style="font-size: 14px; color: #9ca3af;">If you don't want to become an affiliate, you can ignore this email.</p>
              </div>
              
              <div class="footer">
                <p>This email was sent by BLOX City. If you didn't expect this, please ignore it.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      console.log("Affiliate email sent successfully:", emailResponse);

      // Log the action
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: "send_affiliate_email",
        target_type: "affiliate_request",
        target_id: requestId,
        details: { affiliate_username: affiliateUser.username, gold_username: goldUser.username }
      });

      return new Response(
        JSON.stringify({ success: true, message: "Affiliate email sent successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ACCEPT AFFILIATE (public action - no auth required for token-based) ==========
    if (action === "accept_affiliate") {
      const token = requestId; // Token is passed as requestId from frontend
      
      if (!token) {
        return new Response(
          JSON.stringify({ error: "Token is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Processing affiliate acceptance for token: ${token}`);

      const { data: requestData, error: requestError } = await supabaseAdmin
        .from("forum_affiliate_requests")
        .select("id, affiliate_user_id, gold_user_id, admin_approved, user_accepted, status")
        .eq("email_token", token)
        .single();

      if (requestError || !requestData) {
        return new Response(
          JSON.stringify({ error: "Invalid or expired token" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (requestData.status === "accepted") {
        return new Response(
          JSON.stringify({ success: true, alreadyAccepted: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!requestData.admin_approved) {
        return new Response(
          JSON.stringify({ error: "Request not yet approved by admin" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update request
      await supabaseAdmin
        .from("forum_affiliate_requests")
        .update({
          user_accepted: true,
          user_accepted_at: new Date().toISOString(),
          status: "accepted",
        })
        .eq("id", requestData.id);

      // Create affiliate relationship
      await supabaseAdmin
        .from("forum_affiliates")
        .insert({
          gold_user_id: requestData.gold_user_id,
          affiliate_user_id: requestData.affiliate_user_id,
        });

      console.log("Affiliate accepted successfully");

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // ========== UPDATE USER EMAIL ==========
    if (action === "update_email") {
      const { newEmail } = await req.json().catch(() => ({}));
      
      if (!forumUserId || !newEmail) {
        return new Response(
          JSON.stringify({ error: "forumUserId and newEmail are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Admin updating email for forum user ${forumUserId} to ${newEmail}`);

      // Get forum user's auth user_id
      const { data: forumUser } = await supabaseAdmin
        .from("forum_users")
        .select("id, username, user_id")
        .eq("id", forumUserId)
        .single();

      if (!forumUser || !forumUser.user_id) {
        return new Response(
          JSON.stringify({ error: "Forum user not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update email in auth.users
      const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        forumUser.user_id,
        { email: newEmail, email_confirm: true }
      );

      if (updateError) {
        console.error("Failed to update auth email:", updateError);
        return new Response(
          JSON.stringify({ error: updateError.message || "Failed to update email" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Update email in profiles table
      await supabaseAdmin
        .from("profiles")
        .update({ email: newEmail.toLowerCase().trim() })
        .eq("user_id", forumUser.user_id);

      // Log the action
      await supabaseAdmin.from("admin_activity_logs").insert({
        admin_user_id: user.id,
        admin_email: user.email,
        action: "update_user_email",
        target_type: "forum_user",
        target_id: forumUserId,
        details: { username: forumUser.username, new_email: newEmail }
      });

      console.log(`Email updated successfully for ${forumUser.username}`);

      return new Response(
        JSON.stringify({ success: true, message: "Email updated successfully" }),
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