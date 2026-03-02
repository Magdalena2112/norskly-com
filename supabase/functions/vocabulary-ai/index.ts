import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      return new Response(JSON.stringify({ error: "Missing backend config" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, level, theme, word, sentence, exclude_words } = await req.json();

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

VIŠEDIMENZIONALNA EVALUACIJA za ispravku rečenice:
Nivo korisnika: ${level}. ${cefrFocus}

Kad ispravljaš korisnikovu rečenicu, evaluiraj po 5 dimenzija:
1. Gramatika 2. Vokabular 3. Jasnoća 4. Povezivanje 5. Prirodnost
Navedi snage kratko, identifikuj NAJVIŠE 2 oblasti za poboljšanje.`;

    let systemPrompt = "";
    let userPrompt = "";



    if (action === "generate_vocab") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Generišeš vokabular za nivo ${level}.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "words": [
    {
      "word": "norveška reč",
      "translation": "prevod na srpskom",
      "synonym": "sinonim na norveškom ili null",
      "antonym": "antonim na norveškom ili null",
      "examples": ["primer rečenica 1", "primer rečenica 2"]
    }
  ]
}` + qualityCheck;
      const excludeNote = exclude_words?.length ? `\nNE ponavljaj ove reči: ${exclude_words.join(", ")}.` : "";
      userPrompt = `Generiši 8 reči na temu "${theme}". Nivo: ${level}. Za svaku reč daj prevod na srpskom, sinonim (ako postoji), antonim (ako postoji) i 2 primera korišćenja u rečenici.${excludeNote}`;
    } else if (action === "correct_sentence") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Korisnik pokušava da koristi reč "${word}" u rečenici. Ispravi rečenicu i objasni.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "corrected_sentence": "Ispravljena rečenica",
  "is_correct": true/false,
  "explanation": "Objašnjenje na srpskom - da li je pravilno korišćena reč, gramatika itd.",
  "tips": "Kratki saveti za bolje korišćenje reči"
}` + qualityCheck;
      userPrompt = `Korisnik je napisao: "${sentence}"\nReč koju treba da koristi: "${word}"\nNivo: ${level}`;
    } else if (action === "generate_quiz") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Generišeš kviz pitanja iz datih reči za nivo ${level}.
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
      userPrompt = `Generiši 10 kviz pitanja koristeći sledeće norveške reči: ${theme}. Nivo: ${level}. Pitanja mogu biti prevod, popuni blanko, sinonim/antonim itd.`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    // Strip markdown fences
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Try to extract JSON from mixed text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let cleaned = jsonMatch[0]
            .replace(/,\s*}/g, "}")
            .replace(/,\s*]/g, "]");
          parsed = JSON.parse(cleaned);
        } catch {
          console.error("Failed to parse AI response after repair:", content);
          throw new Error("Invalid AI response format");
        }
      } else {
        console.error("No JSON found in AI response:", content);
        throw new Error("Invalid AI response format");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Vocabulary AI error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
