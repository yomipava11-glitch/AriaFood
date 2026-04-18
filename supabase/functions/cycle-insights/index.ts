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
    const { phase, cycleDay, cycleLength, periodDuration, symptoms, profile } = body;

    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!groqKey) {
      return new Response(JSON.stringify({ insight: "⚠️ Clé API Groq manquante." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let systemPrompt = `Tu es Aria, une assistante IA spécialisée en santé féminine et nutrition hormonale pour l'application AriaCycle. Tu réponds TOUJOURS en français.`;

    let userPrompt = `=== DONNÉES DU CYCLE ===\nJour du cycle: J${cycleDay}\nPhase actuelle: ${phase}\nDurée du cycle: ${cycleLength} jours\nDurée des règles: ${periodDuration} jours\n`;

    if (symptoms && symptoms.length > 0) {
      userPrompt += `Symptômes signalés aujourd'hui: ${symptoms.join(', ')}\n`;
    }

    if (profile) {
      if (profile.age) userPrompt += `Âge: ${profile.age} ans\n`;
      if (profile.weight_kg) userPrompt += `Poids: ${profile.weight_kg} kg\n`;
      if (profile.goal_type) userPrompt += `Objectif: ${profile.goal_type}\n`;
      if (profile.medical_conditions) userPrompt += `Conditions: ${profile.medical_conditions}\n`;
      if (profile.allergies) userPrompt += `Allergies: ${profile.allergies}\n`;
    }

    userPrompt += `\nTu dois STRICTEMENT renvoyer un objet JSON valide avec cette structure exacte :
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

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"];
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[INSIGHTS] Trying Groq model: ${model}`);
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqKey}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            response_format: { type: "json_object" }
          })
        });

        const data = await res.json();
        if (data.error) {
          lastError = data.error.message;
          console.error(`[INSIGHTS] ${model} error:`, data.error.message);
          continue;
        }

        const text = data.choices?.[0]?.message?.content?.trim();
        if (text && text.length > 10) {
          const parsed = JSON.parse(text);
          return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        lastError = e.message;
        console.error(`[INSIGHTS] ${model} exception:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      insight: "Désolé, Aria rencontre une difficulté technique temporaire. Réessayez dans un instant.",
      supplements: [],
      error: lastError
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ insight: null, supplements: [], error: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
