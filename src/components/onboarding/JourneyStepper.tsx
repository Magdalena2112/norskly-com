import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const JOURNEY_STEPS = [
  { id: "language", label: "Jezik" },
  { id: "explore", label: "Istraži" },
  { id: "account", label: "Nalog" },
  { id: "trial", label: "Probna verzija" },
  { id: "learn", label: "Učenje" },
] as const;

export type JourneyStepId = (typeof JOURNEY_STEPS)[number]["id"];

interface Props {
  current: JourneyStepId;
  className?: string;
}

export default function JourneyStepper({ current, className }: Props) {
  const currentIdx = JOURNEY_STEPS.findIndex((s) => s.id === current);

  return (
    <div
      className={cn(
        "w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-2 px-2",
        className,
      )}
    >
      <ol className="flex items-center gap-2 sm:gap-3 min-w-max">
        {JOURNEY_STEPS.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
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
                  {step.label}
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
  );
}
