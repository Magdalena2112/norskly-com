import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, Headphones, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";
import { ACTIVITY_TYPE_LABELS, type ListeningActivity, type ListeningProgress } from "@/lib/listening";

export default function ListeningPage() {
  const { user } = useAuth();
  const { code, labelSr } = useSelectedLanguage();
  const { profile, loading: profileLoading } = useProfile();
  const level = profile.level === "C1" ? "B2" : profile.level;
  const navigate = useNavigate();
  const [items, setItems] = useState<ListeningActivity[]>([]);
  const [progress, setProgress] = useState<Record<string, ListeningProgress>>({});
  const [loading, setLoading] = useState(true);
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!user || profileLoading) return;
    setLoading(true);
    (async () => {
      const [{ data: acts }, { data: prog }] = await Promise.all([
        supabase.from("listening_activities").select("*").eq("language", code).eq("cefr_level", level).eq("is_published", true).order("sort_order"),
        supabase.from("listening_progress").select("activity_id,status,score,total,attempts").eq("user_id", user.id).eq("language", code),
      ]);
      setItems((acts || []) as unknown as ListeningActivity[]);
      setProgress(Object.fromEntries((prog || []).map((p) => [p.activity_id, p as ListeningProgress])));
      setLoading(false);
    })();
  }, [user, code, level, profileLoading]);

  const topics = useMemo(() => Array.from(new Set(items.map((i) => i.topic))), [items]);
  const filtered = items.filter((i) => {
    const done = progress[i.id]?.status === "completed";
    return (topic === "all" || i.topic === topic) &&
      (status === "all" || (status === "done" ? done : !done));
  });
  const doneCount = items.filter((i) => progress[i.id]?.status === "completed").length;

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-8 sm:py-10 relative z-10">
        <BackButton />
        <div className="mt-4 mb-6">
          <p className="font-script italic text-primary/60 text-sm">{labelSr} · slušanje</p>
          <h1 className="text-display text-3xl sm:text-4xl text-primary flex items-center gap-3">
            <Headphones className="w-7 h-7" /> Slušanje
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Vežbaj razumevanje govora. Prvo slušaj bez teksta, transkript otvori tek kad ti zatreba.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Nivo: {level}</Badge>
            <span className="text-xs text-muted-foreground">automatski usklađeno sa tvojim profilom</span>
          </div>
          {items.length > 0 && (
            <p className="text-xs text-primary/70 mt-2">Završeno: {doneCount} / {items.length}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="bg-cream"><SelectValue placeholder="Tema" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve teme</SelectItem>
              {topics.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-cream"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sve aktivnosti</SelectItem>
              <SelectItem value="done">Završene</SelectItem>
              <SelectItem value="todo">Nezavršene</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">Nema aktivnosti za izabrane filtere.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((a, i) => {
              const p = progress[a.id];
              const done = p?.status === "completed";
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card
                    onClick={() => navigate(`/listening/${a.id}`)}
                    className="cursor-pointer h-full bg-cream border border-border/60 shadow-card-soft transition-all hover:-translate-y-1 hover:shadow-postcard"
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">{a.cefr_level}</Badge>
                        <span className="text-xs text-primary/60">{a.topic}</span>
                        <span className="ml-auto">
                          {done ? <CheckCircle2 className="w-5 h-5 text-forest" aria-label="Završeno" /> : <Circle className="w-5 h-5 text-primary/25" aria-label="Nije završeno" />}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-lg text-primary leading-tight">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex-1">{a.description}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-primary/70">
                        <span className="font-script italic">{ACTIVITY_TYPE_LABELS[a.activity_type] || a.activity_type}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.max(1, Math.ceil(a.duration_seconds / 60))} min</span>
                      </div>
                      {p && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {done ? `Rezultat: ${p.score}/${p.total}` : "U toku"} · pokušaja: {p.attempts}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
