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

    const apiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!apiKey) {
      console.error("GOOGLE_GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const prompt = `Generate 3 debate cards for the topic: "${topic}". 
    
Each card should present a distinct argument or perspective related to this topic.
Return ONLY a valid JSON object (no markdown code blocks, no backticks) with this exact structure:
{
  "cards": [
    {
      "tagline": "A compelling one-sentence claim or argument",
      "evidence": "2-3 sentences of supporting evidence or explanation",
      "citation": "A credible source or reference",
      "link": "A relevant URL (use a realistic example if needed)"
    }
  ]
}

Make the arguments thoughtful, well-reasoned, and diverse in perspective.`;

    console.log("Sending prompt to Gemini API...");
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", errorText);
      throw new Error("Failed to generate content from Gemini API");
    }

    const geminiData = await geminiResponse.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      console.error("Invalid Gemini API response structure");
      throw new Error("Invalid response from Gemini API");
    }
    
    console.log("Received response from Gemini API");

    // Clean the response - remove markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    console.log("Parsing JSON response...");
    const parsedData = JSON.parse(cleanedText);

    if (!parsedData.cards || !Array.isArray(parsedData.cards) || parsedData.cards.length === 0) {
      console.error("Invalid response structure from Gemini");
      return new Response(
        JSON.stringify({ error: 'Invalid response from AI' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log("Successfully generated", parsedData.cards.length, "debate cards");
    return new Response(
      JSON.stringify(parsedData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
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
