import { createClient } from "jsr:@supabase/supabase-js@2";
import en1 from "../_shared/course-content/EN-A1-L01.json" with { type: "json" };
import en2 from "../_shared/course-content/EN-A2-L01.json" with { type: "json" };
import no2 from "../_shared/course-content/NO-A2-L01.json" with { type: "json" };
import de2 from "../_shared/course-content/DE-A2-L01.json" with { type: "json" };
import noHealth from "../_shared/course-content/NO-HC-B1-L01.json" with { type: "json" };
import deHealth from "../_shared/course-content/DE-HC-B1-L01.json" with { type: "json" };
import { getTalkScenarios, getLessonMaterial } from "../_shared/course-content/talkScenarios.ts";
import { withLessonXp } from "../_shared/lessonXp.ts";

const lessons: Record<string, unknown> = { "EN-A1-L01": en1, "EN-A2-L01": en2, "NO-A2-L01": no2, "DE-A2-L01": de2, "NO-HC-B1-L01": noHealth, "DE-HC-B1-L01": deHealth };
const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Content-Type": "application/json", "Cache-Control": "no-store" };
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_ANON_KEY");
    if (!url || !key) return reply({ error: "Sadržaj nije dostupan." }, 500);
    const client = createClient(url, key, { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } });
    const { data: { user } } = await client.auth.getUser();
    if (!user) return reply({ error: "Potrebna je prijava." }, 401);
    const { lesson_code } = await req.json();
    if (typeof lesson_code !== "string" || lesson_code.length > 80) return reply({ error: "Neispravna lekcija." }, 400);
    // User-scoped RLS checks publication and immutable language/course enrollment.
    const { data, error } = await client.from("course_lessons").select("id, language, course, cefr_level").eq("lesson_code", lesson_code).maybeSingle();
    if (error || !data || !lessons[lesson_code]) return reply({ error: "Ova lekcija nije deo tvog kursa." }, 403);
    // Students may open only the CEFR level they enrolled in; staff see all levels.
    if (data.course === "general") {
      const { data: roles } = await client.from("user_roles").select("role").eq("user_id", user.id);
      const staff = (roles || []).some((r: { role: string }) => ["admin", "admin_teacher", "teacher"].includes(r.role));
      if (!staff) {
        const { data: prof } = await client.from("course_enrollments").select("level").eq("user_id", user.id).eq("language", data.language).eq("course_type", data.course).eq("onboarding_completed", true).maybeSingle();
        const enrolled = String(prof?.level || "").match(/[ABC][12]/)?.[0];
        if (enrolled !== data.cefr_level) return reply({ error: "Ova lekcija nije deo nivoa na koji si upisan/a." }, 403);
      }
    }
    return reply({ content: withLessonXp(lessons[lesson_code]), scenarios: getTalkScenarios(lesson_code), material: getLessonMaterial(lesson_code) });
  } catch { return reply({ error: "Sadržaj nije dostupan." }, 400); }
});