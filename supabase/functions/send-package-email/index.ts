import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client to verify the user
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid or expired session" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { email, userName, packageTitle, packageContent, packageType }: PackageEmailRequest = await req.json();

    // Validate input
    if (!email || !userName || !packageTitle || !packageContent || !packageType) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate content lengths
    if (packageTitle.length > 200 || packageContent.length > 50000) {
      return new Response(JSON.stringify({ error: "Content too long" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Always send to the verified email address (Resend testing mode limitation)
    const verifiedEmail = "aclicktorwanda@gmail.com";
    console.log(`Sending ${packageType} email to ${verifiedEmail} for user ${user.id} (requested: ${email})`);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "A Click to Rwanda <onboarding@resend.dev>",
        to: [verifiedEmail],
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
      }),
    });

    const data = await response.json();
    console.log("Email sent:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to send email");
    }

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
