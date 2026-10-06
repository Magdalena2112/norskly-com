import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TeacherHeader from "@/components/teacher/TeacherHeader";
import TeacherOfferManager from "@/components/teacher/TeacherOfferManager";
import LanguageFilter, { LangBadge, type LangFilter } from "@/components/teacher/LanguageFilter";
import { Calendar, Users, ArrowRight, ClipboardList, LogOut, Shield, Sparkles } from "lucide-react";

export default function TeacherDashboardPage() {
  const { user, signOut } = useAuth() as any;
  const navigate = useNavigate();
  const [lang, setLang] = useState<LangFilter>("all");

  const { data: teacher } = useQuery({
    queryKey: ["teacher-self", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["teacher-lessons", teacher?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lessons")
        .select("*")
        .eq("teacher_id", teacher!.id)
        .order("start_time", { ascending: true });
      return data || [];
    },
    enabled: !!teacher,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["teacher-my-students", teacher?.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_students");
      return data || [];
    },
    enabled: !!teacher,
  });

  const { data: pendingReview = 0 } = useQuery({
    queryKey: ["teacher-submitted", teacher?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from("teacher_assignments")
        .select("id", { count: "exact", head: true })
        .eq("teacher_id", teacher!.id)
        .eq("status", "submitted");
      return count || 0;
    },
    enabled: !!teacher,
  });

  const nameOf = (id: string) => students.find((s: any) => s.student_id === id)?.display_name || "Učenik";
  const consentOf = (id: string) => !!students.find((s: any) => s.student_id === id)?.consent_granted;
  const byLang = (l: any) => lang === "all" || l.language === lang;
  const upcoming = lessons.filter((l: any) => l.status === "scheduled" && new Date(l.end_time) >= new Date() && byLang(l));
  const filteredStudents = students.filter((s: any) => lang === "all" || (s.languages || []).includes(lang));
  const teaching: string[] = teacher?.teaching_languages?.length ? teacher.teaching_languages : teacher?.language ? [teacher.language] : [];

  return (
    <div className="min-h-screen bg-fjord-soft">
      <TeacherHeader />

      <div className="container max-w-4xl py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardContent className="py-6 flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={teacher?.photo_url || undefined} alt={teacher?.name} />
                <AvatarFallback>{(teacher?.name || "?").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-xl font-display font-bold text-foreground">Zdravo, {teacher?.name?.split(" ")[0]}</h1>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {teaching.map((c) => <LangBadge key={c} code={c} />)}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <LanguageFilter value={lang} onChange={setLang} available={teaching.length > 1 ? teaching : undefined} />

        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Calendar} label="Predstojeći časovi" value={upcoming.length} />
          <StatCard icon={Users} label="Učenici" value={filteredStudents.length} />
          <StatCard icon={ClipboardList} label="Domaći za pregled" value={pendingReview} />
        </div>

        <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
          <CardContent className="py-6 space-y-3">
            <h2 className="font-display font-bold text-lg text-foreground">Predstojeći časovi</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema zakazanih časova.</p>
            ) : (
              upcoming.slice(0, 8).map((l: any) => (
                <div key={l.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 p-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground text-sm truncate">{nameOf(l.user_id)}</p>
                      <LangBadge code={l.language} />
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(l.start_time), "dd.MM.yyyy HH:mm")}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={consentOf(l.user_id) ? "default" : "secondary"} className="text-xs hidden sm:inline-flex">
                      <Shield className="w-3 h-3 mr-1" />{consentOf(l.user_id) ? "Analitika" : "Privatna"}
                    </Badge>
                    <Button size="sm" className="rounded-full" onClick={() => navigate(`/teacher/students/${l.user_id}?lesson=${l.id}&lang=${l.language}`)}>
                      <Sparkles className="w-3.5 h-3.5 sm:mr-1" /><span className="hidden sm:inline">Priprema</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl cursor-pointer hover:border-accent/40 transition" onClick={() => navigate(`/teacher/students${lang !== "all" ? `?lang=${lang}` : ""}`)}>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">Moji učenici</h2>
              <p className="text-sm text-muted-foreground">Beleške, plan za naredni čas i domaći zadaci.</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {teacher?.id && <TeacherOfferManager teacherId={teacher.id} />}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-2xl">
      <CardContent className="py-4 px-3 sm:px-5 flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-3 text-center sm:text-left">
        <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-accent" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
          <div className="text-[11px] sm:text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
