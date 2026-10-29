import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { enrollmentName, filterStudentRecords, languageName, studentRecordLabel } from "@/lib/adminStudents";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import { StudentProgressView } from "@/components/admin/StudentProgressView";
import { StudentErrorAnalysis } from "@/components/admin/StudentErrorAnalysis";
import { StudentLessonHistory } from "@/components/admin/StudentLessonHistory";
import { format } from "date-fns";

export default function AdminStudentDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [selection, setSelection] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["admin-student-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId || "")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: xp } = useQuery({
    queryKey: ["admin-student-xp", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", userId || "")
        ;
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: activities = [], isLoading: activitiesLoading, error: activitiesError } = useQuery({
    queryKey: ["admin-student-activities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId || "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: errors = [], isLoading: errorsLoading, error: errorsError } = useQuery({
    queryKey: ["admin-student-errors", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_events")
        .select("*")
        .eq("user_id", userId || "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["admin-student-lessons", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("user_id", userId || "")
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: enrollments = [], error: enrollmentError } = useQuery({
    queryKey: ["admin-enrollments", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("course_enrollments").select("*").eq("user_id", userId || "");
      if (error) throw error;
      return data;
    },
  });
  const { data: courseLessons = [] } = useQuery({
    queryKey: ["admin-course-lessons"], queryFn: async () => {
      const { data, error } = await supabase.from("course_lessons").select("id,language,course,cefr_level,title");
      if (error) throw error;
      return data;
    },
  });
  const { data: progress = [] } = useQuery({
    queryKey: ["admin-lesson-progress", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("course_lesson_progress").select("*").eq("user_id", userId || "");
      if (error) throw error;
      return data;
    },
  });
  const { data: legacyProfiles = [] } = useQuery({
    queryKey: ["admin-legacy-profiles", userId], enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from("language_profiles").select("*").eq("user_id", userId || "");
      if (error) throw error;
      return data || [];
    },
  });
  const knownLanguages = new Set([...enrollments.map(e => e.language), ...legacyProfiles.map(p => p.language), ...activities.map(a => a.language), ...errors.map(e => e.language), ...progress.map(p => p.language), ...(xp || []).map(x => x.language), ...lessons.map(l => l.language)]);
  const legacyEnrollments = [...knownLanguages].filter(l => l && !enrollments.some(e => e.language === l)).map(l => {
    const lp = legacyProfiles.find(p => p.language === l);
    return { id: `legacy-${l}`, user_id: userId || "", language: l, course_type: "legacy", level: lp?.level ?? null,
      onboarding_completed: lp?.onboarding_completed ?? false, learning_goal: lp?.learning_goal ?? null, focus_area: lp?.focus_area ?? null } as (typeof enrollments)[number];
  });
  const allEnrollments = [...enrollments, ...legacyEnrollments];
  const selectedEnrollment = allEnrollments.find(e => e.id === selection);
  const language = selectedEnrollment?.language || (selection.includes(":") ? selection.split(":")[1] : allEnrollments[0]?.language || [...knownLanguages][0] || "");
  const scope = selection.startsWith("unassigned:") ? "unassigned" : selectedEnrollment && selectedEnrollment.course_type !== "legacy" ? "course" : "all";
  const enrollment = selectedEnrollment || allEnrollments.find(e => e.language === language);
  const filterRecords = <T extends Parameters<typeof filterStudentRecords>[0][number]>(records: T[]) => filterStudentRecords(records, language, scope, enrollment, courseLessons);
  const scopedActivities = filterRecords(activities);
  const scopedErrors = filterRecords(errors).map(e => ({ ...e, courseLabel: studentRecordLabel(e, courseLessons) }));
  const scopedProgress = filterRecords(progress);
  const scopedLessons = lessons.filter(l => l.language === language);
  const languageXp = xp?.find(x => x.language === language)?.total_xp ?? 0;

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {profile?.display_name || "Student"}
          </h1>
        </div>

        {enrollmentError && <p className="text-destructive">Upisi nisu učitani. Osveži stranicu.</p>}
        <h2 className="text-lg font-semibold">Upisani kursevi</h2>
        <div className="flex flex-wrap gap-2">{allEnrollments.map(e => <Button key={e.id} variant={selectedEnrollment?.id === e.id ? "secondary" : "outline"} className="h-auto whitespace-normal text-left" onClick={() => setSelection(e.id)}>{enrollmentName(e)}{!e.onboarding_completed && " · Upis nije završen"}</Button>)}</div>
        {!allEnrollments.length && <p className="text-muted-foreground">Korisnik još nema upisan kurs.</p>}
        {language && <Select value={selectedEnrollment ? selectedEnrollment.id : `${scope}:${language}`} onValueChange={setSelection}>
          <SelectTrigger aria-label="Prikaz aktivnosti" className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{[...knownLanguages].filter(Boolean).map(l => <SelectItem key={`all:${l}`} value={`all:${l}`}>{languageName(l)} · Sve aktivnosti i greške</SelectItem>)}{allEnrollments.filter(e => e.course_type !== "legacy").map(e => <SelectItem key={e.id} value={e.id}>{enrollmentName(e)}</SelectItem>)}{[...knownLanguages].filter(Boolean).map(l => <SelectItem key={`unassigned:${l}`} value={`unassigned:${l}`}>{languageName(l)} · Bez dodeljenog kursa</SelectItem>)}</SelectContent>
        </Select>}
        {/* Overview card */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nivo</p>
                <Badge variant="secondary" className="text-sm">{enrollment?.level || "—"}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cilj učenja</p>
                <p className="text-sm font-medium text-foreground">{enrollment?.learning_goal || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fokus</p>
                <p className="text-sm font-medium text-foreground">{enrollment?.focus_area || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">XP za jezik</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent" /> {languageXp}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Registrovan</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.created_at ? format(new Date(profile.created_at), "dd.MM.yyyy") : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="progress">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="progress">Napredak</TabsTrigger>
            <TabsTrigger value="errors">Greške</TabsTrigger>
            <TabsTrigger value="lessons">Lekcije</TabsTrigger>
            <TabsTrigger value="activity">Istorija aktivnosti</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <div className="flex flex-wrap gap-4 py-4 text-sm"><span>Započete lekcije: {scopedProgress.length}</span><span>Završene lekcije: {scopedProgress.filter(p => p.status === "completed").length}</span><span>Zabeleženi koraci: {scopedProgress.reduce((sum, p) => sum + (Array.isArray(p.completed_steps) ? p.completed_steps.length : 0), 0)}</span><span>Aktivnosti: {scopedActivities.length}</span></div>
            {activitiesError ? <p className="text-destructive">Aktivnosti nisu učitane. Osveži stranicu.</p> : <StudentProgressView activities={scopedActivities} loading={activitiesLoading} />}
          </TabsContent>

          <TabsContent value="errors">
            {errorsError ? <p className="text-destructive">Greške nisu učitane. Osveži stranicu.</p> : <><p className="py-3 text-sm text-muted-foreground">Zabeležene greške: {scopedErrors.length}</p><StudentErrorAnalysis errors={scopedErrors} loading={errorsLoading} /></>}
          </TabsContent>

          <TabsContent value="lessons">
            <StudentLessonHistory lessons={scopedLessons} loading={lessonsLoading} />
          </TabsContent>

          <TabsContent value="activity">
            {activitiesLoading ? (
              <p className="text-muted-foreground">Učitavanje...</p>
            ) : scopedActivities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nema zabeleženih aktivnosti.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {scopedActivities.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{a.module} — {a.type}</p>
                      <p className="text-xs text-muted-foreground">{studentRecordLabel(a, courseLessons)}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd.MM.yyyy HH:mm")}</p>
                    </div>
                    <Badge variant="outline">+{a.points} XP</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
