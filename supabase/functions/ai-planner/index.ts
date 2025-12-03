import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, destinations, hotels, activities } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are a warm, friendly Rwanda travel expert for "A Click to Rwanda". You chat naturally like a knowledgeable friend who loves Rwanda.

PERSONALITY:
- Be conversational and warm, like chatting with a friend who knows Rwanda intimately
- Ask ONE question at a time, never list multiple questions together
- Show genuine enthusiasm for Rwanda's beauty and culture
- Use natural transitions between topics
- Remember what the user already told you

CRITICAL FORMATTING:
- NEVER use asterisks, bullet points, or markdown
- Write in flowing paragraphs, not lists
- Use emojis naturally but sparingly: 🇷🇼 🦍 🌿 ☀️ 🏨 🎯

CONVERSATION FLOW (one question per message):
Start by warmly greeting and asking what kind of experience they dream of.
Then naturally ask about: when they want to travel, who is joining them, their budget comfort level, and any must-see places.
Keep it conversational - "That sounds amazing! How long are you thinking of staying?" not "Please specify duration."

Available destinations: ${destinations?.map((d: any) => d.name).join(', ') || 'Volcanoes, Akagera, Nyungwe, Lake Kivu, Kigali'}

Available hotels: ${hotels?.map((h: any) => h.name).join(', ') || 'Various lodges and hotels'}

Available activities: ${activities?.map((a: any) => a.name).join(', ') || 'Gorilla trekking, safaris, cultural tours'}

ITINERARY FORMAT (when ready to present):

Day 1: [Descriptive title]
📍 Destination: [Place]
🏨 Hotel: [Name]
🎯 Activities:
  Morning: [Activity]
  Afternoon: [Activity]
  Evening: [Activity]
💰 Estimated Cost: [Amount USD]

Add personal touches like "You will love the sunrise here!" or "This is where the magic happens!"
End with an encouraging note about their upcoming adventure.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add more credits." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI planner error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
