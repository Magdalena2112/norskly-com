import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const GATEWAY = "https://ai.gateway.lovable.dev";
const TTS_MODEL = "google/gemini-3.1-flash-tts-preview";
const BUCKET = "lesson-audio";
const MAX_CHARS = 3000;
const LANG_NAME: Record<string, string> = { no: "Norwegian Bokmål", de: "German", en: "English" };
// Distinct natural voices: female / male / neutral narrator
const VOICES: Record<string, string> = { f: "Aoede", m: "Charon", n: "Kore" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function sha1(text: string) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

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

    const body = await req.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const lang = ["no", "de", "en"].includes(body?.language) ? body.language : "en";
    const voice = VOICES[body?.voice] || VOICES.n;
    if (!text || text.length > MAX_CHARS) return json({ error: "Neispravan tekst." }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const key = `${lang}/${await sha1(`${voice}|${text}`)}.wav`;

    // Reuse cached clip when it already exists.
    const { data: existing } = await admin.storage.from(BUCKET).list(key.split("/")[0], { search: key.split("/")[1] });
    if (!existing?.some((f) => f.name === key.split("/")[1])) {
      const r = await fetch(`${GATEWAY}/v1/audio/speech`, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: TTS_MODEL,
          contents: [{ role: "user", parts: [{ text: `Say naturally and clearly in ${LANG_NAME[lang]}: ${text}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
          stream_format: "audio",
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("TTS error", r.status, t);
        return json({ error: "Izgovor nije uspeo." }, r.status);
      }
      const audio = new Uint8Array(await r.arrayBuffer());
      const { error: upErr } = await admin.storage.from(BUCKET).upload(key, audio, { contentType: "audio/wav", upsert: true });
      if (upErr) console.error("upload error", upErr);
    }

    const { data: signed, error: signErr } = await admin.storage.from(BUCKET).createSignedUrl(key, 3600);
    if (signErr || !signed?.signedUrl) return json({ error: "Audio nije dostupan." }, 500);
    return json({ url: signed.signedUrl });
  } catch (e) {
    console.error("lesson-tts error", e);
    return json({ error: "Greška na serveru." }, 500);
  }
});
