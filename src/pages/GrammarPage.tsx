import { useState } from "react";
import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle2, XCircle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GrammarExercise {
  id: number;
  topic: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const exercisesByLevel: Record<string, GrammarExercise[]> = {
  A1: [
    { id: 1, topic: "Član (Artikkel)", question: "Koji je tačan član za 'hus' (kuća)?", options: ["en hus", "et hus", "ei hus"], correct: 1, explanation: "'Hus' je srednjeg roda (intetkjønn), pa koristimo 'et'." },
    { id: 2, topic: "Red reči", question: "Koji je tačan red reči?", options: ["Jeg liker kaffe.", "Liker jeg kaffe.", "Kaffe jeg liker."], correct: 0, explanation: "Norveški ima SVO red reči u izjavnim rečenicama: Subjekt + Glagol + Objekat." },
    { id: 3, topic: "Negacija", question: "Kako se kaže 'Ne govorim norveški'?", options: ["Jeg snakker ikke norsk.", "Jeg ikke snakker norsk.", "Ikke jeg snakker norsk."], correct: 0, explanation: "'Ikke' dolazi posle glagola u glavnoj rečenici." },
    { id: 4, topic: "Prezent", question: "Koji je tačan oblik glagola 'å spise' (jesti) u prezentu?", options: ["spiser", "spise", "spiset"], correct: 0, explanation: "Prezent se gradi dodavanjem '-r' na infinitiv: spise → spiser." },
    { id: 5, topic: "Lične zamenice", question: "Kako se kaže 'oni' na norveškom?", options: ["vi", "dere", "de"], correct: 2, explanation: "'De' znači 'oni/one'. 'Vi' = mi, 'Dere' = vi (množina)." },
  ],
  A2: [
    { id: 1, topic: "Prošlo vreme", question: "Koji je tačan preterit od 'å gå' (ići)?", options: ["gikk", "gådde", "går"], correct: 0, explanation: "'Å gå' je nepravilan glagol. Preterit je 'gikk'." },
    { id: 2, topic: "Pridevi", question: "Koji oblik prideva 'stor' koristimo sa 'huset'?", options: ["det stor huset", "det store huset", "det stort huset"], correct: 1, explanation: "Pridev u određenom obliku dobija nastavak '-e': store." },
    { id: 3, topic: "Modalni glagoli", question: "Kako reći 'Moram da radim'?", options: ["Jeg må jobbe.", "Jeg må å jobbe.", "Jeg måtte jobbe."], correct: 0, explanation: "Posle modalnih glagola (må, kan, vil) NE koristi se 'å'." },
    { id: 4, topic: "Predlozi", question: "Živim ___ Oslu.", options: ["i", "på", "til"], correct: 0, explanation: "'I' se koristi za gradove: 'Jeg bor i Oslo'." },
    { id: 5, topic: "Veznici", question: "Koji veznik znači 'zato što'?", options: ["fordi", "hvis", "men"], correct: 0, explanation: "'Fordi' = zato što. 'Hvis' = ako. 'Men' = ali." },
  ],
  B1: [
    { id: 1, topic: "Pasiv", question: "Koji je pasivni oblik od 'Noen stjal bilen'?", options: ["Bilen ble stjålet.", "Bilen stjeles.", "Bilen har stjålet."], correct: 0, explanation: "Pasiv u preteritu: ble + particip (stjålet)." },
    { id: 2, topic: "Relativne rečenice", question: "Koji relativni zamenica je tačna: 'Mannen ___ bor her'?", options: ["som", "hvem", "den"], correct: 0, explanation: "'Som' se koristi kao relativna zamenica za ljude i stvari." },
    { id: 3, topic: "Kondicionali", question: "Kako reći 'Da sam znao, rekao bih ti'?", options: ["Hvis jeg hadde visst, ville jeg ha fortalt deg.", "Hvis jeg visste, ville jeg fortelle deg.", "Om jeg vet, sier jeg deg."], correct: 0, explanation: "Irealni kondicional: Hvis + hadde + particip, ville + ha + particip." },
    { id: 4, topic: "Refleksivni glagoli", question: "Kako reći 'Osećam se dobro'?", options: ["Jeg føler meg bra.", "Jeg føler bra.", "Jeg meg føler bra."], correct: 0, explanation: "Refleksivna zamenica 'meg' dolazi posle glagola." },
    { id: 5, topic: "Inverzija", question: "Koji red reči je tačan: 'Juče sam bio u školi'?", options: ["I går var jeg på skolen.", "I går jeg var på skolen.", "Jeg var i går på skolen."], correct: 0, explanation: "Kad rečenica počinje prilogom, glagol dolazi na drugo mesto (inverzija)." },
  ],
};

export default function GrammarPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const level = profile.level || "A1";
  const exercises = exercisesByLevel[level] || exercisesByLevel["A1"];

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const exercise = exercises[current];
  const progress = ((current + (finished ? 1 : 0)) / exercises.length) * 100;

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === exercise.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (current + 1 >= exercises.length) {
      setFinished(true);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-bold text-lg text-foreground">Gramatika</span>
          <span className="ml-auto text-xs bg-accent/10 text-accent px-3 py-1 rounded-full font-medium">
            Nivo {level}
          </span>
        </div>
      </header>

      <div className="flex-1 container max-w-2xl py-8">
        <Progress value={progress} className="mb-8 h-2" />

        {!finished ? (
          <motion.div key={current} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="shadow-nordic">
              <CardHeader>
                <CardDescription className="text-xs uppercase tracking-wider text-accent font-medium">
                  {exercise.topic} · Pitanje {current + 1}/{exercises.length}
                </CardDescription>
                <CardTitle className="text-xl">{exercise.question}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {exercise.options.map((opt, idx) => {
                  const isSelected = selected === idx;
                  const isCorrect = idx === exercise.correct;
                  let variant = "border-border bg-background hover:border-accent";
                  if (selected !== null) {
                    if (isCorrect) variant = "border-accent bg-accent/10";
                    else if (isSelected) variant = "border-destructive bg-destructive/10";
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      className={`w-full text-left px-4 py-3 rounded-lg border transition-colors flex items-center gap-3 ${variant}`}
                    >
                      {selected !== null && isCorrect && <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                      <span className="text-sm text-foreground">{opt}</span>
                    </button>
                  );
                })}

                {selected !== null && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-lg bg-muted">
                    <p className="text-sm text-muted-foreground">{exercise.explanation}</p>
                  </motion.div>
                )}

                {selected !== null && (
                  <Button variant="hero" className="w-full mt-4" onClick={handleNext}>
                    {current + 1 < exercises.length ? "Sledeće pitanje" : "Završi"} <ChevronRight className="w-4 h-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="shadow-nordic text-center">
              <CardContent className="pt-8 pb-8 space-y-4">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-accent" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {score}/{exercises.length} tačnih!
                </h2>
                <p className="text-muted-foreground">
                  {score === exercises.length ? "Odlično! Savršen rezultat! 🎉" : score >= exercises.length * 0.6 ? "Dobro urađeno! Nastavi tako. 💪" : "Treba malo vežbe. Pokušaj ponovo! 📚"}
                </p>
                <div className="flex gap-3 justify-center pt-4">
                  <Button variant="hero-outline" onClick={handleRestart}>Ponovi vežbu</Button>
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
