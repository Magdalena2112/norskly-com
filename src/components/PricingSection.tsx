import { motion } from "framer-motion";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PROMO_COURSES = [
  "Engleski — opšti kurs A2",
  "Norveški — opšti kurs A2",
  "Nemački — opšti kurs A2",
  "Norveški za zdravstvene radnike — B1",
  "Nemački za zdravstvene radnike — B1",
];

const TEACHER_OPTIONS = ["1 individualni čas", "Paket od 4 časa", "Paket od 8 časova"];

interface PricingSectionProps {
  id?: string;
  className?: string;
  onFreeSelect: () => void;
  onTeacherSelect: () => void;
  teacherDisabled?: boolean;
}

export default function PricingSection({
  id = "pricing",
  className,
  onFreeSelect,
  onTeacherSelect,
  teacherDisabled = false,
}: PricingSectionProps) {
  return (
    <section id={id} className={cn("scroll-mt-16 py-14 md:scroll-mt-20 md:py-24", className)}>
      <div className="container">
        <div className="mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          <Badge variant="outline" className="mb-4 border-accent text-primary">Promo pristup</Badge>
          <h2 className="mb-4 text-display text-3xl text-primary sm:text-5xl">
            100% besplatno tokom testiranja
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Izaberi spreman kurs i uči svojim tempom. Bez unošenja kartice.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto grid max-w-5xl gap-8 border-y border-border py-8 md:grid-cols-2 md:gap-12 sm:py-10"
        >
          <div className="min-w-0">
            <h3 className="mb-5 font-display text-2xl font-bold text-primary">Kursevi dostupni za testiranje</h3>
            <ul className="space-y-4">
              {PROMO_COURSES.map((course) => (
                <li key={course} className="flex gap-3 text-sm text-foreground sm:text-base">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span>{course}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex min-w-0 flex-col justify-center">
            <h3 className="font-display text-2xl font-bold text-primary">Tvoj kurs, tvoj tempo</h3>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Dobijaš pun pristup spremnim lekcijama i alatima svog izabranog kursa,
              uz praćenje napretka i AI podršku u učenju.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Podeli utiske u anketi i pomozi nam da kreiramo kurseve baš po tvojoj meri.
              Ostali nivoi i kursevi su u pripremi.
            </p>
            <Button className="mt-6 w-full rounded-full sm:w-fit" size="lg" onClick={onFreeSelect}>
              Započni besplatno <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-8 md:grid-cols-2 md:gap-12">
          <div className="min-w-0">
            <div className="mb-3 flex items-start gap-3">
              <GraduationCap className="mt-1 h-6 w-6 shrink-0 text-primary" />
              <h3 className="font-display text-2xl font-bold text-primary">Želiš dodatnu podršku profesora?</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              Uči samostalno, a profesora uključi kada ti zatreba. Individualni časovi
              nisu deo besplatnog promo pristupa i dogovaraju se i plaćaju zasebno.
            </p>
          </div>
          <div className="min-w-0">
            <ul className="space-y-3">
              {TEACHER_OPTIONS.map((option) => (
                <li key={option} className="flex items-center gap-3 text-sm text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span>{option}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Cena, trajanje časa i dostupni paketi zavise od izabranog profesora.
            </p>
            <Button variant="outline" className="mt-5 w-full rounded-full sm:w-fit" onClick={onTeacherSelect} disabled={teacherDisabled}>
              Pronađi profesora <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
