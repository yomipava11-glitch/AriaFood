// @ts-nocheck — Supabase Edge Function (Deno runtime)
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
    
    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!groqKey) {
      return new Response(JSON.stringify({ error: "Configuration Error: API Keys missing." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!image) {
      return new Response(JSON.stringify({ error: "Missing image" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.includes(",")) {
      const parts = image.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    const models = ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"];
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[SCANNER] Attempting ${model}...`);
        
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
             "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: `Analyze this food image. IMPORTANT: You MUST respond in FRENCH. Return JSON ONLY: { "food_name": "...", "calories": 0, "protein_g": 0, "carbs_g": 0, "fat_g": 0, "health_score": 0, "health_tips": "... (in French)" }` },
                  {
                    type: "image_url",
                    image_url: {
                       url: `data:${mimeType};base64,${base64Data}`
                    }
                  }
                ]
              }
            ],
            temperature: 0.1,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });

        const data = await res.json();
        
        if (data.error) {
          lastError = data.error.message;
          console.error(`[SCANNER] ${model} failed:`, data.error.message);
          continue;
        }

        const text = data.choices?.[0]?.message?.content?.trim();

        if (text) {
          return new Response(text, { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          });
        }
      } catch (e) {
        lastError = e.message;
      }
    }

    return new Response(JSON.stringify({ 
      error: "ALL_MODELS_FAILED", 
      message: "Désolé, Aria rencontre une difficulté technique temporaire. Réessayez dans un instant.",
      details: lastError?.message || lastError 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: "CRASH", msg: e.message }), { 
      status: 200, 
      headers: corsHeaders 
    });
  }
});
