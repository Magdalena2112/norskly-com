import { getCurrentLanguageCode } from "@/lib/currentLanguage";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Languages, MessageSquare, GraduationCap, CalendarCheck, PenLine, BookOpenText, Headphones, Mic, Lock, CheckCircle2 } from "lucide-react";
import { computeLevelStates, normalizeLevel, LEVEL_UNLOCK_THRESHOLD, type CefrLevel, type LevelState } from "@/lib/levels";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import WeeklyDigest from "@/components/WeeklyDigest";
import TeacherWorkWidget from "@/components/student/TeacherWorkWidget";
import DailyPlanCard from "@/components/student/DailyPlanCard";
import TimeSuggestion from "@/components/dashboard/TimeSuggestion";
import SurveyInvitation from "@/components/survey/SurveyInvitation";
import { format } from "date-fns";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import FjordHero from "@/components/student/FjordHero";
import PostcardVignette from "@/components/student/PostcardVignette";
import TrophyShelf from "@/components/student/TrophyShelf";
import { Trophy } from "lucide-react";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";
import { getLanguageBySlug, getLanguageByCode, type LanguageSlug } from "@/lib/languages";
import FlagStamp from "@/components/dashboard/FlagStamp";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { courseKey, courseLabel, coursePath, selectCourse } from "@/lib/courseSelection";
import { useCourseEnrollment } from "@/hooks/useCourseEnrollment";

type ModuleDef = {
  title: string;
  subtitle: string;
  description: string;
  icon: typeof BookOpen;
  route: string;
  vignette: "book" | "stamp" | "speech" | "cabins" | "teacher";

  iconBg: string;
  rotation: string;
  buttonLabel?: string;
  fullWidth?: boolean;
  stamp?: boolean;
};



