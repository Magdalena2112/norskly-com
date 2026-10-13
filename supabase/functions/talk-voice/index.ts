import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://ai.gateway.lovable.dev";
const STT_MODEL = "openai/gpt-transcribe";
const TTS_MODEL = "google/gemini-3.1-flash-tts-preview";
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;
const MAX_TTS_CHARS = 1500;
const ROLE_VOICES: Record<string, string> = { f: "Aoede", m: "Charon" };
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

    const contentType = req.headers.get("content-type") || "";

    // ── Transcription (multipart audio) ──
    if (contentType.startsWith("multipart/form-data")) {
      const len = Number(req.headers.get("content-length") || 0);
      if (len > MAX_AUDIO_BYTES + 100_000) return json({ error: "Snimak je predugačak." }, 413);
      const form = await req.formData();
      const file = form.get("file");
      const lang = String(form.get("language") || "no");
      if (!(file instanceof File) || !file.size || file.size > MAX_AUDIO_BYTES) {
        return json({ error: "Neispravan snimak." }, 400);
      }
      const up = new FormData();
      up.append("model", STT_MODEL);
      up.append("file", file, file.name || "voice.webm");
      up.append("response_format", "json");
      if (["no", "de", "en"].includes(lang)) up.append("languages", lang === "no" ? "no" : lang);
      const r = await fetch(`${GATEWAY}/v1/audio/transcriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: up,
      });
      const text = await r.text();
      if (!r.ok) {
        console.error("STT error", r.status, text);
        return json({ error: "Transkripcija nije uspela.", details: text }, r.status);
      }
      let parsed: { text?: string } = {};
      try { parsed = JSON.parse(text); } catch { parsed = { text }; }
      return json({ text: (parsed.text || "").trim() });
    }

    // ── Speech (JSON text) ──
    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const lang = ["no", "de", "en"].includes(body?.language) ? body.language : "no";
    if (!text || text.length > MAX_TTS_CHARS) return json({ error: "Neispravan tekst." }, 400);
    const voiceName = ROLE_VOICES[body?.voice] || "Kore";
    const beginner = ["A1", "A2"].includes(String(body?.level || "").toUpperCase());
    const accent = lang === "en" ? " with a natural British (Southern English) accent" : lang === "no" ? " in standard Eastern Norwegian (Bokmål)" : " in standard High German";
    const style = `Read the following line aloud in ${LANG_NAME[lang]}${accent}, as a friendly person in a real conversation. ${beginner ? "Speak clearly and a little slower than usual for a beginner learner, with short natural pauses between sentences, but never robotic or exaggerated." : "Speak at a natural, relaxed conversational pace."} Use natural rising intonation for questions. Read ONLY the text after this instruction, word for word, adding nothing.`;

    const r = await fetch(`${GATEWAY}/v1/audio/speech`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: TTS_MODEL,
        contents: [{ role: "user", parts: [{ text: `${style}\n\n${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } },
        },
        stream_format: "audio",
      }),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("TTS error", r.status, t);
      return json({ error: "Glasovni odgovor nije uspeo.", details: t }, r.status);
    }
    return new Response(r.body, {
      status: r.status,
      headers: { ...corsHeaders, "Content-Type": r.headers.get("content-type") || "audio/wav", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("talk-voice error", e);
    return json({ error: "Greška na serveru." }, 500);
  }
});
