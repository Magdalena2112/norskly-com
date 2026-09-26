import { CalendarDays, CircleCheck } from "lucide-react";

interface RelocationStatusBarProps {
  reviewedOn: string;
}

export function RelocationStatusBar({ reviewedOn }: RelocationStatusBarProps) {
  return (
    <div aria-label="Informacije o vodiču" className="flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-primary">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-secondary/40 px-3 py-1.5">
        <span aria-hidden="true">🇷🇸</span> Za državljane Srbije
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-secondary/40 px-3 py-1.5">
        <CircleCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> Provereno na zvaničnim izvorima
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/10 bg-secondary/40 px-3 py-1.5">
        <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" /> Ažurirano: {reviewedOn}
      </span>
    </div>
  );
}