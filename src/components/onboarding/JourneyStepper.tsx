import { useEffect, useState } from "react";
import { Check, Sparkles, Gift, BookOpen, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { getLanguageBySlug } from "@/lib/languages";

export const JOURNEY_STEPS = [
  { id: "language", label: "Jezik" },
  { id: "explore", label: "Istraži" },
  { id: "account", label: "Nalog" },
  { id: "trial", label: "Probna verzija" },
  { id: "learn", label: "Učenje" },
] as const;

export type JourneyStepId = (typeof JOURNEY_STEPS)[number]["id"];

export type PlanId = "trial" | "self" | "lessons";

export const PLAN_META: Record<PlanId, { label: string; icon: typeof Gift }> = {
  trial: { label: "7 dana besplatno", icon: Gift },
  self: { label: "Self-Learning", icon: BookOpen },
  lessons: { label: "Learning + Lessons", icon: GraduationCap },
};

interface Props {
  current: JourneyStepId;
  className?: string;
  /** Optional overrides; if omitted, the component reads from localStorage. */
  selectedPlan?: PlanId | null;
  selectedLanguage?: string | null;
  /** Hide the summary chip row above the steps. */
  hideSummary?: boolean;
}

function readStored<T extends string>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(key);
  return (v as T) || null;
}

export default function JourneyStepper({
  current,
  className,
  selectedPlan,
  selectedLanguage,
  hideSummary,
}: Props) {
  const currentIdx = JOURNEY_STEPS.findIndex((s) => s.id === current);

  // Hydrate from localStorage when not provided
  const [plan, setPlan] = useState<PlanId | null>(selectedPlan ?? null);
  const [langSlug, setLangSlug] = useState<string | null>(selectedLanguage ?? null);

  useEffect(() => {
    if (selectedPlan === undefined) setPlan(readStored<PlanId>("norskly_selected_plan"));
    if (selectedLanguage === undefined) setLangSlug(readStored<string>("norskly_selected_language"));

    const onStorage = (e: StorageEvent) => {
      if (e.key === "norskly_selected_plan") setPlan((e.newValue as PlanId) || null);
      if (e.key === "norskly_selected_language") setLangSlug(e.newValue || null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [selectedPlan, selectedLanguage]);

  const lang = langSlug ? getLanguageBySlug(langSlug) : undefined;
  const planMeta = plan ? PLAN_META[plan] : null;
  const PlanIcon = planMeta?.icon;

  return (
    <div className={cn("w-full", className)}>
      {/* Selection summary */}
      {!hideSummary && (lang || planMeta) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {lang && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/70 border border-border text-xs font-medium text-foreground">
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </span>
          )}
          {planMeta && PlanIcon && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/40 text-xs font-semibold text-accent">
              <PlanIcon className="w-3.5 h-3.5" />
              {planMeta.label}
              {plan === "trial" && <Sparkles className="w-3 h-3 opacity-80" />}
            </span>
          )}
        </div>
      )}

      <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2">
        <ol className="flex items-center gap-2 sm:gap-3 min-w-max">
          {JOURNEY_STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;

            // Enrich step labels with the user's choice
            let label: string = step.label;
            if (step.id === "language" && lang) label = lang.label;
            if (step.id === "trial" && planMeta) label = planMeta.label;

            return (
              <li key={step.id} className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-all",
                      done && "bg-primary text-primary-foreground border-primary",
                      active &&
                        "bg-accent text-accent-foreground border-accent shadow-accent-glow",
                      !done && !active &&
                        "bg-background text-muted-foreground border-border",
                    )}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-medium whitespace-nowrap",
                      (done || active)
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                </div>
                {i < JOURNEY_STEPS.length - 1 && (
                  <span
                    className={cn(
                      "h-px w-6 sm:w-10 transition-colors",
                      i < currentIdx ? "bg-primary" : "bg-border",
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
