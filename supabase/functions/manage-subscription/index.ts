import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin email - always has free access
const ADMIN_EMAIL = "buteraimanzi@gmail.com";
const STAFF_DOMAIN = "@aclicktorwanda.com";

// Check if user is staff
const isStaffUser = (email: string | undefined): boolean => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase() || 
         email.toLowerCase().endsWith(STAFF_DOMAIN);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user with anon client
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // Use service role for database operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // ========== STAFF ACTIONS ==========
    if (action === "staff_update") {
      // Staff can update any subscription status
      if (!isStaffUser(user.email)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Staff access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { subscription_id, new_status } = body;
      
      if (!subscription_id || !new_status) {
        return new Response(
          JSON.stringify({ error: "subscription_id and new_status are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabaseAdmin
        .from("subscriptions")
        .update({ status: new_status })
        .eq("id", subscription_id);

      if (updateError) {
        console.error("Error updating subscription:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Staff ${user.email} updated subscription ${subscription_id} to ${new_status}`);

      return new Response(
        JSON.stringify({ success: true, message: "Subscription updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "staff_delete") {
      // Staff can delete subscriptions
      if (!isStaffUser(user.email)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Staff access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { subscription_id } = body;
      
      if (!subscription_id) {
        return new Response(
          JSON.stringify({ error: "subscription_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: deleteError } = await supabaseAdmin
        .from("subscriptions")
        .delete()
        .eq("id", subscription_id);

      if (deleteError) {
        console.error("Error deleting subscription:", deleteError);
        return new Response(
          JSON.stringify({ error: "Failed to delete subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Staff ${user.email} deleted subscription ${subscription_id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Subscription deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "staff_create") {
      // Staff can create subscriptions for any user
      if (!isStaffUser(user.email)) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Staff access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { target_user_id, payment_reference } = body;
      
      if (!target_user_id) {
        return new Response(
          JSON.stringify({ error: "target_user_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if subscription already exists
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", target_user_id)
        .maybeSingle();

      if (existing) {
        // Update existing subscription
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ 
            status: "active", 
            payment_reference: payment_reference || "STAFF_CREATED",
            payment_method: "staff_manual"
          })
          .eq("user_id", target_user_id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabaseAdmin
          .from("subscriptions")
          .insert({
            user_id: target_user_id,
            payment_method: "staff_manual",
            payment_reference: payment_reference || "STAFF_CREATED",
            amount: 50.00,
            status: "active"
          });

        if (insertError) {
          console.error("Error creating subscription:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log(`Staff ${user.email} created subscription for user ${target_user_id}`);

      return new Response(
        JSON.stringify({ success: true, message: "Subscription created" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== USER ACTIONS ==========
    if (action === "check") {
      // Check if user is admin (always has access)
      if (user.email === ADMIN_EMAIL) {
        return new Response(
          JSON.stringify({ 
            hasSubscription: true, 
            isAdmin: true,
            message: "Admin account - full access" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check for active subscription
      const { data: subscription, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
        console.error("Error checking subscription:", error);
        return new Response(
          JSON.stringify({ error: "Failed to check subscription" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          hasSubscription: !!subscription,
          subscription: subscription,
          isAdmin: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "activate") {
      // Activate subscription after PayPal payment
      const { payment_reference } = body;
      
      if (!payment_reference) {
        return new Response(
          JSON.stringify({ error: "Payment reference required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if subscription already exists
      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        // Update existing subscription
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ 
            status: "active", 
            payment_reference,
            payment_method: "paypal"
          })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating subscription:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        // Create new subscription
        const { error: insertError } = await supabaseAdmin
          .from("subscriptions")
          .insert({
            user_id: user.id,
            payment_method: "paypal",
            payment_reference,
            amount: 50.00,
            status: "active"
          });

        if (insertError) {
          console.error("Error creating subscription:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      console.log(`Subscription activated for user ${user.id} with reference ${payment_reference}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Subscription activated successfully" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Subscription error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
