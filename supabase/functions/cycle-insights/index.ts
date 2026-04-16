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
    const { phase, cycleDay, cycleLength, periodDuration, symptoms, profile } = body;

    // @ts-ignore
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || "AIzaSyAGxqXBd9vn34rmymvFo9SCtIU7-2UEmg0";

    let context = `Tu es Aria, une assistante IA spécialisée en santé féminine et nutrition hormonale pour l'application AriaCycle. Tu réponds TOUJOURS en français.\n\n=== DONNÉES DU CYCLE ===\nJour du cycle: J${cycleDay}\nPhase actuelle: ${phase}\nDurée du cycle: ${cycleLength} jours\nDurée des règles: ${periodDuration} jours\n`;

    if (symptoms && symptoms.length > 0) {
      context += `Symptômes signalés aujourd'hui: ${symptoms.join(', ')}\n`;
    }

    if (profile) {
      if (profile.age) context += `Âge: ${profile.age} ans\n`;
      if (profile.weight_kg) context += `Poids: ${profile.weight_kg} kg\n`;
      if (profile.goal_type) context += `Objectif: ${profile.goal_type}\n`;
      if (profile.medical_conditions) context += `Conditions: ${profile.medical_conditions}\n`;
      if (profile.allergies) context += `Allergies: ${profile.allergies}\n`;
    }

    context += `\nTu dois STRICTEMENT renvoyer un objet JSON valide avec cette structure exacte :
{
  "insight": "Ton conseil personnalisé en maximum 4 phrases. Termine bien tes phrases.",
  "supplements": [
    {
      "name": "Nom du complément (ex: Magnésium)",
      "reason": "Pourquoi c'est recommandé aujourd'hui"
    }
  ]
}
S'il n'y a pas de symptômes particuliers, renvoie un tableau vide pour supplements. NE RENVOIE AUCUN TEXTE EN DEHORS DU JSON.`;

    const candidates = ["gemini-2.5-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const modelId of candidates) {
      try {
        console.log(`[INSIGHTS] Attempting ${modelId}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: context }] }],
            generationConfig: { 
              temperature: 0.7, 
              maxOutputTokens: 2000,
              thinkingConfig: { thinkingBudget: 0 },
              responseMimeType: "application/json"
            }
          })
        });

        const data = await res.json();
        if (data.error) { 
          lastError = data.error; 
          console.error(`[INSIGHTS] ${modelId} failed:`, data.error.message);
          continue; 
        }

        const candidate = data.candidates?.[0];
        const finishReason = candidate?.finishReason;
        console.log(`[INSIGHTS] ${modelId} finishReason: ${finishReason}`);

        // Reject if explicitly truncated
        if (finishReason === 'MAX_TOKENS') {
          console.warn(`[INSIGHTS] ${modelId} truncated (MAX_TOKENS), trying next model`);
          lastError = { message: 'Truncated' };
          continue;
        }

        // Collect all text parts (thinking models may have multiple parts)
        const parts = candidate?.content?.parts || [];
        const text = parts
          .filter((p: any) => p.text && !p.thought)  // exclude thought/reasoning parts
          .map((p: any) => p.text)
          .join('').trim();

        if (text && text.length > 20) {
          console.log(`[INSIGHTS] ${modelId} success, text length: ${text.length}`);
          try {
            const parsed = JSON.parse(text);
            return new Response(JSON.stringify(parsed), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          } catch(e) {
            return new Response(text, {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        } else {
          console.warn(`[INSIGHTS] ${modelId} returned empty or too-short text`);
          lastError = { message: 'Empty response' };
        }
      } catch (e) { lastError = e; }
    }

    return new Response(JSON.stringify({ insight: "Désolé, Aria n'est pas disponible pour le moment. Réessayez plus tard.", error: "AI unavailable", details: lastError }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ insight: null, error: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
