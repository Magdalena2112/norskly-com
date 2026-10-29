import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/types/profile";
import { ChevronRight, ChevronLeft, User, Target, MessageSquare, Gauge, Clock } from "lucide-react";
import BackButton from "@/components/BackButton";
import JourneyStepper from "@/components/onboarding/JourneyStepper";
import { courseIntent, courseStartLevel, promoAvailableLevels } from "@/lib/courseAccess";
import { selectCourse } from "@/lib/courseSelection";
import { useToast } from "@/hooks/use-toast";

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
    steps: ["Ime", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Norveška"],
    stepCounter: (i, t) => `Korak ${i} od ${t}`,
    nameTitle: "Kako se zoveš?",
    nameDesc: "Kako želiš da ti se obraćamo tokom učenja?",
    namePlaceholder: "Tvoje ime",
    goalTitle: "Zašto učiš norveški?",
    goalDesc: "Tvoj cilj usmerava povratne informacije i savete tokom učenja.",
    goals: ["posao", "preseljenje", "studije", "svakodnevna komunikacija", "ispit", "lični razvoj"],
    toneTitle: "Koji stil komunikacije preferiraš?",
    toneDesc: "Izaberi stil povratnih informacija koji ti odgovara.",
    tones: ["opušten", "neutralan", "profesionalan"],
    focusTitle: "Na šta želiš da se fokusiraš?",
    focusDesc: "Izaberi primarnu oblast na kojoj želiš da radiš.",
    focuses: ["govor", "pisanje", "gramatika", "vokabular"],
    confidenceTitle: "Koliko si siguran/a u svoj norveški?",
    confidenceDesc: "Na skali od 1 do 5, koliko se samouvereno osećaš?",
    lifeTitle: "Živiš li u Norveškoj?",
    lifeDesc: "Ovo nam pomaže da saveti budu bliži tvojim potrebama.",
    lifeOptions: ["Da", "Ne"],
    lifeYesNo: true,
    back: "Nazad",
    next: "Dalje",
    finish: "Završi",
  },
  en: {
    brand: "Norskly · English",
    steps: ["Ime", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Engleski u životu"],
    stepCounter: (i, t) => `Korak ${i} od ${t}`,
    nameTitle: "Kako se zoveš?",
    nameDesc: "Kako želiš da ti se obraćamo tokom učenja?",
    namePlaceholder: "Tvoje ime",
    goalTitle: "Šta želiš da postigneš sa engleskim?",
    goalDesc: "Tvoj cilj usmerava povratne informacije i savete tokom učenja.",
    goals: [
      "putovanja",
      "karijera u inostranstvu",
      "intervjui za posao",
      "studije u inostranstvu",
      "fluentnost",
      "lični razvoj",
    ],
    toneTitle: "Koji stil komunikacije ti odgovara?",
    toneDesc: "Izaberi stil povratnih informacija koji ti odgovara.",
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
    steps: ["Ime", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Nemački u životu"],
    stepCounter: (i, t) => `Korak ${i} od ${t}`,
    nameTitle: "Kako se zoveš?",
    nameDesc: "Kako želiš da ti se obraćamo tokom učenja?",
    namePlaceholder: "Tvoje ime",
    goalTitle: "Zašto učiš nemački?",
    goalDesc: "Tvoj cilj usmerava povratne informacije i savete tokom učenja.",
    goals: ["posao", "preseljenje", "studije", "svakodnevna komunikacija", "ispit", "lični razvoj"],
    toneTitle: "Koji stil komunikacije preferiraš?",
    toneDesc: "Izaberi stil povratnih informacija koji ti odgovara.",
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

const ONBOARDING_STEPS = ["Ime", "Vreme", "Cilj", "Samopouzdanje", "Stil podrške"];
const TIME_OPTIONS = [
  { value: 15, title: "15 min dnevno · Lagani ritam", desc: "1 modul dnevno, lekcija za ~9–10 dana, cilj 15–20 XP" },
  { value: 30, title: "30 min dnevno · Optimalni ritam", desc: "2–3 modula dnevno, lekcija za ~4–5 dana, cilj 30–40 XP" },
  { value: 60, title: "60+ min dnevno · Intenzivni ritam", desc: "Cela lekcija za 1–2 dana, cilj 80–100 XP" },
];
const GENERAL_GOALS = [
  { value: "svakodnevni život", title: "Svakodnevni život i snalaženje", desc: "Fokus na tečnost i prirodan govorni jezik" },
  { value: "posao i karijera", title: "Posao i karijera", desc: "Fokus na formalnost i profesionalne formulacije" },
  { value: "ispit", title: "Polaganje ispita", desc: "Fokus na gramatičku preciznost i strukture koje se boduju" },
];
const HEALTH_GOALS = [
  { value: "rad sa pacijentima", title: "Rad sa pacijentima i anamneza", desc: "Simptomi, empatija, jasna pitanja" },
  { value: "medicinska dokumentacija", title: "Izveštaji i dokumentacija", desc: "Stručni termini i precizno pisanje" },
  { value: "komunikacija sa kolegama", title: "Komunikacija sa lekarima i kolegama", desc: "Vizite, primopredaja smene, hitne situacije" },
  { value: "autorizacija", title: "Priprema za autorizaciju / ispit struke", desc: "Fokus na tačnost i strukture koje se proveravaju" },
];
const SUPPORT_STYLES = [
  { value: "podržavajući", title: "Podržavajući i blag", desc: "Fokus na smisao i ohrabrenje, bez zalaženja u svaku sitnicu" },
  { value: "direktan", title: "Direktan i detaljan", desc: "Svaka greška označena, uz pravilo i ispravan primer" },
];

function ChoiceRow({ title, desc, selected, onClick }: { title: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
        selected ? "border-accent bg-accent/10 shadow-accent-glow" : "border-border bg-background hover:border-accent/40"
      }`}
    >
      <span className={`block text-sm font-semibold break-words ${selected ? "text-accent" : "text-foreground"}`}>{title}</span>
      <span className="block text-xs text-muted-foreground mt-0.5 break-words">{desc}</span>
    </button>
  );
}

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
  const [params] = useSearchParams();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Resolve the language being onboarded from the selection made earlier in the journey.
  const selectedLang = params.get("lang") || (typeof window !== "undefined" && localStorage.getItem("norskly_selected_language")) || "norveski";
  const langCode: LangCode = SLUG_TO_CODE[selectedLang] || "no";
  const savedIntent = user?.user_metadata?.signup_language === selectedLang ? user.user_metadata : null;
  const explicitIntent = params.has("course") || params.has("level");
  const chosenCourse = courseIntent(explicitIntent ? params.get("course") : savedIntent?.signup_course, langCode);
  const chosenLevel = courseStartLevel(explicitIntent ? params.get("level") : savedIntent?.signup_level, chosenCourse, promoAvailableLevels(langCode, chosenCourse));
  const t = COPY[langCode];

  const goals = chosenCourse === "health" ? HEALTH_GOALS : GENERAL_GOALS;
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<UserProfile> & { life_context?: string; daily_minutes?: number }>({
    name: profile.name || "",
    level: chosenLevel,
    learning_goal: goals[0].value,
    preferred_tone: SUPPORT_STYLES[0].value,
    focus_area: "",
    confidence_level: profile.confidence_level || 3,
    lives_in_norway: false,
    life_context: "",
    daily_minutes: 30,
  });

  const steps = ONBOARDING_STEPS;

  const next = async () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      if (!user || saving) return;
      setSaving(true);
      try {
      const selectedPlan = localStorage.getItem("norskly_selected_plan");
      if (user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            user_id: user.id,
            display_name: form.name || "",
            preferred_language: selectedLang,
            ...(selectedPlan ? { subscription_type: selectedPlan } : {}),
          }, { onConflict: "user_id" });
        if (profileError) throw profileError;
        const { data: existing, error: enrollmentError } = await supabase.from("course_enrollments").select("course_type, level, onboarding_completed").eq("user_id", user.id).eq("language", langCode).eq("course_type", chosenCourse).maybeSingle();
        if (enrollmentError) throw enrollmentError;
        const enrolledCourse = courseIntent(existing?.course_type ?? chosenCourse, langCode);
        const enrolledLevel = existing?.onboarding_completed || (existing && enrolledCourse !== chosenCourse) ? courseStartLevel(existing.level, enrolledCourse, promoAvailableLevels(langCode, enrolledCourse)) : courseStartLevel(chosenLevel, enrolledCourse, promoAvailableLevels(langCode, enrolledCourse));
        const { error: languageError } = await supabase
          .from("course_enrollments")
          .upsert({
            user_id: user.id,
            language: langCode,
            course_type: existing?.course_type || chosenCourse,
            level: enrolledLevel,
            learning_goal: form.learning_goal || "",
            focus_area: form.focus_area || "",
            confidence_level: form.confidence_level ?? 3,
            preferred_tone: form.preferred_tone || SUPPORT_STYLES[0].value,
            daily_minutes: form.daily_minutes ?? 30,
            lives_in_norway: form.lives_in_norway ?? false,
            life_context: form.life_context || null,
            subscription_type: selectedPlan,
            onboarding_completed: true,
          }, { onConflict: "user_id,language,course_type" });
        if (languageError) throw languageError;
        updateProfile({ ...form, level: enrolledLevel, life_context: form.life_context || "" });
        selectCourse(langCode, chosenCourse);
        localStorage.setItem("norskly_onboarding_done", "true");
        await queryClient.invalidateQueries({ queryKey: ["course-enrollment"] });
        await queryClient.invalidateQueries({ queryKey: ["onboarding-status"] });
      }
      const target = `/ucenje/${selectedLang}`;
      const qs = `?course=${chosenCourse}${selectedPlan ? `&plan=${selectedPlan}` : ""}`;
      navigate(`${target}${qs}`);
      } catch {
        toast({ title: "Profil nije sačuvan", description: "Pokušaj ponovo. Upisani kurs ostaje nepromenjen.", variant: "destructive" });
      } finally { setSaving(false); }
    }
  };
  const prev = () => step > 0 && setStep(step - 1);

  const stepIcons = [User, Clock, Target, Gauge, MessageSquare];
  const StepIcon = stepIcons[step];

  const sidebarBg = langCode === "no" ? "bg-nordic-gradient" : "bg-gradient-to-br from-primary via-fjord to-accent";

  const lastStepDisabled = useMemo(() => {
    return false;
  }, []);

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

      <div className="flex-1 min-w-0 w-full flex items-center justify-center p-4 sm:p-6">
        <div className="w-full min-w-0 max-w-lg">
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
              className="min-w-0"
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
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 break-words">{t.nameTitle}</h2>
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
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 break-words">Koliko vremena možeš da izdvojiš za učenje?</h2>
                  <p className="text-muted-foreground mb-6">Na osnovu ovoga predlažemo dnevni plan modula i XP cilj.</p>
                  <div className="grid gap-3">
                    {TIME_OPTIONS.map((o) => (
                      <ChoiceRow key={o.value} title={o.title} desc={o.desc} selected={form.daily_minutes === o.value} onClick={() => setForm({ ...form, daily_minutes: o.value })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 break-words">{t.goalTitle}</h2>
                  <p className="text-muted-foreground mb-6">Zadaci u lekcijama su isti za sve; cilj usmerava povratne informacije i savete tokom učenja.</p>
                  <div className="grid gap-3">
                    {goals.map((g) => (
                      <ChoiceRow key={g.value} title={g.title} desc={g.desc} selected={form.learning_goal === g.value} onClick={() => setForm({ ...form, learning_goal: g.value })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 break-words">{t.confidenceTitle}</h2>
                  <p className="text-muted-foreground mb-6">1 = nesiguran/na, 5 = vrlo siguran/na. Na osnovu toga prilagođavamo stil podrške i detaljnost objašnjenja.</p>
                  <div className="flex gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setForm({ ...form, confidence_level: n })}
                        className={`w-11 h-11 sm:w-14 sm:h-14 rounded-xl text-base sm:text-lg font-bold transition-all ${
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

              {step === 4 && (
                <div>
                  <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground mb-2 break-words">Kakav pristup ispravkama ti odgovara?</h2>
                  <p className="text-muted-foreground mb-6">Važi za ispravke u pisanju i povratne informacije u razgovoru.</p>
                  <div className="grid gap-3">
                    {SUPPORT_STYLES.map((o) => (
                      <ChoiceRow key={o.value} title={o.title} desc={o.desc} selected={form.preferred_tone === o.value} onClick={() => setForm({ ...form, preferred_tone: o.value })} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-10">
            <Button variant="ghost" onClick={prev} disabled={step === 0 || saving}>
              <ChevronLeft className="w-4 h-4 mr-1" /> {t.back}
            </Button>
            <Button
              variant="hero"
              onClick={next}
              disabled={saving || (step === 0 && !form.name?.trim()) || lastStepDisabled}
            >
              {saving ? "Čuvanje…" : step === steps.length - 1 ? t.finish : t.next} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
