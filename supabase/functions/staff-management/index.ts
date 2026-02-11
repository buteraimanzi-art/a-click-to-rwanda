import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "buteraimanzi@gmail.com";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const email = user.email?.toLowerCase() || "";
    const isStaff = email === ADMIN_EMAIL || email.endsWith("@aclicktorwanda.com");
    if (!isStaff) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { entity, action, ...payload } = await req.json();

    // DESTINATIONS
    if (entity === "destination") {
      if (action === "create") {
        const { id, name, description, latitude, longitude } = payload;
        const { data, error } = await supabaseClient
          .from("destinations")
          .insert({ id, name, description, latitude: latitude || null, longitude: longitude || null })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "update") {
        const { id, ...updates } = payload;
        const { data, error } = await supabaseClient
          .from("destinations")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "delete") {
        const { id } = payload;
        const { error } = await supabaseClient.from("destinations").delete().eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // HOTELS
    if (entity === "hotel") {
      if (action === "create") {
        const { id, name, destination_id, latitude, longitude, website } = payload;
        const { data, error } = await supabaseClient
          .from("hotels")
          .insert({ id, name, destination_id, latitude: latitude || null, longitude: longitude || null, website: website || null })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "update") {
        const { id, ...updates } = payload;
        const { data, error } = await supabaseClient
          .from("hotels")
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "delete") {
        const { id } = payload;
        const { error } = await supabaseClient.from("hotels").delete().eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // TOUR COMPANY IMAGES
    if (entity === "tour_company_image") {
      if (action === "create") {
        const { company_id, image_url, caption, sort_order } = payload;
        const { data, error } = await supabaseClient
          .from("tour_company_images")
          .insert({ company_id, image_url, caption: caption || null, sort_order: sort_order || 0 })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "delete") {
        const { id } = payload;
        const { error } = await supabaseClient.from("tour_company_images").delete().eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // SOS ALERTS management
    if (entity === "sos_alert") {
      if (action === "list") {
        const { data, error } = await supabaseClient
          .from("sos_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "resolve") {
        const { id } = payload;
        const { data, error } = await supabaseClient
          .from("sos_alerts")
          .update({ status: "resolved", resolved_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // MESSAGING - staff side
    if (entity === "conversation") {
      if (action === "list") {
        const { data, error } = await supabaseClient
          .from("conversations")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(100);
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (entity === "message") {
      if (action === "list") {
        const { conversation_id } = payload;
        const { data, error } = await supabaseClient
          .from("messages")
          .select("*")
          .eq("conversation_id", conversation_id)
          .order("created_at", { ascending: true });
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "send") {
        const { conversation_id, content } = payload;
        const { data, error } = await supabaseClient
          .from("messages")
          .insert({
            conversation_id,
            sender_id: user.id,
            sender_type: "staff",
            content,
          })
          .select()
          .single();
        if (error) throw error;
        // Update conversation timestamp
        await supabaseClient
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation_id);
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (action === "mark_read") {
        const { conversation_id } = payload;
        const { error } = await supabaseClient
          .from("messages")
          .update({ read: true })
          .eq("conversation_id", conversation_id)
          .eq("sender_type", "user");
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid entity or action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
