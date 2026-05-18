import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/types/profile";
import { ChevronRight, ChevronLeft, User, Target, MessageSquare, BookOpen, Gauge, Globe } from "lucide-react";
import BackButton from "@/components/BackButton";
import JourneyStepper from "@/components/onboarding/JourneyStepper";

type LangCode = "no" | "en" | "de";

const SLUG_TO_CODE: Record<string, LangCode> = {
  norveski: "no",
  engleski: "en",
  nemacki: "de",
};

type Copy = {
  brand: string;
  steps: string[];
  stepCounter: (i: number, total: number) => string;
  nameTitle: string;
  nameDesc: string;
  namePlaceholder: string;
  levelTitle: string;
  levelDesc: string;
  goalTitle: string;
  goalDesc: string;
  goals: string[];
  toneTitle: string;
  toneDesc: string;
  tones: string[];
  focusTitle: string;
  focusDesc: string;
  focuses: string[];
  confidenceTitle: string;
  confidenceDesc: string;
  lifeTitle: string;
  lifeDesc: string;
  /** For Norwegian: yes/no. For English/German: list of lifestyle scenarios. */
  lifeOptions: string[];
  lifeYesNo?: boolean;
  back: string;
  next: string;
  finish: string;
};

const COPY: Record<LangCode, Copy> = {
  no: {
    brand: "Norskly",
    steps: ["Ime", "Nivo", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Norveška"],
    stepCounter: (i, t) => `Korak ${i} od ${t}`,
    nameTitle: "Kako se zoveš?",
    nameDesc: "AI će koristiti tvoje ime za personalizovanu komunikaciju.",
    namePlaceholder: "Tvoje ime",
    levelTitle: "Koji je tvoj nivo?",
    levelDesc: "Odaberi nivo koji najbolje opisuje tvoje znanje norveškog.",
    goalTitle: "Zašto učiš norveški?",
    goalDesc: "Ovo pomaže AI-u da prilagodi sadržaj tvom cilju.",
    goals: ["posao", "preseljenje", "studije", "svakodnevna komunikacija", "ispit", "lični razvoj"],
    toneTitle: "Koji stil komunikacije preferiraš?",
    toneDesc: "AI prilagođava ton odgovora prema tvojim preferencijama.",
    tones: ["opušten", "neutralan", "profesionalan"],
    focusTitle: "Na šta želiš da se fokusiraš?",
    focusDesc: "Izaberi primarnu oblast na kojoj želiš da radiš.",
    focuses: ["govor", "pisanje", "gramatika", "vokabular"],
    confidenceTitle: "Koliko si siguran/a u svoj norveški?",
    confidenceDesc: "Na skali od 1 do 5, koliko se samouvereno osećaš?",
    lifeTitle: "Živiš li u Norveškoj?",
    lifeDesc: "Ovo pomaže AI-u da daje relevantnije primere i savete.",
    lifeOptions: ["Da", "Ne"],
    lifeYesNo: true,
    back: "Nazad",
    next: "Dalje",
    finish: "Završi",
  },
  en: {
    brand: "Norskly · English",
    steps: ["Ime", "Nivo", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Engleski u životu"],
    stepCounter: (i, t) => `Korak ${i} od ${t}`,
    nameTitle: "Kako se zoveš?",
    nameDesc: "AI tutor će ti se obraćati ličnim imenom kroz ceo kurs.",
    namePlaceholder: "Tvoje ime",
    levelTitle: "Koji je tvoj nivo engleskog?",
    levelDesc: "Odaberi CEFR nivo koji najbliže opisuje tvoje trenutno znanje.",
    goalTitle: "Šta želiš da postigneš sa engleskim?",
    goalDesc: "AI prilagođava materijal i feedback ovom cilju.",
    goals: [
      "putovanja",
      "karijera u inostranstvu",
      "intervjui za posao",
      "studije u inostranstvu",
      "fluentnost",
      "lični razvoj",
    ],
    toneTitle: "Koji stil komunikacije ti odgovara?",
    toneDesc: "AI bira ton — od casual chata do business engleskog.",
    tones: ["casual", "neutralan", "business"],
    focusTitle: "Na šta želiš da se fokusiraš?",
    focusDesc: "Tvoj primarni fokus za naredne sesije.",
    focuses: ["speaking", "writing", "grammar", "vocabulary", "pronunciation"],
    confidenceTitle: "Koliko si siguran/a u svoj engleski?",
    confidenceDesc: "Na skali od 1 do 5 — koliko se komotno osećaš kad pričaš engleski?",
    lifeTitle: "Gde ti engleski najviše treba u životu?",
    lifeDesc: "Izaberi kontekst koji ti je najbliži — prilagodićemo primere, vokabular i razgovore.",
    lifeOptions: [
      "putovanja",
      "business English",
      "intervjui za posao",
      "filmovi i serije",
      "svakodnevna komunikacija",
      "društvene mreže i internet",
      "studije u inostranstvu",
    ],
    back: "Nazad",
    next: "Dalje",
    finish: "Završi",
  },
  de: {
    brand: "Norskly · Deutsch",
    steps: ["Ime", "Nivo", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Nemački u životu"],
    stepCounter: (i, t) => `Korak ${i} od ${t}`,
    nameTitle: "Kako se zoveš?",
    nameDesc: "AI tutor će koristiti tvoje ime u svim lekcijama.",
    namePlaceholder: "Tvoje ime",
    levelTitle: "Koji je tvoj nivo nemačkog?",
    levelDesc: "Izaberi CEFR nivo koji najbolje opisuje tvoje znanje.",
    goalTitle: "Zašto učiš nemački?",
    goalDesc: "AI prilagođava sadržaj tvom cilju.",
    goals: ["posao", "preseljenje", "studije", "svakodnevna komunikacija", "ispit", "lični razvoj"],
    toneTitle: "Koji stil komunikacije preferiraš?",
    toneDesc: "AI prilagođava ton odgovora.",
    tones: ["opušten", "neutralan", "profesionalan"],
    focusTitle: "Na šta želiš da se fokusiraš?",
    focusDesc: "Izaberi primarnu oblast.",
    focuses: ["govor", "pisanje", "gramatika", "vokabular"],
    confidenceTitle: "Koliko si siguran/a u svoj nemački?",
    confidenceDesc: "Na skali od 1 do 5.",
    lifeTitle: "Gde ti nemački najviše treba?",
    lifeDesc: "Izaberi kontekst koji ti je najbliži.",
    lifeOptions: [
      "putovanja",
      "posao u DACH regionu",
      "studije u Nemačkoj",
      "filmovi i serije",
      "svakodnevna komunikacija",
      "ispit (Goethe / TestDaF)",
    ],
    back: "Nazad",
    next: "Dalje",
    finish: "Završi",
  },
};

function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
        selected
          ? "border-accent bg-accent/10 text-accent shadow-accent-glow"
          : "border-border bg-background text-foreground hover:border-accent/40"
      }`}
    >
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { updateProfile, profile } = useProfile();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Resolve the language being onboarded from the selection made earlier in the journey.
  const selectedLang = (typeof window !== "undefined" && localStorage.getItem("norskly_selected_language")) || "norveski";
  const langCode: LangCode = SLUG_TO_CODE[selectedLang] || "no";
  const t = COPY[langCode];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<UserProfile> & { life_context?: string }>({
    name: profile.name || "",
    level: profile.level || "A1",
    learning_goal: t.goals[0],
    preferred_tone: t.tones[0],
    focus_area: t.focuses[0],
    confidence_level: profile.confidence_level || 3,
    lives_in_norway: false,
    life_context: "",
  });

  const steps = t.steps;

  const next = async () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      updateProfile({
        name: form.name,
        level: form.level,
        learning_goal: form.learning_goal,
        preferred_tone: form.preferred_tone,
        focus_area: form.focus_area,
        confidence_level: form.confidence_level,
        lives_in_norway: form.lives_in_norway,
      });
      localStorage.setItem("norskly_onboarding_done", "true");
      const selectedPlan = localStorage.getItem("norskly_selected_plan");
      if (user) {
        await supabase
          .from("profiles")
          .upsert({
            user_id: user.id,
            display_name: form.name || "",
            preferred_language: selectedLang,
            ...(selectedPlan ? { subscription_type: selectedPlan } : {}),
          }, { onConflict: "user_id" });

        await supabase
          .from("language_profiles")
          .upsert({
            user_id: user.id,
            language: langCode,
            level: form.level || "A1",
            learning_goal: form.learning_goal || "",
            focus_area: form.focus_area || "",
            confidence_level: form.confidence_level ?? 3,
            preferred_tone: form.preferred_tone || "opušten",
            lives_in_norway: form.lives_in_norway ?? false,
            life_context: form.life_context || null,
            subscription_type: selectedPlan,
            onboarding_completed: true,
          }, { onConflict: "user_id,language" });

        await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      }
      const target = `/ucenje/${selectedLang}`;
      const qs = selectedPlan ? `?plan=${selectedPlan}` : "";
      navigate(`${target}${qs}`);
    }
  };
  const prev = () => step > 0 && setStep(step - 1);

  const stepIcons = [User, Target, Target, MessageSquare, BookOpen, Gauge, Globe];
  const StepIcon = stepIcons[step];

  const sidebarBg = langCode === "no" ? "bg-nordic-gradient" : "bg-gradient-to-br from-primary via-fjord to-accent";

  const lastStepDisabled = useMemo(() => {
    if (step !== steps.length - 1) return false;
    return t.lifeYesNo ? false : !form.life_context;
  }, [step, steps.length, t.lifeYesNo, form.life_context]);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar progress */}
      <div className={`hidden md:flex w-72 ${sidebarBg} flex-col p-8 text-primary-foreground`}>
        <span className="font-display font-bold text-2xl mb-12">{t.brand}</span>
        <div className="space-y-3 flex-1">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  i <= step ? "bg-accent text-accent-foreground" : "bg-primary-foreground/20 text-primary-foreground/60"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm ${i <= step ? "opacity-100 font-medium" : "opacity-50"}`}>{s}</span>
            </div>
          ))}
        </div>
        <p className="text-sm opacity-60">{t.stepCounter(step + 1, steps.length)}</p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="md:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <BackButton />
              <span className="font-display font-bold text-xl text-foreground">{t.brand}</span>
            </div>
            <span className="text-sm text-muted-foreground">{step + 1}/{steps.length}</span>
          </div>

          <div className="mb-8">
            <JourneyStepper current="trial" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6">
                <StepIcon className="w-7 h-7 text-accent" />
              </div>

              {step === 0 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.nameTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.nameDesc}</p>
                  <Input
                    placeholder={t.namePlaceholder}
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="text-lg h-12"
                  />
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.levelTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.levelDesc}</p>
                  <div className="flex flex-wrap gap-3">
                    {(["A1", "A2", "B1", "B2", "C1"] as const).map((l) => (
                      <OptionCard key={l} label={l} selected={form.level === l} onClick={() => setForm({ ...form, level: l })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.goalTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.goalDesc}</p>
                  <div className="flex flex-wrap gap-3">
                    {t.goals.map((g) => (
                      <OptionCard key={g} label={g} selected={form.learning_goal === g} onClick={() => setForm({ ...form, learning_goal: g })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.toneTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.toneDesc}</p>
                  <div className="flex flex-wrap gap-3">
                    {t.tones.map((tn) => (
                      <OptionCard key={tn} label={tn} selected={form.preferred_tone === tn} onClick={() => setForm({ ...form, preferred_tone: tn })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.focusTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.focusDesc}</p>
                  <div className="flex flex-wrap gap-3">
                    {t.focuses.map((f) => (
                      <OptionCard key={f} label={f} selected={form.focus_area === f} onClick={() => setForm({ ...form, focus_area: f })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.confidenceTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.confidenceDesc}</p>
                  <div className="flex gap-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setForm({ ...form, confidence_level: n })}
                        className={`w-14 h-14 rounded-xl text-lg font-bold transition-all ${
                          form.confidence_level === n
                            ? "bg-accent text-accent-foreground shadow-accent-glow scale-110"
                            : "bg-secondary text-secondary-foreground hover:bg-accent/20"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 6 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t.lifeTitle}</h2>
                  <p className="text-muted-foreground mb-6">{t.lifeDesc}</p>
                  <div className="flex flex-wrap gap-3">
                    {t.lifeYesNo ? (
                      <>
                        <OptionCard label={t.lifeOptions[0]} selected={form.lives_in_norway === true} onClick={() => setForm({ ...form, lives_in_norway: true })} />
                        <OptionCard label={t.lifeOptions[1]} selected={form.lives_in_norway === false} onClick={() => setForm({ ...form, lives_in_norway: false })} />
                      </>
                    ) : (
                      t.lifeOptions.map((opt) => (
                        <OptionCard
                          key={opt}
                          label={opt}
                          selected={form.life_context === opt}
                          onClick={() => setForm({ ...form, life_context: opt })}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {t.back}
            </Button>
            <Button
              variant="hero"
              onClick={next}
              disabled={(step === 0 && !form.name?.trim()) || lastStepDisabled}
            >
              {step === steps.length - 1 ? t.finish : t.next} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
