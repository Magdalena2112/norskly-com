import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase config" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, level, topic, count, text } = await req.json();

    const cefrExpectations: Record<string, string> = {
      A1: "Fokus na osnovnu strukturu rečenice i razumljivost.",
      A2: "Fokus na stabilnost glagolskih vremena i jednostavne veznike.",
      B1: "Fokus na zavisne rečenice i izražavanje mišljenja.",
      B2: "Fokus na stilsku varijaciju i složene strukture.",
      C1: "Fokus na nijanse, idiomatski jezik i preciznost.",
    };
    const cefrFocus = cefrExpectations[level] || cefrExpectations["A1"];

    const qualityCheck = `

OBAVEZNA SAMOPROVERA pre slanja odgovora:
- Norveški tekst nema gramatičke greške.
- Red reči u rečenicama je ispravan (V2 pravilo u glavnoj rečenici).
- Prepozicije su prirodne (ne doslovno sa srpskog).
- Korišćen je nivo ${level} (ne pretežak vokabular).
- Značenje je isto kao cilj; nema izmišljenih detalja.
- Nema kontradikcija i nema "čudnih" formulacija.
Ako bilo šta nije sigurno: pojednostavi rečenicu. Ne dodaj nove informacije.`;

    const cefrEvalBlock = `

VIŠEDIMENZIONALNA EVALUACIJA za ispravljanje teksta:
Nivo korisnika: ${level}. ${cefrFocus}

Kad ispravljaš tekst, evaluiraj po 5 dimenzija:
1. Gramatika – tačnost struktura
2. Vokabular – raspon i prikladnost
3. Jasnoća – razumljivost
4. Povezivanje – upotreba veznika
5. Prirodnost – ton i pragmatička prikladnost

Navedi snage kratko, identifikuj NAJVIŠE 2 oblasti za poboljšanje.`;

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate_exercises") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Generišeš gramatičke vežbe za nivo ${level}.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "exercises": [
    {
      "id": 1,
      "instruction": "Instrukcija na srpskom",
      "sentence": "Rečenica sa _____ na mestu gde treba popuniti",
      "solution": "Tačan odgovor",
      "hint": "Kratak hint na srpskom"
    }
  ]
}` + qualityCheck;
      userPrompt = `Generiši ${count || 5} vežbi na temu "${topic}". Nivo: ${level}. Svaka vežba treba da ima rečenicu sa blankom i rešenje.`;
    } else if (action === "correct_text") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Ispravljaš tekst korisnika na nivou ${level}.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "corrected_text": "Ispravljena verzija teksta",
  "mistakes": [
    {
      "original": "Pogrešan deo",
      "corrected": "Ispravljen deo",
      "explanation": "Kratko objašnjenje na srpskom"
    }
  ],
  "overall_feedback": "Opšti komentar na srpskom",
  "nivo_analiza": {
    "gramatika": "kratka ocena",
    "vokabular": "kratka ocena",
    "jasnoća": "kratka ocena",
    "povezivanje": "kratka ocena",
    "prirodnost": "kratka ocena"
  },
  "sledeci_korak": ["preporuka 1", "preporuka 2"]
}
${cefrEvalBlock}` + qualityCheck;
      userPrompt = `Ispravi sledeći tekst na norveškom i objasni greške:\n\n"${text}"`;
    } else if (action === "generate_quiz") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Generišeš kviz pitanja za nivo ${level}.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "questions": [
    {
      "id": 1,
      "question": "Pitanje na srpskom",
      "options": ["opcija1", "opcija2", "opcija3", "opcija4"],
      "correct": 0,
      "explanation": "Objašnjenje na srpskom"
    }
  ]
}` + qualityCheck;
      userPrompt = `Generiši 5 kviz pitanja na temu "${topic}". Nivo: ${level}. Svako pitanje ima 4 opcije i jedno tačno rešenje.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", errText);
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // If correction, save to grammar_submissions
    if (action === "correct_text") {
      await supabase.from("grammar_submissions").insert({
        user_id: user.id,
        topic: "Text correction",
        user_text: text,
        corrected_text: parsed.corrected_text || "",
        explanations: JSON.stringify(parsed.mistakes || []),
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Grammar AI error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
