import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserProfile } from "@/types/profile";
import { ChevronRight, ChevronLeft, User, Target, MessageSquare, BookOpen, Gauge } from "lucide-react";

const steps = ["Ime", "Nivo", "Cilj", "Stil", "Fokus", "Samopouzdanje", "Norveška"];

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
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Partial<UserProfile>>({
    name: profile.name || "",
    level: profile.level || "A1",
    learning_goal: profile.learning_goal || "svakodnevna komunikacija",
    preferred_tone: profile.preferred_tone || "opušten",
    focus_area: profile.focus_area || "govor",
    confidence_level: profile.confidence_level || 3,
    lives_in_norway: profile.lives_in_norway || false,
  });

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else {
      updateProfile(form);
      localStorage.setItem("norskly_onboarding_done", "true");
      // Sync to profiles table
      if (user) {
        supabase
          .from("profiles")
          .upsert({
            user_id: user.id,
            display_name: form.name || "",
            level: form.level || "A1",
            learning_goal: form.learning_goal || "",
            focus_area: form.focus_area || "",
            confidence_level: form.confidence_level ?? 3,
          }, { onConflict: "user_id" })
          .then();
      }
      navigate("/practice");
    }
  };
  const prev = () => step > 0 && setStep(step - 1);

  const stepIcons = [User, Target, Target, MessageSquare, BookOpen, Gauge, Target];
  const StepIcon = stepIcons[step];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar progress */}
      <div className="hidden md:flex w-72 bg-nordic-gradient flex-col p-8 text-primary-foreground">
        <span className="font-display font-bold text-2xl mb-12">Norskly</span>
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
        <p className="text-sm opacity-60">Korak {step + 1} od {steps.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          {/* Mobile progress */}
          <div className="md:hidden flex items-center justify-between mb-8">
            <span className="font-display font-bold text-xl text-foreground">Norskly</span>
            <span className="text-sm text-muted-foreground">{step + 1}/{steps.length}</span>
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
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Kako se zoveš?</h2>
                  <p className="text-muted-foreground mb-6">AI će koristiti tvoje ime za personalizovanu komunikaciju.</p>
                  <Input
                    placeholder="Tvoje ime"
                    value={form.name || ""}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="text-lg h-12"
                  />
                </div>
              )}

              {step === 1 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Koji je tvoj nivo?</h2>
                  <p className="text-muted-foreground mb-6">Odaberi nivo koji najbolje opisuje tvoje znanje norveškog.</p>
                  <div className="flex flex-wrap gap-3">
                    {(["A1", "A2", "B1", "B2", "C1"] as const).map((l) => (
                      <OptionCard key={l} label={l} selected={form.level === l} onClick={() => setForm({ ...form, level: l })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Zašto učiš norveški?</h2>
                  <p className="text-muted-foreground mb-6">Ovo pomaže AI-u da prilagodi sadržaj tvom cilju.</p>
                  <div className="flex flex-wrap gap-3">
                    {["posao", "preseljenje", "studije", "svakodnevna komunikacija", "ispit", "lični razvoj"].map((g) => (
                      <OptionCard key={g} label={g} selected={form.learning_goal === g} onClick={() => setForm({ ...form, learning_goal: g })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Koji stil komunikacije preferiraš?</h2>
                  <p className="text-muted-foreground mb-6">AI prilagođava ton odgovora prema tvojim preferencijama.</p>
                  <div className="flex flex-wrap gap-3">
                    {["opušten", "neutralan", "profesionalan"].map((t) => (
                      <OptionCard key={t} label={t} selected={form.preferred_tone === t} onClick={() => setForm({ ...form, preferred_tone: t })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Na šta želiš da se fokusiraš?</h2>
                  <p className="text-muted-foreground mb-6">Izaberi primarnu oblast na kojoj želiš da radiš.</p>
                  <div className="flex flex-wrap gap-3">
                    {["govor", "pisanje", "gramatika", "vokabular"].map((f) => (
                      <OptionCard key={f} label={f} selected={form.focus_area === f} onClick={() => setForm({ ...form, focus_area: f })} />
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Koliko si siguran/a u svoj norveški?</h2>
                  <p className="text-muted-foreground mb-6">Na skali od 1 do 5, koliko se samouvereno osećaš?</p>
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
                  <h2 className="text-2xl font-display font-bold text-foreground mb-2">Živiš li u Norveskoj?</h2>
                  <p className="text-muted-foreground mb-6">Ovo pomaže AI-u da daje relevantnije primere i savete.</p>
                  <div className="flex gap-3">
                    <OptionCard label="Da" selected={form.lives_in_norway === true} onClick={() => setForm({ ...form, lives_in_norway: true })} />
                    <OptionCard label="Ne" selected={form.lives_in_norway === false} onClick={() => setForm({ ...form, lives_in_norway: false })} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <Button variant="ghost" onClick={prev} disabled={step === 0}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Nazad
            </Button>
            <Button
              variant="hero"
              onClick={next}
              disabled={step === 0 && !form.name?.trim()}
            >
              {step === steps.length - 1 ? "Završi" : "Dalje"} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
