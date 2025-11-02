# Deploying Outside Lovable with Gemini API

This guide explains how to deploy this debate card generator to other platforms using your own Gemini API key instead of Lovable AI.

## Prerequisites

- A Google Cloud account with Gemini API access
- Your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- A hosting platform (Vercel, Netlify, Railway, etc.)

## Steps

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy and save it securely

### 2. Update the Edge Function

Replace the Lovable AI gateway call with direct Gemini API:

**File: `supabase/functions/generate-debate-cards/index.ts`**

```typescript
// Replace this:
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

// With this:
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Replace the AI gateway call (line 78-124):
const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${LOVABLE_API_KEY}`,
  },
  body: JSON.stringify({
    model: "gemini-2.0-flash",
    messages: [
      {
        role: "user",
        content: systemPrompt + "\n\n" + userPrompt,
      },
    ],
    temperature: 0.7,
    top_p: 0.95,
    response_format: {
      type: "json_object",
      schema: {
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
                link: { type: "string" },
              },
              required: ["tagline", "evidence", "citation", "link"],
            },
          },
        },
        required: ["cards"],
      },
    },
  }),
});

// With direct Gemini API call:
const aiResp = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: systemPrompt + "\n\n" + userPrompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: {
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
                required: ["tagline", "evidence", "citation", "link"]
              }
            }
          },
          required: ["cards"]
        }
      }
    })
  }
);

// Update response parsing (around line 144):
const data = await aiResp.json();
const parsed = data?.candidates?.[0]?.content?.parts?.[0]?.text 
  ? JSON.parse(data.candidates[0].content.parts[0].text)
  : null;
```

### 3. Deployment Options

#### Option A: Vercel + Supabase

1. **Setup Supabase:**
   - Create a free Supabase project at [supabase.com](https://supabase.com)
   - Deploy the edge function to your Supabase project
   - Add `GEMINI_API_KEY` secret in Supabase dashboard

2. **Deploy Frontend to Vercel:**
   ```bash
   npm install -g vercel
   vercel
   ```
   - Add environment variables in Vercel dashboard:
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Option B: Netlify + Netlify Functions

1. **Convert Edge Function to Netlify Function:**
   - Move edge function code to `netlify/functions/generate-debate-cards.ts`
   - Add `GEMINI_API_KEY` in Netlify environment variables

2. **Deploy:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

#### Option C: Railway (Full Stack)

1. **Create Railway Project:**
   - Connect your GitHub repository
   - Railway will auto-detect and deploy

2. **Add Environment Variables:**
   - `GEMINI_API_KEY`
   - `VITE_SUPABASE_URL` (if using Supabase)
   - `VITE_SUPABASE_PUBLISHABLE_KEY`

### 4. Update Frontend API Call

Update `src/pages/Generator.tsx` to point to your new endpoint:

```typescript
// Replace:
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-debate-cards`,
  // ...
);

// With your deployed endpoint:
const response = await fetch(
  'https://your-domain.com/api/generate-debate-cards',
  // ...
);
```

## Cost Comparison

- **Lovable AI:** Pay-as-you-go through Lovable credits
- **Direct Gemini API:** 
  - Free tier: 15 requests/minute
  - Paid: ~$0.07 per 1M input tokens, ~$0.21 per 1M output tokens
  - Significantly cheaper for high volume

## Security Notes

- Never commit API keys to your repository
- Always use environment variables
- Enable API key restrictions in Google Cloud Console
- Set up rate limiting on your endpoints
- Consider adding authentication for production use

## Support

For issues with:
- Gemini API: [Google AI Studio Support](https://ai.google.dev/docs)
- Supabase: [Supabase Documentation](https://supabase.com/docs)
- Deployment platforms: Check respective platform documentation
