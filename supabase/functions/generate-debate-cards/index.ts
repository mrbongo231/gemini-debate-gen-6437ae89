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

    const systemPrompt = `You are formatting debate evidence for Public Forum style with visual emphasis for spoken delivery.

Create a card using this exact structure:

Tagline: [10-18 word argumentative claim summarizing what this evidence proves.]
Citation: [Author or Organization], [Year or "No Date"]. "[Full article title]." *[Publication Name].* [Verified URL], accessed [MM-DD-YYYY]; [Initials].
Evidence: "[Verbatim quote from the article (1-3 sentences). Use HTML tags:
- <mark>phrase</mark> wraps the portion read aloud (roughly 50-70% of main sentence)
- <b>word/phrase</b> INSIDE <mark> for strongest emphasis on key words
- <u>phrase</u> INSIDE <mark> for secondary emphasis
Example: "<mark>Climate change <b>accelerates extinction rates</b> by <u>disrupting ecosystems</u> and <b>reducing biodiversity</b>.</mark>"
Ensure proper punctuation and readability.]"

Required Output: JSON object with 'cards' array of exactly 3 items. Each card must include:
- tagline: Short argumentative claim (10-18 words max)
- citation: Format as shown above with all fields
- evidence: Verbatim quote with <mark>, <b>, and <u> HTML tags properly nested. Must be wrapped in quotation marks.
- link: Full working URL to source

Rules:
- Do not paraphrase; quote directly
- Always include quotation marks around evidence
- Highlight (<mark>) roughly 50-70% of the main sentence that a debater would read
- Use <b> and <u> INSIDE <mark> tags for layered emphasis - never outside
- Bold (<b>) is for strongest emphasis, underline (<u>) for supporting emphasis
- Use HTML entities correctly
- Evidence must be direct quotes with HTML formatting
- Tagline should be a claim, not a fragment
- Use realistic academic sources with proper citations`;

    const userPrompt = `Generate 3 debate cards for the topic: "${topic}". Make arguments thoughtful, well-reasoned, and diverse. Use realistic academic sources with proper citations and working URLs.`;

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