export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { slug: routeSlug } = useParams<{ slug: string }>();
  const { slug: storedSlug, code, setLanguage } = useSelectedLanguage();

  // If the URL carries /ucenje/:slug, make it the active language.
  useEffect(() => {
    if (!routeSlug) return;
    const fromUrl = getLanguageBySlug(routeSlug);
    if (fromUrl && fromUrl.slug !== storedSlug) {
      setLanguage(fromUrl.slug as LanguageSlug);
    }
  }, [routeSlug, storedSlug, setLanguage]);

  const activeLang = useMemo(
    () => (routeSlug ? getLanguageBySlug(routeSlug) : undefined) || getLanguageByCode(code),
    [routeSlug, code],
  );
  const ui = activeLang.ui;

  const modules: ModuleDef[] = useMemo(
    () => [
      { title: "Gramatika", subtitle: ui.module.grammar, description: "Vežbaj gramatiku kroz kvizove i objašnjenja prilagođena tvom nivou.", icon: BookOpen, route: "/grammar", vignette: "book", iconBg: "bg-primary", rotation: "rotate-card-1" },
      { title: "Vokabular", subtitle: ui.module.vocabulary, description: "Uči nove reči sa flashcard sistemom.", icon: Languages, route: "/vocabulary", vignette: "stamp", iconBg: "bg-sunset", rotation: "rotate-card-2" },
      { title: "Razgovor", subtitle: ui.module.talk, description: "Vežbaj pisanje poruka u realnim situacijama.", icon: MessageSquare, route: "/talk", vignette: "speech", iconBg: "bg-fjord", rotation: "rotate-card-3" },
      { title: "Pisanje", subtitle: ui.module.writing, description: "Vežbaj pisanje, bildebeskrivelse i dobij detaljan feedback.", icon: PenLine, route: "/writing", vignette: "book", iconBg: "bg-accent", rotation: "rotate-card-4" },
      { title: "Čitanje", subtitle: ui.module.reading, description: "Čitaj tekstove prilagođene tvom nivou i reši vežbe razumevanja.", icon: BookOpenText, route: "/reading", vignette: "stamp", iconBg: "bg-fjord", rotation: "rotate-card-2" },
      { title: "Slušanje", subtitle: ({ no: "Lytting", de: "Hören", en: "Listening" } as Record<string, string>)[activeLang.code] || "Listening", description: "Slušaj snimke i dijaloge i proveri razumevanje kroz vežbe.", icon: Headphones, route: "/listening", vignette: "speech", iconBg: "bg-sunset", rotation: "rotate-card-3" },
      { title: "Izgovor", subtitle: ({ no: "Uttale", de: "Aussprache", en: "Pronunciation" } as Record<string, string>)[activeLang.code] || "Pronunciation", description: "Slušaj, ponovi i uvežbaj glasove, reči, naglasak i intonaciju.", icon: Mic, route: "/pronunciation", vignette: "speech", iconBg: "bg-primary", rotation: "rotate-card-4" },
      { title: "Uči uz podršku profesora", subtitle: ui.module.teacher, description: "Više ti odgovara učenje sa profesorom ili ti je potrebna dodatna pomoć? Zakaži individualni čas i uči svojim tempom.", icon: GraduationCap, route: "/book-lesson", vignette: "teacher", iconBg: "bg-forest", rotation: "rotate-card-1", buttonLabel: "Zakaži čas", fullWidth: true },

    ],
    [ui, activeLang.label],
  );

  const [xpData, setXpData] = useState<{ total_xp: number; level: number } | null>(null);
  const [upcomingLesson, setUpcomingLesson] = useState<{ start_time: string; end_time: string; status: string } | null>(null);
  const [lessonLoaded, setLessonLoaded] = useState(false);
  const [courseLessons, setCourseLessons] = useState<{ id: string; sort_order: number; cefr_level: string; title_target: string; summary: string; course: string }[]>([]);
  const { data: course, isLoading: enrollmentLoading } = useCourseEnrollment(code);
  const { data: enrollments = [] } = useQuery({ queryKey: ["course-enrollments", user?.id], enabled: !!user, queryFn: async () => { const {data,error} = await supabase.from("course_enrollments").select("language,course_type,level").eq("user_id", user?.id ?? "").eq("onboarding_completed", true); if(error) throw error; return data ?? []; } });
  const [lessonProgress, setLessonProgress] = useState<Record<string, string>>({});
  const [trophies, setTrophies] = useState<Set<string>>(new Set());
  const [lessonsLoaded, setLessonsLoaded] = useState(false);

  const startLevel = normalizeLevel(profile.level);
  const [selectedLevel, setSelectedLevel] = useState<CefrLevel>(startLevel);
  const [lockedMsg, setLockedMsg] = useState<string | null>(null);
  useEffect(() => { setSelectedLevel(startLevel); setLockedMsg(null); }, [startLevel, code, course]);

  useEffect(() => {
    setCourseLessons([]); setLessonsLoaded(false);
    if (!user || !course) return;
    let alive = true;
    (async () => {
      const [{ data: ls }, { data: pr }] = await Promise.all([
        supabase.from("course_lessons").select("id, sort_order, cefr_level, title_target, summary, course").eq("language", code).eq("course", course).eq("is_published", true).order("sort_order"),
        supabase.from("course_lesson_progress").select("lesson_id, status, completed_steps").eq("user_id", user.id).eq("language", code),
      ]);
      if (!alive) return;
      setCourseLessons(ls || []);
      setLessonProgress(Object.fromEntries((pr || []).map((p) => [p.lesson_id, p.status])));
      setTrophies(new Set((pr || []).filter((p) => Array.isArray(p.completed_steps) && (p.completed_steps as unknown[]).includes("REVIEW-PASS")).map((p) => p.lesson_id)));
      setLessonsLoaded(true);
    })();
    return () => { alive = false; };
  }, [user, code, course]);

  const generalLessons = useMemo(() => courseLessons.filter((l) => (l.course || "general") === "general"), [courseLessons]);
  const healthLessons = useMemo(() => courseLessons.filter((l) => l.course === "health"), [courseLessons]);
  const activeCourse = course;
  const levelStates = useMemo(() => computeLevelStates(startLevel, generalLessons, lessonProgress), [startLevel, generalLessons, lessonProgress]);
  const visibleLessons = activeCourse === "health" ? healthLessons : generalLessons.filter((l) => l.cefr_level === selectedLevel);

  const onLevelClick = (s: LevelState, i: number) => {
    if (s.unlocked) { setSelectedLevel(s.level); setLockedMsg(null); return; }
    const prev = levelStates[i - 1];
    const needed = Math.ceil(prev.total * LEVEL_UNLOCK_THRESHOLD);
    const left = Math.max(needed - prev.done, 0);
    setLockedMsg(
      prev.total === 0
        ? `Nivo ${s.level} se otključava kada završiš bar ${Math.round(LEVEL_UNLOCK_THRESHOLD * 100)}% nivoa ${prev.level}. Lekcije za ${prev.level} su u pripremi.`
        : `Nivo ${s.level} se otključava kada završiš bar ${Math.round(LEVEL_UNLOCK_THRESHOLD * 100)}% nivoa ${prev.level} (trenutno: ${Math.round(prev.ratio * 100)}%).${prev.unlocked && left > 0 ? ` Još ${left} ${left === 1 ? "lekcija" : "lekcije"} do otključavanja!` : ""}`,
    );
  };



  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: xp }, { data: lesson }] = await Promise.all([
        supabase.from("user_xp").select("total_xp, level").eq("user_id", user.id).eq("language", code).maybeSingle(),
        supabase.from("lessons").select("start_time, end_time, status").eq("user_id", user.id).eq("language", code).eq("status", "scheduled").gte("start_time", new Date().toISOString()).order("start_time", { ascending: true }).limit(1).maybeSingle(),
      ]);
      setXpData(xp || { total_xp: 0, level: 1 });
      setUpcomingLesson(lesson);
      setLessonLoaded(true);
    })();
  }, [user, code]);

  if (profileLoading || enrollmentLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  const nextLesson =
    visibleLessons.find((l) => lessonProgress[l.id] === "in_progress") ??
    visibleLessons.find((l) => lessonProgress[l.id] !== "completed") ??
    null;

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-8 sm:py-10 relative z-10">
        {enrollments.length > 1 && <div className="mb-6 max-w-md">
          <Select value={`${code}:${course}`} onValueChange={key => { const chosen = enrollments.find(e => courseKey(e) === key); if (!chosen) return; selectCourse(chosen.language, chosen.course_type); navigate(coursePath(chosen)); }}>
            <SelectTrigger aria-label="Izaberi kurs"><SelectValue placeholder="Izaberi kurs" /></SelectTrigger>
            <SelectContent>{enrollments.map(e => <SelectItem key={courseKey(e)} value={courseKey(e)}>{courseLabel(e)}</SelectItem>)}</SelectContent>
          </Select>
        </div>}
        {/* CONTINUE CARD — one clear next step */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mb-8"
        >
          <div className="note-scalloped drop-shadow-sm">
          <div className="note-lined relative rounded-sm p-5 sm:p-7 pr-24 sm:pr-32">
            <FlagStamp language={code} className="absolute top-4 right-4 w-16 sm:w-20 rotate-[4deg]" />
            <p className="font-script italic text-primary text-2xl sm:text-3xl">
              {({ en: "Hi", de: "Hallo" } as Record<string, string>)[getCurrentLanguageCode()] ?? "Hei"}, {profile.name || "korisniče"}
            </p>
            {nextLesson ? (
              <>
                <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">
                  {lessonProgress[nextLesson.id] === "in_progress" ? "Nastavi gde si stao/la" : "Tvoj sledeći korak"} · Lekcija {nextLesson.sort_order}
                </p>
                <h1 className="text-display text-2xl sm:text-3xl text-primary mt-1 leading-tight break-words">{nextLesson.title_target}</h1>
                <Button
                  variant="hero"
                  size="lg"
                  className="mt-5 w-full sm:w-auto"
                  onClick={() => navigate(`/lekcija/${nextLesson.id}?course=${course}`)}
                >
                  {lessonProgress[nextLesson.id] === "in_progress" ? "Nastavi gde si stao/la" : "Započni lekciju"}
                </Button>
              </>
            ) : (
              <h1 className="text-display text-2xl sm:text-3xl text-primary mt-4 leading-tight">
                {lessonsLoaded && visibleLessons.length > 0 ? "Sve lekcije su završene. Bravo!" : ui.heroBody}
              </h1>
            )}
          </div>
          </div>
        </motion.div>
        {user && <TimeSuggestion userId={user.id} language={code} course={course} nextLesson={nextLesson} nextStatus={nextLesson ? lessonProgress[nextLesson.id] : undefined} doneCount={visibleLessons.filter((l) => lessonProgress[l.id] === "completed").length} />}
        {location.state?.courseDenied && <p role="alert" className="my-4 text-sm text-destructive">Ova lekcija nije deo kursa na koji si upisan/a.</p>}

        <TeacherWorkWidget language={code} />
        <SurveyInvitation language={code} />

        <div className="mt-10 mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="font-script italic text-sm text-primary/70 flex items-center gap-2">
            <span className="text-primary/40">✦</span>
            {ui.modulesDivider}
            <span className="text-primary/40">✦</span>
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {activeCourse === "health" && <h2 className="font-display text-xl text-primary mb-4">Za zdravstvene radnike · B1</h2>}

        {activeCourse === "general" && <h2 className="font-display text-xl text-primary mb-4">Lekcije · Nivo {selectedLevel}</h2>}

        {lessonsLoaded && visibleLessons.length === 0 && (
          <Card className="mb-6 bg-cream/90 border-border/60 shadow-card-soft">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Lekcije za nivo {selectedLevel} su u pripremi. Uskoro ih dodajemo!
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visibleLessons.map((l, i) => {
            const p = lessonProgress[l.id];
            const isNext = nextLesson?.id === l.id;
            const pct = p === "completed" ? 100 : p === "in_progress" ? 50 : 0;
            const statusLabel = p === "completed" ? "Završeno" : p === "in_progress" ? "U toku" : "Nije započeto";
            return (
              <motion.div key={l.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 + 0.1 }}>
                <Card
                  className={`cursor-pointer group h-full bg-cream border shadow-postcard relative transition-all duration-300 hover:-translate-y-1 hover:shadow-card-soft ${
                    isNext ? "border-primary ring-2 ring-primary/30" : "border-border/60"
                  }`}
                  onClick={() => navigate(`/lekcija/${l.id}?course=${course}`)}
                >
                  <CardContent className="p-5 flex gap-4 items-start">
                    <span className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl ${
                      p === "completed" ? "bg-forest text-cream" : isNext ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                    }`}>
                      {p === "completed" ? <CheckCircle2 className="w-7 h-7" /> : String(l.sort_order).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Lekcija {l.sort_order}</span>
                        {isNext && <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">Na redu</span>}
                        {trophies.has(l.id) && <Trophy className="w-4 h-4 text-sunset" aria-label="Trofej osvojen" />}
                      </div>
                      <h3 className="font-display font-semibold text-lg text-primary leading-snug mt-1 break-words">{l.title_target}</h3>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-1.5 flex-1 rounded-full bg-border/70 overflow-hidden">
                          <div className={`h-full rounded-full ${p === "completed" ? "bg-forest" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">{statusLabel}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          {modules.filter((m) => m.fullWidth).map((mod) => (
            <motion.div key={mod.route} className="col-span-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="cursor-pointer group h-full bg-cream border border-border/60 shadow-postcard overflow-hidden relative transition-all duration-500 hover:-translate-y-1.5" onClick={() => navigate(mod.route)}>
                <div className="relative w-full h-32 sm:h-36 overflow-hidden border-b border-border/40">
                  <PostcardVignette variant={mod.vignette} className="absolute inset-0 w-full h-full" />
                </div>

                <CardContent className="pt-5 pb-5 px-5">

                  <p className="font-script italic text-xs text-primary/55 mb-0.5">{mod.subtitle}</p>
                  <h3 className="font-display font-semibold text-lg text-primary leading-tight">{mod.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{mod.description}</p>
                  <Button size="sm" variant="hero" className="mt-3">{mod.buttonLabel}</Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 space-y-4">
          {user && <DailyPlanCard userId={user.id} language={code} nextLesson={nextLesson} />}
          {lessonsLoaded && (
            <TrophyShelf level={activeCourse === "health" ? "B1" : selectedLevel} lessons={visibleLessons} won={trophies} />
          )}
          <WeeklyDigest />
        </div>

        {lessonLoaded && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="mt-8 border-border/50 bg-cream/85 backdrop-blur-sm shadow-card-soft">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <CalendarCheck className="w-5 h-5 text-fjord" />
                  <h3 className="font-display font-semibold text-primary">Moji predstojeći časovi</h3>
                </div>
                {upcomingLesson ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {format(new Date(upcomingLesson.start_time), "dd.MM.yyyy HH:mm")} – {format(new Date(upcomingLesson.end_time), "HH:mm")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Zakazano</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate("/my-lessons")} className="self-start sm:self-auto">
                      Pogledaj detalje
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Nema zakazanih časova.</p>
                    <Button size="sm" variant="hero" onClick={() => navigate("/book-lesson")}>
                      Rezerviši sada
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </StudentLayout>
  );
}
