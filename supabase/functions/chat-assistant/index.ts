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
    const { message, profile, logs } = body;

    const groqKey = Deno.env.get("GROQ_API_KEY");

    if (!groqKey) {
      return new Response(JSON.stringify({ reply: "⚠️ Clé API Groq manquante." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!message) {
      return new Response(JSON.stringify({ reply: "Aucun message reçu." }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build system prompt
    let systemPrompt = "Tu es Aria, un assistant nutritionnel intelligent et bienveillant pour l'application AriaFood. Tu réponds TOUJOURS en français. Tu donnes des conseils personnalisés basés sur le profil de santé et l'historique alimentaire de l'utilisateur.\n\n";

    if (profile) {
      systemPrompt += "=== PROFIL UTILISATEUR ===\n";
      if (profile.name) systemPrompt += `Nom: ${profile.name}\n`;
      if (profile.medical_conditions) systemPrompt += `Conditions médicales: ${profile.medical_conditions}\n`;
      if (profile.allergies) systemPrompt += `Allergies/Intolérances: ${profile.allergies}\n`;
      if (profile.goal) systemPrompt += `Objectif: ${profile.goal}\n`;
      systemPrompt += "\n";
    }

    if (logs && logs.length > 0) {
      systemPrompt += "=== DERNIERS REPAS CONSOMMÉS ===\n";
      for (const log of logs) {
        systemPrompt += `- ${log.food_name}: ${log.calories} kcal, ${log.protein_g || 0}g protéines, ${log.carbs_g || 0}g glucides, ${log.fat_g || 0}g lipides\n`;
      }
      systemPrompt += "\n";
    }

    systemPrompt += "IMPORTANT: Réponds de manière concise, chaleureuse et utile. Si l'utilisateur mentionne un problème de santé grave, conseille-lui de consulter un médecin. Ne donne jamais de diagnostic médical.";

    // Modèles Groq en ordre de priorité
    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
    let lastError = null;

    for (const model of models) {
      try {
        console.log(`[CHAT] Trying Groq model: ${model}`);
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
              { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        const data = await res.json();

        if (data.error) {
          console.error(`[CHAT] ${model} error:`, data.error.message);
          lastError = data.error.message;
          continue;
        }

        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) {
          return new Response(JSON.stringify({ reply: text }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (e) {
        lastError = e.message;
        console.error(`[CHAT] ${model} exception:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      reply: "Désolé, je rencontre une difficulté technique temporaire. Veuillez réessayer dans un instant.",
      error: lastError
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e) {
    return new Response(JSON.stringify({ reply: "Erreur serveur.", details: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
