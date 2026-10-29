import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { belongsToEnrollment, enrollmentName } from "@/lib/adminStudents";
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

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
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

  const { data: errors = [], isLoading: errorsLoading } = useQuery({
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
  const enrollment = enrollments.find(e => e.id === selection) || enrollments[0];
  const unassigned = selection === "unassigned";
  const matches = (record: Parameters<typeof belongsToEnrollment>[0]) => enrollment && belongsToEnrollment(record, enrollment, courseLessons);
  const scopedActivities = unassigned ? activities.filter(a => a.language === enrollment?.language && !enrollments.some(e => belongsToEnrollment(a, e, courseLessons))) : activities.filter(matches);
  const scopedErrors = unassigned ? errors.filter(e => e.language === enrollment?.language && !enrollments.some(n => belongsToEnrollment(e, n, courseLessons))) : errors.filter(matches);
  const scopedProgress = unassigned ? [] : progress.filter(matches);
  const scopedLessons = lessons.filter(l => l.language === enrollment?.language);
  const languageXp = xp?.find(x => x.language === enrollment?.language)?.total_xp ?? 0;

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
        <div className="flex flex-wrap gap-2">{enrollments.map(e => <Button key={e.id} variant={!unassigned && enrollment?.id === e.id ? "secondary" : "outline"} className="h-auto whitespace-normal text-left" onClick={() => setSelection(e.id)}>{enrollmentName(e)}{!e.onboarding_completed && " · Upis nije završen"}</Button>)}</div>
        {!enrollments.length && <p className="text-muted-foreground">Korisnik još nema upisan kurs.</p>}
        {enrollment && <Select value={unassigned ? "unassigned" : enrollment.id} onValueChange={setSelection}>
          <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>{enrollments.map(e => <SelectItem key={e.id} value={e.id}>{enrollmentName(e)}</SelectItem>)}<SelectItem value="unassigned">Ostale aktivnosti i ranije greške · {enrollment.language.toUpperCase()}</SelectItem></SelectContent>
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
            {!unassigned && <div className="flex flex-wrap gap-4 py-4 text-sm"><span>Započete lekcije: {scopedProgress.length}</span><span>Završene lekcije: {scopedProgress.filter(p => p.status === "completed").length}</span><span>Zabeleženi koraci: {scopedProgress.reduce((sum, p) => sum + (Array.isArray(p.completed_steps) ? p.completed_steps.length : 0), 0)}</span></div>}
            <StudentProgressView activities={scopedActivities} loading={activitiesLoading} />
          </TabsContent>

          <TabsContent value="errors">
            <StudentErrorAnalysis errors={scopedErrors} loading={errorsLoading} />
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
                {scopedActivities.slice(0, 50).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{a.module} — {a.type}</p>
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
