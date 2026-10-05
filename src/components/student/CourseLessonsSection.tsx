import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { lessonImage, type CourseLesson } from "@/lib/courseLessons";

export default function CourseLessonsSection({ language, level }: { language: string; level: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<CourseLesson[] | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("language", language)
        .eq("cefr_level", level)
        .eq("is_published", true)
        .order("sort_order");
      setLessons((data as unknown as CourseLesson[]) || []);
      if (user) {
        const { data: prog } = await supabase
          .from("course_lesson_progress")
          .select("lesson_id, status")
          .eq("user_id", user.id)
          .eq("language", language);
        setDone(new Set((prog || []).filter((p) => p.status === "completed").map((p) => p.lesson_id)));
      }
    })();
  }, [language, level, user]);

  if (!lessons || lessons.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="mb-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="font-script italic text-sm text-primary/70">✦ Lekcije · nivo {level} ✦</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {lessons.map((l) => {
          const img = lessonImage(l.illustration_url);
          const isDone = done.has(l.id);
          return (
            <button
              key={l.id}
              onClick={() => navigate(`/lekcije/${l.id}`)}
              className="group text-left rounded-2xl border border-border/60 bg-cream shadow-card-soft overflow-hidden transition-all hover:-translate-y-1 hover:shadow-postcard"
            >
              {img && <img src={img} alt="" loading="lazy" width={1280} height={720} className="w-full aspect-video object-cover" />}
              <div className="p-4">
                <div className="flex items-center justify-between text-xs text-primary/60 mb-1">
                  <span>Lekcija {l.sort_order}</span>
                  {isDone && <span className="flex items-center gap-1 text-forest"><CheckCircle2 className="w-3.5 h-3.5" /> Završeno</span>}
                </div>
                <h3 className="font-display font-semibold text-primary leading-tight">{l.title}</h3>
                <p className="font-script italic text-xs text-primary/55">{l.title_target}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm text-primary font-medium">
                  {isDone ? "Ponovi" : "Otvori lekciju"} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
