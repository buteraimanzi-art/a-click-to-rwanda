import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode as base64Decode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email - always works in testing mode (Resend account owner)
const ADMIN_EMAIL = "buteraimanzi@gmail.com";
// Emergency contact - configurable, defaults to admin
const EMERGENCY_EMAIL = Deno.env.get("EMERGENCY_CONTACT_EMAIL") || ADMIN_EMAIL;
// From email - use verified domain in production
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Click to Rwanda Emergency <onboarding@resend.dev>";

interface SOSAlertRequest {
  latitude: number | null;
  longitude: number | null;
  locationAvailable: boolean;
  phoneNumber: string;
  description: string;
  voiceRecording: string | null; // base64 encoded audio
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

    const { 
      latitude, 
      longitude, 
      locationAvailable,
      phoneNumber,
      description,
      voiceRecording
    }: SOSAlertRequest = await req.json();

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

    // Emergency description section
    const descriptionSection = description 
      ? `<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <h2 style="margin-top: 0; color: #991b1b;">📝 Emergency Description</h2>
           <p style="white-space: pre-wrap; margin: 0;">${description}</p>
         </div>`
      : '';

    // Voice recording note
    const voiceNote = voiceRecording 
      ? `<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <h2 style="margin-top: 0; color: #991b1b;">🎤 Voice Recording</h2>
           <p>A voice recording is attached to this email. Please listen to it for details about the emergency.</p>
         </div>`
      : '';

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
            <p><strong>📞 Phone:</strong> <a href="tel:${phoneNumber}" style="color: #dc2626; font-size: 18px; font-weight: bold;">${phoneNumber}</a></p>
            <p><strong>User ID:</strong> ${user.id}</p>
          </div>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">📍 Location Details</h2>
            ${locationInfo}
          </div>

          ${descriptionSection}
          ${voiceNote}
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">🕐 Alert Time</h2>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
          </div>
          
          <div style="background-color: #991b1b; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-weight: bold;">⚠️ IMMEDIATE ACTION REQUIRED ⚠️</p>
            <p style="margin: 10px 0 0 0;">Please contact this traveler immediately at <a href="tel:${phoneNumber}" style="color: white; font-weight: bold;">${phoneNumber}</a></p>
          </div>
        </div>
        
        <p style="text-align: center; color: #666; font-size: 12px; margin-top: 20px;">
          This is an automated emergency alert from Click to Rwanda
        </p>
      </body>
      </html>
    `;

    // Prepare attachments if voice recording exists
    const attachments = [];
    if (voiceRecording) {
      try {
        const audioBuffer = base64Decode(voiceRecording);
        attachments.push({
          filename: `sos-voice-recording-${Date.now()}.webm`,
          content: audioBuffer,
        });
      } catch (e) {
        console.error("Error processing voice recording:", e);
      }
    }

    const emailPayload: any = {
      from: FROM_EMAIL,
      to: [EMERGENCY_EMAIL],
      subject: `🚨 EMERGENCY SOS ALERT - ${userName} - ${phoneNumber}`,
      html: emailHtml,
    };

    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    const emailResponse = await resend.emails.send(emailPayload);

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
