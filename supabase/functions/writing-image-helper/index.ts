import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildSystem(level: string) {
  return `Ti si nastavnik norveškog (Bokmål) za studenta na nivou ${level}.
Student je učitao sliku da bi vežbao bildebeskrivelse (opis slike).

Pažljivo analiziraj sliku i izvuci ŠTO VIŠE korisnog vokabulara koji student može
koristiti da je opiše — i jednostavne i nešto naprednije reči kada su relevantne.

Vrati ISKLJUČIVO JSON u sledećem formatu:
{
  "vocabulary_groups": {
    "imenice":        [ { "word": "en park", "translation": "park" } ],
    "glagoli":        [ { "word": "å sitte", "translation": "sedeti" } ],
    "pridevi":        [ { "word": "grønn", "translation": "zelen" } ],
    "mesta_objekti":  [ { "word": "et tre", "translation": "drvo" } ],
    "ljudi_radnje":   [ { "word": "et barn som leker", "translation": "dete koje se igra" } ],
    "korisni_izrazi": [ { "word": "å gå tur", "translation": "šetati" } ]
  },
  "sentence_starters": [
    "På bildet ser jeg ...",
    "I forgrunnen er det ...",
    "I bakgrunnen kan man se ...",
    "Til høyre/venstre ser vi ...",
    "Personen ser ut til å ...",
    "Det virker som om ...",
    "Bildet viser ...",
    "Stemningen virker ..."
  ],
  "description_hint": "kratak savet (1-2 rečenice) na srpskom kako da student strukturira opis"
}

PRAVILA:
- Imenice MORAJU imati član (en/ei/et) ispred — npr. "en park", "et tre".
- Glagoli moraju biti u infinitivu sa "å" — npr. "å sitte", "å gå tur".
- Pridevi u osnovnom obliku — npr. "grønn", "stor".
- Svaka grupa treba 6-12 stavki (ukupno 30-60 reči/izraza) ako slika to dozvoljava.
- Sve striktno relevantno za sliku. Ne izmišljaj objekte koji nisu na slici.
- Bokmål, korektno gramatički. Srpski prevodi kratki i precizni.
- "sentence_starters" su KRATKI POČECI/FRAGMENTI rečenica koje student sam dovršava.
  NE pisati pune primere rečenica — samo počeci sa "..." na kraju.
- NE vraćaj polje "phrases_by_level" ni pune primere rečenica.`;
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
            { type: "text", text: "Analiziraj sliku i izvuci što više relevantnog vokabulara po grupama, plus kratke početke rečenica." },
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

    // Backward-compat: flatten groups into vocabulary array as well
    const groups = (parsed.vocabulary_groups || {}) as Record<string, { word: string; translation: string }[]>;
    if (groups && typeof groups === "object") {
      const flat: { word: string; translation: string; type?: string }[] = [];
      for (const [g, items] of Object.entries(groups)) {
        if (Array.isArray(items)) {
          for (const it of items) {
            if (it?.word) flat.push({ word: it.word, translation: it.translation, type: g });
          }
        }
      }
      if (!parsed.vocabulary) parsed.vocabulary = flat;
    }
    // Strip full example phrases per new spec
    delete (parsed as Record<string, unknown>).phrases_by_level;

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
