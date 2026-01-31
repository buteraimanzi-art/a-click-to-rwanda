import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { fileContent, fileName, fileType, destinations, hotels, activities } = await req.json();
    
    if (!fileContent) {
      return new Response(JSON.stringify({ error: "No file content provided" }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context about available options
    const destinationNames = destinations.map((d: { name: string }) => d.name).join(', ');
    const hotelNames = hotels.map((h: { name: string }) => h.name).join(', ');
    const activityNames = activities.map((a: { name: string }) => a.name).join(', ');

    // Prepare the message for the AI
    const systemPrompt = `You are an expert travel itinerary parser. Your job is to extract structured itinerary information from documents.

AVAILABLE DESTINATIONS in Rwanda: ${destinationNames}

AVAILABLE HOTELS: ${hotelNames}

AVAILABLE ACTIVITIES: ${activityNames}

Extract the itinerary into a JSON array with this structure:
[
  {
    "destination": "exact destination name from the available list",
    "hotel": "hotel name if mentioned (optional)",
    "activity": "main activity for the day if mentioned (optional)",
    "notes": "any other important notes or details (optional)"
  }
]

RULES:
1. Match destinations to the closest available destination from the list
2. Each day should be a separate object in the array
3. If dates are mentioned, try to preserve the chronological order
4. Extract hotels and activities only if they're clearly mentioned
5. Put extra details in the notes field
6. Return ONLY valid JSON, no markdown or explanation
7. If you cannot identify any itinerary information, return an empty array []`;

    let userContent: any[];

    // Handle different file types
    if (fileType.startsWith('image/')) {
      // For images, use vision capability
      const mimeType = fileType;
      userContent = [
        {
          type: 'text',
          text: `Please extract the travel itinerary from this image. Look for destinations, dates, hotels, activities, and any travel plans.`
        },
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${fileContent}`
          }
        }
      ];
    } else {
      // For text/PDF/Word - decode base64 and extract text
      // Note: For PDFs and Word docs, we'll send the base64 and let the AI try to interpret
      // In production, you might want to use a proper document parsing library
      let textContent = '';
      
      try {
        // Try to decode as text
        const decoded = atob(fileContent);
        textContent = decoded;
      } catch {
        textContent = `[Document: ${fileName}] Please analyze this base64-encoded document and extract any travel itinerary information.`;
      }

      userContent = [
        {
          type: 'text',
          text: `Extract the travel itinerary from this document content:\n\n${textContent.substring(0, 10000)}`
        }
      ];
    }

    console.log(`Processing document: ${fileName} (${fileType})`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: fileType.startsWith('image/') ? "google/gemini-2.5-flash" : "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to process document" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log("AI response:", content);

    // Parse the JSON from the AI response
    let itinerary = [];
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        itinerary = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
    }

    return new Response(JSON.stringify({ 
      itinerary,
      rawResponse: content 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Extract itinerary error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
