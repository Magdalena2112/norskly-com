import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Mic, Snail, Volume2, Lightbulb, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";
import { logActivity } from "@/lib/logActivity";
import {
  ACTIVITY_TYPE_LABELS, CATEGORY_LABEL, activityItems, isPair, playPronunciation, stopPronunciation,
  type PronItem, type PronPair, type PronunciationActivity,
} from "@/lib/pronunciation";

const STEPS = ["Slušaj", "Uoči", "Ponovi", "Vežbaj"];

function ListenButtons({ item, lang, onPlayed }: { item: PronItem; lang: string; onPlayed?: () => void }) {
  const [playing, setPlaying] = useState<"n" | "s" | null>(null);
  const play = (slow: boolean) => {
    setPlaying(slow ? "s" : "n");
    onPlayed?.();
    playPronunciation(item, lang, slow, () => setPlaying(null));
  };
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="hero" onClick={() => play(false)} aria-label="Slušaj">
        <Volume2 className={`w-4 h-4 mr-1 ${playing === "n" ? "animate-pulse" : ""}`} /> Slušaj
      </Button>
      <Button variant="outline" onClick={() => play(true)} aria-label="Slušaj sporije">
        <Snail className={`w-4 h-4 mr-1 ${playing === "s" ? "animate-pulse" : ""}`} /> Sporije
      </Button>
    </div>
  );
}

/** Target text with optional stressed-word highlighting. */
function Target({ item, big = true }: { item: PronItem; big?: boolean }) {
  const words = item.text.split(/\s+/);
  return (
    <p className={`font-display text-primary text-center leading-tight ${big ? "text-3xl sm:text-5xl" : "text-2xl"}`}>
      {item.stress?.length
        ? words.map((w, i) => (
            <span key={i} className={item.stress!.includes(i) ? "underline decoration-sunset decoration-4 underline-offset-8" : ""}>
              {w}{i < words.length - 1 ? " " : ""}
            </span>
          ))
        : item.text}
    </p>
  );
}

function Guide({ item }: { item: PronItem }) {
  if (!item.ipa && !item.hint && !item.tip && !item.translation) return null;
  return (
    <div className="mt-5 space-y-1.5 text-center text-sm">
      {item.ipa && <p className="font-mono text-primary/80">/{item.ipa}/</p>}
      {item.translation && <p className="text-muted-foreground italic">{item.translation}</p>}
      {item.hint && <p className="text-primary/70">{item.hint}</p>}
      {item.tip && (
        <p className="inline-flex items-start gap-1.5 text-left text-muted-foreground bg-secondary/40 rounded-lg px-3 py-2">
          <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-sunset" />{item.tip}
        </p>
      )}
    </div>
  );
}

