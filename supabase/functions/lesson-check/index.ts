import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { loadLearnerStyleLine } from "../_shared/learnerStyle.ts";
import { buildRubricLine } from "../_shared/pedagogy/skillsMatrix.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/responses";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json", ...extra } });

const LANG: Record<string, string> = { en: "engleskog", no: "norveškog (Bokmål)", de: "nemačkog" };

const schema = {
  type: "object",
  additionalProperties: false,
  required: ["results", "errors"],
  properties: {
    results: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["index", "verdict", "feedback", "improved"],
        properties: {
          index: { type: "integer" },
          verdict: { type: "string", enum: ["correct", "partial", "incorrect"] },
          feedback: { type: "string" },
          improved: { type: "string" },
        },
      },
    },
    errors: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "topic", "severity", "example_wrong", "example_correct"],
        properties: {
          category: { type: "string", enum: ["grammar", "vocabulary", "spelling", "word_order", "other"] },
          topic: { type: "string" },
          severity: { type: "integer" },
          example_wrong: { type: "string" },
          example_correct: { type: "string" },
        },
      },
    },
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI nije podešen." }, 500);
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const language = String(body.language || "en");
    const level = String(body.level || "A1").slice(0, 3);
    const lessonTitle = String(body.lessonTitle || "").slice(0, 200);
    const exercise = body.exercise || {};
    const items: { prompt: string; answer: string; guide?: string }[] = (body.items || []).slice(0, 10).map((i: any) => ({
      prompt: String(i.prompt || "").slice(0, 400),
      answer: String(i.answer || "").slice(0, 1500),
      guide: i.guide ? String(i.guide).slice(0, 400) : undefined,
    }));
    if (!items.length) return json({ error: "Nema odgovora." }, 400);

    const learnerStyle = await loadLearnerStyleLine(supabase, user.id, language, body.course);
    const instructions = `Ti si strpljiv tutor ${LANG[language] || "engleskog"} jezika na Norskly platformi. Ocenjuješ otvorene odgovore učenika nivoa ${level} u lekciji „${lessonTitle}“.
Pravila:
- Prihvati sve prirodne i semantički tačne varijante; ne traži jedan jedini odgovor.
- Ocenjuj samo ono što je u lekciji aktivno (za A1: kratke potvrdne rečenice, zamenice, am/is/are, a/an, pozdravi). Ne kažnjavaj nepoznate strukture ako su razumljive.
- Uputstva i povratna informacija su na srpskom (latinica), kratko i ohrabrujuće (1–2 rečenice). Primeri ostaju na ciljnom jeziku.
- verdict: correct (cilj ispunjen, bez važnih grešaka), partial (razumljivo ali sa greškom), incorrect (cilj nije ispunjen).
- improved: ispravljena prirodna verzija odgovora (ili isti tekst ako je tačan).
- errors: najviše 3 najvažnije greške ukupno, severity 1–3.`;
    const input = `Vežba ${exercise.code || ""}: ${exercise.title || ""}\nUputstvo: ${exercise.instruction || ""}\n\n` +
      items.map((it, i) => `[${i}] Zadatak: ${it.prompt}${it.guide ? `\nPrimer prihvatljivog odgovora: ${it.guide}` : ""}\nOdgovor učenika: ${it.answer || "(prazno)"}`).join("\n\n");

    const res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "fetch",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        stream: true,
        store: false,
        reasoning: { effort: "low" },
        instructions: [instructions, buildRubricLine(language, level, ["writing", "grammar", "vocabulary", "reading"]), learnerStyle].filter(Boolean).join("\n\n"),
        input,
        text: { format: { type: "json_schema", name: "lesson_grading", strict: true, schema } },
      }),
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      let msg = "AI provera trenutno nije dostupna.";
      try { msg = JSON.parse(t)?.error?.message || JSON.parse(t)?.message || msg; } catch { /* keep */ }
      if (res.status === 429) msg = "Previše zahteva, pokušaj ponovo za koji trenutak.";
      if (res.status === 402) msg = "Nema dovoljno AI kredita.";
      console.error("gateway", res.status, t.slice(0, 500));
      return json({ error: msg }, res.status);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let text = "";
    let refused = false;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          const ev = JSON.parse(data);
          if (ev.type === "response.output_text.delta") text += ev.delta || "";
          else if (ev.type === "response.refusal.delta") refused = true;
          else if (ev.type === "response.failed" || ev.type === "error") {
            return json({ error: ev.response?.error?.message || ev.message || "AI greška." }, 502);
          }
        } catch { /* ignore partial */ }
      }
    }
    if (refused || !text) return json({ error: "AI nije vratio ocenu." }, 502);
    const parsed = JSON.parse(text);
    return json(parsed, 200, { "X-Lovable-AIG-Run-ID": res.headers.get("X-Lovable-AIG-Run-ID") || "" });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Greška" }, 500);
  }
});
