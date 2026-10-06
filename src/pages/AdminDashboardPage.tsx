import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, subDays } from "date-fns";
import { Users, GraduationCap, UserCheck, CalendarDays, ArrowRight, Activity, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const LANG: Record<string, string> = { no: "🇳🇴 Norveški", en: "🇬🇧 Engleski", de: "🇩🇪 Nemački" };

export default function AdminDashboardPage() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const weekAgo = subDays(new Date(), 7).toISOString();
      const now = new Date().toISOString();
      const [profiles, roles, activities, apps, teachers, lessons, xp] = await Promise.all([
        supabase.from("profiles").select("user_id, display_name, level, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("activities").select("user_id").gte("created_at", weekAgo),
        supabase.from("teacher_applications").select("id, full_name, languages, created_at, status").order("created_at", { ascending: false }),
        supabase.from("teachers").select("id, name, is_active"),
        supabase.from("lessons").select("id, user_id, teacher_id, start_time, status, language").order("start_time", { ascending: true }),
        supabase.from("user_xp").select("user_id, total_xp"),
      ]);
      const staff = new Set(
        (roles.data ?? []).filter((r) => ["admin", "admin_teacher", "teacher"].includes(r.role)).map((r) => r.user_id),
      );
      const students = (profiles.data ?? []).filter((p) => !staff.has(p.user_id));
      const xpMap = new Map<string, number>();
      (xp.data ?? []).forEach((x) => xpMap.set(x.user_id, (xpMap.get(x.user_id) ?? 0) + x.total_xp));
      const nameMap = new Map((profiles.data ?? []).map((p) => [p.user_id, p.display_name || "Učenik"]));
      const teacherMap = new Map((teachers.data ?? []).map((t) => [t.id, t.name]));
      const allLessons = lessons.data ?? [];
      return {
        students,
        activeWeek: new Set((activities.data ?? []).filter((a) => !staff.has(a.user_id)).map((a) => a.user_id)).size,
        pending: (apps.data ?? []).filter((a) => a.status === "pending"),
        activeTeachers: (teachers.data ?? []).filter((t) => t.is_active).length,
        upcoming: allLessons.filter((l) => l.status === "scheduled" && l.start_time >= now).slice(0, 6),
        scheduledCount: allLessons.filter((l) => l.status === "scheduled").length,
        completedCount: allLessons.filter((l) => l.status === "completed").length,
        xpMap,
        nameMap,
        teacherMap,
      };
    },
  });

  const stats = [
    { label: "Učenici", value: data?.students.length ?? 0, sub: `${data?.activeWeek ?? 0} aktivno ove nedelje`, icon: Users, to: "/admin/students" },
    { label: "Prijave na čekanju", value: data?.pending.length ?? 0, sub: "profesori čekaju odluku", icon: GraduationCap, to: "/admin/teacher-applications", highlight: (data?.pending.length ?? 0) > 0 },
    { label: "Aktivni profesori", value: data?.activeTeachers ?? 0, sub: "drže nastavu", icon: UserCheck, to: "/admin/teachers" },
    { label: "Časovi", value: data?.scheduledCount ?? 0, sub: `zakazano · ${data?.completedCount ?? 0} održano`, icon: CalendarDays, to: "/admin/lessons" },
  ];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Kontrolna tabla</h1>
          <p className="text-sm text-muted-foreground mt-1">Pregled cele platforme na jednom mestu.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <button key={s.label} onClick={() => navigate(s.to)} className="text-left">
              <Card className={`h-full transition-shadow hover:shadow-md ${s.highlight ? "border-accent ring-1 ring-accent/40" : ""}`}>
                <CardContent className="p-4 space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span className="text-xs font-medium">{s.label}</span>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{isLoading ? "…" : s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.sub}</div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>

        {(data?.pending.length ?? 0) > 0 && (
          <Card className="border-accent/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-accent" /> Zahteva tvoju pažnju
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data!.pending.slice(0, 5).map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground truncate">{a.full_name}</div>
                    <div className="text-xs text-muted-foreground">{a.languages} · {format(new Date(a.created_at), "dd.MM.yyyy.")}</div>
                  </div>
                  <Button size="sm" onClick={() => navigate(`/admin/teacher-applications/${a.id}`)}>
                    Pregledaj <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Predstojeći časovi</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/lessons")}>Svi</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <p className="text-sm text-muted-foreground">Učitavanje…</p> :
                data!.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">Nema zakazanih časova.</p> :
                data!.upcoming.map((l) => (
                  <div key={l.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{data!.nameMap.get(l.user_id) ?? "Učenik"}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        Profesor: {(l.teacher_id && data!.teacherMap.get(l.teacher_id)) || "—"}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm text-foreground">{format(new Date(l.start_time), "dd.MM. HH:mm")}</div>
                      <Badge variant="secondary" className="text-[10px]">{LANG[l.language] ?? l.language}</Badge>
                    </div>
                  </div>
                ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Najnoviji učenici</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/students")}>Svi</Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? <p className="text-sm text-muted-foreground">Učitavanje…</p> :
                data!.students.length === 0 ? <p className="text-sm text-muted-foreground">Još nema učenika.</p> :
                data!.students.slice(0, 6).map((s) => (
                  <button key={s.user_id} onClick={() => navigate(`/admin/students/${s.user_id}`)}
                    className="w-full flex items-center justify-between gap-2 rounded-lg border border-border p-3 text-left hover:bg-muted/50">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{s.display_name || "Bez imena"}</div>
                      <div className="text-xs text-muted-foreground">
                        {s.created_at ? `Registrovan ${format(new Date(s.created_at), "dd.MM.yyyy.")}` : ""}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline">{s.level || "A1"}</Badge>
                      <div className="text-xs text-muted-foreground mt-1">{data!.xpMap.get(s.user_id) ?? 0} XP</div>
                    </div>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
