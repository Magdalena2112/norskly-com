import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildPersonalizationLines, type LangCode } from "../_shared/personalization.ts";

const URL_RESPONSES = "https://ai.gateway.lovable.dev/v1/responses";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const LEVEL_GUIDE: Record<string, string> = {
  A1: "very simple everyday topics (family, home, daily routine, food, weekend); present tense; 40–70 words",
  A2: "experiences and plans (trip, first job, shopping, doctor visit); past tense, simple connectors; 70–120 words",
  B1: "opinions, comparisons, everyday challenges; subordinate clauses, expressing views; 120–180 words",
  B2: "argumentative or formal texts (society, work, integration, formal emails); 180–250 words",
  C1: "nuanced argumentative/formal texts, cover letters, complex issues; 250+ words",
};

const CATEGORIES: Record<string, string> = {
  svakodnevno: "everyday life",
  posao: "work and career",
  misljenje: "opinion / debate",
  formalno: "formal email or letter",
};

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["topics"],
  properties: {
    topics: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "title_sr", "guiding_questions", "keywords", "sentence_starters", "min_words", "max_words"],
        properties: {
          title: { type: "string" },
          title_sr: { type: "string" },
          guiding_questions: { type: "array", items: { type: "string" } },
          keywords: {
            type: "array",
            items: {
              type: "object", additionalProperties: false, required: ["word", "translation"],
              properties: { word: { type: "string" }, translation: { type: "string" } },
            },
          },
          sentence_starters: { type: "array", items: { type: "string" } },
          min_words: { type: "integer" },
          max_words: { type: "integer" },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI nije podešen." }, 500);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const level = ["A1", "A2", "B1", "B2", "C1"].includes(String(body.level)) ? String(body.level) : "A1";
    const lang = (["no", "en", "de"].includes(String(body.language)) ? String(body.language) : "no") as LangCode;
    const category = CATEGORIES[String(body.category)] || "";
    const avoid = Array.isArray(body.avoid) ? body.avoid.slice(0, 12).map((s: unknown) => String(s).slice(0, 120)) : [];
    const target = lang === "en" ? "English" : lang === "de" ? "German" : "Norwegian Bokmål";
    const pers = buildPersonalizationLines(lang, body.focus_area, body.life_context).englishLine;

    const instructions = `You create writing prompts for a ${level} learner of ${target}. Native language: Serbian (Latin script).
Level guide: ${LEVEL_GUIDE[level]}.
${category ? `Category: ${category}.` : "Mix three different categories (everyday life, work/career, opinion or formal letter as fits the level)."}
${pers}
${avoid.length ? `Do not repeat these topics: ${avoid.join("; ")}.` : ""}
Return exactly 3 distinct topics. For each: "title" in ${target}; "title_sr" Serbian translation; 3–4 "guiding_questions" in ${target} (for A1/A2 add the Serbian translation in parentheses); 5 "keywords" (word in ${target} with article for nouns, translation in Serbian); 3 "sentence_starters" in ${target} using natural, correct word order${lang !== "en" ? " (V2)" : ""}; min_words/max_words per level guide. All ${target} text must be grammatically perfect and level-appropriate.`;

    const ai = await fetch(URL_RESPONSES, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
        Authorization: `Bearer ${apiKey}`,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions,
        input: [{ role: "user", content: "Generate the 3 writing topics now." }],
        text: { format: { type: "json_schema", name: "writing_topics", strict: true, schema } },
      }),
    });

    if (!ai.ok || !ai.body) {
      const t = await ai.text().catch(() => "");
      console.error("gateway", ai.status, t);
      if (ai.status === 429) return json({ error: "Previše zahteva, pokušaj ponovo za par sekundi." }, 429);
      if (ai.status === 402) return json({ error: "Nedovoljno AI kredita." }, 402);
      if (ai.status === 403) return json({ error: "AI pristup je trenutno blokiran." }, 403);
      return json({ error: "AI greška" }, 500);
    }

    const reader = ai.body.getReader();
    const dec = new TextDecoder();
    let buf = "", out = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const d = line.slice(5).trim();
        if (!d || d === "[DONE]") continue;
        try {
          const ev = JSON.parse(d);
          if (ev.type === "response.output_text.delta") out += ev.delta || "";
          if (ev.type === "response.failed" || ev.type === "error") console.error("stream error", d);
        } catch { /* ignore */ }
      }
    }
    let parsed: { topics?: unknown[] } = {};
    try { parsed = JSON.parse(out); } catch { return json({ error: "AI nije vratio teme. Pokušaj ponovo." }, 502); }
    return json({ topics: (parsed.topics || []).slice(0, 3) });
  } catch (e) {
    console.error("writing-topics", e);
    return json({ error: "Greška" }, 500);
  }
});