type CheckResult = { score: number; verdict: "excellent" | "good" | "retry"; heard: string; feedback: string; tip?: string; words: { word: string; ok: boolean }[] };
const CHECK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pronunciation-check`;
const MAX_REC_MS = 15000;

/** Record the learner, then get an AI pronunciation score and feedback. */
function RecordSlot({ item, lang, level, onSuccess }: { item: PronItem; lang: string; level: string; onSuccess: () => void }) {
  const [state, setState] = useState<"idle" | "rec" | "busy">("idle");
  const [secs, setSecs] = useState(0);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [myUrl, setMyUrl] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setResult(null);
    setMyUrl(null);
    return () => { recRef.current?.state === "recording" && recRef.current.stop(); };
  }, [item.text]);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const type = ["audio/webm", "audio/mp4", "audio/ogg"].find((t) => MediaRecorder.isTypeSupported?.(t)) || "";
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (timerRef.current) window.clearInterval(timerRef.current);
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        send(blob);
      };
      recRef.current = rec;
      rec.start();
      setResult(null);
      setSecs(0);
      setState("rec");
      const t0 = Date.now();
      timerRef.current = window.setInterval(() => {
        const s = Date.now() - t0;
        setSecs(Math.floor(s / 1000));
        if (s >= MAX_REC_MS && rec.state === "recording") rec.stop();
      }, 250);
    } catch {
      toast.error("Dozvoli pristup mikrofonu da bi snimio/la izgovor.");
    }
  };

  const send = async (blob: Blob) => {
    if (blob.size < 1000) { setState("idle"); toast.error("Snimak je prekratak."); return; }
    setState("busy");
    setMyUrl(URL.createObjectURL(blob));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const ext = blob.type.includes("mp4") ? "m4a" : blob.type.includes("ogg") ? "ogg" : "webm";
      const fd = new FormData();
      fd.append("file", blob, `rec.${ext}`);
      fd.append("expected", item.text);
      fd.append("language", lang);
      fd.append("level", level);
      const r = await fetch(CHECK_URL, { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` }, body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Greška");
      setResult(data);
      if (data.verdict !== "retry") onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Procena nije uspela.");
    } finally {
      setState("idle");
    }
  };

  const tone = result?.verdict === "excellent" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700"
    : result?.verdict === "good" ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
    : "border-destructive/40 bg-destructive/10 text-destructive";
  const label = result?.verdict === "excellent" ? "Odlično!" : result?.verdict === "good" ? "Vrlo dobro" : "Pokušaj ponovo";

  return (
    <div className="mt-6 flex flex-col items-center gap-3">
      {state === "rec" ? (
        <Button variant="destructive" className="rounded-full" onClick={() => recRef.current?.stop()}>
          <Square className="w-4 h-4 mr-1" /> Završi snimanje · {secs}s
        </Button>
      ) : (
        <Button variant={result ? "outline" : "hero"} className="rounded-full" disabled={state === "busy"} onClick={start}>
          {state === "busy" ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analiziram izgovor…</>
            : <><Mic className="w-4 h-4 mr-1" /> {result ? "Snimi ponovo" : "Izgovori i proveri"}</>}
        </Button>
      )}
      {state === "rec" && <span className="text-xs text-destructive animate-pulse">● Snimanje… izgovori naglas</span>}

      {result && (
        <div className={`w-full max-w-md rounded-2xl border p-4 text-left ${tone}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">{label}</span>
            <span className="text-lg font-display">{result.score}%</span>
          </div>
          {result.words.length > 0 && (
            <p className="text-base mb-2 text-foreground">
              {result.words.map((w, i) => (
                <span key={i} className={w.ok ? "text-emerald-700" : "text-orange-600 underline decoration-wavy underline-offset-4"}>{w.word} </span>
              ))}
            </p>
          )}
          {result.heard && <p className="text-xs text-muted-foreground mb-2">Čuli smo: „{result.heard}“</p>}
          {result.feedback && <p className="text-sm text-foreground">{result.feedback}</p>}
          {result.tip && (
            <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground">
              <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-sunset" />{result.tip}
            </p>
          )}
          {myUrl && <audio controls src={myUrl} className="w-full h-9 mt-3" aria-label="Tvoj snimak" />}
        </div>
      )}
    </div>
  );
}

function CompareView({ pair, lang }: { pair: PronPair; lang: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-4">
      {[pair.a, pair.b].map((side, i) => (
        <div key={i} className={i === 1 ? "sm:order-3" : ""}>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-5 text-center">
            {side.label && <p className="font-display text-4xl text-primary mb-2">{side.label}</p>}
            <Target item={side} big={false} />
            <Guide item={side} />
            <div className="mt-4"><ListenButtons item={side} lang={lang} /></div>
          </div>
        </div>
      ))}
      <span className="text-center text-2xl text-primary/40 sm:order-2">↔</span>
    </div>
  );
}

export default function PronunciationActivityPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<PronunciationActivity | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [practiced, setPracticed] = useState<number[]>([]);
  const [heard, setHeard] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!activityId || !user || profileLoading) return;
    setLoading(true);
    setIdx(0);
    (async () => {
      const { data } = await supabase.from("pronunciation_activities").select("*").eq("id", activityId).eq("is_published", true).maybeSingle();
      const a = data as unknown as PronunciationActivity | null;
      const level = profile.level || "A1";
      if (!a || a.cefr_level !== level) {
        setActivity(null);
        setLoading(false);
        return;
      }
      setActivity(a);
      const [{ data: prog }, { data: list }] = await Promise.all([
        supabase.from("pronunciation_progress").select("status,practiced_items").eq("user_id", user.id).eq("activity_id", a.id).maybeSingle(),
        supabase.from("pronunciation_activities").select("id,sort_order").eq("language", a.language).eq("cefr_level", level).eq("is_published", true).order("sort_order"),
      ]);
      setPracticed(((prog?.practiced_items as number[]) || []));
      setCompleted(prog?.status === "completed");
      const ids = (list || []).map((r) => r.id);
      const pos = ids.indexOf(a.id);
      setNextId(pos >= 0 && pos < ids.length - 1 ? ids[pos + 1] : null);
      setLoading(false);
    })();
    return () => stopPronunciation();
  }, [activityId, user, profileLoading, profile.level]);

  useEffect(() => setHeard(false), [idx]);

  if (loading) {
    return <StudentLayout><div className="flex justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div></StudentLayout>;
  }
  if (!activity) {
    return (
      <StudentLayout>
        <div className="container max-w-3xl py-10">
          <BackButton />
          <p className="text-center text-muted-foreground py-16">Ova vežba nije dostupna za tvoj nivo.</p>
          <div className="text-center"><Button variant="outline" onClick={() => navigate("/pronunciation")}>Nazad na izgovor</Button></div>
        </div>
      </StudentLayout>
    );
  }

  const items = activityItems(activity);
  const total = items.length;
  const current = items[idx];
  const lang = activity.language;
  const step = completed ? 3 : practiced.includes(idx) ? 3 : heard ? 2 : 0;

  const save = async (nextPracticed: number[], done: boolean) => {
    if (!user) return;
    await supabase.from("pronunciation_progress").upsert({
      user_id: user.id,
      activity_id: activity.id,
      language: lang,
      status: done ? "completed" : "in_progress",
      practiced_items: nextPracticed,
      attempts: 1,
      completed_at: done ? new Date().toISOString() : null,
    } as any, { onConflict: "user_id,activity_id" });
  };

  const markPracticed = async () => {
    const next = practiced.includes(idx) ? practiced : [...practiced, idx];
    setPracticed(next);
    const done = next.length >= total;
    await save(next, done);
    if (done && !completed) {
      setCompleted(true);
      logActivity(user!.id, "pronunciation", "activity_completed", 10, { activity_id: activity.id }, { dedupKey: `pron_${activity.id}`, checkDailyBonus: true, language: lang as any });
      toast.success("Vežba izgovora završena!");
    } else if (idx < total - 1) {
      setIdx(idx + 1);
    }
  };

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-3xl py-8 sm:py-10 relative z-10">
        <BackButton />
        <div className="mt-4 mb-5">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <Badge variant="secondary">{activity.cefr_level}</Badge>
            <span className="text-xs text-primary/60">{CATEGORY_LABEL[activity.category]} · {ACTIVITY_TYPE_LABELS[activity.activity_type]}</span>
          </div>
          <h1 className="text-display text-2xl sm:text-3xl text-primary">{activity.title}</h1>
          {activity.description && <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>}
        </div>

        {/* Listen → Notice → Repeat → Practice */}
        <div className="flex items-center gap-1.5 mb-4 text-[11px] sm:text-xs">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 flex-1">
              <span className={`rounded-full px-2 py-0.5 border ${i <= step ? "bg-primary text-primary-foreground border-primary" : "border-border/60 text-primary/60"}`}>{s}</span>
              {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {total === 0 ? (
          <p className="text-center text-muted-foreground py-16">Sadržaj ove vežbe je u pripremi.</p>
        ) : (
          <Card className="bg-cream border border-border/60 shadow-postcard">
            <CardContent className="p-6 sm:p-10">
              {isPair(current) ? (
                <CompareView pair={current} lang={lang} />
              ) : (
                <>
                  <Target item={current} />
                  <div className="mt-6"><ListenButtons item={current} lang={lang} onPlayed={() => setHeard(true)} /></div>
                  <Guide item={current} />
                  <RecordSlot item={current} lang={lang} level={activity.cefr_level} onSuccess={() => setHeard(true)} />
                </>
              )}

              <div className="mt-8 flex items-center justify-between gap-2">
                <Button variant="ghost" size="sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Nazad
                </Button>
                <span className="text-xs text-primary/60">{idx + 1} / {total}</span>
                <Button size="sm" variant={practiced.includes(idx) ? "outline" : "hero"} onClick={markPracticed}>
                  <Check className="w-4 h-4 mr-1" /> {practiced.includes(idx) ? "Uvežbano" : "Ponovio/la sam"}
                </Button>
              </div>
              <Progress value={(practiced.length / total) * 100} className="h-1.5 mt-4" />
            </CardContent>
          </Card>
        )}

        {completed && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/pronunciation")}>Sve vežbe</Button>
            {nextId && <Button variant="hero" onClick={() => navigate(`/pronunciation/${nextId}`)}>Sledeća vežba <ArrowRight className="w-4 h-4 ml-1" /></Button>}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
