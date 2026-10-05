import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, Eye, EyeOff, RotateCcw, ArrowRight, Volume2, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/logActivity";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import BackButton from "@/components/BackButton";
import AudioPlayer, { type AudioPlayerHandle } from "@/components/listening/AudioPlayer";
import {
  ACTIVITY_TYPE_LABELS, correctAnswerText, gradeQuestion, isScored,
  type ListeningActivity, type Question,
} from "@/lib/listening";
import { cn } from "@/lib/utils";

type Answers = Record<string, unknown>;

export default function ListeningActivityPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const player = useRef<AudioPlayerHandle>(null);
  const [act, setAct] = useState<ListeningActivity | null>(null);
  const [nextId, setNextId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTranscript, setShowTranscript] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [finished, setFinished] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!activityId || !user) return;
    setLoading(true);
    reset();
    (async () => {
      const { data } = await supabase.from("listening_activities").select("*").eq("id", activityId).maybeSingle();
      const a = data as unknown as ListeningActivity | null;
      setAct(a);
      if (a) {
        const [{ data: list }, { data: prog }] = await Promise.all([
          supabase.from("listening_activities").select("id").eq("language", a.language).eq("cefr_level", a.cefr_level).eq("is_published", true).order("sort_order"),
          supabase.from("listening_progress").select("attempts").eq("user_id", user.id).eq("activity_id", a.id).maybeSingle(),
        ]);
        const ids = (list || []).map((r) => r.id);
        const idx = ids.indexOf(a.id);
        setNextId(ids.length > 1 ? ids[(idx + 1) % ids.length] : null);
        setAttempts(prog?.attempts || 0);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId, user]);

  function reset() {
    setAnswers({});
    setChecked({});
    setFinished(false);
    setShowTranscript(false);
  }

  const questions = act?.questions || [];
  const scored = questions.filter(isScored);
  const correct = scored.filter((q) => checked[q.id] !== undefined && gradeQuestion(q, answers[q.id])).length;
  const allChecked = questions.every((q) => checked[q.id] !== undefined);

  const playSeg = (seg?: number | null) => {
    if (!act) return;
    const s = seg != null ? act.segments[seg] : undefined;
    if (s) player.current?.playSegment(s.start, s.end);
    else player.current?.playSegment(0);
  };

  const check = (q: Question) => setChecked((c) => ({ ...c, [q.id]: gradeQuestion(q, answers[q.id]) }));

  const finish = async () => {
    if (!act || !user) return;
    setFinished(true);
    const total = scored.length;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    await supabase.from("listening_progress").upsert({
      user_id: user.id, activity_id: act.id, language: act.language, status: "completed",
      score: correct, total, answers: answers as never, attempts: newAttempts, completed_at: new Date().toISOString(),
    }, { onConflict: "user_id,activity_id" });
    const points = Math.min(50, 5 + correct * 3);
    await logActivity(user.id, "listening", act.activity_type, points, { activity_id: act.id, score: correct, total },
      { dedupKey: `listening_${act.id}_${newAttempts}`, checkDailyBonus: true, language: act.language as "no" | "en" | "de" });
  };

  const transcriptLines = useMemo(() => (act?.transcript || "").split("\n").filter(Boolean), [act]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }
  if (!act) {
    return (
      <StudentLayout>
        <div className="container max-w-3xl py-10"><BackButton /><p className="mt-6 text-muted-foreground">Aktivnost nije pronađena.</p></div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="container max-w-3xl py-8 sm:py-10 relative z-10">
        <BackButton />
        <div className="mt-4 mb-5">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="secondary">{act.cefr_level}</Badge>
            <span className="text-xs text-primary/60">{act.topic}</span>
            <span className="text-xs font-script italic text-primary/60">· {ACTIVITY_TYPE_LABELS[act.activity_type]}</span>
          </div>
          <h1 className="text-display text-2xl sm:text-3xl text-primary">{act.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{act.description}</p>
        </div>

        {act.audio_url ? <AudioPlayer ref={player} src={act.audio_url} /> : <p className="text-muted-foreground">Snimak još nije dostupan.</p>}

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={() => setShowTranscript((s) => !s)}>
            {showTranscript ? <><EyeOff className="w-4 h-4 mr-1.5" />Sakrij transkript</> : <><Eye className="w-4 h-4 mr-1.5" />Prikaži transkript</>}
          </Button>
        </div>
        {showTranscript && (
          <Card className="mt-2 bg-cream/90 border-border/50">
            <CardContent className="p-5 space-y-2 text-sm leading-relaxed text-foreground">
              {transcriptLines.map((l, i) => <p key={i}>{l}</p>)}
            </CardContent>
          </Card>
        )}

        <div className="mt-8 space-y-4">
          {questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i}
              q={q}
              value={answers[q.id]}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              result={checked[q.id]}
              onCheck={() => check(q)}
              onReplay={() => playSeg((q as { seg?: number | null }).seg)}
              disabled={finished}
            />
          ))}
        </div>

        {!finished ? (
          <div className="mt-8 flex justify-end">
            <Button variant="hero" disabled={!allChecked} onClick={finish}>Završi aktivnost</Button>
          </div>
        ) : (
          <Card className="mt-8 bg-cream border-2 border-primary/20 shadow-postcard">
            <CardContent className="p-6 text-center">
              <p className="font-script italic text-primary/60">Aktivnost završena</p>
              <p className="text-display text-4xl text-primary my-2">{correct} / {scored.length}</p>
              <p className="text-sm text-muted-foreground">
                {scored.length ? `Tačnih odgovora: ${correct} (${Math.round((correct / scored.length) * 100)}%)` : "Vežba ponavljanja je završena."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <Button variant="outline" onClick={reset}><RotateCcw className="w-4 h-4 mr-1.5" />Pokušaj ponovo</Button>
                {nextId && <Button variant="hero" onClick={() => navigate(`/listening/${nextId}`)}>Sledeća aktivnost<ArrowRight className="w-4 h-4 ml-1.5" /></Button>}
                <Button variant="ghost" onClick={() => navigate("/listening")}>Sve aktivnosti</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </StudentLayout>
  );
}

function QuestionCard({ q, index, value, onChange, result, onCheck, onReplay, disabled }: {
  q: Question; index: number; value: unknown; onChange: (v: unknown) => void;
  result: boolean | undefined; onCheck: () => void; onReplay: () => void; disabled: boolean;
}) {
  const locked = result !== undefined || disabled;
  const hasAnswer = q.type === "repeat" ? true
    : q.type === "match" ? q.pairs.every((p) => (value as Record<string, string> | undefined)?.[p.left])
    : q.type === "gap" ? typeof value === "string" && value.trim() !== ""
    : value !== undefined;

  const options = useMemo(() => {
    if (q.type !== "match") return [];
    return [...q.pairs.map((p) => p.right)].sort();
  }, [q]);

  return (
    <Card className="bg-cream/95 border-border/60 shadow-card-soft">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 justify-between">
          <p className="font-medium text-primary"><span className="text-primary/50 mr-1.5">{index + 1}.</span>{q.prompt}</p>
          <button type="button" onClick={onReplay} className="shrink-0 inline-flex items-center gap-1 text-xs text-primary/70 hover:text-primary" aria-label="Pusti deo snimka">
            <Volume2 className="w-4 h-4" /> Pusti deo
          </button>
        </div>

        <div className="mt-3">
          {(q.type === "mc" || q.type === "heard") && (
            <div className="grid gap-2">
              {q.options.map((o) => (
                <OptionButton key={o} label={o} selected={value === o} disabled={locked} onClick={() => onChange(o)}
                  state={result !== undefined ? (o === q.answer ? "right" : value === o ? "wrong" : undefined) : undefined} />
              ))}
            </div>
          )}
          {q.type === "tf" && (
            <div className="grid grid-cols-2 gap-2">
              {[true, false].map((v) => (
                <OptionButton key={String(v)} label={v ? "Tačno" : "Netačno"} selected={value === v} disabled={locked} onClick={() => onChange(v)}
                  state={result !== undefined ? (v === q.answer ? "right" : value === v ? "wrong" : undefined) : undefined} />
              ))}
            </div>
          )}
          {q.type === "gap" && (
            <Input value={(value as string) || ""} disabled={locked} onChange={(e) => onChange(e.target.value)} placeholder="Upiši reč koju čuješ…" className="bg-background" />
          )}
          {q.type === "match" && (
            <div className="space-y-2">
              {q.pairs.map((p) => (
                <div key={p.left} className="grid sm:grid-cols-2 gap-2 items-center">
                  <span className="text-sm text-foreground italic">„{p.left}"</span>
                  <Select disabled={locked} value={(value as Record<string, string> | undefined)?.[p.left] || ""}
                    onValueChange={(v) => onChange({ ...((value as Record<string, string>) || {}), [p.left]: v })}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Izaberi značenje" /></SelectTrigger>
                    <SelectContent>{options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
          {q.type === "repeat" && (
            <div className="rounded-xl bg-secondary/40 px-4 py-3 flex items-center gap-3">
              <Mic className="w-4 h-4 text-primary/60" />
              <span className="text-foreground">{q.text}</span>
            </div>
          )}
        </div>

        {result === undefined && !disabled ? (
          <div className="mt-3 flex justify-end">
            <Button size="sm" variant="outline" disabled={!hasAnswer} onClick={onCheck}>
              {q.type === "repeat" ? "Ponovio/la sam" : "Proveri"}
            </Button>
          </div>
        ) : result !== undefined && q.type !== "repeat" ? (
          <div className={cn("mt-3 rounded-xl px-4 py-3 text-sm", result ? "bg-forest/10" : "bg-destructive/10")}>
            <p className="font-medium flex items-center gap-1.5">
              {result ? <CheckCircle2 className="w-4 h-4 text-forest" /> : <XCircle className="w-4 h-4 text-destructive" />}
              {result ? "Tačno!" : "Netačno"}
            </p>
            {!result && <p className="mt-1">Tačan odgovor: <strong>{correctAnswerText(q)}</strong></p>}
            {q.explanation && <p className="mt-1 text-muted-foreground">{q.explanation}</p>}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OptionButton({ label, selected, disabled, onClick, state }: {
  label: string; selected: boolean; disabled: boolean; onClick: () => void; state?: "right" | "wrong";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "text-left rounded-xl border px-4 py-2.5 text-sm transition-colors",
        state === "right" ? "border-forest bg-forest/10" :
        state === "wrong" ? "border-destructive bg-destructive/10" :
        selected ? "border-primary bg-primary/5" : "border-border/60 bg-background hover:border-primary/40",
      )}
    >
      {label}
    </button>
  );
}
