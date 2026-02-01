import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_ACCOUNTS_PER_EMAIL = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, username, recaptchaToken, email } = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check email usage limit action
    if (action === 'check_email_limit') {
      if (!email || typeof email !== "string") {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Count how many accounts use this email
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        return new Response(
          JSON.stringify({ allowed: true, count: 0 }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const matchingUsers = authUsers.users.filter(
        (u) => u.email?.toLowerCase() === trimmedEmail
      );

      const count = matchingUsers.length;
      const allowed = count < MAX_ACCOUNTS_PER_EMAIL;

      return new Response(
        JSON.stringify({ allowed, count, max: MAX_ACCOUNTS_PER_EMAIL }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Username recovery action
    if (action === 'recover_username') {
      if (!email || typeof email !== "string") {
        return new Response(
          JSON.stringify({ error: "Email is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const trimmedEmail = email.trim().toLowerCase();

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (!resendApiKey) {
        console.error("RESEND_API_KEY not configured");
        return new Response(
          JSON.stringify({ error: "Email service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const resend = new Resend(resendApiKey);

      // Look up auth users by email
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Filter users matching this email
      const matchingAuthUsers = authUsers.users.filter(
        (u) => u.email?.toLowerCase() === trimmedEmail
      );

      if (matchingAuthUsers.length === 0) {
        console.log(`No users found for email: ${trimmedEmail}`);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get usernames from forum_users table
      const userIds = matchingAuthUsers.map((u) => u.id);
      const { data: forumUsers, error: forumError } = await supabaseAdmin
        .from("forum_users")
        .select("username")
        .in("user_id", userIds);

      if (forumError) {
        console.error("Error fetching forum users:", forumError);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const usernames = forumUsers?.map((u) => u.username) || [];

      if (usernames.length === 0) {
        console.log(`No forum usernames found for email: ${trimmedEmail}`);
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Send email with usernames
      const usernameList =
        usernames.length === 1
          ? `<strong>${usernames[0]}</strong>`
          : usernames.map((u) => `<li><strong>${u}</strong></li>`).join("");

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
            <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <h1 style="color: #18181b; font-size: 24px; margin: 0 0 16px;">Username Recovery</h1>
              <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                You requested to recover your username${usernames.length > 1 ? "s" : ""} for BLOX City. Here ${usernames.length > 1 ? "are the accounts" : "is the account"} associated with your email:
              </p>
              ${
                usernames.length === 1
                  ? `<p style="color: #18181b; font-size: 18px; background: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center;">${usernameList}</p>`
                  : `<ul style="color: #18181b; font-size: 16px; background: #f4f4f5; padding: 16px 16px 16px 32px; border-radius: 8px; margin: 0 0 24px;">${usernameList}</ul>`
              }
              <p style="color: #71717a; font-size: 14px; line-height: 1.5; margin: 24px 0 0;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0;">
              <p style="color: #a1a1aa; font-size: 12px; margin: 0; text-align: center;">
                BLOX City
              </p>
            </div>
          </body>
        </html>
      `;

      let emailResult;
      try {
        emailResult = await resend.emails.send({
          from: "BLOX City <noreply@bloxcity.net>",
          to: [trimmedEmail],
          subject: "Your BLOX City Username",
          html: htmlContent,
        });
      } catch (primaryError) {
        console.log("Primary domain failed, trying fallback:", primaryError);
        emailResult = await resend.emails.send({
          from: "BLOX City <onboarding@resend.dev>",
          to: [trimmedEmail],
          subject: "Your BLOX City Username",
          html: htmlContent,
        });
      }

      console.log("Username recovery email sent:", emailResult);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === 'verify') {
      // Verify reCAPTCHA
      const recaptchaSecret = Deno.env.get('RECAPTCHA_SECRET_KEY');
      
      if (recaptchaSecret && recaptchaToken) {
        const recaptchaResponse = await fetch(
          `https://www.google.com/recaptcha/api/siteverify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${recaptchaSecret}&response=${recaptchaToken}`
          }
        );

        const recaptchaResult = await recaptchaResponse.json();
        
        if (!recaptchaResult.success || recaptchaResult.score < 0.5) {
          return new Response(
            JSON.stringify({ error: 'reCAPTCHA verification failed. Please try again.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Check email limit if email is provided
      if (email) {
        const trimmedEmail = email.trim().toLowerCase();
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        
        if (authUsers) {
          const matchingUsers = authUsers.users.filter(
            (u) => u.email?.toLowerCase() === trimmedEmail
          );
          
          if (matchingUsers.length >= MAX_ACCOUNTS_PER_EMAIL) {
            return new Response(
              JSON.stringify({ error: 'Email usage limit exceeded. You can only create up to 5 accounts with the same email.' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }

      // Check username availability
      if (username) {
        const { data: existingUser } = await supabaseAdmin
          .from('forum_users')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (existingUser) {
          return new Response(
            JSON.stringify({ error: 'Username is already taken' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Check for profanity in username
        const profanityCheck = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/forum-check-profanity`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
            },
            body: JSON.stringify({ content: username })
          }
        );

        const profanityResult = await profanityCheck.json();
        if (profanityResult.hasProfanity) {
          return new Response(
            JSON.stringify({ error: 'Username contains inappropriate content' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in forum-register:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
