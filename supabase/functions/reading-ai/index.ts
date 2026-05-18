import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const lengthSpec: Record<string, string> = {
  kratak: "kratak tekst (80–130 reči)",
  srednji: "srednji tekst (180–260 reči)",
  duzi: "duži tekst (320–450 reči)",
};

const cefrSpec: Record<string, string> = {
  A1: "Vrlo jednostavan vokabular, kratke rečenice, sadašnje vreme.",
  A2: "Jednostavne rečenice, prošlo i sadašnje vreme, osnovni veznici.",
  B1: "Povezane rečenice, izražavanje mišljenja, raznovrsna vremena.",
  B2: "Složenije strukture, apstraktnije teme, nijansiraniji izrazi.",
  C1: "Bogat vokabular, idiomatski izrazi, složene argumentacije.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader! } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = String(body.action || "");
    const level = String(body.level || "A1");
    const topic = String(body.topic || "svakodnevni život").slice(0, 200);
    const length = String(body.length || "kratak");
    const cefr = cefrSpec[level] || cefrSpec.A1;
    const lenDesc = lengthSpec[length] || lengthSpec.kratak;

    const isAdvanced = level === "B1" || level === "B2" || level === "C1";
    const instrLang = isAdvanced
      ? "Sva pitanja i tekstovi zadataka MORAJU biti na norveškom (Bokmål)."
      : "Sva pitanja i tekstovi zadataka MORAJU biti na srpskom (latinica). Reči/izrazi koje student treba da analizira ostaju na norveškom.";

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "generate") {
      systemPrompt = `Ti si nastavnik norveškog jezika (Bokmål). Pravi tekst za čitanje prilagođen CEFR nivou ${level}. ${cefr}
${instrLang}
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a. STRUKTURA VEŽBI MORA BITI TAČNO OVIM REDOSLEDOM:
1) Najpre TAČNO 5 vežbi tipa "true_false" (ids 1–5)
2) Zatim 3–5 vežbi tipa "open" (pitanja razumevanja teksta)
3) Na kraju vokabularne vežbe: redom barem po jedna "synonym", "antonym" i "vocab" (ukupno 3–5)

{
  "title": "Naslov teksta na norveškom",
  "text": "Tekst na norveškom (${lenDesc}). Koristi paragrafe odvojene praznim redom.",
  "vocabulary": [
    { "word": "norveška reč", "translation": "prevod na srpski", "explanation": "kratko objašnjenje na srpskom" }
  ],
  "exercises": [
    { "id": 1, "type": "true_false", "question": "${isAdvanced ? "Tvrdnja na norveškom" : "Tvrdnja na srpskom"}", "answer": true, "explanation": "${isAdvanced ? "objašnjenje na norveškom" : "objašnjenje na srpskom"}" },
    { "id": 6, "type": "open", "question": "${isAdvanced ? "Svar på spørsmålet …" : "Odgovori na pitanje …"}", "answer": "očekivani sažet odgovor na norveškom", "explanation": "" },
    { "id": 10, "type": "synonym", "question": "${isAdvanced ? "Finn et synonym for ordet 'X'." : "Pronađi sinonim za reč 'X'."}", "word": "X", "answer": "sinonim na norveškom", "explanation": "" },
    { "id": 11, "type": "antonym", "question": "${isAdvanced ? "Finn et antonym for ordet 'Y'." : "Pronađi antonim za reč 'Y'."}", "word": "Y", "answer": "antonim na norveškom", "explanation": "" },
    { "id": 12, "type": "vocab", "question": "${isAdvanced ? "Forklar betydningen av uttrykket 'Z' i denne sammenhengen." : "Objasni značenje izraza 'Z' u datom kontekstu."}", "word": "Z", "answer": "kratko objašnjenje (${isAdvanced ? "na norveškom" : "na srpskom"})", "explanation": "" }
  ]
}
Vokabular: 6–10 ključnih reči iz teksta. Sve vežbe MORAJU biti generisane navedenim redosledom (true_false → open → synonym/antonym/vocab).`;
      userPrompt = `Tema: "${topic}". Nivo: ${level}. Dužina: ${lenDesc}. Generiši tekst i vežbe po zadatoj strukturi.`;
    } else if (action === "evaluate") {
      const exercises = body.exercises || [];
      const answers = body.answers || {};
      systemPrompt = `Ti si nastavnik norveškog jezika. Ocenjuješ odgovore studenta na nivou ${level}.
Odgovori ISKLJUČIVO u JSON formatu, bez markdown-a:
{
  "results": [
    { "id": 1, "is_correct": true/false, "user_answer": "...", "correct_answer": "...", "explanation": "objašnjenje na srpskom", "feedback": "kratak komentar" }
  ],
  "score": broj_tačnih,
  "total": ukupno,
  "overall_feedback": "kratak opšti komentar na srpskom",
  "vocabulary_feedback": "saveti za vokabular na srpskom"
}
Za true_false: tačno ako se boolean poklapa.
Za open/synonym/antonym/vocab: budi tolerantan na sinonime i parafraze; ocenjuj značenjski, ne doslovno.`;
      userPrompt = `Vežbe i odgovori studenta:\n${JSON.stringify({ exercises, answers }, null, 2)}`;
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: action === "generate" ? 0.85 : 0.4,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Pokušaj ponovo za trenutak." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI krediti su potrošeni." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI request failed");
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0].replace(/,\s*}/g, "}").replace(/,\s*]/g, "]"));
      } else {
        throw new Error("Invalid AI response");
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reading AI error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
