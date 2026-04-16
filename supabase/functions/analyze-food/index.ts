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

    // Le format fourni par le frontend est généralement "data:image/jpeg;base64,/9j/4AAQ..."
    let mimeType = "image/jpeg";
    let base64Data = image;

    if (image.includes(",")) {
      const parts = image.split(",");
      const match = parts[0].match(/:(.*?);/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    // @ts-ignore
    const geminiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || "AIzaSyAGxqXBd9vn34rmymvFo9SCtIU7-2UEmg0";
    // @ts-ignore
    const spoonacularKey = Deno.env.get("SPOONACULAR_API_KEY") || "991aedc684eb48c8b7d44b3c8a8a1229";

    if (!geminiKey) {
      throw new Error("API Key Gemini manquante. Veuillez la configurer dans Supabase (.env).");
    }

    // 1. Appel à Gemini 1.5 Flash Vision
    const prompt = `Tu es Aria, une assistante en nutrition ultra pointue pour l'application AriaFood, pensée pour tous, y compris le continent africain.
Analyse cette image de nourriture. 
- Identifie s'il s'agit d'un plat préparé, d'un aliment culturel spécifique (comme l'Okok, le Ndolé, Poulet DG...) ou d'un ingrédient brut (ex: Un morceau de bœuf, un oignon, une tomate).
- Estime de manière réaliste les macros pour la portion visible.

Tu dois répondre UNIQUEMENT en JSON avec la structure exacte suivante :
{
  "food_name": "Nom du plat ou ingrédient (ex: Okok fait maison, Oignon rouge)",
  "calories": 0, // estimation entière
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "fiber_g": 0,
  "health_score": 0, // Sur 10
  "health_tips": "Bref conseil santé franc et bienveillant de 2 phrases.",
  "is_ingredient": false, // true si c'est un aliment brut (ex: courgette, oignon), false si plat cuisiné
  "ingredient_english": "onion" // Obligatoire si is_ingredient est TRUE (nom de l'ingrédient principal en ANGLAIS pour interroger 1 l'API de recette)
}`;

    const modelCandidates = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const modelId of modelCandidates) {
      try {
        console.log(`[ANALYZE] Trying model: ${modelId}...`);
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${geminiKey}`;

        const geminiBody = {
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Data
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2000,
            thinkingConfig: { thinkingBudget: 0 },
            responseMimeType: "application/json"
          }
        };

        const aiRes = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(geminiBody)
        });

        const aiData = await aiRes.json();
        if (aiData.error) {
          console.error(`[ANALYZE] ${modelId} error:`, aiData.error.message);
          lastError = aiData.error.message;
          continue;
        }

        const parts = aiData.candidates?.[0]?.content?.parts || [];
        const candidateText = parts
          .filter((p: any) => p.text && !p.thought)
          .map((p: any) => p.text)
          .join('').trim();

        if (!candidateText || candidateText.length < 10) {
          console.warn(`[ANALYZE] ${modelId} returned empty/short text`);
          lastError = "Empty response";
          continue;
        }

        console.log(`[ANALYZE] ${modelId} success, length: ${candidateText.length}`);

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
        console.error(`[ANALYZE] ${modelId} exception:`, modelErr);
      }
    }

    // Tous les modèles ont échoué
    throw new Error(lastError || "All AI models failed");

  } catch (e: any) {
    console.error("[ANALYZE-FOOD ERROR]", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
