import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ERROR_EXTRACT_BLOCK = `

Takođe, u odgovor OBAVEZNO dodaj polje "_errors" koje sadrži strukturirane greške korisnika.
Format:
"_errors": [
  {
    "category": "kratka kategorija greške (npr. word_order, verb_form, preposition, article, spelling)",
    "topic": "specifična tema (npr. V2 pravilo, presens vs perfektum)",
    "severity": 1-3 (1=mala, 2=srednja, 3=velika),
    "example_wrong": "pogrešan deo",
    "example_correct": "tačan deo"
  }
]
Ako nema grešaka, vrati prazan niz: "_errors": []
`;

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

    const { action, level, topic, count, text, unique_seed, attempt_no, previous_sentences } = await req.json();

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
    let errorLimit = 2;

    const uniqueSeed = unique_seed || "";

    if (action === "generate_exercises") {
      const prevBlock = Array.isArray(previous_sentences) && previous_sentences.length > 0
        ? `\n\nEvo rečenica koje su VEĆ KORIŠĆENE u prethodnim vežbama — NE KORISTI ih ponovo i NE pravi slične varijante:\n${previous_sentences.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n`
        : "";
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Generišeš gramatičke vežbe za nivo ${level}.
VAŽNO: Svaki put generiši potpuno NOVE i RAZNOVRSNE rečenice. Ne ponavljaj prethodne primere. Variraj kontekst, vokabular i strukturu rečenica. Koristi različite životne situacije (posao, porodica, putovanja, hobiji, svakodnevica). Seed: ${uniqueSeed}${prevBlock}
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
    } else if (action === "check_exercise") {
      errorLimit = 2;
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Korisnik pokušava da reši gramatičku vežbu.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "is_correct": true/false,
  "hint": "Ako je netačno: kratki hint na srpskom koji ukazuje na pravilo, bez davanja odgovora. Ako je tačno: kratka pohvala.",
  "close": true/false,
  "_errors": [...]
}
${ERROR_EXTRACT_BLOCK}
OGRANIČENJE: Maksimalno ${errorLimit} greške u _errors nizu.
Ako je tačan odgovor, "_errors" mora biti prazan niz.` + qualityCheck;
      userPrompt = `Vežba: "${text}"\nKorisnikov odgovor: "${topic}"\nTačan odgovor: "${count}"\nNivo: ${level}\nBroj pokušaja: ${attempt_no || 1}`;
    } else if (action === "correct_text") {
      errorLimit = 5;
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
  "sledeci_korak": ["preporuka 1", "preporuka 2"],
  "_errors": [...]
}
${ERROR_EXTRACT_BLOCK}
OGRANIČENJE: Maksimalno ${errorLimit} grešaka u _errors nizu.
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
      "explanation": "Objašnjenje na srpskom",
      "_error": {
        "category": "kategorija greške",
        "topic": "specifična tema",
        "severity": 1,
        "example_wrong": "pogrešna opcija koja se najčešće bira",
        "example_correct": "tačan odgovor"
      }
    }
  ]
}` + qualityCheck;
      userPrompt = `Generiši 5 kviz pitanja na temu "${topic}". Nivo: ${level}. Svako pitanje ima 4 opcije i jedno tačno rešenje. Za svako pitanje dodaj _error objekat sa kategorijom greške.`;
    } else if (action === "explain_topic") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Objašnjavaš gramatičke teme za nivo ${level}.
${cefrFocus}

Korisnik može postaviti pitanje na srpskom, norveškom ili mešovito. Protumači nameru čak i ako je formulacija neformalna.
Ako je tema preširoka, automatski je suzi na najkorisniji aspekt za nivo ${level}.
Ako je tema napredna za nivo korisnika, pojednostavi objašnjenje.

Svako objašnjenje treba da bude kao mini-lekcija: detaljno, strukturirano i pedagoški korisno.

Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. Format:
{
  "naslov": "Kratki naslov teme na srpskom",
  "sazetak": "Kratak rezime od 2–3 rečenice koji daje brz i jednostavan odgovor pre detaljnih sekcija.",
  "definicija": "Detaljno objašnjenje gramatičke teme: šta je, koja je funkcija, kada se koristi, koja je logika iza pravila. Ovo treba da bude dublje od prostog opisa — objasni ZAŠTO pravilo postoji i kako funkcioniše u jeziku. Prilagodi dubinu nivou ${level}.",
  "formula": {
    "label": "Naziv gramatičkog obrasca (npr. Perfektum, Preteritum, Leddsetning)",
    "pattern": "Obrazac/formula (npr. subjekt + har/er + perfektum particip)",
    "examples": ["Primer 1 na norveškom", "Primer 2 na norveškom"]
  },
  "kada_se_koristi": [
    "Situacija 1 kada se koristi (na srpskom)",
    "Situacija 2 kada se koristi"
  ],
  "kada_se_ne_koristi": [
    "Situacija ili čest slučaj kada se NE koristi ili kada treba koristiti drugi oblik (na srpskom)",
    "Kontrast sa sličnom strukturom"
  ],
  "poredjenje": {
    "title": "Naslov poređenja (npr. Preteritum vs Perfektum)",
    "left_label": "Leva strana (npr. Preteritum)",
    "right_label": "Desna strana (npr. Perfektum)",
    "rows": [
      { "left": "Primer levo (norveški)", "right": "Primer desno (norveški)", "note": "Kratko objašnjenje razlike (srpski)" }
    ]
  },
  "primeri": {
    "jednostavni": [
      { "no": "Jednostavan primer na norveškom", "sr": "Prevod na srpski" }
    ],
    "iz_zivota": [
      { "no": "Primer iz svakodnevnog života", "sr": "Prevod", "kontekst": "Kratko objašnjenje konteksta" }
    ],
    "kontrastni": [
      { "pogresno": "Pogrešna upotreba", "tacno": "Tačna upotreba", "objasnjenje": "Zašto je pogrešno" }
    ]
  },
  "tipicne_greske": [
    { "pogresno": "Pogrešan primer", "tacno": "Tačan primer", "objasnjenje": "Detaljno objašnjenje zašto je pogrešno i koje pravilo je prekršeno" }
  ],
  "mini_savet": "Kratak praktičan savet ili trik za pamćenje — pravilo palca koje pomaže studentu da zapamti koncept",
  "povezane_teme": ["Povezana tema 1", "Povezana tema 2"]
}

VAŽNA UPUTSTVA:
- Generiši 3–5 jednostavnih primera, 2–3 primera iz života, i 1–3 kontrastna primera, prilagođenih nivou ${level}.
- Navedi 2–4 tipične greške specifične za nivo, sa detaljnim objašnjenjima.
- Za "kada_se_koristi" navedi 3–5 stavki.
- Za "kada_se_ne_koristi" navedi 2–3 stavki sa jasnim kontrastima.
- Ako tema uključuje dva srodna koncepta (npr. preteritum vs perfektum, bestemt vs ubestemt), OBAVEZNO popuni "poredjenje" sa 3–5 redova. Ako nema prirodnog poređenja, vrati "poredjenje": null.
- Za "povezane_teme" navedi 2–4 povezane gramatičke teme koje bi student mogao da istraži dalje.
- Objašnjenja piši na srpskom, primere na norveškom.
- Formulu piši jednostavno i jasno, sa 2–3 primera primene.` + qualityCheck;
      userPrompt = `Objasni sledeću gramatičku temu za nivo ${level}:\n\n"${text || topic}"`;
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
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          let cleaned = jsonMatch[0].replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
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

    // Save correction to grammar_submissions
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
