import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Click to Rwanda emergency contact email - UPDATE THIS
const EMERGENCY_EMAIL = "emergency@clicktorwanda.com";

interface SOSAlertRequest {
  latitude: number | null;
  longitude: number | null;
  locationAvailable: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { latitude, longitude, locationAvailable }: SOSAlertRequest = await req.json();

    // Get user's name from metadata
    const userName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.email?.split('@')[0] || 
                     'Unknown User';
    
    const userEmail = user.email || 'No email provided';
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Africa/Kigali',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    // Create Google Maps link if coordinates available
    const locationInfo = locationAvailable && latitude && longitude
      ? `<p><strong>📍 Location:</strong> <a href="https://www.google.com/maps?q=${latitude},${longitude}" style="color: #dc2626;">View on Google Maps</a></p>
         <p><strong>Coordinates:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>`
      : `<p><strong>📍 Location:</strong> <span style="color: #dc2626;">Location unavailable - user may have denied permission</span></p>`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>🚨 EMERGENCY SOS ALERT</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY SOS ALERT 🚨</h1>
        </div>
        
        <div style="background-color: white; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; color: #dc2626; font-weight: bold; margin-top: 0;">
            A traveler has activated the emergency SOS button!
          </p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">👤 Traveler Information</h2>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #dc2626;">${userEmail}</a></p>
            <p><strong>User ID:</strong> ${user.id}</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">📍 Location Details</h2>
            ${locationInfo}
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">🕐 Alert Time</h2>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
          </div>
          
          <div style="background-color: #991b1b; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-weight: bold;">⚠️ IMMEDIATE ACTION REQUIRED ⚠️</p>
            <p style="margin: 10px 0 0 0;">Please contact this traveler immediately to assess the emergency situation.</p>
          </div>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated emergency alert from Click to Rwanda
        </p>
      </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Click to Rwanda Emergency <onboarding@resend.dev>",
      to: [EMERGENCY_EMAIL],
      subject: `🚨 EMERGENCY SOS ALERT - ${userName}`,
      html: emailHtml,
    });

    console.log("SOS Alert email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "SOS alert sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-sos-alert function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
