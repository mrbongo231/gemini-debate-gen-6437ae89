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
        tools: [
          {
            type: "function",
            function: {
              name: "return_debate_cards",
              description: "Return exactly 3 debate cards with tagline, evidence, citation, and link.",
              parameters: {
                type: "object",
                properties: {
                  cards: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tagline: { type: "string" },
                        evidence: { type: "string" },
                        citation: { type: "string" },
                        link: { type: "string" }
                      },
                      required: ["tagline", "evidence", "citation", "link"],
                      additionalProperties: false
                    },
                    minItems: 3,
                    maxItems: 3
                  }
                },
                required: ["cards"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "return_debate_cards" } },
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

    // Prefer tool-calling output for robust JSON extraction
    let parsed: any | undefined;
    try {
      const toolCalls = data?.choices?.[0]?.message?.tool_calls;
      if (toolCalls?.length) {
        const argsStr = toolCalls[0]?.function?.arguments;
        parsed = JSON.parse(argsStr);
      } else {
        let content: string | undefined = data?.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
          content = content.trim();
          if (content.startsWith('```json')) content = content.replace(/^```json\n/, '').replace(/\n```$/, '');
          if (content.startsWith('```')) content = content.replace(/^```\n/, '').replace(/\n```$/, '');
          parsed = JSON.parse(content);
        }
      }
    } catch (e) {
      console.error('Failed to parse AI response', e);
    }

    if (!parsed || !parsed.cards || !Array.isArray(parsed.cards)) {
      console.error('Invalid AI response format', data);
      return new Response(JSON.stringify({ error: 'Invalid AI response format' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalize = (c: any) => ({
      tagline: String(c?.tagline ?? ''),
      evidence: String(c?.evidence ?? ''),
      citation: String(c?.citation ?? ''),
      link: String(c?.link ?? ''),
    });

    let cards = parsed.cards.map(normalize).filter((c: any) => c.tagline || c.evidence);
    if (cards.length > 3) cards = cards.slice(0, 3);

    if (cards.length === 0) {
      return new Response(JSON.stringify({ error: 'AI returned no cards' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully generated', cards.length, 'debate cards');
    return new Response(JSON.stringify({ cards }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
