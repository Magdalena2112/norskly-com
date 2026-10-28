import { useNavigate } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TalkScenario } from "@/content/lessons/talkScenarios";
import { lessonScenarioUrl } from "@/lib/lessonSpeaking";

export default function LessonSpeakingTab({ scenarios, lessonCode }: { scenarios: TalkScenario[]; lessonCode: string }) {
  const navigate = useNavigate();
  if (!scenarios.length) return (
    <Button variant="hero" onClick={() => navigate(`/talk?lesson=${encodeURIComponent(lessonCode)}`)}>
      <MessageSquare className="h-4 w-4" /> Otvori razgovor
    </Button>
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {scenarios.map((scenario) => (
        <article key={scenario.id} className="flex min-w-0 flex-col rounded-lg border border-border/60 bg-cream/90 p-5 shadow-card-soft">
          <span className="text-xs text-muted-foreground">{scenario.id}</span>
          <h3 className="mt-1 font-display text-lg font-semibold text-primary break-words">{scenario.title}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{scenario.description}</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div><dt className="font-semibold text-primary">Tvoja uloga</dt><dd>{scenario.studentRole}</dd></div>
            <div><dt className="font-semibold text-primary">Sagovornik</dt><dd>{scenario.aiRole}</dd></div>
          </dl>
          <h4 className="mt-4 text-sm font-semibold text-primary">Zadatak i kriterijumi</h4>
          <ul className="mt-2 list-disc space-y-2 pl-4 text-sm">
            {scenario.goals.map((goal) => <li key={goal}>{goal}</li>)}
          </ul>
          <div className="mt-auto pt-5">
            <Button variant="hero" className="w-full gap-2" aria-label={`Započni razgovor: ${scenario.title}`} onClick={() => navigate(lessonScenarioUrl(lessonCode, scenario.id))}>
              <MessageSquare className="h-4 w-4 shrink-0" /> Započni razgovor
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}