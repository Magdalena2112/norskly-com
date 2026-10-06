import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://ai.gateway.lovable.dev";
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;
const LANG_NAME: Record<string, string> = { no: "Norwegian Bokmål", de: "German", en: "English" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI nije podešen." }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const form = await req.formData();
    const file = form.get("file");
    const expected = String(form.get("expected") || "").trim().slice(0, 500);
    const lang = ["no", "de", "en"].includes(String(form.get("language"))) ? String(form.get("language")) : "no";
    const level = String(form.get("level") || "A1").slice(0, 3);
    if (!(file instanceof File) || !file.size || file.size > MAX_AUDIO_BYTES || !expected) {
      return json({ error: "Neispravan snimak." }, 400);
    }

    // 1) Transcribe
    const up = new FormData();
    up.append("model", "openai/gpt-transcribe");
    up.append("file", file, file.name || "voice.webm");
    up.append("response_format", "json");
    up.append("languages", lang);
    const sr = await fetch(`${GATEWAY}/v1/audio/transcriptions`, {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}` }, body: up,
    });
    const srText = await sr.text();
    if (!sr.ok) {
      console.error("STT error", sr.status, srText);
      return json({ error: sr.status === 429 ? "Previše zahteva, pokušaj malo kasnije." : "Prepoznavanje govora nije uspelo." }, sr.status === 429 ? 429 : 502);
    }
    let heard = "";
    try { heard = (JSON.parse(srText).text || "").trim(); } catch { heard = srText.trim(); }
    if (!heard) {
      return json({ score: 0, heard: "", verdict: "retry", feedback: "Nisam uspeo/la da čujem govor. Približi se mikrofonu i pokušaj ponovo.", words: [] });
    }

    // 2) Evaluate
    const sys = `You are a friendly ${LANG_NAME[lang]} pronunciation coach for a Serbian-speaking learner at CEFR ${level}.
You get the TARGET text and what speech recognition HEARD. Mismatches reveal pronunciation problems (recognizer is lenient about punctuation/case — ignore those).
Return ONLY JSON: {"score": 0-100 integer, "verdict": "excellent"|"good"|"retry", "feedback": "1-2 short encouraging sentences in Serbian (Latin script)", "tip": "one concrete articulation tip in Serbian Latin (mouth/tongue/lips/stress) for the weakest sound, or empty string if perfect", "words": [{"word": "target word", "ok": true|false}]}
excellent >= 90, good 70-89, retry < 70. "words" must list every target word in order.`;
    const r = await fetch(`${GATEWAY}/v1/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: sys }, { role: "user", content: `TARGET: ${expected}\nHEARD: ${heard}` }],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("Eval error", r.status, t);
      if (r.status === 402) return json({ error: "AI krediti su potrošeni." }, 402);
      return json({ error: "Procena izgovora nije uspela." }, 502);
    }
    const data = await r.json();
    let out: any = {};
    try { out = JSON.parse(data.choices?.[0]?.message?.content || "{}"); } catch { out = {}; }
    const score = Math.max(0, Math.min(100, Math.round(Number(out.score) || 0)));
    const verdict = score >= 90 ? "excellent" : score >= 70 ? "good" : "retry";
    return json({
      score, verdict, heard,
      feedback: String(out.feedback || ""),
      tip: String(out.tip || ""),
      words: Array.isArray(out.words) ? out.words.slice(0, 60).map((w: any) => ({ word: String(w.word || ""), ok: !!w.ok })) : [],
    });
  } catch (e) {
    console.error("pronunciation-check error", e);
    return json({ error: "Greška na serveru." }, 500);
  }
});
