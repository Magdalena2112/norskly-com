import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ImagePlus, Loader2, PenLine, FileDown, History, Sparkles, ChevronDown, Trash2, RefreshCcw } from "lucide-react";
import StudentLayout from "@/components/student/StudentLayout";
import NordicBackdrop from "@/components/student/NordicBackdrop";
import { logErrors } from "@/lib/logErrors";
import { generateWritingPdf } from "@/lib/writingPdf";
import { format } from "date-fns";

// ─── Shared types ───
interface Mistake { original: string; corrected: string; explanation: string; }
interface VocabSuggestion { weak: string; better: string; why: string; }
interface CorrectionResult {
  corrected_text: string;
  mistakes: Mistake[];
  vocabulary_suggestions?: VocabSuggestion[];
  overall_feedback?: string;
  naturalness_score?: number;
  complexity_score?: number;
  nivo_analiza?: Record<string, string>;
  cefr_assessment?: string;
  sledeci_korak?: string[];
  _errors?: { category: string; topic: string; severity: number; example_wrong: string; example_correct: string }[];
}

interface ImageHelper {
  vocabulary?: { word: string; translation: string; type?: string }[];
  expressions?: { no: string; sr: string }[];
  sentence_starters?: string[];
  phrases_by_level?: { no: string; sr: string }[];
  description_hint?: string;
}

interface WritingExercise {
  id: string;
  exercise_type: "image" | "text";
  image_path: string | null;
  original_text: string;
  corrected_text: string | null;
  analysis: CorrectionResult & { __helper?: ImageHelper };
  vocabulary: ImageHelper;
  level: string | null;
  created_at: string;
}

async function callFn<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const res = await supabase.functions.invoke(name, {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });
  if (res.error) throw new Error(res.error.message || "AI greška");
  return res.data as T;
}

export default function WritingPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const level = profile.level || "A1";
  const [tab, setTab] = useState("bildebeskrivelse");

  return (
    <StudentLayout>
      <NordicBackdrop />
      <div className="relative z-10">
        <header className="border-b border-border/50 bg-cream/80 backdrop-blur-md sticky top-0 z-40">
          <div className="container flex items-center gap-3 h-14">
            <Button variant="ghost" size="icon" onClick={() => navigate("/practice")} className="text-primary hover:text-primary/80">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <PenLine className="w-4 h-4 text-primary" />
            <span className="font-display font-bold text-lg text-primary">Pisanje</span>
            <span className="ml-auto text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
              Nivo {level}
            </span>
          </div>
        </header>

        <div className="container max-w-5xl py-6 sm:py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="rounded-3xl border border-border/50 bg-cream/90 shadow-postcard p-5 sm:p-6">
              <p className="font-script italic text-primary/60 text-sm">Skriving & bildebeskrivelse</p>
              <h1 className="text-display text-2xl sm:text-3xl text-primary mt-1">Vežbaj pisanje na norveškom</h1>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Učitaj sliku za bildebeskrivelse ili napiši slobodan tekst i dobi detaljan AI feedback, predloge vokabulara i PDF analizu.
              </p>
            </div>
          </motion.div>

          <Tabs value={tab} onValueChange={setTab} className="space-y-6">
            <TabsList className="w-full flex gap-0.5 overflow-x-auto scrollbar-hide">
              <TabsTrigger value="bildebeskrivelse" className="gap-1 text-[11px] sm:text-xs px-2 sm:px-3">
                <ImagePlus className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Bildebeskrivelse
              </TabsTrigger>
              <TabsTrigger value="correction" className="gap-1 text-[11px] sm:text-xs px-2 sm:px-3">
                <PenLine className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Korekcija teksta
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1 text-[11px] sm:text-xs px-2 sm:px-3">
                <History className="w-3.5 h-3.5 shrink-0 hidden sm:block" /> Istorija
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bildebeskrivelse"><BildebeskrivelseTab level={level} /></TabsContent>
            <TabsContent value="correction"><CorrectionTab level={level} /></TabsContent>
            <TabsContent value="history"><HistoryTab onReopen={(t) => setTab(t)} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </StudentLayout>
  );
}

