import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedCourse } from "@/hooks/useSelectedCourse";
import { dailyPace, dailyProgress } from "@/lib/dailyPlan";

type Props = {
  userId: string;
  language: string;
  nextLesson?: { id: string; title_target: string } | null;
};

export default function DailyPlanCard({ userId, language, nextLesson }: Props) {
  const navigate = useNavigate();
  const course = useSelectedCourse(language);
  const [minutes, setMinutes] = useState<number | null>(null);
  const [xpToday, setXpToday] = useState(0);

  useEffect(() => {
    let alive = true;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    (async () => {
      const [{ data: lp }, { data: acts }] = await Promise.all([
        supabase.from("course_enrollments").select("daily_minutes").eq("user_id", userId).eq("language", language).eq("course_type", course).maybeSingle(),
        supabase.from("activities").select("points").eq("user_id", userId).eq("language", language).gte("created_at", start.toISOString()),
      ]);
      if (!alive) return;
      setMinutes(lp?.daily_minutes ?? null);
      setXpToday((acts || []).reduce((s, a) => s + (a.points || 0), 0));
    })();
    return () => { alive = false; };
  }, [userId, language, course]);

  const pace = dailyPace(minutes);
  const prog = dailyProgress(xpToday, pace);
  const task = pace.modulesPerDay >= 9 ? "celu lekciju" : pace.modulesPerDay === 1 ? "1 modul" : `${pace.modulesPerDay} modula`;

  return (
    <Card className="glass-card my-4">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
            {prog.done ? <CheckCircle2 className="w-5 h-5 text-accent" /> : <CalendarClock className="w-5 h-5 text-accent" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Dnevni plan · {pace.minutes} min · {pace.label}</p>
            <h3 className="font-display font-semibold text-foreground mt-0.5">
              {prog.done ? "Današnji cilj je ispunjen!" : nextLesson ? `Danas: ${task} iz lekcije „${nextLesson.title_target}"` : `Danas: ${task}`}
            </h3>
            <div className="mt-3">
              <Progress value={prog.ratio * 100} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1.5">
                {xpToday} / {pace.xpGoal} XP danas{prog.done ? "" : ` · još ${prog.left} XP`} · lekcija za {pace.lessonDays}
              </p>
            </div>
            {nextLesson && !prog.done && (
              <Button size="sm" variant="hero" className="mt-3" onClick={() => navigate(`/lekcija/${nextLesson.id}`)}>
                Nastavi učenje
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
