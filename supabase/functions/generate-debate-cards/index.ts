import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting debate card generation...");
    
    const { topic } = await req.json();
    console.log("Topic received:", topic);

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      console.error("Invalid topic provided");
      return new Response(
        JSON.stringify({ error: 'Please provide a valid topic' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: 'AI gateway not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const systemPrompt = `You generate exactly valid JSON. Do not include markdown, code fences, commentary, or any text outside the JSON.\nReturn an object with a 'cards' array of exactly 3 items. Each item must include: tagline (string), evidence (string, 2-3 sentences), citation (string), link (string URL).`;

    const userPrompt = `Generate 3 debate cards for the topic: "${topic}". Make the arguments thoughtful, well-reasoned, and diverse in perspective.`;

    console.log("Calling Lovable AI gateway (non-streaming)...");
    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error("AI gateway request failed");
    }

    const data = await aiResp.json();
    let text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.trim()) {
      console.error("Invalid AI response structure", data);
      throw new Error("Invalid AI response");
    }

    text = text.trim();
    if (text.startsWith('```json')) text = text.replace(/^```json\n/, '').replace(/\n```$/, '');
    if (text.startsWith('```')) text = text.replace(/^```\n/, '').replace(/\n```$/, '');

    console.log("Parsing JSON response...");
    const parsed = JSON.parse(text);

    if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length !== 3) {
      console.error("AI did not return 3 cards as required", parsed);
      throw new Error("AI returned unexpected structure");
    }

    console.log("Successfully generated", parsed.cards.length, "debate cards");
    return new Response(
      JSON.stringify(parsed),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-debate-cards function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
