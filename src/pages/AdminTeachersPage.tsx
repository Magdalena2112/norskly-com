import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Star, CheckCircle2, CalendarDays, Users } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { visibleForCourse } from "@/lib/teacherVisibility";

const LANG: Record<string, string> = { no: "🇳🇴 Norveški", en: "🇬🇧 Engleski", de: "🇩🇪 Nemački" };

const formatPrice = (cents: number, currency: string) =>
  `${(cents / 100).toLocaleString("sr-RS", { maximumFractionDigits: 2 })} ${currency}`;

export default function AdminTeachersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const approval = useMutation({
    mutationFn: async ({ teacherId, language, enabled }: { teacherId: string; language: string; enabled: boolean }) => {
      const result = enabled
        ? await supabase.from("teacher_course_approvals").insert({ teacher_id: teacherId, language })
        : await supabase.from("teacher_course_approvals").delete().eq("teacher_id", teacherId).eq("language", language).eq("course_type", "health");
      if (result.error) throw result.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers-overview"] });
      queryClient.invalidateQueries({ queryKey: ["teachers-list"] });
      toast({ title: "Vidljivost sačuvana" });
    },
    onError: () => toast({ title: "Vidljivost nije sačuvana", variant: "destructive" }),
  });
  const { data, isLoading } = useQuery({
    queryKey: ["admin-teachers-overview"],
    queryFn: async () => {
      const [teachers, types, lessons, approvals] = await Promise.all([
        supabase.from("teachers").select("id, name, email, photo_url, is_active, teaching_languages, language, rating, focus, teaching_levels, course_types").order("name"),
        supabase.from("lesson_types").select("id, teacher_id, title, duration_minutes, price_cents, currency, is_active, language"),
        supabase.from("lessons").select("teacher_id, user_id, status, start_time"),
        supabase.from("teacher_course_approvals").select("teacher_id, language"),
      ]);
      if (teachers.error) throw teachers.error;
      if (types.error) throw types.error;
      if (approvals.error) throw approvals.error;
      const now = new Date().toISOString();
      return (teachers.data ?? []).map((t) => {
        const ls = (lessons.data ?? []).filter((l) => l.teacher_id === t.id);
        return {
          ...t,
          approvedLanguages: (approvals.data ?? []).filter(a => a.teacher_id === t.id).map(a => a.language),
          completed: ls.filter((l) => l.status === "completed" || (l.status === "scheduled" && l.start_time < now)).length,
          upcoming: ls.filter((l) => l.status === "scheduled" && l.start_time >= now).length,
          students: new Set(ls.map((l) => l.user_id)).size,
          offers: (types.data ?? []).filter((o) => o.teacher_id === t.id),
        };
      });
    },
  });

  const list = data ?? [];
  const active = list.filter((t) => t.is_active);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Profesori</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isLoading ? "Učitavanje…" : `${active.length} aktivnih od ukupno ${list.length}`}
          </p>
        </div>

        {!isLoading && list.length === 0 && (
          <Card><CardContent className="p-6 text-sm text-muted-foreground">Još nema profesora.</CardContent></Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {list.map((t) => {
            const langs = t.teaching_languages?.length ? t.teaching_languages : [t.language];
            return (
              <Card key={t.id} className={t.is_active ? "" : "opacity-70"}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    {t.photo_url ? (
                      <img src={t.photo_url} alt={t.name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground">
                        {t.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{t.name}</span>
                        <Badge variant={t.is_active ? "default" : "secondary"}>{t.is_active ? "Aktivan" : "Pauziran"}</Badge>
                      </div>
                      {t.email && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {t.email}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {langs.map((l) => <Badge key={l} variant="outline" className="text-xs">{LANG[l] ?? l}</Badge>)}
                        {(t.teaching_levels ?? []).map((l: string) => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>)}
                        {(t.course_types ?? []).includes("health") && <Badge variant="secondary" className="text-xs">Želi zdravstveni</Badge>}
                        {!(t.teaching_levels ?? []).length && <Badge variant="destructive" className="text-xs">Nivoi nisu uneti</Badge>}
                        {Number(t.rating) > 0 && (
                          <Badge variant="outline" className="text-xs"><Star className="h-3 w-3 mr-1" />{Number(t.rating).toFixed(1)}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: CheckCircle2, label: "Održano", value: t.completed },
                      { icon: CalendarDays, label: "Zakazano", value: t.upcoming },
                      { icon: Users, label: "Učenika", value: t.students },
                    ].map((s) => (
                      <div key={s.label} className="rounded-lg border border-border p-2 text-center">
                        <s.icon className="h-4 w-4 mx-auto text-muted-foreground" />
                        <div className="text-lg font-bold text-foreground">{s.value}</div>
                        <div className="text-[11px] text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 border-t border-border pt-3">
                    <h2 className="text-sm font-semibold text-foreground">Vidljivost na kursevima</h2>
                    {langs.map(language => (
                      <div key={language} className="space-y-1">
                        <div className="text-xs text-muted-foreground">{LANG[language] ?? language} · Opšti: {visibleForCourse(t, language, "general", t.offers, t.approvedLanguages) ? "Vidljiv" : "Bez aktivne ponude"}</div>
                        <label className="flex items-center justify-between gap-3 text-sm text-foreground">
                          <span>Zdravstveni · {LANG[language] ?? language}</span>
                          <Switch aria-label={`Zdravstveni ${language} za ${t.name}`} checked={t.approvedLanguages.includes(language)} disabled={approval.isPending}
                            onCheckedChange={enabled => approval.mutate({ teacherId: t.id, language, enabled })} />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-2">Ponude i cene</div>
                    {t.offers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Nema podešenih ponuda.</p>
                    ) : (
                      <ul className="space-y-1">
                        {t.offers.map((o) => (
                          <li key={o.id} className="flex items-center justify-between gap-2 text-sm">
                            <span className={`truncate ${o.is_active ? "text-foreground" : "text-muted-foreground line-through"}`}>
                              {o.title} · {o.duration_minutes} min {LANG[o.language] ? `· ${LANG[o.language]}` : ""}
                            </span>
                            <span className="font-medium text-foreground whitespace-nowrap">{formatPrice(o.price_cents, o.currency)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
