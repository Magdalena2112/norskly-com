import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, ThumbsUp, ThumbsDown, Volume2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FlashCard {
  norwegian: string;
  serbian: string;
  example: string;
  category: string;
}

const cardsByLevel: Record<string, FlashCard[]> = {
  A1: [
    { norwegian: "hei", serbian: "zdravo", example: "Hei, hvordan har du det?", category: "Pozdravi" },
    { norwegian: "takk", serbian: "hvala", example: "Tusen takk for hjelpen!", category: "Pozdravi" },
    { norwegian: "vann", serbian: "voda", example: "Kan jeg få et glass vann?", category: "Hrana" },
    { norwegian: "brød", serbian: "hleb", example: "Jeg kjøper brød i butikken.", category: "Hrana" },
    { norwegian: "jobb", serbian: "posao", example: "Jeg liker jobben min.", category: "Posao" },
    { norwegian: "skole", serbian: "škola", example: "Barna går på skolen.", category: "Obrazovanje" },
    { norwegian: "hus", serbian: "kuća", example: "Vi bor i et stort hus.", category: "Dom" },
    { norwegian: "venn", serbian: "prijatelj", example: "Han er min beste venn.", category: "Ljudi" },
    { norwegian: "kaffe", serbian: "kafa", example: "Vil du ha en kopp kaffe?", category: "Hrana" },
    { norwegian: "tid", serbian: "vreme", example: "Har du tid i dag?", category: "Apstraktno" },
  ],
  A2: [
    { norwegian: "avtale", serbian: "dogovor/zakazivanje", example: "Jeg har en avtale hos legen.", category: "Svakodnevica" },
    { norwegian: "erfaring", serbian: "iskustvo", example: "Hun har mye erfaring.", category: "Posao" },
    { norwegian: "mulighet", serbian: "mogućnost", example: "Det er en god mulighet.", category: "Apstraktno" },
    { norwegian: "oppgave", serbian: "zadatak", example: "Jeg har mange oppgaver.", category: "Posao" },
    { norwegian: "trivsel", serbian: "zadovoljstvo", example: "Trivsel på arbeidsplassen er viktig.", category: "Posao" },
    { norwegian: "utdanning", serbian: "obrazovanje", example: "Utdanning er viktig for alle.", category: "Obrazovanje" },
    { norwegian: "beslutning", serbian: "odluka", example: "Vi tok en viktig beslutning.", category: "Apstraktno" },
    { norwegian: "tilbud", serbian: "ponuda", example: "Butikken har gode tilbud.", category: "Kupovina" },
    { norwegian: "fornøyd", serbian: "zadovoljan", example: "Jeg er veldig fornøyd.", category: "Osećanja" },
    { norwegian: "bekymret", serbian: "zabrinut", example: "Hun er litt bekymret.", category: "Osećanja" },
  ],
  B1: [
    { norwegian: "forhandling", serbian: "pregovaranje", example: "Forhandlingene tok lang tid.", category: "Posao" },
    { norwegian: "bærekraftig", serbian: "održiv", example: "Vi trenger bærekraftige løsninger.", category: "Društvo" },
    { norwegian: "påvirkning", serbian: "uticaj", example: "Mediene har stor påvirkning.", category: "Društvo" },
    { norwegian: "samarbeid", serbian: "saradnja", example: "Godt samarbeid er nøkkelen.", category: "Posao" },
    { norwegian: "utfordring", serbian: "izazov", example: "Det er en stor utfordring.", category: "Apstraktno" },
    { norwegian: "ansvar", serbian: "odgovornost", example: "Alle har et ansvar.", category: "Posao" },
    { norwegian: "innvandring", serbian: "imigracija", example: "Innvandring er et viktig tema.", category: "Društvo" },
    { norwegian: "rettighet", serbian: "pravo", example: "Alle har like rettigheter.", category: "Društvo" },
    { norwegian: "kompetanse", serbian: "kompetencija", example: "Høy kompetanse er etterspurt.", category: "Posao" },
    { norwegian: "tillit", serbian: "poverenje", example: "Tillit må bygges over tid.", category: "Apstraktno" },
  ],
};

export default function VocabularyPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const level = profile.level || "A1";
  const cards = cardsByLevel[level] || cardsByLevel["A1"];

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<number[]>([]);
  const [unknown, setUnknown] = useState<number[]>([]);

  const remaining = useMemo(() => cards.filter((_, i) => !known.includes(i) && !unknown.includes(i)), [known, unknown, cards]);
  const card = cards[index];
  const isDone = known.length + unknown.length === cards.length;

  const handleAction = (isKnown: boolean) => {
    if (isKnown) setKnown((p) => [...p, index]);
    else setUnknown((p) => [...p, index]);
    setFlipped(false);
    // Find next unreviewed card
    for (let i = 1; i <= cards.length; i++) {
      const next = (index + i) % cards.length;
      if (!known.includes(next) && !unknown.includes(next) && next !== index) {
        setIndex(next);
        return;
      }
    }
  };

  const handleRestart = () => {
    setIndex(0);
    setFlipped(false);
    setKnown([]);
    setUnknown([]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-bold text-lg text-foreground">Vokabular</span>
          <span className="ml-auto text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
            Nivo {level} · {known.length + unknown.length}/{cards.length}
          </span>
        </div>
      </header>

      <div className="flex-1 container max-w-lg py-8 flex flex-col items-center justify-center">
        {!isDone ? (
          <>
            <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">{card.category}</p>
            <div className="w-full perspective-1000 cursor-pointer mb-8" onClick={() => setFlipped(!flipped)}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${index}-${flipped}`}
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="shadow-nordic min-h-[240px] flex items-center justify-center">
                    <CardContent className="pt-6 text-center space-y-3">
                      {!flipped ? (
                        <>
                          <p className="text-4xl font-display font-bold text-foreground">{card.norwegian}</p>
                          <p className="text-sm text-muted-foreground">Tapni da vidiš prevod</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-display font-bold text-accent">{card.serbian}</p>
                          <p className="text-lg text-foreground mt-2">{card.norwegian}</p>
                          <p className="text-sm text-muted-foreground italic mt-3">"{card.example}"</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatePresence>
            </div>

            {flipped && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                <Button variant="outline" size="lg" onClick={() => handleAction(false)} className="gap-2">
                  <ThumbsDown className="w-4 h-4" /> Ne znam
                </Button>
                <Button variant="hero" size="lg" onClick={() => handleAction(true)} className="gap-2">
                  <ThumbsUp className="w-4 h-4" /> Znam
                </Button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="shadow-nordic text-center">
              <CardContent className="pt-8 pb-8 space-y-4">
                <p className="text-5xl mb-2">🎯</p>
                <h2 className="text-2xl font-display font-bold text-foreground">Sesija završena!</h2>
                <div className="flex gap-6 justify-center text-sm">
                  <span className="text-accent font-medium">✅ Znam: {known.length}</span>
                  <span className="text-destructive font-medium">❌ Ne znam: {unknown.length}</span>
                </div>
                <div className="flex gap-3 justify-center pt-4">
                  <Button variant="hero-outline" onClick={handleRestart} className="gap-2">
                    <RotateCcw className="w-4 h-4" /> Ponovi
                  </Button>
                  <Button variant="hero" onClick={() => navigate("/practice")}>Nazad</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
