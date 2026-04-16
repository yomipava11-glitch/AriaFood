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
    const { message, profile, logs } = body;

    // @ts-ignore
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || "AIzaSyAGxqXBd9vn34rmymvFo9SCtIU7-2UEmg0";

    if (!apiKey) {
      return new Response(JSON.stringify({ reply: "Configuration Error: API Key missing." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ reply: "Aucun message reçu." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build context
    let context = "Tu es Aria, un assistant nutritionnel intelligent et bienveillant pour l'application AriaFood. Tu réponds TOUJOURS en français. Tu donnes des conseils personnalisés basés sur le profil de santé et l'historique alimentaire de l'utilisateur.\n\n";

    if (profile) {
      context += "=== PROFIL UTILISATEUR ===\n";
      if (profile.name) context += `Nom: ${profile.name}\n`;
      if (profile.medical_conditions) context += `Conditions médicales: ${profile.medical_conditions}\n`;
      if (profile.allergies) context += `Allergies/Intolérances: ${profile.allergies}\n`;
      if (profile.goal) context += `Objectif: ${profile.goal}\n`;
      context += "\n";
    }

    if (logs && logs.length > 0) {
      context += "=== DERNIERS REPAS CONSOMMÉS ===\n";
      for (const log of logs) {
        context += `- ${log.food_name}: ${log.calories} kcal, ${log.protein_g || 0}g protéines, ${log.carbs_g || 0}g glucides, ${log.fat_g || 0}g lipides\n`;
      }
      context += "\n";
    }

    context += "IMPORTANT: Réponds de manière concise, chaleureuse et utile. Si l'utilisateur mentionne un problème de santé grave, conseille-lui de consulter un médecin. Ne donne jamais de diagnostic médical.\n\n";
    context += `Message de l'utilisateur: ${message}`;

    const models = [
      "gemini-2.5-flash",
      "gemini-flash-latest"
    ];

    let lastError = null;
    for (const modelId of models) {
      try {
        console.log(`[CHAT] Attempting ${modelId}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: context }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2000, thinkingConfig: { thinkingBudget: 0 } }
          })
        });

        const data = await res.json();
        if (data.error) {
          lastError = data.error;
          console.error(`[CHAT] ${modelId} failed:`, data.error.message);
          continue;
        }

        const text = (data.candidates?.[0]?.content?.parts || [])
          .filter((p: any) => p.text && !p.thought)
          .map((p: any) => p.text)
          .join('').trim();
        if (text) {
          return new Response(JSON.stringify({ reply: text }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        lastError = e;
      }
    }

    return new Response(JSON.stringify({ 
      reply: "Désolé, je rencontre une difficulté technique avec l'IA. Veuillez vérifier votre connexion ou réessayez plus tard.",
      error: lastError?.message || lastError
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ reply: "Erreur serveur.", details: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
