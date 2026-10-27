import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, HeartPulse, ClipboardCheck } from "lucide-react";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/levels";
import { courseStartLevel, promoAvailableLevels } from "@/lib/courseAccess";

type Course = {
  id: string;
  title: string;
  description: string;
  level: string;
  status: "active" | "soon";
  icon: typeof BookOpen;
};

const COURSES: Record<string, Course[]> = {
  norveski: [
    { id: "general", title: "Opšti kurs", description: "Sistematske lekcije od početnog do naprednog nivoa.", level: "A1–C1", status: "active", icon: BookOpen },
    { id: "health", title: "Norveški za zdravstvene radnike", description: "Jezik za rad sa pacijentima, kolegama i dokumentacijom.", level: "B1", status: "active", icon: HeartPulse },
    { id: "norskprove", title: "Norskprøve priprema", description: "Ciljana priprema za zvanični test norveškog jezika.", level: "A2–B2", status: "soon", icon: ClipboardCheck },
  ],
  nemacki: [
    { id: "general", title: "Opšti kurs", description: "Sistematske lekcije od početnog do naprednog nivoa.", level: "A1–C1", status: "active", icon: BookOpen },
    { id: "health", title: "Nemački za zdravstvene radnike", description: "Jezik za rad sa pacijentima, kolegama i dokumentacijom.", level: "B1", status: "active", icon: HeartPulse },
  ],
  engleski: [
    { id: "general", title: "Opšti kurs", description: "Sistematske lekcije od početnog do naprednog nivoa.", level: "A1–C1", status: "active", icon: BookOpen },
  ],
};

const SLUG_TO_CODE: Record<string, string> = { norveski: "no", engleski: "en", nemacki: "de" };

export default function CourseTypeSection({ slug, onSelect }: { slug: string; onSelect: (courseId: string, level: CefrLevel) => void }) {
  const [selectedLevels, setSelectedLevels] = useState<Record<string, CefrLevel>>({});
  const courses = COURSES[slug] ?? [];
  if (!courses.length) return null;
  return (
    <section id="courses" className="py-20 md:py-24">
      <div className="container">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Kursevi</p>
          <h2 className="text-display text-[clamp(2rem,4.5vw,3.5rem)] text-primary">Izaberi vrstu kursa</h2>
          <p className="text-muted-foreground mt-3">Svaki kurs ima zaseban pristup i napredak.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((c) => {
            const courseType = c.id === "health" ? "health" : "general";
            const promo = promoAvailableLevels(SLUG_TO_CODE[slug] ?? "", courseType);
            return (
            <Card key={c.id} className={`rounded-3xl h-full ${c.status === "soon" ? "border-dashed bg-background/50" : "hover:shadow-soft"}`}>
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/70 flex items-center justify-center">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <Badge variant={c.status === "active" ? "default" : "outline"}>
                    {c.status === "active" ? "Aktivno" : "U pripremi"}
                  </Badge>
                </div>
                <h3 className="font-display text-xl font-bold text-primary">{c.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{c.level}</p>
                <p className="text-sm text-muted-foreground mt-3 flex-1">{c.description}</p>
                {c.status === "active" && (
                  <div className="mt-5">
                    <p className="text-sm font-medium text-foreground mb-2">Početni nivo</p>
                    <div className="grid grid-cols-5 gap-1.5" role="group" aria-label={`Početni nivo · ${c.title}`}>
                      {CEFR_LEVELS.map((level) => {
                        const available = promo ? promo.includes(level) : courseType === "general" || level === "B1";
                        const selected = courseStartLevel(selectedLevels[c.id], courseType, promo) === level;
                        return <Button key={level} size="sm" variant={selected ? "default" : "outline"} className="px-0 min-w-0" aria-pressed={selected} disabled={!available} title={available ? level : `${level} · U pripremi`} onClick={() => setSelectedLevels((prev) => ({ ...prev, [c.id]: level }))}>{level}</Button>;
                      })}
                    </div>
                    {c.id === "health" && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Tokom promotivnog perioda aktivan je B1. A1, A2, B2 i C1 su u pripremi.</p>}
                    {promo && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">Tokom promotivnog perioda aktivan je {promo[0]}. {CEFR_LEVELS.filter((l) => !promo.includes(l)).join(", ")} su u pripremi.</p>}
                  </div>
                )}
                {c.status === "active" ? (
                  <Button className="mt-6 rounded-full" onClick={() => onSelect(c.id, courseStartLevel(selectedLevels[c.id], courseType, promo))}>
                    Prijavi se na kurs <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button className="mt-6 rounded-full" variant="outline" disabled>Uskoro dostupno</Button>
                )}
              </CardContent>
            </Card>
          );})}
        </div>
      </div>
    </section>
  );
}
