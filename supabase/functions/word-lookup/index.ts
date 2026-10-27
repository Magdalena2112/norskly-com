import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};
const LANG: Record<string, string> = { no: "norveški (Bokmål)", en: "engleski", de: "nemački" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { word, sentence, language } = await req.json();
    if (typeof word !== "string" || !word.trim() || word.length > 60) return json({ error: "Neispravna reč." }, 400);
    if (sentence != null && (typeof sentence !== "string" || sentence.length > 600)) return json({ error: "Neispravna rečenica." }, 400);
    const lang = LANG[String(language)];
    if (!lang) return json({ error: "Nepoznat jezik." }, 400);

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: `Ti si rečnik za ${lang} jezik za učenike koji govore srpski (latinica). Objasni reč TAČNO u značenju koje ima u datoj rečenici. Ne izmišljaj. Odgovori samo JSON: {"lemma": "osnovni oblik (za imenice sa članom, npr. 'en lege', 'der Arzt')", "translation": "prevod na srpskom u ovom kontekstu", "pos": "vrsta reči na srpskom", "example": "kratka primer rečenica na ciljnom jeziku", "example_sr": "prevod primera"}` },
          { role: "user", content: `Reč: "${word}"\nRečenica: "${sentence ?? ""}"` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (res.status === 429) return json({ error: "Previše zahteva, pokušaj malo kasnije." }, 429);
    if (res.status === 402) return json({ error: "AI krediti su potrošeni." }, 402);
    if (!res.ok) return json({ error: "Prevod trenutno nije dostupan." }, 502);
    const data = await res.json();
    const raw = String(data.choices?.[0]?.message?.content ?? "{}").replace(/```json|```/g, "");
    return json(JSON.parse(raw));
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Greška" }, 500);
  }
});
