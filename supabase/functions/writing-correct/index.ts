import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CEFR_FOCUS: Record<string, string> = {
  A1: "Fokus na osnovnu strukturu rečenice i razumljivost.",
  A2: "Fokus na stabilnost glagolskih vremena i jednostavne veznike.",
  B1: "Fokus na zavisne rečenice i izražavanje mišljenja.",
  B2: "Fokus na stilsku varijaciju i složene strukture.",
  C1: "Fokus na nijanse, idiomatski jezik i preciznost.",
};

function buildSystem(level: string, hasImage: boolean) {
  return `Ti si stručni nastavnik norveškog (Bokmål). Student je na nivou ${level}. ${CEFR_FOCUS[level] || ""}
${hasImage ? "Student opisuje sliku (bildebeskrivelse). Komentariši i prirodnost opisa slike." : ""}

ZADATAK: Ispravi tekst i daj detaljnu pedagošku analizu. STROGO se drži V2 reda reči, prirodnih predloga i pravilnih oblika.

Vrati ISKLJUČIVO JSON sa sledećim poljima:
{
  "corrected_text": "kompletna ispravljena verzija na norveškom",
  "mistakes": [
    { "original": "...", "corrected": "...", "explanation": "objašnjenje na srpskom" }
  ],
  "vocabulary_suggestions": [
    { "weak": "previše osnovna ili neprirodna reč", "better": "bolja norveška reč", "why": "kratko objašnjenje na srpskom" }
  ],
  "overall_feedback": "kratak rezime na srpskom (2-3 rečenice)",
  "naturalness_score": 1-5,
  "complexity_score": 1-5,
  "nivo_analiza": {
    "gramatika": "...",
    "vokabular": "...",
    "jasnoća": "...",
    "povezivanje": "...",
    "prirodnost": "..."
  },
  "cefr_assessment": "procena realnog CEFR nivoa teksta (A1-C1)",
  "sledeci_korak": ["konkretan savet 1", "savet 2", "savet 3"],
  "_errors": [
    { "category": "word_order|verb_form|preposition|article|spelling|vocabulary", "topic": "...", "severity": 1, "example_wrong": "...", "example_correct": "..." }
  ]
}

Sva objašnjenja na srpskom (latinica). Sav norveški tekst na Bokmålu. Nemoj izmišljati greške ako ih nema.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const text: string = (body.text || "").toString();
    const level: string = (body.level || "A1").toString().slice(0, 4);
    const hasImage: boolean = !!body.has_image;

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: "Tekst je obavezan" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 5000) {
      return new Response(JSON.stringify({ error: "Tekst je predugačak (max 5000 znakova)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystem(level, hasImage) },
          { role: "user", content: `Analiziraj ovaj tekst:\n\n${text}` },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Previše zahteva, pokušaj ponovo za par sekundi." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiRes.status === 402) {
      return new Response(JSON.stringify({ error: "Nedovoljno AI kredita." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway error", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "AI greška" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(content); } catch { parsed = { corrected_text: content, mistakes: [], overall_feedback: "" }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("writing-correct error", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Greška" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
