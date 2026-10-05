import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";
const LANG_NAME: Record<string, string> = { no: "Norwegian Bokmål", de: "German", en: "English" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI nije podešen." }, 500);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Missing authorization" }, 401);
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { action, lessonId, messages, text } = await req.json();
    const { data: lesson } = await supabase.from("course_lessons").select("*").eq("id", lessonId).maybeSingle();
    if (!lesson) return json({ error: "Lekcija nije pronađena." }, 404);
    const lang = LANG_NAME[lesson.language] ?? "Norwegian Bokmål";
    const words = (lesson.vocabulary as { word: string }[]).map((w) => w.word).join(", ");
    const grammar = (lesson.grammar as { title: string }[]).map((g) => g.title).join("; ");
    const ctx = `Lesson "${lesson.title}" (${lesson.title_target}), CEFR ${lesson.cefr_level}. Topic summary: ${lesson.summary}. Lesson text: ${(lesson.text_segments as { text: string }[]).map((s) => s.text).join(" ")}. Target vocabulary: ${words}. Grammar: ${grammar}.`;

    let sys: string; let msgs: { role: string; content: string }[];
    if (action === "chat") {
      if (!Array.isArray(messages) || messages.length > 40) return json({ error: "Invalid messages" }, 400);
      sys = `You are a friendly conversation partner for a ${lesson.cefr_level} learner of ${lang}. ${ctx}
Role-play a short everyday conversation about this lesson's topic, using only its vocabulary and grammar level. Use correct V2 word order and natural prepositions. Ask one simple question per turn.
Reply ONLY as JSON: {"reply": "<1-3 short sentences in ${lang}>", "translation": "<Serbian Latin translation of reply>", "correction": "<if the learner's last message had mistakes: corrected version + very short explanation in Serbian Latin; otherwise empty string>"}`;
      msgs = messages.map((m: { role: string; content: string }) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content).slice(0, 1000) }));
      if (!msgs.length) msgs = [{ role: "user", content: "(Start the conversation.)" }];
    } else if (action === "write") {
      if (typeof text !== "string" || !text.trim() || text.length > 3000) return json({ error: "Neispravan tekst." }, 400);
      sys = `You are a ${lang} writing teacher for a ${lesson.cefr_level} learner. ${ctx}
The learner wrote a short text on this lesson's topic. Evaluate strictly by their level. Reply ONLY as JSON: {"corrected": "<corrected text in ${lang}>", "feedback": "<2-4 sentences in Serbian Latin: what is good, main mistakes>", "used_words": ["<lesson words the learner used>"]}`;
      msgs = [{ role: "user", content: text }];
    } else return json({ error: "Invalid action" }, 400);

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: sys }, ...msgs], response_format: { type: "json_object" } }),
    });
    if (r.status === 429) return json({ error: "Previše zahteva, pokušaj malo kasnije." }, 429);
    if (r.status === 402) return json({ error: "AI krediti su potrošeni." }, 402);
    if (!r.ok) { console.error(await r.text()); return json({ error: "AI greška." }, 500); }
    const data = await r.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    try { return json(JSON.parse(content)); } catch { return json({ reply: content }); }
  } catch (e) {
    console.error(e);
    return json({ error: "Internal server error" }, 500);
  }
});
