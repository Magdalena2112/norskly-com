import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildSystem(level: string) {
  return `Ti si nastavnik norveškog (Bokmål) za studenta na nivou ${level}.
Student će ti dati sliku da bi vežbao bildebeskrivelse (opis slike).

Pažljivo pogledaj sliku i vrati ISKLJUČIVO JSON:
{
  "vocabulary": [
    { "word": "norveška reč (sa članom za imenice, npr. 'et hus')", "translation": "srpski prevod", "type": "imenica|glagol|pridev|prilog" }
  ],
  "expressions": [
    { "no": "korisni izraz na norveškom", "sr": "prevod na srpski" }
  ],
  "sentence_starters": [
    "Na bildet ser jeg ...",
    "I forgrunnen ...",
    "I bakgrunnen ..."
  ],
  "phrases_by_level": [
    { "no": "rečenica na ${level} nivou", "sr": "srpski prevod" }
  ],
  "description_hint": "kratak savet (1-2 rečenice) na srpskom kako da student strukturira opis"
}

Vraćaj 8-12 vokabular reči i 4-6 izraza, sve striktno relevantno za sliku.
Sav norveški jezik na Bokmålu, korektno gramatički. Nemoj izmišljati objekte koji nisu na slici.`;
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
    const imageUrl: string = (body.image_url || "").toString();
    const imageBase64: string = (body.image_base64 || "").toString();
    const level: string = (body.level || "A1").toString().slice(0, 4);

    if (!imageUrl && !imageBase64) {
      return new Response(JSON.stringify({ error: "Slika je obavezna" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imagePart = imageBase64
      ? { type: "image_url", image_url: { url: imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const aiRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: buildSystem(level) },
          { role: "user", content: [
            { type: "text", text: "Analiziraj sliku i pomozi studentu da je opiše na norveškom." },
            imagePart,
          ]},
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiRes.status === 429) {
      return new Response(JSON.stringify({ error: "Previše zahteva." }), {
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
    try { parsed = JSON.parse(content); } catch { parsed = {}; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("writing-image-helper error", e);
    return new Response(JSON.stringify({ error: (e as Error).message || "Greška" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
