import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

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

interface PackageEmailRequest {
  email: string;
  userName: string;
  packageTitle: string;
  packageContent: string;
  packageType: 'ai-planner' | 'itinerary';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting: max 5 emails per hour per user
    const supabaseAdmin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const isLimited = await checkRateLimit(supabaseAdmin, `email:${user.id}`, 3600000, 5);
    if (isLimited) {
      return new Response(JSON.stringify({ error: "Too many emails sent. Please wait before sending another." }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, userName, packageTitle, packageContent, packageType }: PackageEmailRequest = await req.json();

    if (!email || !userName || !packageTitle || !packageContent || !packageType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (packageTitle.length > 200 || packageContent.length > 50000) {
      return new Response(JSON.stringify({ error: "Content too long" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "";
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "A Click to Rwanda <onboarding@resend.dev>";
    const hasVerifiedDomain = !FROM_EMAIL.includes("resend.dev");
    // In test mode (resend.dev), send to ADMIN_EMAIL if valid, otherwise fall back to user's email
    const recipientEmail = hasVerifiedDomain ? email : (ADMIN_EMAIL && ADMIN_EMAIL.includes("@") ? ADMIN_EMAIL : email);
    
    if (!recipientEmail) {
      throw new Error("No recipient email configured.");
    }

    console.log(`Sending ${packageType} email to ${recipientEmail} for user ${user.id}${!hasVerifiedDomain ? ' (testing mode - admin only)' : ''}`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: `Your Rwanda ${packageType === 'ai-planner' ? 'Tour Package' : 'Itinerary'}: ${packageTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #145833 0%, #1a7a45 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0 0 10px 0; font-size: 28px; }
    .header p { margin: 0; opacity: 0.9; }
    .content { padding: 30px; }
    .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
    .package-box { background: #f8faf9; border: 2px solid #145833; border-radius: 12px; padding: 25px; margin: 20px 0; }
    .package-title { color: #145833; font-size: 20px; font-weight: bold; margin-bottom: 15px; }
    .package-content { white-space: pre-wrap; line-height: 1.8; color: #444; }
    .cta-section { background: #145833; color: white; padding: 25px; border-radius: 12px; margin-top: 25px; text-align: center; }
    .cta-section h3 { margin: 0 0 15px 0; }
    .cta-button { display: inline-block; background: white; color: #145833; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 5px; }
    .footer { text-align: center; padding: 25px; color: #666; border-top: 1px solid #eee; }
    .footer a { color: #145833; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇷🇼 A Click to Rwanda</h1>
      <p>Your Gateway to the Land of a Thousand Hills</p>
    </div>
    <div class="content">
      <p class="greeting">Hello ${userName}! 👋</p>
      <p>Great news! Your Rwanda ${packageType === 'ai-planner' ? 'tour package' : 'travel itinerary'} has been saved successfully. Here's a copy for your records:</p>
      
      <div class="package-box">
        <div class="package-title">📋 ${packageTitle}</div>
        <div class="package-content">${packageContent.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&lt;br&gt;/g, '<br>')}</div>
      </div>
      
      <div class="cta-section">
        <h3>Ready to Book Your Adventure?</h3>
        <a href="https://visitrwandabookings.rdb.rw/rdbportal/mountain-gorilla-tracking" class="cta-button">🦍 Gorilla Trekking</a>
        <a href="https://visitakagera.org/book-now/" class="cta-button">🦁 Akagera Safari</a>
        <a href="https://visitnyungwe.org/book-now/" class="cta-button">🐒 Nyungwe Forest</a>
      </div>
    </div>
    <div class="footer">
      <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      <p><a href="https://aclicktorwanda.com">A Click to Rwanda</a> - Discover Rwanda's Magic</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(error.message || "Failed to send email");
    }

    console.log("Email sent successfully:", data);

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});