import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Database-backed staff check
async function checkIsStaff(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("is_staff", { _user_id: userId });
  if (error) {
    console.error("Error checking staff role:", error);
    return false;
  }
  return data === true;
}

// Database-backed admin check
async function checkIsAdmin(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (error) {
    console.error("Error checking admin role:", error);
    return false;
  }
  return data === true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Audit logger helper
    const logAudit = async (action: string, entityId?: string, changes?: any) => {
      await supabaseAdmin.from("staff_audit_log").insert({
        staff_user_id: user.id,
        action,
        entity_type: "subscription",
        entity_id: entityId || null,
        changes: changes || null,
      });
    };

    // ========== STAFF ACTIONS ==========
    if (action === "staff_update") {
      if (!(await checkIsStaff(supabaseAdmin, user.id))) {
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

      await logAudit("staff_update", subscription_id, { new_status });
      return new Response(
        JSON.stringify({ success: true, message: "Subscription updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "staff_delete") {
      if (!(await checkIsStaff(supabaseAdmin, user.id))) {
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

      await logAudit("staff_delete", subscription_id);
      return new Response(
        JSON.stringify({ success: true, message: "Subscription deleted" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "staff_create") {
      if (!(await checkIsStaff(supabaseAdmin, user.id))) {
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

      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", target_user_id)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ 
            status: "active", 
            payment_reference: payment_reference || "STAFF_CREATED",
            payment_method: "staff_manual"
          })
          .eq("user_id", target_user_id);
        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
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
          return new Response(
            JSON.stringify({ error: "Failed to create subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      await logAudit("staff_create", target_user_id, { payment_reference: payment_reference || "STAFF_CREATED" });
      return new Response(
        JSON.stringify({ success: true, message: "Subscription created" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== USER ACTIONS ==========
    if (action === "check") {
      // Check if user is admin (always has access)
      const isAdmin = await checkIsAdmin(supabaseAdmin, user.id);
      if (isAdmin) {
        return new Response(
          JSON.stringify({ 
            hasSubscription: true, 
            isAdmin: true,
            message: "Admin account - full access" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: subscription, error } = await supabaseAdmin
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (error) {
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
      const { payment_reference } = body;
      if (!payment_reference) {
        return new Response(
          JSON.stringify({ error: "Payment reference required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existing } = await supabaseAdmin
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error: updateError } = await supabaseAdmin
          .from("subscriptions")
          .update({ status: "active", payment_reference, payment_method: "paypal" })
          .eq("user_id", user.id);
        if (updateError) {
          return new Response(
            JSON.stringify({ error: "Failed to update subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
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
          return new Response(
            JSON.stringify({ error: "Failed to create subscription" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Subscription activated successfully" }),
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
