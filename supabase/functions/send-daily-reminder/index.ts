import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DailyReminderRequest {
  userId: string;
  userEmail: string;
  userName: string;
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

    // Verify user authentication
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

    const { userEmail, userName }: DailyReminderRequest = await req.json();

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log(`Checking for itinerary on ${todayStr} for user ${user.id}`);

    const { data: todayItems, error: fetchError } = await supabase
      .from('itineraries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', todayStr);

    if (fetchError) {
      console.error("Error fetching itinerary:", fetchError);
      throw fetchError;
    }

    if (!todayItems || todayItems.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No activities scheduled for today" 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch destinations and activities for the items
    const destinationIds = [...new Set(todayItems.map(i => i.destination_id))];
    const activityIds = todayItems.filter(i => i.activity_id).map(i => i.activity_id);
    const hotelIds = todayItems.filter(i => i.hotel_id).map(i => i.hotel_id);

    const [destinationsRes, activitiesRes, hotelsRes] = await Promise.all([
      supabase.from('destinations').select('*').in('id', destinationIds),
      activityIds.length > 0 
        ? supabase.from('activities').select('*').in('id', activityIds)
        : Promise.resolve({ data: [] }),
      hotelIds.length > 0 
        ? supabase.from('hotels').select('*').in('id', hotelIds)
        : Promise.resolve({ data: [] }),
    ]);

    const destinations = destinationsRes.data || [];
    const activities = activitiesRes.data || [];
    const hotels = hotelsRes.data || [];

    const scheduleItems = todayItems.map((item) => {
      const destination = destinations.find(d => d.id === item.destination_id);
      const activity = activities.find(a => a.id === item.activity_id);
      const hotel = hotels.find(h => h.id === item.hotel_id);

      return {
        destination: destination?.name || 'Unknown',
        activity: activity?.name || null,
        hotel: hotel?.name || null,
        isTransfer: item.day_type === 'transfer',
        times: {
          wake: item.wake_time,
          breakfast: item.breakfast_time,
          lunch: item.lunch_time,
          dinner: item.dinner_time,
        },
        notes: item.notes,
      };
    });

    const formattedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Determine recipient based on testing mode
    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "";
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "A Click to Rwanda <onboarding@resend.dev>";
    const isTestMode = FROM_EMAIL.includes("resend.dev");
    const recipientEmail = isTestMode ? (ADMIN_EMAIL && ADMIN_EMAIL.includes("@") ? ADMIN_EMAIL : userEmail) : userEmail;

    if (!recipientEmail) {
      throw new Error("No recipient email configured.");
    }

    if (isTestMode) {
      console.warn(`Resend test mode: sending to ${recipientEmail} instead of ${userEmail}`);
    }
    console.log(`Sending daily reminder to ${recipientEmail} for user ${user.id}`);

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [recipientEmail],
      subject: `🌅 Today's Rwanda Adventure - ${formattedDate}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #145833 0%, #1a7a45 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0 0 8px 0; font-size: 24px; }
    .header p { margin: 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 25px; }
    .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
    .schedule-card { background: #f8faf9; border-left: 4px solid #145833; border-radius: 8px; padding: 20px; margin: 15px 0; }
    .schedule-title { color: #145833; font-size: 18px; font-weight: bold; margin-bottom: 12px; }
    .time-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
    .time-item { background: white; padding: 10px; border-radius: 6px; text-align: center; }
    .time-label { font-size: 11px; color: #666; margin-bottom: 4px; }
    .time-value { font-size: 16px; font-weight: bold; color: #145833; }
    .activity-box { background: #e8f5e9; border: 1px solid #4caf50; border-radius: 8px; padding: 12px; margin: 12px 0; }
    .notes-box { background: #fff8e1; border: 1px solid #ffc107; border-radius: 8px; padding: 12px; margin-top: 12px; font-style: italic; }
    .footer { text-align: center; padding: 20px; color: #666; border-top: 1px solid #eee; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🇷🇼 Good Morning, ${userName}!</h1>
      <p>${formattedDate}</p>
    </div>
    <div class="content">
      <p class="greeting">Here's your schedule for today's adventure in Rwanda:</p>
      
      ${scheduleItems.map((item) => `
        <div class="schedule-card">
          <div class="schedule-title">
            ${item.isTransfer ? '🚗 Transfer Day' : '📍 ' + item.destination}
          </div>
          
          ${item.hotel ? `<p>🏨 <strong>Accommodation:</strong> ${item.hotel}</p>` : ''}
          
          ${item.activity ? `
            <div class="activity-box">
              <strong>🎯 Today's Activity:</strong><br>
              ${item.activity}
            </div>
          ` : ''}
          
          <div class="time-grid">
            ${item.times.wake ? `
              <div class="time-item">
                <div class="time-label">⏰ Wake Up</div>
                <div class="time-value">${item.times.wake}</div>
              </div>
            ` : ''}
            ${item.times.breakfast ? `
              <div class="time-item">
                <div class="time-label">🍳 Breakfast</div>
                <div class="time-value">${item.times.breakfast}</div>
              </div>
            ` : ''}
            ${item.times.lunch ? `
              <div class="time-item">
                <div class="time-label">🍽️ Lunch</div>
                <div class="time-value">${item.times.lunch}</div>
              </div>
            ` : ''}
            ${item.times.dinner ? `
              <div class="time-item">
                <div class="time-label">🍷 Dinner</div>
                <div class="time-value">${item.times.dinner}</div>
              </div>
            ` : ''}
          </div>
          
          ${item.notes ? `
            <div class="notes-box">
              📝 ${item.notes}
            </div>
          ` : ''}
        </div>
      `).join('')}
      
      <p style="margin-top: 20px; text-align: center; color: #666;">
        Have an amazing day exploring Rwanda! 🌄
      </p>
    </div>
    <div class="footer">
      <p>A Click to Rwanda - Your Gateway to the Land of a Thousand Hills</p>
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

    console.log("Daily reminder email sent:", data);

    return new Response(JSON.stringify({ 
      success: true, 
      data,
      itemsCount: todayItems.length 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending daily reminder:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});