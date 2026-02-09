import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestId = crypto.randomUUID();

    // Verify admin authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user and check admin role
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claims?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claims.claims.sub;

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: userId,
      _role: 'admin'
    });

    if (roleError || !hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { reservationId, status, denialReason } = await req.json();

    if (!reservationId || typeof reservationId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Reservation ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!status || !['approved', 'denied'].includes(status)) {
      return new Response(
        JSON.stringify({ error: 'Status must be "approved" or "denied"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the reservation details
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reserved_usernames')
      .select('*')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      console.error(`[${requestId}] Fetch error:`, fetchError);
      return new Response(
        JSON.stringify({ error: 'Reservation not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the reservation status
    const updateData: { status: string; denial_reason?: string } = { status };
    if (status === 'denied' && denialReason) {
      updateData.denial_reason = denialReason;
    }

    const { error: updateError } = await supabaseAdmin
      .from('reserved_usernames')
      .update(updateData)
      .eq('id', reservationId);

    if (updateError) {
      console.error(`[${requestId}] Update error:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update reservation status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the admin activity
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single();

    await supabaseAdmin.from('admin_activity_logs').insert({
      admin_user_id: userId,
      admin_email: adminProfile?.email,
      action: status === 'approved' ? 'approve_reservation' : 'deny_reservation',
      target_type: 'reservation',
      target_id: reservationId,
      details: { username: reservation.username, denial_reason: denialReason }
    });

    console.log(`[${requestId}] Reservation ${reservationId} updated to ${status} by admin ${userId}`);

    // Send email notification
    let emailSent = false;
    const fromPrimary = 'BLOX City <noreply@bloxcity.net>';
    const fromFallback = 'BLOX City <onboarding@resend.dev>';

    try {
      let emailHtml = '';
      let emailSubject = '';

      if (status === 'approved') {
        emailSubject = 'Your BLOX City Username Has Been Approved! 🎉';
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f8f9fa; color: #2d3748; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2d3748; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">BLOX City</h1>
                <p style="color: #718096; font-size: 14px; margin-top: 5px; font-weight: 500;">Est. March 2016</p>
              </div>
              
              <h2 style="color: #059669; font-size: 24px; margin-bottom: 20px; text-align: center; font-weight: 700;">Username Approved! 🎉</h2>
              
              <p style="color: #718096; font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: center;">
                Great news! Your username has been approved:
              </p>
              
              <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <span style="color: #059669; font-size: 24px; font-weight: bold;">${reservation.username}</span>
              </div>
              
              <div style="background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <p style="color: #d97706; font-size: 16px; font-weight: 700; margin: 0 0 10px 0; text-align: center;">⚠️ KEEP THIS CODE SAFE!</p>
                <p style="color: #718096; font-size: 14px; margin: 0 0 15px 0; text-align: center;">You'll need this reservation code to claim your username when BLOX City launches:</p>
                <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center;">
                  <code style="color: #2d3748; font-size: 28px; font-weight: 700; letter-spacing: 0.1em; font-family: 'Courier New', monospace;">${reservation.reservation_code}</code>
                </div>
                <p style="color: #dc2626; font-size: 13px; margin-top: 12px; text-align: center; font-weight: 500;">Write it down or take a screenshot. This code will not be shown again.</p>
              </div>
              
              <p style="color: #718096; font-size: 14px; line-height: 1.6; margin-bottom: 25px; text-align: center;">
                Keep this email safe! You'll need your reservation code when we launch in <strong style="color: #4a7cc9;">2026</strong>.
              </p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
                © 2026 BLOX City, Inc. All rights reserved.<br>
                <a href="https://bloxcity.net" style="color: #4a7cc9; text-decoration: none; font-weight: 600;">bloxcity.net</a>
              </p>
            </div>
          </body>
          </html>
        `;
      } else {
        // Denied
        emailSubject = 'BLOX City Username Reservation Update';
        const reasonText = denialReason ? `<p style="color: #991b1b; font-size: 14px; margin-top: 10px; text-align: center;"><strong>Reason:</strong> ${denialReason}</p>` : '';
        emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #f8f9fa; color: #2d3748; padding: 40px 20px; margin: 0;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2d3748; font-size: 32px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">BLOX City</h1>
                <p style="color: #718096; font-size: 14px; margin-top: 5px; font-weight: 500;">Est. March 2016</p>
              </div>
              
              <h2 style="color: #dc2626; font-size: 24px; margin-bottom: 20px; text-align: center; font-weight: 700;">Username Not Approved</h2>
              
              <p style="color: #718096; font-size: 16px; line-height: 1.8; margin-bottom: 20px; text-align: center;">
                Unfortunately, the following username was not approved:
              </p>
              
              <div style="background: #fef2f2; border: 1px solid #ef4444; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 25px;">
                <span style="color: #dc2626; font-size: 24px; font-weight: bold;">${reservation.username}</span>
                ${reasonText}
              </div>
              
              <div style="background: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <p style="color: #4a5568; font-size: 14px; margin: 0; text-align: center;">
                  Don't worry! You can request a different username by visiting <a href="https://bloxcity.net" style="color: #4a7cc9; text-decoration: none; font-weight: 600;">bloxcity.net</a> and submitting a new reservation.
                </p>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
                © 2026 BLOX City, Inc. All rights reserved.<br>
                <a href="https://bloxcity.net" style="color: #4a7cc9; text-decoration: none; font-weight: 600;">bloxcity.net</a>
              </p>
            </div>
          </body>
          </html>
        `;
      }

      const primaryResponse = await resend.emails.send({
        from: fromPrimary,
        to: [reservation.email],
        subject: emailSubject,
        html: emailHtml,
      });

      if ((primaryResponse as any)?.error) {
        console.error(`[${requestId}] Email send error (primary):`, (primaryResponse as any).error);

        // Try fallback sender
        const fallbackResponse = await resend.emails.send({
          from: fromFallback,
          to: [reservation.email],
          subject: emailSubject,
          html: emailHtml,
        });

        if ((fallbackResponse as any)?.error) {
          console.error(`[${requestId}] Email send error (fallback):`, (fallbackResponse as any).error);
        } else {
          emailSent = true;
          console.log(`[${requestId}] ${status} email sent to ${reservation.email} (fallback sender)`);
        }
      } else {
        emailSent = true;
        console.log(`[${requestId}] ${status} email sent to ${reservation.email} (primary sender)`);
      }
    } catch (emailErr) {
      console.error(`[${requestId}] Email send exception:`, emailErr);
    }

    // If denied, also delete the reservation so the user can reserve again
    if (status === 'denied') {
      const { error: deleteError } = await supabaseAdmin
        .from('reserved_usernames')
        .delete()
        .eq('id', reservationId);

      if (deleteError) {
        console.error(`[${requestId}] Delete error after denial:`, deleteError);
      } else {
        console.log(`[${requestId}] Reservation ${reservationId} deleted after denial`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        status,
        emailSent,
        message: `Reservation ${status}. ${emailSent ? 'Email sent to user.' : 'Email could not be sent.'}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
