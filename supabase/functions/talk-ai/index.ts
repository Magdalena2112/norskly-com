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

    const { action, messages: rawMessages, profile, settings, language: rawLanguage } = await req.json();
    const language = (typeof rawLanguage === "string" && ["no", "en", "de"].includes(rawLanguage)) ? rawLanguage : "no";

    // Input validation: cap messages count/size and whitelist roles to prevent
    // prompt injection (e.g., injected system messages) and cost amplification.
    const MAX_MESSAGES = 50;
    const MAX_TOTAL_CHARS = 20000;
    const MAX_MSG_CHARS = 4000;
    if (!Array.isArray(rawMessages) || rawMessages.length > MAX_MESSAGES) {
      return new Response(JSON.stringify({ error: "Invalid messages" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    let totalChars = 0;
    const messages: { role: "user" | "assistant"; content: string }[] = [];
    for (const m of rawMessages) {
      if (!m || typeof m !== "object") continue;
      const role = (m as any).role;
      const content = (m as any).content;
      if (role !== "user" && role !== "assistant") {
        return new Response(JSON.stringify({ error: "Invalid message role" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof content !== "string" || content.length > MAX_MSG_CHARS) {
        return new Response(JSON.stringify({ error: "Message too large" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      totalChars += content.length;
      if (totalChars > MAX_TOTAL_CHARS) {
        return new Response(JSON.stringify({ error: "Messages exceed total size limit" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      messages.push({ role, content });
    }

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

    // ── Personalization helpers (focus_area + life_context) ──
    const focusArea = (profile?.focus_area || "").toString().toLowerCase().trim();
    const lifeContext = (profile?.life_context || "").toString().toLowerCase().trim();

    const enFocusMap: Record<string, string> = {
      "govor": "prioritize natural spoken phrasing, contractions, and conversational fillers",
      "speaking": "prioritize natural spoken phrasing, contractions, and conversational fillers",
      "pisanje": "favor a written register, full sentences, punctuation and paragraph flow",
      "writing": "favor a written register, full sentences, punctuation and paragraph flow",
      "gramatika": "weave one targeted grammar reminder into each correction",
      "grammar": "weave one targeted grammar reminder into each correction",
      "vokabular": "introduce 1–2 fresh on-topic words per reply and reuse them in context",
      "vocabulary": "introduce 1–2 fresh on-topic words per reply and reuse them in context",
      "izgovor": "flag tricky sounds, stress patterns and intonation when relevant",
      "pronunciation": "flag tricky sounds, stress patterns and intonation when relevant",
    };
    const enLifeMap: Record<string, string> = {
      "travel": "airports, hotels, directions, ordering food, sightseeing",
      "business english": "meetings, email phrasing, polite assertiveness, negotiation",
      "business": "meetings, email phrasing, polite assertiveness, negotiation",
      "job interviews": "STAR answers, professional self-introduction, common interview questions",
      "interviews": "STAR answers, professional self-introduction, common interview questions",
      "movies and series": "idioms, slang, pop-culture references",
      "movies": "idioms, slang, pop-culture references",
      "everyday communication": "small talk, daily routines, casual conversations",
      "everyday": "small talk, daily routines, casual conversations",
      "social media and internet": "casual tone, common abbreviations, online etiquette",
      "social media": "casual tone, common abbreviations, online etiquette",
      "studies abroad": "academic vocabulary, campus life, course registration",
      "studies": "academic vocabulary, campus life, course registration",
    };

    const enFocusLine = focusArea && enFocusMap[focusArea]
      ? `Learner's focus area is "${focusArea}" — ${enFocusMap[focusArea]}.`
      : focusArea ? `Learner's focus area is "${focusArea}" — adapt examples and corrections accordingly.` : "";
    const enLifeLine = lifeContext && enLifeMap[lifeContext]
      ? `Anchor scenarios and vocabulary in the learner's real-life context: ${lifeContext} (${enLifeMap[lifeContext]}).`
      : lifeContext ? `Anchor scenarios and vocabulary in the learner's real-life context: ${lifeContext}.` : "";

    const noFocusLine = focusArea ? `Korisnikova fokusna oblast je "${focusArea}" — prilagodi primere i ispravke tome.` : "";
    const noLifeLine = lifeContext ? `Vezuj situacije i vokabular za stvarni kontekst korisnika: ${lifeContext}.` : "";

    // ── CHAT action ──
    if (action === "chat") {
      const situationCtx = settings?.situation ? `Situacija: ${settings.situation}.` : "";
      const formalityCtx = settings?.formality ? `Formalnost: ${settings.formality}.` : "";
      const roleCtx = settings?.role ? `Tvoja uloga u razgovoru: ${settings.role}.` : "";

      const enSituation = settings?.situation ? `Situation: ${settings.situation}.` : "";
      const enFormality = settings?.formality ? `Formality: ${settings.formality}.` : "";
      const enRole = settings?.role ? `Your role in the conversation: ${settings.role}.` : "";

      const englishPrompt = `You are an AI English tutor having a natural conversation with ${profile?.name || "the learner"} at CEFR level ${profile?.level || "A1"}. Learning goal: ${profile?.learning_goal || "everyday communication"}.
${enSituation} ${enFormality} ${enRole}
${enFocusLine}
${enLifeLine}

RULES:
1. Reply using EXACTLY the section format below. Each section starts with its tag on a new line.
2. Stay inside the requested situation, formality and role.
3. Be natural, warm and encouraging.
4. The student's UI language is Serbian — write explanations, corrections and feedback in Serbian. Only the [RESPONSE] section and the English example words/phrases are in English.

RESPONSE FORMAT (use these tags EXACTLY):

[ODGOVOR]
A natural English reply suitable for CEFR ${profile?.level || "A1"}. No explanations, just English text. Keep it 1–3 sentences.

[VOKABULAR]
List 3–5 useful words or phrases from your reply, each anchored in the learner's life context when possible. Format:
- **english word/phrase** — srpski prevod

[ISPRAVKE]
If the user made mistakes, correct them briefly. Format:
- ❌ wrong → ✅ correct (kratko objašnjenje na srpskom)
If no mistakes: "Nema grešaka, odlično! ✓"

[POVRATNA INFORMACIJA]
1–2 rečenice na srpskom: gramatika, jasnoća, prirodnost.

[SLEDEĆI KORAK]
Jedan konkretan predlog na srpskom za nastavak razgovora, vezan za izabrani kontekst (${lifeContext || "opšti"}).

IMPORTANT: Always include all 5 sections. Keep each section short.
${qualityCheck}`;

      const norwegianPrompt = `Ti si AI sagovornik za vežbanje norveškog jezika (Bokmål).
Korisnik se zove ${profile?.name || "korisnik"}, nivo je ${profile?.level || "A1"}, cilj učenja: ${profile?.learning_goal || "svakodnevna komunikacija"}.
${situationCtx} ${formalityCtx} ${roleCtx}
${noFocusLine}
${noLifeLine}

PRAVILA:
1. Odgovaraj koristeći TAČNO ovaj format sa sekcijama. Svaka sekcija počinje oznakom na novom redu.
2. Drži se zadate situacije i formalnosti.
3. Budi prirodan i ohrabrujući.

FORMAT ODGOVORA (koristi TAČNO ove oznake):

[ODGOVOR]
Napiši samo prirodan odgovor na norveškom (Bokmål), prilagođen nivou ${userLevel}. Bez objašnjenja, samo norveški tekst. Kratko, 1-3 rečenice.

[VOKABULAR]
Navedi 3-5 korisnih reči ili izraza iz tvog odgovora. Format svake stavke:
- **norveška reč/izraz** — srpski prevod

[ISPRAVKE]
Ako je korisnik napravio greške, kratko ih ispravi. Format:
- ❌ pogrešno → ✅ ispravno (kratko objašnjenje)
Ako nema grešaka, napiši: Nema grešaka, odlično! ✓

[POVRATNA INFORMACIJA]
Kratka evaluacija (1-2 rečenice) korisnikovog teksta: gramatika, jasnoća, prirodnost. Piši na srpskom.

[SLEDEĆI KORAK]
Jedan konkretan predlog za nastavak razgovora na srpskom (npr. "Probaj da pitaš o...").

VAŽNO: Uvek koristi sve 5 sekcija. Drži svaku sekciju kratkom.
${qualityCheck}`;

      const systemPrompt = language === "en" ? englishPrompt : norwegianPrompt;

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
      const recapLangLabel = language === "en" ? "engleskog" : language === "de" ? "nemačkog" : "norveškog";
      const systemPrompt = `Ti si nastavnik ${recapLangLabel} jezika. Analiziraj sledeći razgovor i napravi rezime sesije.
Korisnik se zove ${profile?.name || "korisnik"}, nivo je ${userLevel}. ${cefrFocus}
${focusArea ? `Fokusna oblast korisnika: ${focusArea}. Istakni napredak i preporuke u toj oblasti.` : ""}
${lifeContext ? `Stvarni kontekst korisnika: ${lifeContext}. Vezuj korisne fraze i sledeće korake za ovaj kontekst.` : ""}


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
  ],
  "nivo_analiza": {
    "gramatika": "kratka ocena",
    "vokabular": "kratka ocena",
    "jasnoća": "kratka ocena",
    "povezivanje": "kratka ocena",
    "prirodnost": "kratka ocena"
  },
  "sledeci_korak": ["preporuka 1", "preporuka 2"],
  "_errors": [
    {
      "category": "kategorija greške",
      "topic": "specifična tema",
      "severity": 1-3,
      "example_wrong": "pogrešan primer iz razgovora",
      "example_correct": "ispravljena verzija"
    }
  ]
}

PRAVILA ZA _errors:
- Identifikuj TAČNO 3 najvažnije greške iz razgovora.
- Svaka greška mora imati konkretan primer iz razgovora.
- Kategorije: word_order, verb_form, preposition, article, spelling, gender, meaning_confusion, idiom_misuse, formality_mismatch.

Strengths i mistakes piši na srpskom. Strengths su pozitivne stvari iz razgovora. Mistakes su konkretne greške.
Nivo analiza: oceni svaku od 5 dimenzija kratko (1 rečenica). Sledeći korak: daj 1-2 konkretne preporuke.
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
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
