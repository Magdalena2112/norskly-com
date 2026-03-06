import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Settings,
  Sparkles,
  StopCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  AlertTriangle,
  BookOpen,
  History,
  X,
  MessageSquare,
  Clock,
  MessageCircle,
  Languages,
  PenLine,
  Star,
  ArrowRight,
  Trash2,
  Play,
  Volume2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/logActivity";
import { logErrors } from "@/lib/logErrors";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { sr } from "date-fns/locale";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RecapData {
  strengths: string[];
  mistakes: string[];
  useful_phrases: { norwegian: string; serbian: string }[];
}

interface TalkSession {
  id: string;
  situation: string;
  formality: string;
  role: string;
  messages: Message[];
  recap: RecapData | null;
  message_count: number;
  points: number;
  created_at: string;
  title: string;
  updated_at: string;
}

const situationPresets = [
  { value: "predstavljanje", label: "Predstavljanje na poslu" },
  { value: "kafeterija", label: "Naručivanje u kafeteriji" },
  { value: "lekar", label: "Zakazivanje kod lekara" },
  { value: "stanodavac", label: "Komunikacija sa stanodavcem" },
  { value: "prodavnica", label: "Kupovina u prodavnici" },
  { value: "telefon", label: "Telefonski razgovor" },
  { value: "slobodno", label: "Slobodna tema" },
];

const formalityOptions = [
  { value: "opušten", label: "Opušten (du)" },
  { value: "formalan", label: "Formalan (De)" },
  { value: "poslovni", label: "Poslovni" },
];

const roleOptions = [
  { value: "sagovornik", label: "Prijatelj / sagovornik" },
  { value: "kolega", label: "Kolega na poslu" },
  { value: "prodavac", label: "Prodavac / konobar" },
  { value: "lekar", label: "Lekar / recepcioner" },
  { value: "nastavnik", label: "Nastavnik norveškog" },
];

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/talk-ai`;

// ── Section parser for structured AI responses ──
const SECTION_KEYS = ["ODGOVOR", "VOKABULAR", "ISPRAVKE", "POVRATNA INFORMACIJA", "SLEDEĆI KORAK"] as const;
type SectionKey = typeof SECTION_KEYS[number];

interface ParsedSection {
  key: SectionKey;
  content: string;
}

function parseSections(text: string): ParsedSection[] | null {
  // Check if text has at least the main section marker
  if (!text.includes("[ODGOVOR]")) return null;

  const sections: ParsedSection[] = [];
  for (let i = 0; i < SECTION_KEYS.length; i++) {
    const marker = `[${SECTION_KEYS[i]}]`;
    const startIdx = text.indexOf(marker);
    if (startIdx === -1) continue;

    const contentStart = startIdx + marker.length;
    // Find end: next section marker or end of text
    let endIdx = text.length;
    for (let j = i + 1; j < SECTION_KEYS.length; j++) {
      const nextMarker = `[${SECTION_KEYS[j]}]`;
      const nextIdx = text.indexOf(nextMarker, contentStart);
      if (nextIdx !== -1) {
        endIdx = nextIdx;
        break;
      }
    }
    const content = text.slice(contentStart, endIdx).trim();
    if (content) sections.push({ key: SECTION_KEYS[i], content });
  }
  return sections.length > 0 ? sections : null;
}

const sectionConfig: Record<SectionKey, { icon: React.ReactNode; label: string; accent: string }> = {
  "ODGOVOR": { icon: <MessageCircle className="w-4 h-4" />, label: "Odgovor", accent: "text-accent" },
  "VOKABULAR": { icon: <Languages className="w-4 h-4" />, label: "Vokabular", accent: "text-primary" },
  "ISPRAVKE": { icon: <PenLine className="w-4 h-4" />, label: "Ispravke", accent: "text-destructive" },
  "POVRATNA INFORMACIJA": { icon: <Star className="w-4 h-4" />, label: "Povratna informacija", accent: "text-accent" },
  "SLEDEĆI KORAK": { icon: <ArrowRight className="w-4 h-4" />, label: "Sledeći korak", accent: "text-primary" },
};

// ── TTS helper ──
function speakNorwegian(text: string) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  // Strip markdown formatting for cleaner speech
  const clean = text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/[#_~`>]/g, "").trim();
  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang = "nb-NO";
  utter.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const nbVoice = voices.find((v) => v.lang.startsWith("nb") || v.lang.startsWith("no"));
  if (nbVoice) utter.voice = nbVoice;
  window.speechSynthesis.speak(utter);
}

