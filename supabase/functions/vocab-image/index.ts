import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GATEWAY = "https://ai.gateway.lovable.dev/v1";
const CHAT_MODEL = "openai/gpt-6-astra";
const IMAGE_MODEL = "openai/gpt-image-2.5-sunburst";
const BUCKET = "vocab-images";
const SIGNED_TTL = 60 * 60 * 24 * 7;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANG_NAMES: Record<string, string> = { no: "Norwegian (Bokmål)", en: "English", de: "German" };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

class GatewayError extends Error {
  constructor(public status: number, msg: string) { super(msg); }
}

/** Reads an SSE body and calls onEvent for each parsed JSON data line. */
async function readSSE(body: ReadableStream<Uint8Array>, onEvent: (evt: string, data: any) => void) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let evt = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, idx).replace(/\r$/, "");
      buf = buf.slice(idx + 1);
      if (line.startsWith("event:")) evt = line.slice(6).trim();
      else if (line.startsWith("data:")) {
        const d = line.slice(5).trim();
        if (d && d !== "[DONE]") {
          try { onEvent(evt, JSON.parse(d)); } catch { /* ignore */ }
        }
      } else if (line === "") evt = "";
    }
  }
}

/** Decides whether the word is picturable and writes a short scene description. */
async function planImage(apiKey: string, word: string, translation: string, langName: string) {
  const res = await fetch(`${GATEWAY}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content:
            "You decide if a vocabulary word can be clearly illustrated by a single picture for a flashcard. Concrete nouns, actions, and clear adjectives (colors, big/small, hot/cold) are visual. Abstract words, conjunctions, prepositions, pronouns, grammatical words and vague concepts are NOT visual. If visual, describe one simple, unambiguous scene in English (max 25 words) that shows the meaning. Never include text or letters in the scene.",
        },
        { role: "user", content: `${langName} word: "${word}" (Serbian meaning: "${translation}")` },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "plan",
          strict: true,
          schema: {
            type: "object",
            properties: { visual: { type: "boolean" }, scene: { type: "string" } },
            required: ["visual", "scene"],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  if (!res.ok || !res.body) throw new GatewayError(res.status, await res.text());
  let text = "";
  await readSSE(res.body, (_e, d) => {
    if (d?.type === "response.output_text.delta" && typeof d.delta === "string") text += d.delta;
  });
  const parsed = JSON.parse(text);
  return { visual: !!parsed.visual, scene: String(parsed.scene || "") };
}

async function generateImage(apiKey: string, scene: string): Promise<Uint8Array> {
  const prompt =
    `Playful, colorful flat vector illustration for a language-learning flashcard: ${scene}. ` +
    "Bold cheerful colors, soft rounded shapes, simple centered subject, clean light pastel background, friendly and engaging. " +
    "Absolutely no text, letters, numbers or words anywhere in the image.";
  const res = await fetch(`${GATEWAY}/images/generations`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: IMAGE_MODEL, prompt, size: "1024x1024", quality: "low", stream: true, partial_images: 1 }),
  });
  if (!res.ok || !res.body) throw new GatewayError(res.status, await res.text());
  let b64 = "";
  let err = "";
  await readSSE(res.body, (evt, d) => {
    const type = evt || d?.type;
    if (type === "error" || d?.type === "error") err = d?.error?.message || "Image error";
    if (type === "image_generation.completed" && d?.b64_json) b64 = d.b64_json;
  });
  if (!b64) throw new Error(err || "No image returned");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!apiKey) return json({ error: "Missing LOVABLE_API_KEY" }, 500);

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const word = String(body.word ?? "").trim().slice(0, 80);
    const translation = String(body.translation ?? "").trim().slice(0, 120);
    const language = ["no", "en", "de"].includes(body.language) ? body.language : "no";
    if (!word) return json({ error: "Missing word" }, 400);

    const wordKey = word.toLowerCase().replace(/\s+/g, " ");
    const admin = createClient(url, service);

    const sign = async (path: string) => {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL);
      return data?.signedUrl ?? null;
    };

    // 1) Shared cache
    const { data: cached } = await admin
      .from("vocab_images")
      .select("is_visual, image_url")
      .eq("language", language)
      .eq("word_key", wordKey)
      .maybeSingle();
    if (cached) {
      if (!cached.is_visual || !cached.image_url) return json({ visual: false, url: null, cached: true });
      return json({ visual: true, url: await sign(cached.image_url), cached: true });
    }

    // 2) Decide + generate
    const plan = await planImage(apiKey, word, translation, LANG_NAMES[language]);
    if (!plan.visual || !plan.scene) {
      await admin.from("vocab_images").upsert(
        { language, word_key: wordKey, word, translation, is_visual: false, image_url: null },
        { onConflict: "language,word_key", ignoreDuplicates: true },
      );
      return json({ visual: false, url: null, cached: false });
    }

    const bytes = await generateImage(apiKey, plan.scene);
    const safe = wordKey.normalize("NFKD").replace(/[^a-z0-9]+/g, "-").slice(0, 40) || "word";
    const path = `${language}/${safe}-${crypto.randomUUID().slice(0, 8)}.png`;
    const { error: upErr } = await admin.storage.from(BUCKET).upload(path, bytes, { contentType: "image/png" });
    if (upErr) throw upErr;

    await admin.from("vocab_images").upsert(
      { language, word_key: wordKey, word, translation, is_visual: true, image_url: path },
      { onConflict: "language,word_key", ignoreDuplicates: true },
    );
    return json({ visual: true, url: await sign(path), cached: false });
  } catch (e) {
    console.error("vocab-image error:", e);
    if (e instanceof GatewayError) {
      const status = [402, 403, 429].includes(e.status) ? e.status : 502;
      return json({ error: "Slika trenutno nije dostupna." }, status);
    }
    return json({ error: "Slika trenutno nije dostupna." }, 500);
  }
});
