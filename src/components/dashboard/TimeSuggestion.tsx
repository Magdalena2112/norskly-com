import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { dailyPace } from "@/lib/dailyPlan";
import RetroClock from "./RetroClock";

type Props = {
  userId: string; language: string; course: string;
  nextLesson?: { sort_order: number } | null;
  nextStatus?: string;
  doneCount: number;
};

/** Subtle fjord strip under the mentor note: today's time + a short next step based on finished lessons. */
export default function TimeSuggestion({ userId, language, course, nextLesson, nextStatus, doneCount }: Props) {
  const [minutes, setMinutes] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    supabase.from("course_enrollments").select("daily_minutes").eq("user_id", userId).eq("language", language).eq("course_type", course).maybeSingle()
      .then(({ data }) => { if (alive) setMinutes(data?.daily_minutes ?? null); });
    return () => { alive = false; };
  }, [userId, language, course]);
  if (minutes === undefined) return null;
  const pace = dailyPace(minutes);
  const task = pace.modulesPerDay >= 9 ? "cela lekcija" : pace.modulesPerDay === 1 ? "1 modul" : `${pace.modulesPerDay} modula`;
  const n = nextLesson ? `lekciju ${nextLesson.sort_order}` : "";
  const step = !nextLesson
    ? doneCount > 0 ? "ponovi rečnik i uradi razgovor" : ""
    : nextStatus === "in_progress"
      ? `nastavi ${n} od prvog nezavršenog modula`
      : doneCount === 0 ? `počni ${n} uvodom i vokabularom` : `završio/la si ${doneCount} – kreni na ${n}`;
  return (
    <div className="-mt-4 mb-2 flex items-center gap-3 px-1">
      <RetroClock className="w-10 h-10 shrink-0 -rotate-6" />
      <p className="flex-1 min-w-0 rounded-2xl border border-fjord/25 bg-fjord/10 px-3.5 py-1.5 text-xs sm:text-sm text-primary/80">
        Predlog za danas: <span className="font-medium text-primary">{pace.minutes} min</span> · {task}{step && <> · {step}</>}
      </p>
    </div>
  );
}