// ═══════════════════════════════════════
// Bildebeskrivelse
// ═══════════════════════════════════════
function BildebeskrivelseTab({ level }: { level: string }) {
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [helper, setHelper] = useState<ImageHelper | null>(null);
  const [helperLoading, setHelperLoading] = useState(false);
  const [helperOpen, setHelperOpen] = useState(true);
  const [text, setText] = useState("");
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [correctLoading, setCorrectLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onPickImage = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    if (file.size > 6 * 1024 * 1024) {
      alert("Slika je prevelika (max 6MB).");
      return;
    }
    setImageFile(file);
    setHelper(null);
    setResult(null);
    setUploadedPath(null);
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const analyzeImage = async () => {
    if (!imageDataUrl || !user) return;
    setHelperLoading(true);
    try {
      // Upload to storage (best-effort; helper uses base64 directly)
      if (imageFile && !uploadedPath) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("writing-images").upload(path, imageFile);
        if (!upErr) setUploadedPath(path);
      }
      const data = await callFn<ImageHelper>("writing-image-helper", {
        image_base64: imageDataUrl,
        level,
      });
      setHelper(data);
      setHelperOpen(true);
    } catch (e) {
      console.error(e);
      alert("Nije moguće analizirati sliku. Pokušaj ponovo.");
    } finally {
      setHelperLoading(false);
    }
  };

  const correctText = async () => {
    if (!text.trim() || !user) return;
    setCorrectLoading(true);
    setResult(null);
    try {
      const data = await callFn<CorrectionResult>("writing-correct", {
        text: text.trim(), level, has_image: !!helper,
      });
      setResult(data);
      if (data._errors?.length) {
        await logErrors(user.id, "writing", "bildebeskrivelse", data._errors.slice(0, 5));
      }
      await supabase.from("writing_exercises").insert({
        user_id: user.id,
        exercise_type: "image",
        image_path: uploadedPath,
        original_text: text.trim(),
        corrected_text: data.corrected_text,
        analysis: data as any,
        vocabulary: (helper || {}) as any,
        level,
      });
    } catch (e) {
      console.error(e);
      alert("Greška pri korekciji.");
    } finally {
      setCorrectLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result) return;
    generateWritingPdf({
      type: "image",
      level,
      original_text: text,
      corrected_text: result.corrected_text,
      mistakes: result.mistakes,
      vocabulary_suggestions: result.vocabulary_suggestions,
      overall_feedback: result.overall_feedback,
      sledeci_korak: result.sledeci_korak,
      vocabulary_helper: helper?.vocabulary,
      cefr_assessment: result.cefr_assessment,
    }, `bildebeskrivelse-${Date.now()}.pdf`);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Image panel */}
      <Card className="bg-cream/90 border-border/50 shadow-card-soft">
        <CardHeader>
          <CardTitle className="text-base font-display text-primary">1. Slika</CardTitle>
          <CardDescription>Učitaj sliku i AI će predložiti reči, izraze i početke rečenica.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])}
          />
          {imageDataUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-border/50">
              <img src={imageDataUrl} alt="Bildebeskrivelse" className="w-full h-auto object-cover max-h-80" />
              <Button
                variant="secondary" size="sm"
                className="absolute top-2 right-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Promeni
              </Button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-border/60 bg-secondary/30 hover:bg-secondary/50 transition-colors py-12 flex flex-col items-center justify-center gap-2 text-primary/70"
            >
              <ImagePlus className="w-7 h-7" />
              <span className="font-medium text-sm">Klikni da učitaš sliku</span>
              <span className="text-xs text-muted-foreground">JPG, PNG · do 6MB</span>
            </button>
          )}

          <Button
            variant="hero" className="w-full"
            onClick={analyzeImage}
            disabled={!imageDataUrl || helperLoading}
          >
            {helperLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Analiziram sliku...</> : <><Sparkles className="w-4 h-4 mr-1" /> Analiziraj sliku</>}
          </Button>

          {helper && (
            <Collapsible open={helperOpen} onOpenChange={setHelperOpen} className="rounded-2xl bg-secondary/40 border border-border/40">
              <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-3 text-left">
                <span className="font-display text-sm text-primary">Pomoć pri opisu</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${helperOpen ? "rotate-180" : ""}`} />
              </CollapsibleTrigger>
              <CollapsibleContent className="px-4 pb-4 space-y-4 text-sm">
                {helper.description_hint && (
                  <p className="italic text-primary/80">{helper.description_hint}</p>
                )}
                {helper.vocabulary && helper.vocabulary.length > 0 && (
                  <div>
                    <p className="font-semibold text-primary mb-1">Ord</p>
                    <div className="flex flex-wrap gap-1.5">
                      {helper.vocabulary.map((v, i) => (
                        <span key={i} className="px-2 py-1 rounded-full bg-cream border border-border/60 text-xs">
                          <span className="font-medium text-primary">{v.word}</span>
                          <span className="text-muted-foreground"> — {v.translation}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {helper.expressions && helper.expressions.length > 0 && (
                  <div>
                    <p className="font-semibold text-primary mb-1">Uttrykk</p>
                    <ul className="space-y-1">
                      {helper.expressions.map((e, i) => (
                        <li key={i}><span className="font-medium">{e.no}</span> <span className="text-muted-foreground">— {e.sr}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
                {helper.sentence_starters && helper.sentence_starters.length > 0 && (
                  <div>
                    <p className="font-semibold text-primary mb-1">Početci rečenica</p>
                    <ul className="space-y-1 text-primary/80">
                      {helper.sentence_starters.map((s, i) => <li key={i}>· {s}</li>)}
                    </ul>
                  </div>
                )}
                {helper.phrases_by_level && helper.phrases_by_level.length > 0 && (
                  <div>
                    <p className="font-semibold text-primary mb-1">Primeri na {level}</p>
                    <ul className="space-y-1">
                      {helper.phrases_by_level.map((p, i) => (
                        <li key={i}><span className="font-medium">{p.no}</span> <span className="text-muted-foreground">— {p.sr}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Writing panel */}
      <Card className="bg-cream/90 border-border/50 shadow-card-soft">
        <CardHeader>
          <CardTitle className="text-base font-display text-primary">2. Tvoj opis</CardTitle>
          <CardDescription>Napiši opis slike na norveškom i dobi feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="På bildet ser jeg..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            maxLength={3000}
            className="resize-none bg-cream/60"
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">{text.length}/3000</span>
            <Button variant="hero" onClick={correctText} disabled={correctLoading || !text.trim()}>
              {correctLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Analiziram...</> : "Proveri tekst"}
            </Button>
          </div>

          {result && <CorrectionResultView result={result} onPdf={downloadPdf} />}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════
// Free text correction
// ═══════════════════════════════════════
function CorrectionTab({ level }: { level: string }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [result, setResult] = useState<CorrectionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const correct = async () => {
    if (!text.trim() || !user) return;
    setLoading(true);
    setResult(null);
    try {
      const data = await callFn<CorrectionResult>("writing-correct", { text: text.trim(), level });
      setResult(data);
      if (data._errors?.length) {
        await logErrors(user.id, "writing", "text_correction", data._errors.slice(0, 5));
      }
      await supabase.from("writing_exercises").insert({
        user_id: user.id,
        exercise_type: "text",
        original_text: text.trim(),
        corrected_text: data.corrected_text,
        analysis: data as any,
        level,
      });
    } catch (e) {
      console.error(e);
      alert("Greška pri korekciji.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!result) return;
    generateWritingPdf({
      type: "text",
      level,
      original_text: text,
      corrected_text: result.corrected_text,
      mistakes: result.mistakes,
      vocabulary_suggestions: result.vocabulary_suggestions,
      overall_feedback: result.overall_feedback,
      sledeci_korak: result.sledeci_korak,
      cefr_assessment: result.cefr_assessment,
    }, `korekcija-${Date.now()}.pdf`);
  };

  return (
    <Card className="bg-cream/90 border-border/50 shadow-card-soft max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-base font-display text-primary">Slobodno pisanje</CardTitle>
        <CardDescription>Napiši tekst na norveškom — AI će ga ispraviti i objasniti greške.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Skriv en tekst på norsk..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          maxLength={3000}
          className="resize-none bg-cream/60"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{text.length}/3000</span>
          <Button variant="hero" onClick={correct} disabled={loading || !text.trim()}>
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Analiziram...</> : "Ispravi tekst"}
          </Button>
        </div>
        {result && <CorrectionResultView result={result} onPdf={downloadPdf} />}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════
// Result view (shared)
// ═══════════════════════════════════════
function CorrectionResultView({ result, onPdf }: { result: CorrectionResult; onPdf: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-2">
      <div className="rounded-2xl bg-secondary/40 border border-border/40 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Ispravljena verzija</p>
          <Button size="sm" variant="outline" onClick={onPdf}>
            <FileDown className="w-3.5 h-3.5 mr-1" /> Preuzmi PDF analizu
          </Button>
        </div>
        <p className="text-foreground leading-relaxed">{result.corrected_text}</p>
      </div>

      {result.mistakes && result.mistakes.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Greške ({result.mistakes.length})</p>
          {result.mistakes.map((m, i) => (
            <div key={i} className="p-3 rounded-xl bg-cream border border-border/40">
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-destructive line-through">{m.original}</span>
                <span className="text-primary font-medium">→ {m.corrected}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{m.explanation}</p>
            </div>
          ))}
        </div>
      )}

      {result.vocabulary_suggestions && result.vocabulary_suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">Predlozi vokabulara</p>
          {result.vocabulary_suggestions.map((v, i) => (
            <div key={i} className="p-3 rounded-xl bg-secondary/30 border border-border/40 text-sm">
              <div><span className="line-through text-muted-foreground">{v.weak}</span> <span className="text-primary font-medium">→ {v.better}</span></div>
              <p className="text-xs text-muted-foreground mt-1">{v.why}</p>
            </div>
          ))}
        </div>
      )}

      {result.overall_feedback && (
        <div className="p-4 rounded-2xl bg-accent/20 border border-accent/40 text-sm text-foreground">
          {result.overall_feedback}
        </div>
      )}

      {result.nivo_analiza && (
        <div className="rounded-2xl bg-cream border border-border/40 p-4 space-y-1.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">Nivo analiza</p>
          {Object.entries(result.nivo_analiza).filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <span className="font-medium min-w-[100px] capitalize">{k}:</span>
              <span className="text-muted-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      {result.sledeci_korak && result.sledeci_korak.length > 0 && (
        <div className="rounded-2xl bg-secondary/40 border border-border/40 p-4 text-sm space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary/70 mb-1">Sledeći koraci</p>
          {result.sledeci_korak.map((s, i) => (
            <div key={i} className="flex gap-2"><span className="text-primary font-bold">{i + 1}.</span><span>{s}</span></div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════
// History
// ═══════════════════════════════════════
function HistoryTab({ onReopen }: { onReopen: (tab: string) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<WritingExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<"all" | "image" | "text">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("writing_exercises")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setItems((data as any) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const remove = async (id: string) => {
    if (!confirm("Obrisati ovu vežbu?")) return;
    await supabase.from("writing_exercises").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const allCategories = Array.from(new Set(
    items.flatMap((i) => i.analysis?._errors?.map((e: any) => e.category) || [])
  )).filter(Boolean);

  const filtered = items.filter((i) => {
    if (typeFilter !== "all" && i.exercise_type !== typeFilter) return false;
    if (categoryFilter !== "all") {
      const cats = i.analysis?._errors?.map((e: any) => e.category) || [];
      if (!cats.includes(categoryFilter)) return false;
    }
    return true;
  });

  const reopenPdf = (i: WritingExercise) => {
    const a = i.analysis as any;
    generateWritingPdf({
      type: i.exercise_type,
      level: i.level || undefined,
      original_text: i.original_text,
      corrected_text: i.corrected_text || undefined,
      mistakes: a?.mistakes,
      vocabulary_suggestions: a?.vocabulary_suggestions,
      overall_feedback: a?.overall_feedback,
      sledeci_korak: a?.sledeci_korak,
      cefr_assessment: a?.cefr_assessment,
      vocabulary_helper: (i.vocabulary as any)?.vocabulary,
    }, `pisanje-${i.id.slice(0, 8)}.pdf`);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex gap-1 bg-secondary/40 rounded-full p-1 border border-border/40">
          {(["all", "image", "text"] as const).map((k) => (
            <button key={k} onClick={() => setTypeFilter(k)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${typeFilter === k ? "bg-primary text-primary-foreground" : "text-primary/70 hover:text-primary"}`}>
              {k === "all" ? "Sve" : k === "image" ? "Bildebeskrivelse" : "Tekst"}
            </button>
          ))}
        </div>
        {allCategories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs rounded-full border border-border/50 bg-cream/80 px-3 py-1.5"
          >
            <option value="all">Sve greške</option>
            {allCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
        <Button size="sm" variant="ghost" onClick={load}><RefreshCcw className="w-3.5 h-3.5 mr-1" /> Osveži</Button>
      </div>

      {filtered.length === 0 ? (
        <Card className="bg-cream/90 border-border/50">
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Još nema sačuvanih vežbi. Započni u "Bildebeskrivelse" ili "Korekcija teksta".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((i) => (
            <Card key={i.id} className="bg-cream/90 border-border/50 shadow-card-soft">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/60">
                        {i.exercise_type === "image" ? "Bildebeskrivelse" : "Tekst"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{format(new Date(i.created_at), "dd.MM.yyyy HH:mm")}</span>
                      {i.level && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{i.level}</span>}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{i.original_text}</p>
                    {i.analysis?._errors && i.analysis._errors.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Array.from(new Set(i.analysis._errors.map((e: any) => e.category))).slice(0, 4).map((c: any) => (
                          <span key={c} className="text-[10px] bg-secondary/60 text-primary/80 px-1.5 py-0.5 rounded">{c}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => reopenPdf(i)} title="Preuzmi PDF">
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(i.id)} title="Obriši" className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
