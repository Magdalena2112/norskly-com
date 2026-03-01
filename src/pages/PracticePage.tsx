import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { logActivity } from "@/lib/logActivity";
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
      .limit(20);

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

  const saveSession = async (recapData: RecapData) => {
    if (!user) return;
    const { error } = await supabase.from("talk_sessions").insert({
      user_id: user.id,
      situation,
      formality,
      role,
      messages: messages as unknown as any,
      recap: recapData as unknown as any,
      message_count: messages.length,
      points: 12,
    });
    if (error) console.error("Failed to save session:", error);
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
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

    setIsLoading(false);
  };

  const endSession = async () => {
    if (messages.length < 2) {
      toast.info("Razgovaraj bar jednu turu pre završetka sesije.");
      return;
    }
    setRecapLoading(true);

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
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

      const data: RecapData = await resp.json();
      setRecap(data);

      // Save session to DB
      await saveSession(data);

      if (user) {
        await logActivity(user.id, "talk", "session_complete", 12, {
          message_count: messages.length,
          situation,
          formality,
          role,
        });
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
    setShowControls(true);
  };

  const viewSession = (session: TalkSession) => {
    setViewingSession(session);
    setShowHistory(false);
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
              <Button variant="ghost" size="sm" onClick={() => setViewingSession(null)}>
                ← Nazad
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-3xl py-6 space-y-4">
            {/* Session info */}
            <div className="text-center text-xs text-muted-foreground mb-4">
              {getSituationLabel(s.situation)} · {s.message_count} poruka ·{" "}
              {formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: sr })}
            </div>

            {/* Messages */}
            {(s.messages as Message[]).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border text-card-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none text-card-foreground">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm">{msg.content}</p>
                  )}
                </div>
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
                  pastSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => viewSession(session)}
                      className="w-full text-left p-3 rounded-xl border border-border bg-card hover:border-accent transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {getSituationLabel(session.situation)}
                          </p>
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
                  ))
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
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border text-card-foreground rounded-bl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none text-card-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
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
