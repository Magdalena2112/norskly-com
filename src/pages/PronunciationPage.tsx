import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, Clock, Mic, CircleDot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";
import {
  ACTIVITY_TYPE_LABELS, CATEGORIES, CATEGORY_LABEL,
  type PronCategory, type PronunciationActivity, type PronunciationProgress,
} from "@/lib/pronunciation";

export default function PronunciationPage() {
  const { user } = useAuth();
  const { code, labelSr } = useSelectedLanguage();
  const { profile, loading: profileLoading } = useProfile();
  const level = profile.level || "A1";
  const navigate = useNavigate();
  const [items, setItems] = useState<PronunciationActivity[]>([]);
  const [progress, setProgress] = useState<Record<string, PronunciationProgress>>({});
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<"all" | PronCategory>("all");
  const [topic, setTopic] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!user || profileLoading) return;
    setLoading(true);
    (async () => {
      const [{ data: acts }, { data: prog }] = await Promise.all([
        supabase.from("pronunciation_activities").select("*").eq("language", code).eq("cefr_level", level).eq("is_published", true).order("sort_order"),
        supabase.from("pronunciation_progress").select("activity_id,status,score,practiced_items,attempts").eq("user_id", user.id).eq("language", code),
      ]);
      setItems((acts || []) as unknown as PronunciationActivity[]);
      setProgress(Object.fromEntries((prog || []).map((p) => [p.activity_id, p as unknown as PronunciationProgress])));
      setLoading(false);
    })();
  }, [user, code, level, profileLoading]);

  const topics = useMemo(() => Array.from(new Set(items.map((i) => i.topic))), [items]);
  const usedCategories = CATEGORIES.filter((c) => items.some((i) => i.category === c.id));
  const filtered = items.filter((i) => {
    const s = progress[i.id]?.status;
    return (category === "all" || i.category === category) && (topic === "all" || i.topic === topic) &&
      (status === "all" || (status === "done" ? s === "completed" : status === "progress" ? s === "in_progress" : !s));
  });
  const doneCount = items.filter((i) => progress[i.id]?.status === "completed").length;
  const pct = items.length ? Math.round((doneCount / items.length) * 100) : 0;

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-4xl py-8 sm:py-10 relative z-10">
        <BackButton />
        <div className="mt-4 mb-6">
          <p className="font-script italic text-primary/60 text-sm">{labelSr} · izgovor</p>
          <h1 className="text-display text-3xl sm:text-4xl text-primary flex items-center gap-3">
            <Mic className="w-7 h-7" /> Izgovor
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Slušaj → uoči → ponovi → vežbaj. Uvežbaj glasove, reči i rečenice da zvučiš prirodno.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Nivo: {level}</Badge>
            <span className="text-xs text-muted-foreground">automatski usklađeno sa tvojim profilom</span>
          </div>
          {items.length > 0 && (
            <div className="mt-4 max-w-sm">
              <div className="flex justify-between text-xs text-primary/70 mb-1">
                <span>Napredak u izgovoru</span><span>{doneCount} / {items.length}</span>
              </div>
              <Progress value={pct} className="h-2" />
            </div>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {[{ id: "all" as const, label: "Sve" }, ...CATEGORIES].map((c) => {
            const active = category === c.id;
            const empty = c.id !== "all" && !usedCategories.some((u) => u.id === c.id);
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  active ? "bg-primary text-primary-foreground border-primary" : "bg-cream border-border/60 text-primary hover:bg-secondary/60"
                } ${empty && !active ? "opacity-50" : ""}`}
              >
                {c.label}
              </button>
            );
          })}
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
              <SelectItem value="todo">Nezapočete</SelectItem>
              <SelectItem value="progress">U toku</SelectItem>
              <SelectItem value="done">Završene</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            {items.length === 0 ? `Vežbe izgovora za nivo ${level} su u pripremi.` : "Nema aktivnosti za izabrane filtere."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filtered.map((a, i) => {
              const p = progress[a.id];
              return (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Card
                    onClick={() => navigate(`/pronunciation/${a.id}`)}
                    className="cursor-pointer h-full bg-cream border border-border/60 shadow-card-soft transition-all hover:-translate-y-1 hover:shadow-postcard"
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="secondary">{a.cefr_level}</Badge>
                        <span className="text-xs text-primary/60">{CATEGORY_LABEL[a.category] || a.category}</span>
                        <span className="ml-auto">
                          {p?.status === "completed" ? <CheckCircle2 className="w-5 h-5 text-forest" aria-label="Završeno" />
                            : p ? <CircleDot className="w-5 h-5 text-sunset" aria-label="U toku" />
                            : <Circle className="w-5 h-5 text-primary/25" aria-label="Nije započeto" />}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-lg text-primary leading-tight">{a.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex-1">{a.description}</p>
                      <div className="mt-4 flex items-center justify-between text-xs text-primary/70">
                        <span className="font-script italic">{ACTIVITY_TYPE_LABELS[a.activity_type] || a.activity_type}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{Math.max(1, Math.ceil(a.duration_seconds / 60))} min</span>
                      </div>
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
