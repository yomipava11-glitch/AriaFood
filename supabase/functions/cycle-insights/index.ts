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
    const apiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") || "AIzaSyDfxVXMfaSvJiHvBfPFr6HJhlYn7TTckE0";

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

    context += `\nGénère un conseil personnalisé et bienveillant en 3-4 phrases maximum. Le conseil doit couvrir:\n1. Un conseil NUTRITION adapté à cette phase hormonale (aliments spécifiques à privilégier/éviter)\n2. Un conseil ACTIVITÉ PHYSIQUE adapté au niveau d'énergie de cette phase\n3. Un conseil BIEN-ÊTRE si des symptômes sont signalés\n\nSois précise, concrète et chaleureuse. Utilise des emojis avec parcimonie (1-2 max). Ne mentionne pas que tu es une IA.`;

    const candidates = ["gemini-1.5-flash", "gemini-2.0-flash"]; // Reordered
    let lastError: any = null;

    for (const modelId of candidates) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: context }] }],
            generationConfig: { temperature: 0.8, maxOutputTokens: 300 }
          })
        });

        const data = await res.json();
        if (data.error) { lastError = data.error; continue; }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return new Response(JSON.stringify({ insight: text }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } else {
            // Safety blocked or something else
            lastError = data;
        }
      } catch (e) { lastError = Object.assign({}, e); }
    }

    return new Response(JSON.stringify({ insight: null, error: "AI unavailable", details: lastError }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ insight: null, error: e.message }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
