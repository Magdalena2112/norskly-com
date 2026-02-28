import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Settings, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const situationSuggestions = [
  "Želim da se predstavim na poslu",
  "Treba da napišem mejl stanodavcu",
  "Kako da naručim kafu u kafeteriji",
  "Želim da zakažem termin kod lekara",
  "Kako da pitam za put na ulici",
  "Treba da odgovorim na oglas za posao",
];

export default function PracticePage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Mock AI response for now — will be replaced with Lovable Cloud edge function
    setTimeout(() => {
      const mockResponse = generateMockResponse(text, profile);
      setMessages((prev) => [...prev, { role: "assistant", content: mockResponse }]);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <span className="font-display font-bold text-lg text-foreground">Norskly</span>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
              {profile.level} · {profile.learning_goal}
            </span>
            <Button variant="ghost" size="icon" onClick={() => navigate("/onboarding")}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

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
                Opiši situaciju na srpskom, a ja ću ti pomoći da se izraziš na norveškom.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {situationSuggestions.map((s) => (
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

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-card border border-border rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.3s" }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-glow" style={{ animationDelay: "0.6s" }} />
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
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="container max-w-3xl flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Opiši situaciju ili napiši poruku..."
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

// Mock response generator
function generateMockResponse(userMessage: string, profile: any): string {
  const name = profile.name || "korisniče";
  const level = profile.level || "A1";

  return `## 1️⃣ Kontekst i cilj komunikacije

**Situacija:** Svakodnevna komunikacija
**Cilj:** Pomoći ti, ${name}, da se izraziš prirodno na norveškom.
**Formalnost:** Srednji nivo

## 2️⃣ Tipične greške za nivo ${level}

- ❌ Pogrešan red reči u pitanjima
- ❌ Mešanje "en" i "et" članova
- ❌ Izostavljanje "å" ispred infinitiva

## 3️⃣ Predlog poruke (norveški)

> **Hei! Jeg vil gjerne bestille en kaffe, takk.**

## 4️⃣ Alternativna verzija (formalnija)

> **God dag. Kunne jeg fått en kopp kaffe, vær så snill?**

## 5️⃣ Objašnjenje

Prva verzija je opuštenija i pogodna za svakodnevne situacije. Druga koristi kondicional ("kunne jeg fått") što zvuči učtivije i profesionalnije. Oba oblika su potpuno prihvatljiva u Norveskoj.`;
}
