import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BackButton from "@/components/BackButton";
import { LangBadge, langMeta } from "@/components/teacher/LanguageFilter";
import { toast } from "@/hooks/use-toast";
import { Lock, AlertCircle, Activity, Target, NotebookPen, ClipboardList, Compass, Trash2, ExternalLink } from "lucide-react";

const MODULE_LABEL: Record<string, string> = {
  grammar: "Gramatika", vocabulary: "Vokabular", talk: "Razgovor", writing: "Pisanje",
  reading: "Čitanje", listening: "Slušanje", pronunciation: "Izgovor",
};
const STATUS: Record<string, { label: string; cls: string }> = {
  assigned: { label: "Zadato", cls: "bg-gold/15 text-foreground border-gold/40" },
  submitted: { label: "Predato", cls: "bg-primary/10 text-primary border-primary/30" },
  reviewed: { label: "Pregledano", cls: "bg-accent/15 text-foreground border-accent/40" },
};

export default function TeacherStudentDetailPage() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const [params] = useSearchParams();
  const lessonId = params.get("lesson");
  const qc = useQueryClient();

  const { data: teacher } = useQuery({
    queryKey: ["teacher-self", user?.id],
    queryFn: async () => (await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle()).data,
    enabled: !!user,
  });

  const { data: student } = useQuery({
    queryKey: ["teacher-my-students"],
    queryFn: async () => (await supabase.rpc("get_my_students")).data || [],
    select: (rows: any[]) => rows.find((r) => r.student_id === studentId),
  });

  const langs: string[] = student?.languages || [];
  const [lang, setLang] = useState<string | null>(params.get("lang"));
  const activeLang = lang || langs[0] || "no";
  const hasConsent = !!student?.consent_granted;

  const { data: langProfile } = useQuery({
    queryKey: ["t-student-lp", studentId, activeLang],
    queryFn: async () => (await supabase.from("language_profiles").select("*").eq("user_id", studentId!).eq("language", activeLang).maybeSingle()).data,
    enabled: hasConsent,
  });

  const since30 = useMemo(() => new Date(Date.now() - 30 * 864e5).toISOString(), []);
  const since7 = useMemo(() => new Date(Date.now() - 7 * 864e5).toISOString(), []);

  const { data: errors = [] } = useQuery({
    queryKey: ["t-student-errors", studentId, activeLang],
    queryFn: async () => (await supabase.from("error_events").select("topic, category, example_wrong, example_correct, created_at")
      .eq("user_id", studentId!).eq("language", activeLang).gte("created_at", since30).order("created_at", { ascending: false }).limit(200)).data || [],
    enabled: hasConsent,
  });

  const { data: acts = [] } = useQuery({
    queryKey: ["t-student-acts", studentId, activeLang],
    queryFn: async () => (await supabase.from("activities").select("module, created_at")
      .eq("user_id", studentId!).eq("language", activeLang).gte("created_at", since7).limit(500)).data || [],
    enabled: hasConsent,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ["t-notes", studentId, teacher?.id],
    queryFn: async () => (await supabase.from("teacher_lesson_notes").select("*").eq("teacher_id", teacher!.id).eq("student_id", studentId!).order("created_at", { ascending: false })).data || [],
    enabled: !!teacher,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["t-assign", studentId, teacher?.id],
    queryFn: async () => (await supabase.from("teacher_assignments").select("*").eq("teacher_id", teacher!.id).eq("student_id", studentId!).order("created_at", { ascending: false })).data || [],
    enabled: !!teacher,
  });

  const topErrors = useMemo(() => {
    const m = new Map<string, { topic: string; count: number; ex?: any }>();
    errors.forEach((e: any) => {
      const k = e.topic;
      const cur = m.get(k) || { topic: k, count: 0, ex: e };
      cur.count++;
      m.set(k, cur);
    });
    return [...m.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [errors]);

  const actByModule = useMemo(() => {
    const m: Record<string, number> = {};
    acts.forEach((a: any) => (m[a.module] = (m[a.module] || 0) + 1));
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [acts]);

  const langNotes = notes.filter((n: any) => n.language === activeLang);
  const lastNote = langNotes[0];
  const langAssignments = assignments.filter((a: any) => a.language === activeLang);
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["t-notes", studentId] });
    qc.invalidateQueries({ queryKey: ["t-assign", studentId] });
    qc.invalidateQueries({ queryKey: ["teacher-submitted"] });
  };

  return (
    <div className="min-h-screen bg-fjord-soft">
      <header className="border-b border-border/50 bg-cream/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/teacher/students" />
          <span className="font-display font-bold text-lg text-primary truncate">{student?.display_name || "Učenik"}</span>
        </div>
      </header>

      <div className="container max-w-3xl py-6 space-y-4">
        {langs.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {langs.map((c) => (
              <button key={c} onClick={() => setLang(c)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm border ${c === activeLang ? "bg-primary text-primary-foreground border-primary" : "bg-background/80 border-border"}`}>
                {langMeta(c).flag} {langMeta(c).label}
              </button>
            ))}
          </div>
        )}

        <Tabs defaultValue={lessonId ? "brief" : "brief"}>
          <TabsList className="w-full grid grid-cols-3 rounded-full">
            <TabsTrigger value="brief" className="rounded-full text-xs sm:text-sm">Priprema</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-full text-xs sm:text-sm">Beleške</TabsTrigger>
            <TabsTrigger value="hw" className="rounded-full text-xs sm:text-sm">Domaći</TabsTrigger>
          </TabsList>

          {/* PRE-LESSON BRIEF */}
          <TabsContent value="brief" className="space-y-4 mt-4">
            <Section icon={Compass} title="Plan sa prethodnog časa">
              {lastNote ? (
                <div className="space-y-2 text-sm">
                  {lastNote.next_plan && <p><span className="text-muted-foreground">Fokus: </span>{lastNote.next_plan}</p>}
                  {lastNote.revisit && <p><span className="text-muted-foreground">Vratiti se na: </span>{lastNote.revisit}</p>}
                  <p className="text-xs text-muted-foreground">Beleška od {format(new Date(lastNote.created_at), "dd.MM.yyyy")}</p>
                </div>
              ) : <p className="text-sm text-muted-foreground">Još nema beleški za ovaj jezik.</p>}
            </Section>

            {!hasConsent ? (
              <Card className="bg-background/85 border-border/30 rounded-3xl">
                <CardContent className="py-8 text-center">
                  <Lock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="font-medium text-foreground">Privatna analitika</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    Učenik nije podelio napredak iz samostalnog rada. Beleške i domaći rade normalno.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Section icon={Target} title="Profil učenja">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <Info label="Nivo" value={langProfile?.level} />
                    <Info label="Cilj" value={langProfile?.learning_goal} />
                    <Info label="Fokus" value={langProfile?.focus_area} />
                    <Info label="Kontekst" value={langProfile?.life_context} />
                  </div>
                </Section>
                <Section icon={AlertCircle} title="Najčešće greške (30 dana)">
                  {topErrors.length === 0 ? <p className="text-sm text-muted-foreground">Nema zabeleženih grešaka.</p> : (
                    <div className="space-y-2">
                      {topErrors.map((e) => (
                        <div key={e.topic} className="rounded-xl border border-border/40 p-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-foreground">{e.topic}</span>
                            <Badge variant="secondary" className="text-xs">{e.count}×</Badge>
                          </div>
                          {e.ex?.example_wrong && (
                            <p className="text-xs mt-1"><span className="line-through text-destructive/80">{e.ex.example_wrong}</span> → <span className="text-foreground">{e.ex.example_correct}</span></p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
                <Section icon={Activity} title="Aktivnost (7 dana)">
                  {actByModule.length === 0 ? <p className="text-sm text-muted-foreground">Bez aktivnosti u poslednjih 7 dana.</p> : (
                    <div className="flex flex-wrap gap-2">
                      {actByModule.map(([m, c]) => <Badge key={m} variant="outline" className="text-xs">{MODULE_LABEL[m] || m}: {c}</Badge>)}
                    </div>
                  )}
                </Section>
              </>
            )}

            <Section icon={ClipboardList} title="Otvoreni domaći">
              {langAssignments.filter((a: any) => a.status !== "reviewed").length === 0
                ? <p className="text-sm text-muted-foreground">Nema otvorenih zadataka.</p>
                : langAssignments.filter((a: any) => a.status !== "reviewed").map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm py-1">
                    <span>{a.title}</span><StatusChip s={a.status} />
                  </div>
                ))}
            </Section>
          </TabsContent>

          {/* NOTES */}
          <TabsContent value="notes" className="space-y-4 mt-4">
            {teacher && studentId && <NoteForm teacherId={teacher.id} studentId={studentId} language={activeLang} lessonId={lessonId} onSaved={refresh} />}
            {langNotes.map((n: any) => (
              <Card key={n.id} className="bg-background/85 border-border/30 rounded-2xl">
                <CardContent className="py-4 space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{format(new Date(n.created_at), "dd.MM.yyyy HH:mm")}</span>
                    <div className="flex items-center gap-2">
                      {n.shared_with_student && <Badge variant="outline" className="text-[10px]">Podeljeno</Badge>}
                      <button aria-label="Obriši belešku" onClick={async () => { await supabase.from("teacher_lesson_notes").delete().eq("id", n.id); refresh(); }}>
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </div>
                  {n.covered && <p><b>Obrađeno:</b> {n.covered}</p>}
                  {n.struggles && <p><b>Problematično:</b> {n.struggles}</p>}
                  {n.revisit && <p><b>Vratiti se na:</b> {n.revisit}</p>}
                  {n.next_plan && <p><b>Plan za sledeći čas:</b> {n.next_plan}</p>}
                  {n.shared_with_student && n.student_summary && <p className="text-muted-foreground"><b>Za učenika:</b> {n.student_summary}</p>}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* HOMEWORK */}
          <TabsContent value="hw" className="space-y-4 mt-4">
            {teacher && studentId && <AssignmentForm teacherId={teacher.id} studentId={studentId} language={activeLang} onSaved={refresh} />}
            {langAssignments.map((a: any) => <AssignmentCard key={a.id} a={a} onChange={refresh} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
      <CardContent className="py-5 space-y-3">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2"><Icon className="w-4 h-4 text-accent" />{title}</h3>
        {children}
      </CardContent>
    </Card>
  );
}
function Info({ label, value }: { label: string; value?: string | null }) {
  return <div className="rounded-xl bg-muted/40 p-2.5"><div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div><div className="text-foreground">{value || "—"}</div></div>;
}
function StatusChip({ s }: { s: string }) {
  const m = STATUS[s] || STATUS.assigned;
  return <span className={`text-[11px] px-2 py-0.5 rounded-full border ${m.cls}`}>{m.label}</span>;
}

function NoteForm({ teacherId, studentId, language, lessonId, onSaved }: any) {
  const [f, setF] = useState({ covered: "", struggles: "", revisit: "", next_plan: "", student_summary: "" });
  const [share, setShare] = useState(false);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!f.covered && !f.struggles && !f.revisit && !f.next_plan) return;
    setBusy(true);
    const { error } = await supabase.from("teacher_lesson_notes").insert({
      teacher_id: teacherId, student_id: studentId, language, lesson_id: lessonId || null, ...f, shared_with_student: share,
    });
    setBusy(false);
    if (error) return toast({ title: "Greška", description: error.message, variant: "destructive" });
    setF({ covered: "", struggles: "", revisit: "", next_plan: "", student_summary: "" });
    setShare(false);
    toast({ title: "Beleška sačuvana" });
    onSaved();
  };
  const field = (k: keyof typeof f, label: string, ph: string) => (
    <div className="space-y-1"><Label className="text-xs">{label}</Label>
      <Textarea rows={2} placeholder={ph} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
  );
  return (
    <Section icon={NotebookPen} title="Nova beleška o času">
      {field("covered", "Šta je rađeno", "Teme, gramatika, situacije…")}
      {field("struggles", "Šta je bilo problematično", "Npr. V2 red reči, izgovor ø…")}
      {field("revisit", "Čemu se vraćamo", "Stavke za ponavljanje")}
      {field("next_plan", "Plan za sledeći čas", "Kratak fokus za naredni susret")}
      <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3">
        <Label className="text-sm">Podeli kratak rezime sa učenikom</Label>
        <Switch checked={share} onCheckedChange={setShare} />
      </div>
      {share && field("student_summary", "Rezime za učenika", "Šta učenik vidi na svojoj tabli")}
      <Button onClick={save} disabled={busy} className="rounded-full w-full sm:w-auto">Sačuvaj belešku</Button>
    </Section>
  );
}

function AssignmentForm({ teacherId, studentId, language, onSaved }: any) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [due, setDue] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return;
    if (url && !/^https?:\/\//i.test(url)) return toast({ title: "Link mora početi sa https://", variant: "destructive" });
    setBusy(true);
    const { error } = await supabase.from("teacher_assignments").insert({
      teacher_id: teacherId, student_id: studentId, language, title: title.trim(), description,
      resource_url: url || null, due_date: due ? new Date(due).toISOString() : null,
    });
    setBusy(false);
    if (error) return toast({ title: "Greška", description: error.message, variant: "destructive" });
    setTitle(""); setDescription(""); setUrl(""); setDue("");
    toast({ title: "Zadatak poslat učeniku" });
    onSaved();
  };
  return (
    <Section icon={ClipboardList} title="Novi domaći zadatak">
      <Input placeholder="Naslov zadatka" value={title} onChange={(e) => setTitle(e.target.value)} />
      <Textarea rows={3} placeholder="Opis i uputstvo" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid sm:grid-cols-2 gap-2">
        <Input placeholder="Link ka materijalu (opciono)" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Rok" />
      </div>
      <Button onClick={save} disabled={busy} className="rounded-full w-full sm:w-auto">Zadaj</Button>
    </Section>
  );
}

function AssignmentCard({ a, onChange }: { a: any; onChange: () => void }) {
  const [fb, setFb] = useState(a.feedback || "");
  const review = async () => {
    const { error } = await supabase.from("teacher_assignments").update({ feedback: fb, status: "reviewed" }).eq("id", a.id);
    if (error) return toast({ title: "Greška", description: error.message, variant: "destructive" });
    toast({ title: "Povratna informacija poslata" });
    onChange();
  };
  return (
    <Card className="bg-background/85 border-border/30 rounded-2xl">
      <CardContent className="py-4 space-y-2 text-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-medium text-foreground">{a.title}</p>
            <p className="text-xs text-muted-foreground">
              {a.due_date ? `Rok: ${format(new Date(a.due_date), "dd.MM.yyyy")}` : "Bez roka"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusChip s={a.status} />
            <button aria-label="Obriši zadatak" onClick={async () => { await supabase.from("teacher_assignments").delete().eq("id", a.id); onChange(); }}>
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
        {a.description && <p className="text-muted-foreground whitespace-pre-wrap">{a.description}</p>}
        {a.resource_url && <a href={a.resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline text-xs">Materijal <ExternalLink className="w-3 h-3" /></a>}
        {a.submission_text && (
          <div className="rounded-xl bg-muted/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Odgovor učenika</p>
            <p className="whitespace-pre-wrap text-foreground">{a.submission_text}</p>
          </div>
        )}
        {a.status !== "assigned" && (
          <div className="space-y-2">
            <Textarea rows={2} placeholder="Povratna informacija za učenika" value={fb} onChange={(e) => setFb(e.target.value)} />
            <Button size="sm" className="rounded-full" onClick={review}>{a.status === "reviewed" ? "Ažuriraj komentar" : "Označi kao pregledano"}</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
