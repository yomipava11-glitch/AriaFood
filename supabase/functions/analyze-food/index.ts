// @ts-nocheck — Supabase Edge Function (Deno runtime)
/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types expected by the Frontend
interface AnalysisResponse {
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
  health_score: number;
  health_tips: string;
  is_ingredient?: boolean;
  ingredient_english?: string;
  recipes?: { name: string; image: string }[];
}

// @ts-ignore
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      throw new Error("No image provided.");
    }

    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.includes(",")) {
      const parts = image.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    const groqKey = Deno.env.get("GROQ_API_KEY");
    const spoonacularKey = Deno.env.get("SPOONACULAR_API_KEY");

    if (!groqKey) {
      throw new Error("Clé API Groq manquante.");
    }

    const prompt = `Tu es Aria, une assistante en nutrition ultra pointue pour l'application AriaFood, pensée pour tous, y compris le continent africain.
Analyse cette image de nourriture. 
- Identifie s'il s'agit d'un plat préparé, d'un aliment culturel spécifique (comme l'Okok, le Ndolé, Poulet DG...) ou d'un ingrédient brut (ex: Un morceau de bœuf, un oignon, une tomate).
- Estime de manière réaliste les macros pour la portion visible.

Tu dois répondre UNIQUEMENT en JSON avec la structure exacte suivante :
{
  "food_name": "Nom du plat ou ingrédient (ex: Okok fait maison, Oignon rouge)",
  "calories": 0,
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "fiber_g": 0,
  "health_score": 0,
  "health_tips": "Bref conseil santé franc et bienveillant de 2 phrases.",
  "is_ingredient": false,
  "ingredient_english": "onion"
}`;

    const models = ["llama-3.2-90b-vision-preview", "llama-3.2-11b-vision-preview"];
    let lastError: any = null;

    for (const model of models) {
      try {
        console.log(`[ANALYZE] Trying model: ${model}`);
        
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
                  { type: "text", text: prompt },
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
          console.error(`[ANALYZE] ${model} error:`, data.error.message);
          lastError = data.error.message;
          continue;
        }

        const candidateText = data.choices?.[0]?.message?.content?.trim();

        if (!candidateText || candidateText.length < 10) {
          console.warn(`[ANALYZE] ${model} returned empty/short text`);
          lastError = "Empty response";
          continue;
        }

        console.log(`[ANALYZE] ${model} success, length: ${candidateText.length}`);

        let parsedResult: AnalysisResponse;
        try {
          parsedResult = JSON.parse(candidateText);
        } catch (err) {
          console.error("JSON Parse Error:", candidateText);
          lastError = "Invalid JSON from AI";
          continue;
        }

        // Spoonacular si ingrédient brut
        if (parsedResult.is_ingredient && parsedResult.ingredient_english && spoonacularKey) {
          console.log(`[ANALYZE] Ingredient: ${parsedResult.ingredient_english}. Fetching recipes...`);
          const spoonUrl = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${encodeURIComponent(parsedResult.ingredient_english)}&number=5&apiKey=${spoonacularKey}`;
          try {
            const spoonRes = await fetch(spoonUrl);
            if (spoonRes.ok) {
              const spoonData = await spoonRes.json();
              if (spoonData && Array.isArray(spoonData)) {
                parsedResult.recipes = spoonData.map((d: any) => ({
                  name: d.title,
                  image: d.image
                }));
              }
            }
          } catch (spoonErr) {
            console.error("[ANALYZE] Spoonacular error:", spoonErr);
          }
        }

        return new Response(JSON.stringify(parsedResult), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (modelErr: any) {
        lastError = modelErr.message;
        console.error(`[ANALYZE] ${model} exception:`, modelErr);
      }
    }

    throw new Error(lastError || "All AI models failed");

  } catch (e: any) {
    console.error("[ANALYZE-FOOD ERROR]", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
