import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, messages, profile, settings } = await req.json();

    const userLevel = profile?.level || "A1";

    const cefrExpectations: Record<string, string> = {
      A1: "Fokus na osnovnu strukturu rečenice i razumljivost. Očekuj jednostavne rečenice, osnovne glagole u prezentu.",
      A2: "Fokus na stabilnost glagolskih vremena i jednostavne veznike (og, men, fordi). Očekuj kratke povezane rečenice.",
      B1: "Fokus na zavisne rečenice i izražavanje mišljenja (jeg synes at, jeg tror at). Očekuj složenije strukture.",
      B2: "Fokus na stilsku varijaciju i složene strukture (leddsetninger, passiv). Očekuj idiomatske izraze.",
      C1: "Fokus na nijanse, idiomatski jezik i preciznost. Očekuj akademski/profesionalni registar.",
    };
    const cefrFocus = cefrExpectations[userLevel] || cefrExpectations["A1"];

    const qualityCheck = `

OBAVEZNA SAMOPROVERA pre slanja odgovora:
- Norveški tekst nema gramatičke greške.
- Red reči u rečenicama je ispravan (V2 pravilo u glavnoj rečenici).
- Prepozicije su prirodne (ne doslovno sa srpskog).
- Korišćen je nivo ${userLevel} (ne pretežak vokabular).
- Značenje je isto kao cilj; nema izmišljenih detalja.
- Nema kontradikcija i nema "čudnih" formulacija.
Ako bilo šta nije sigurno: pojednostavi rečenicu. Ne dodaj nove informacije.`;

    const cefrEvalBlock = `

VIŠEDIMENZIONALNA EVALUACIJA (primeni kad ispravljaš ili daješ povratnu informaciju korisniku):
Nivo korisnika: ${userLevel}. ${cefrFocus}

Evaluiraj korisnikov tekst po 5 dimenzija:
1. Gramatika – tačnost gramatičkih struktura
2. Vokabular – raspon i prikladnost reči
3. Jasnoća – razumljivost poruke
4. Povezivanje – upotreba veznika i struktura rečenica
5. Prirodnost – ton i pragmatička prikladnost

PRAVILA za povratnu informaciju:
- Navedi snage u svakoj dimenziji kratko (✓ ili kratka pohvala).
- Identifikuj NAJVIŠE 2 najvažnije oblasti za poboljšanje.
- Ne preopterećuj učenika – budi koncizan.
- Na kraju ispravljanja dodaj blok:

**Nivo analiza:**
- Gramatika: [kratka ocena]
- Vokabular: [kratka ocena]
- Jasnoća: [kratka ocena]
- Povezivanje: [kratka ocena]
- Prirodnost: [kratka ocena]

**Sledeći korak u učenju:**
[1–2 konkretne preporuke na srpskom]

Objašnjenja piši jednostavno na srpskom, bez lingvističkog žargona.`;

    // ── CHAT action ──
    if (action === "chat") {
      const situationCtx = settings?.situation
        ? `Situacija: ${settings.situation}.`
        : "";
      const formalityCtx = settings?.formality
        ? `Formalnost: ${settings.formality}.`
        : "";
      const roleCtx = settings?.role
        ? `Tvoja uloga u razgovoru: ${settings.role}.`
        : "";

      const systemPrompt = `Ti si AI sagovornik za vežbanje norveškog jezika (Bokmål).
Korisnik se zove ${profile?.name || "korisnik"}, nivo je ${profile?.level || "A1"}, cilj učenja: ${profile?.learning_goal || "svakodnevna komunikacija"}.
${situationCtx} ${formalityCtx} ${roleCtx}

PRAVILA:
1. Odgovaraj na norveškom (Bokmål), prilagođeno nivou korisnika.
2. Posle svake norveške poruke dodaj kratko objašnjenje na srpskom (prevod ključnih reči, gramatičke napomene).
3. Koristi markdown formatiranje: **bold** za norveške izraze, *italic* za srpske prevode.
4. Ispravi greške korisnika blago i poučno.
5. Drži se zadate situacije i formalnosti.
6. Budi prirodan i ohrabrujući.
${cefrEvalBlock}
${qualityCheck}`;

      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required, please add credits." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        throw new Error("AI gateway error");
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // ── RECAP action ──
    if (action === "recap") {
      const systemPrompt = `Ti si nastavnik norveškog jezika. Analiziraj sledeći razgovor i napravi rezime sesije.
Korisnik se zove ${profile?.name || "korisnik"}, nivo je ${profile?.level || "A1"}.

Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "strengths": ["tačka 1", "tačka 2", "tačka 3"],
  "mistakes": ["greška 1", "greška 2", "greška 3"],
  "useful_phrases": [
    { "norwegian": "norveški izraz", "serbian": "srpski prevod" },
    { "norwegian": "norveški izraz", "serbian": "srpski prevod" },
    { "norwegian": "norveški izraz", "serbian": "srpski prevod" },
    { "norwegian": "norveški izraz", "serbian": "srpski prevod" },
    { "norwegian": "norveški izraz", "serbian": "srpski prevod" }
  ]
}

Strengths i mistakes piši na srpskom. Strengths su pozitivne stvari iz razgovora. Mistakes su konkretne greške.
${qualityCheck}`;

      const conversationText = (messages || [])
        .map((m: any) => `${m.role === "user" ? "Korisnik" : "AI"}: ${m.content}`)
        .join("\n");

      const response = await fetch(GATEWAY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Analiziraj ovaj razgovor:\n\n${conversationText}` },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI recap error:", response.status, t);
        throw new Error("AI recap failed");
      }

      const aiData = await response.json();
      let content = aiData.choices?.[0]?.message?.content || "";
      content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        console.error("Failed to parse recap:", content);
        throw new Error("Invalid recap format");
      }

      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Talk AI error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