function CollapsibleSection({ section, defaultOpen }: { section: ParsedSection; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const config = sectionConfig[section.key];
  const isMain = section.key === "ODGOVOR";

  if (isMain) {
    return (
      <div className="bg-card border border-border text-card-foreground rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="prose prose-sm max-w-none text-card-foreground text-base flex-1">
            <ReactMarkdown>{section.content}</ReactMarkdown>
          </div>
          <button
            onClick={() => speakNorwegian(section.content)}
            className="shrink-0 mt-1 p-1.5 rounded-lg text-accent hover:bg-accent/10 transition-colors"
            title="Slušaj izgovor"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/50 border border-border/50 text-card-foreground rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/80 transition-colors"
      >
        <div className={`flex items-center gap-1.5 ${config.accent}`}>
          {config.icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-4 pb-3 prose prose-sm max-w-none text-card-foreground text-sm">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StructuredAssistantMessage({ content }: { content: string }) {
  const sections = parseSections(content);

  if (!sections) {
    return (
      <div className="bg-card border border-border text-card-foreground rounded-2xl rounded-bl-md px-5 py-3">
        <div className="prose prose-sm max-w-none text-card-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section, i) => (
        <CollapsibleSection key={i} section={section} defaultOpen={section.key === "ODGOVOR" || section.key === "ISPRAVKE"} />
      ))}
    </div>
  );
}

export default function PracticePage() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [recap, setRecap] = useState<RecapData | null>(null);
  const [recapLoading, setRecapLoading] = useState(false);

  const [situation, setSituation] = useState("slobodno");
  const [formality, setFormality] = useState("opušten");
  const [role, setRole] = useState("sagovornik");

  // History state
  const [showHistory, setShowHistory] = useState(false);
  const [pastSessions, setPastSessions] = useState<TalkSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingSession, setViewingSession] = useState<TalkSession | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("talk_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("Failed to fetch history:", error);
    } else {
      setPastSessions((data as unknown as TalkSession[]) || []);
    }
    setHistoryLoading(false);
  }, [user]);

  useEffect(() => {
    if (showHistory) fetchHistory();
  }, [showHistory, fetchHistory]);

  /** Generate title from first user message */
  const generateTitle = (msgs: Message[]): string => {
    const firstUser = msgs.find(m => m.role === "user");
    if (!firstUser) return "Novi razgovor";
    const text = firstUser.content.slice(0, 60);
    return text.length < firstUser.content.length ? text + "…" : text;
  };

  /** Auto-save: create or update session in DB */
  const autoSaveSession = async (updatedMessages: Message[], recapData?: RecapData) => {
    if (!user) return null;
    const title = generateTitle(updatedMessages);

    if (currentSessionId) {
      // Update existing session
      await supabase
        .from("talk_sessions")
        .update({
          messages: updatedMessages as unknown as any,
          message_count: updatedMessages.length,
          title,
          updated_at: new Date().toISOString(),
          ...(recapData ? { recap: recapData as unknown as any, points: 12 } : {}),
        } as any)
        .eq("id", currentSessionId);
      return currentSessionId;
    } else {
      // Create new session
      const { data, error } = await supabase
        .from("talk_sessions")
        .insert({
          user_id: user.id,
          situation,
          formality,
          role,
          messages: updatedMessages as unknown as any,
          message_count: updatedMessages.length,
          title,
          points: 0,
        } as any)
        .select("id")
        .single();
      if (error) {
        console.error("Failed to create session:", error);
        return null;
      }
      const newId = (data as any)?.id;
      setCurrentSessionId(newId);
      return newId;
    }
  };

  const saveSession = async (recapData: RecapData) => {
    await autoSaveSession(messages, recapData);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setShowControls(false);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error("Morate biti prijavljeni.");
        setIsLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: "chat",
          messages: updatedMessages,
          profile: {
            name: profile.name,
            level: profile.level,
            learning_goal: profile.learning_goal,
          },
          settings: {
            situation: situationPresets.find((s) => s.value === situation)?.label,
            formality: formalityOptions.find((f) => f.value === formality)?.label,
            role: roleOptions.find((r) => r.value === role)?.label,
          },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error("Previše zahteva. Pokušaj ponovo za minut.");
        else if (resp.status === 402) toast.error("Potrebno je dopuniti kredite.");
        else toast.error("Greška pri slanju poruke.");
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          if (!raw) continue;
          if (raw.endsWith("\r")) raw = raw.slice(0, -1);
          if (raw.startsWith(":") || raw.trim() === "") continue;
          if (!raw.startsWith("data: ")) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      console.error("Talk error:", e);
      toast.error("Greška pri komunikaciji sa AI-jem.");
    }

    // Auto-save after each exchange
    if (assistantSoFar) {
      const finalMessages = [...updatedMessages, { role: "assistant" as const, content: assistantSoFar }];
      await autoSaveSession(finalMessages);
    }

    setIsLoading(false);
  };

  const endSession = async () => {
    if (messages.length < 2) {
      toast.info("Razgovaraj bar jednu turu pre završetka sesije.");
      return;
    }
    setRecapLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) {
        toast.error("Morate biti prijavljeni.");
        setRecapLoading(false);
        return;
      }

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action: "recap",
          messages,
          profile: {
            name: profile.name,
            level: profile.level,
            learning_goal: profile.learning_goal,
          },
        }),
      });

      if (!resp.ok) throw new Error("Recap failed");

      const data = await resp.json();
      setRecap(data);

      // Save session to DB
      await saveSession(data);

      // Log structured errors from recap (exactly 3)
      if (user && data._errors?.length) {
        await logErrors(user.id, "talk", "recap", data._errors.slice(0, 3), situation);
      }

      if (user) {
        const userMsgCount = messages.filter((m: any) => m.role === "user").length;
        if (userMsgCount >= 5) {
          // Quality bonus: check if recap has good nivo_analiza
          const qualityBonus = data?.nivo_analiza &&
            ["gramatika", "vokabular", "jasnoća", "povezivanje", "prirodnost"]
              .every((k: string) => {
                const val = (data.nivo_analiza as any)?.[k] || "";
                return /dobr|odličn|tačn|stabili/i.test(val);
              }) ? 3 : 0;

          await logActivity(user.id, "talk", "session_complete", 12 + qualityBonus, {
            message_count: messages.length,
            user_message_count: userMsgCount,
            situation,
            formality,
            role,
            quality_bonus: qualityBonus,
          }, { dedupKey: `talk_${Date.now()}`, checkDailyBonus: true });
        }
      }
    } catch (e) {
      console.error("Recap error:", e);
      toast.error("Greška pri generisanju rezimea.");
    }
    setRecapLoading(false);
  };

  const startNewSession = () => {
    setMessages([]);
    setRecap(null);
    setViewingSession(null);
    setCurrentSessionId(null);
    setShowControls(true);
  };

  const viewSession = (session: TalkSession) => {
    setViewingSession(session);
    setShowHistory(false);
  };

  const continueSession = (session: TalkSession) => {
    setMessages(session.messages as Message[]);
    setCurrentSessionId(session.id);
    setSituation(session.situation);
    setFormality(session.formality);
    setRole(session.role);
    setRecap(null);
    setViewingSession(null);
    setShowHistory(false);
    setShowControls(false);
  };

  const deleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("talk_sessions")
      .delete()
      .eq("id", sessionId);
    if (error) {
      toast.error("Greška pri brisanju sesije.");
      return;
    }
    setPastSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (viewingSession?.id === sessionId) setViewingSession(null);
    if (currentSessionId === sessionId) setCurrentSessionId(null);
    toast.success("Sesija obrisana.");
  };

  const getSituationLabel = (val: string) =>
    situationPresets.find((s) => s.value === val)?.label || val;

  // ── Viewing a past session ──
  if (viewingSession) {
    const s = viewingSession;
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container flex items-center justify-between h-14">
            <span className="font-display font-bold text-lg text-foreground">Norskly</span>
            <div className="flex items-center gap-2">
              {!s.recap && (
                <Button variant="hero" size="sm" onClick={() => continueSession(s)} className="gap-1.5">
                  <Play className="w-3.5 h-3.5" /> Nastavi
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteSession(s.id)}
                className="text-destructive hover:text-destructive"
                title="Obriši sesiju"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setViewingSession(null)}>
                ← Nazad
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-3xl py-6 space-y-4">
            {/* Session info */}
            <div className="text-center mb-4">
              <p className="text-sm font-medium text-foreground">{(s as any).title || getSituationLabel(s.situation)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {getSituationLabel(s.situation)} · {s.message_count} poruka ·{" "}
                {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: sr })}
              </p>
            </div>

            {/* Messages */}
            {(s.messages as Message[]).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" ? (
                  <div className="max-w-[90%]">
                    <StructuredAssistantMessage content={msg.content} />
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-primary text-primary-foreground rounded-br-md">
                    <p className="text-sm">{msg.content}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Recap if exists */}
            {s.recap && <RecapView recap={s.recap} messageCount={s.message_count} points={s.points} />}
          </div>
        </div>
      </div>
    );
  }

  // ── Recap screen ──
  if (recap) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container flex items-center justify-between h-14">
            <span className="font-display font-bold text-lg text-foreground">Norskly</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-2xl py-10 space-y-8">
            <RecapView recap={recap} messageCount={messages.length} points={12} />
            <div className="flex justify-center gap-3 pt-4 pb-8">
              <Button variant="hero" size="lg" onClick={startNewSession}>
                Nova sesija
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => { startNewSession(); setShowHistory(true); }}
              >
                <History className="w-4 h-4 mr-2" /> Istorija
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Chat screen ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-lg text-foreground">Norskly</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
              title="Istorija sesija"
            >
              <History className="w-4 h-4" />
            </Button>
            {messages.length >= 2 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={endSession}
                disabled={recapLoading}
                className="gap-1.5"
              >
                <StopCircle className="w-4 h-4" />
                {recapLoading ? "Generiše se..." : "Završi sesiju"}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => navigate("/onboarding")}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* History drawer */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground z-40"
              onClick={() => setShowHistory(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-background border-l border-border z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-display font-bold text-foreground">Istorija sesija</h3>
                <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {historyLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Učitavanje...</p>
                ) : pastSessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nemaš prethodnih sesija.
                  </p>
                ) : (
                  pastSessions.map((session) => {
                    const firstMsg = (session.messages as Message[])?.[0];
                    const title = (session as any).title || getSituationLabel(session.situation);
                    const preview = firstMsg?.content?.slice(0, 50) || "";

                    return (
                      <div
                        key={session.id}
                        className="p-3 rounded-xl border border-border bg-card hover:border-accent transition-colors"
                      >
                        <button
                          onClick={() => viewSession(session)}
                          className="w-full text-left"
                        >
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {title}
                              </p>
                              {preview && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {preview}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                <Clock className="w-3 h-3" />
                                {formatDistanceToNow(new Date(session.created_at), {
                                  addSuffix: true,
                                  locale: sr,
                                })}
                                <span>· {session.message_count} poruka</span>
                              </div>
                            </div>
                          </div>
                        </button>
                        <div className="flex gap-1.5 mt-2 ml-6">
                          {!session.recap && (
                            <button
                              onClick={() => continueSession(session)}
                              className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors"
                            >
                              <Play className="w-3 h-3" /> Nastavi
                            </button>
                          )}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                            className="flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> Obriši
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Controls panel */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-border bg-card/50 overflow-hidden"
          >
            <div className="container max-w-3xl py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Podešavanja sesije
                </span>
                <button onClick={() => setShowControls(false)} className="text-muted-foreground hover:text-foreground">
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Situacija</label>
                  <Select value={situation} onValueChange={setSituation}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {situationPresets.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Formalnost</label>
                  <Select value={formality} onValueChange={setFormality}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {formalityOptions.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Uloga AI-ja</label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showControls && messages.length > 0 && (
        <button
          onClick={() => setShowControls(true)}
          className="border-b border-border bg-card/50 py-1.5 text-xs text-muted-foreground flex items-center justify-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronDown className="w-3 h-3" /> Podešavanja
        </button>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-3xl py-6 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                Hei, {profile.name || "korisniče"}! 👋
              </h2>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Izaberi situaciju gore i započni razgovor na norveškom. Ja ću ti odgovarati i pomagati.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Hei, jeg heter " + (profile.name || "..."),
                  "Kan du hjelpe meg?",
                  "Jeg vil gjerne øve på norsk",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    className="px-4 py-2 text-sm rounded-full border border-border bg-background text-foreground hover:border-accent hover:text-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" ? (
                <div className="max-w-[90%]">
                  <StructuredAssistantMessage content={msg.content} />
                </div>
              ) : (
                <div className="max-w-[85%] rounded-2xl px-5 py-3 bg-primary text-primary-foreground rounded-br-md">
                  <p className="text-sm">{msg.content}</p>
                </div>
              )}
            </motion.div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.3s" }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" style={{ animationDelay: "0.6s" }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-background/80 backdrop-blur-md p-4">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="container max-w-3xl flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Napiši poruku na norveškom..."
            className="flex-1 h-12"
            disabled={isLoading}
          />
          <Button variant="hero" size="icon" className="h-12 w-12" disabled={!input.trim() || isLoading}>
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Recap component ──
function RecapView({
  recap,
  messageCount,
  points,
}: {
  recap: RecapData;
  messageCount: number;
  points: number;
}) {
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2 text-center">
          Rezime sesije 🎉
        </h2>
        <p className="text-muted-foreground text-center text-sm mb-8">
          +{points} poena · {messageCount} poruka
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-accent" />
          <h3 className="font-display font-bold text-foreground">Snage</h3>
        </div>
        <ul className="space-y-2">
          {recap.strengths.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
              <span className="text-accent mt-0.5">✓</span>
              {s}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          <h3 className="font-display font-bold text-foreground">Greške za popraviti</h3>
        </div>
        <ul className="space-y-2">
          {recap.mistakes.map((m, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
              <span className="text-destructive mt-0.5">✗</span>
              {m}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-foreground">Korisni izrazi</h3>
        </div>
        <div className="space-y-3">
          {recap.useful_phrases.map((p, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{p.norwegian}</span>
              <span className="text-xs text-muted-foreground">{p.serbian}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
