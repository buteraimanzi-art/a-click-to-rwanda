import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Rate limit helper
async function checkRateLimit(supabaseAdmin: any, key: string, windowMs: number, maxRequests: number): Promise<boolean> {
  await supabaseAdmin.from("rate_limits").delete().lt("expires_at", new Date().toISOString());
  const { data } = await supabaseAdmin.from("rate_limits").select("id").eq("key", key).gte("expires_at", new Date().toISOString());
  if (data && data.length >= maxRequests) return true;
  await supabaseAdmin.from("rate_limits").insert({ key, expires_at: new Date(Date.now() + windowMs).toISOString() });
  return false;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const ADMIN_EMAIL = "buteraimanzi@gmail.com";
    const EMERGENCY_EMAIL = ADMIN_EMAIL;
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Click to Rwanda Emergency <onboarding@resend.dev>";

    if (!EMERGENCY_EMAIL) {
      throw new Error("No emergency email configured. Set ADMIN_EMAIL or EMERGENCY_CONTACT_EMAIL.");
    }

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

    // Rate limiting: max 3 SOS alerts per hour per user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const isLimited = await checkRateLimit(supabaseAdmin, `sos:${user.id}`, 3600000, 3);
    if (isLimited) {
      return new Response(
        JSON.stringify({ error: "Too many SOS alerts. Please wait before sending another." }),
        { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawBody = await req.json();

    // Validate inputs
    const phoneNumber = String(rawBody.phoneNumber || "").trim();
    const description = String(rawBody.description || "").trim();
    const latitude = rawBody.latitude != null ? Number(rawBody.latitude) : null;
    const longitude = rawBody.longitude != null ? Number(rawBody.longitude) : null;
    const locationAvailable = !!rawBody.locationAvailable;
    const voiceRecording = rawBody.voiceRecording ? String(rawBody.voiceRecording) : null;

    // Phone number validation
    const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (description.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Description must be under 2000 characters" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (latitude !== null && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
      return new Response(
        JSON.stringify({ error: "Invalid latitude" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    if (longitude !== null && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
      return new Response(
        JSON.stringify({ error: "Invalid longitude" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown User';
    const userEmail = user.email || 'No email provided';
    const timestamp = new Date().toLocaleString('en-US', { 
      timeZone: 'Africa/Kigali', dateStyle: 'full', timeStyle: 'long'
    });

    await supabaseAdmin.from("sos_alerts").insert({
      user_id: user.id,
      user_email: userEmail,
      phone_number: phoneNumber,
      description: description || null,
      latitude: latitude || null,
      longitude: longitude || null,
      has_voice_recording: !!voiceRecording,
      status: "pending",
    });

    // Build email
    const locationInfo = locationAvailable && latitude && longitude
      ? `<p><strong>📍 Location:</strong> <a href="https://www.google.com/maps?q=${latitude},${longitude}" style="color: #dc2626;">View on Google Maps</a></p>
         <p><strong>Coordinates:</strong> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>`
      : `<p><strong>📍 Location:</strong> <span style="color: #dc2626;">Location unavailable</span></p>`;

    const descriptionSection = description 
      ? `<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <h2 style="margin-top: 0; color: #991b1b;">📝 Emergency Description</h2>
           <p style="white-space: pre-wrap; margin: 0;">${description}</p>
         </div>` : '';

    const voiceNote = voiceRecording 
      ? `<div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
           <h2 style="margin-top: 0; color: #991b1b;">🎤 Voice Recording</h2>
           <p>A voice recording is attached to this email.</p>
         </div>` : '';

    const emailHtml = `
      <!DOCTYPE html><html><body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fef2f2;">
        <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚨 EMERGENCY SOS ALERT 🚨</h1>
        </div>
        <div style="background-color: white; padding: 30px; border: 2px solid #dc2626; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="font-size: 18px; color: #dc2626; font-weight: bold; margin-top: 0;">A traveler has activated the emergency SOS button!</p>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">👤 Traveler Information</h2>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Email:</strong> <a href="mailto:${userEmail}" style="color: #dc2626;">${userEmail}</a></p>
            <p><strong>📞 Phone:</strong> <a href="tel:${phoneNumber}" style="color: #dc2626; font-size: 18px; font-weight: bold;">${phoneNumber}</a></p>
          </div>
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">📍 Location Details</h2>
            ${locationInfo}
          </div>
          ${descriptionSection}${voiceNote}
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #991b1b;">🕐 Alert Time</h2>
            <p><strong>Timestamp:</strong> ${timestamp}</p>
          </div>
          <div style="background-color: #991b1b; color: white; padding: 15px; border-radius: 8px; text-align: center; margin-top: 20px;">
            <p style="margin: 0; font-weight: bold;">⚠️ IMMEDIATE ACTION REQUIRED ⚠️</p>
            <p style="margin: 10px 0 0 0;">Please contact this traveler immediately at <a href="tel:${phoneNumber}" style="color: white; font-weight: bold;">${phoneNumber}</a></p>
          </div>
        </div>
      </body></html>`;

    const attachments: any[] = [];
    if (voiceRecording) {
      try {
        attachments.push({
          filename: `sos-voice-recording-${Date.now()}.webm`,
          content: voiceRecording,
          content_type: 'audio/webm',
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
    if (attachments.length > 0) emailPayload.attachments = attachments;

    const { data: emailData, error: emailError } = await resend.emails.send(emailPayload);
    
    if (emailError) {
      console.error("Resend error:", emailError);
      throw new Error(emailError.message || "Failed to send SOS alert email");
    }

    console.log("SOS Alert email sent:", emailData);

    return new Response(
      JSON.stringify({ success: true, message: "SOS alert sent successfully" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-sos-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);