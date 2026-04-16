import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    const body = await req.json();
    const { image } = body;
    
    // @ts-ignore
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || "AIzaSyAGxqXBd9vn34rmymvFo9SCtIU7-2UEmg0";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API Key missing" }), { status: 200, headers: corsHeaders });
    }

    if (!image) {
      return new Response(JSON.stringify({ error: "Missing image" }), { status: 200, headers: corsHeaders });
    }

    const base64Data = image.includes(",") ? image.split(",")[1] : image;

    const models = [
      "gemini-2.5-flash",
      "gemini-flash-latest"
    ];

    let lastError = null;
    for (const modelId of models) {
      try {
        console.log(`[SCANNER] Attempting ${modelId}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: `Analyze this food image. IMPORTANT: You MUST respond in FRENCH. Return JSON ONLY: { "food_name": "...", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "health_score": 0, "health_tips": "... (in French)" }` },
                { inline_data: { mime_type: "image/jpeg", data: base64Data } }
              ]
            }],
            generationConfig: {
              response_mime_type: "application/json"
            }
          })
        });

        const data = await res.json();
        if (data.error) {
          lastError = data.error;
          console.error(`[SCANNER] ${modelId} failed:`, data.error.message);
          continue;
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return new Response(text, { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }
      } catch (e) {
        lastError = e;
      }
    }

    return new Response(JSON.stringify({ error: "ALL_MODELS_FAILED", details: lastError?.message || lastError }), { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: "CRASH", msg: e.message }), { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});
