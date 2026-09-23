import { motion } from "framer-motion";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FREE_FEATURES = [
  "Test nivoa",
  "Odabrane lekcije i vežbe",
  "Ograničen pristup alatima za učenje",
  "Osnovni pregled napretka",
  "Odabrani sadržaji iz Relocation Hub-a",
];

const FREE_DETAILS = [
  "Ograničen pristup Grammar funkciji",
  "Ograničen pristup Vocabulary funkciji",
  "Ograničen pristup Reading funkciji",
  "Ograničen pristup Writing funkciji",
  "Ograničen pristup Talk funkciji",
  "Mogućnost pregleda dostupnih profesora",
  "Mogućnost prelaska na punu pretplatu u bilo kom trenutku",
];

const PAID_FEATURES = [
  "Kompletan pristup svim alatima za učenje",
  "Personalizovane vežbe i preporuke",
  "Praćenje napretka i analiza grešaka",
  "Kompletan pristup Relocation Hub-u",
  "Mogućnost zakazivanja časova sa profesorima",
];

const PAID_DETAILS = [
  "Grammar",
  "Vocabulary",
  "Reading",
  "Writing",
  "Talk",
  "Personalizovane vežbe",
  "Praćenje napretka",
  "Analiza najčešćih grešaka",
  "Preporuke za dalji rad",
  "Kompletan pristup Relocation Hub-u",
  "Mogućnost pronalaženja profesora i dodatnog zakazivanja časova",
];

const TEACHER_OPTIONS = ["1 individualni čas", "Paket od 4 časa", "Paket od 8 časova"];

interface PricingSectionProps {
  id?: string;
  className?: string;
  onFreeSelect: () => void;
  onPaidSelect: () => void;
  onTeacherSelect: () => void;
  paidDisabled?: boolean;
  teacherDisabled?: boolean;
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5 text-sm text-foreground/85">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BenefitsAccordion({ value, items }: { value: string; items: string[] }) {
  return (
    <Accordion type="single" collapsible className="mt-5 border-t border-border">
      <AccordionItem value={value} className="border-0">
        <AccordionTrigger className="py-4 text-left text-sm font-semibold text-primary hover:no-underline">
          Pogledaj sve pogodnosti
        </AccordionTrigger>
        <AccordionContent>
          <FeatureList items={items} />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export default function PricingSection({
  id = "pricing",
  className,
  onFreeSelect,
  onPaidSelect,
  onTeacherSelect,
  paidDisabled = false,
  teacherDisabled = false,
}: PricingSectionProps) {
  return (
    <section id={id} className={cn("py-14 md:py-24", className)}>
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-primary/70 sm:text-xs">
            Fleksibilno učenje
          </p>
          <h2 className="mb-3 text-display text-[clamp(1.75rem,5vw,4rem)] text-primary sm:mb-4">
            Izaberi način učenja koji ti <span className="font-script text-primary/70">odgovara</span>.
          </h2>
          <p className="text-sm text-muted-foreground sm:text-base">
            Počni besplatno ili otključaj kompletno Norskly iskustvo.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl items-stretch gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="h-full"
          >
            <Card className="h-full rounded-3xl border-border bg-background shadow-card-soft">
              <CardContent className="flex h-full flex-col p-6 sm:p-8">
                <h3 className="font-display text-2xl font-bold text-primary sm:text-3xl">Isprobaj Norskly</h3>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-black text-foreground">0 €</span>
                </div>
                <p className="mt-3 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  Upoznaj platformu pre nego što se pretplatiš.
                </p>
                <div className="mt-6 flex-1">
                  <FeatureList items={FREE_FEATURES} />
                  <BenefitsAccordion value="free-benefits" items={FREE_DETAILS} />
                </div>
                <Button className="mt-6 w-full rounded-full" onClick={onFreeSelect}>
                  Počni besplatno <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: 0.07 }}
            className="h-full"
          >
            <Card className="h-full rounded-3xl border-2 border-accent bg-card shadow-accent-glow">
              <CardContent className="flex h-full flex-col p-6 sm:p-8">
                <h3 className="font-display text-2xl font-bold text-primary sm:text-3xl">Uči uz Norskly</h3>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-background p-3 sm:p-4">
                    <p className="font-display text-2xl font-black text-foreground sm:text-3xl">9,90 €</p>
                    <p className="mt-1 text-xs text-muted-foreground">mesečno</p>
                  </div>
                  <div className="rounded-2xl border border-accent/60 bg-accent/10 p-3 sm:p-4">
                    <Badge className="mb-2 bg-accent text-accent-foreground hover:bg-accent">Najisplativije</Badge>
                    <p className="font-display text-2xl font-black text-foreground sm:text-3xl">89 €</p>
                    <p className="mt-1 text-xs text-muted-foreground">godišnje</p>
                    <p className="mt-2 text-xs font-semibold text-primary">Uštedi 29,80 € godišnje</p>
                  </div>
                </div>
                <p className="mt-4 min-h-10 text-sm leading-relaxed text-muted-foreground">
                  Za korisnike koji žele kompletan pristup platformi i učenje svojim tempom.
                </p>
                <div className="mt-6 flex-1">
                  <FeatureList items={PAID_FEATURES} />
                  <BenefitsAccordion value="paid-benefits" items={PAID_DETAILS} />
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Časovi sa profesorom nisu uključeni u cenu pretplate i plaćaju se dodatno prema ponudi izabranog profesora.
                  </p>
                </div>
                <Button className="mt-6 w-full rounded-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={onPaidSelect} disabled={paidDisabled}>
                  Započni učenje <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="mx-auto mt-8 max-w-5xl border-t border-border pt-8 sm:mt-10 sm:pt-10">
          <div className="rounded-3xl border border-border bg-secondary/60 p-6 sm:p-8 md:p-10">
            <div className="grid gap-7 lg:grid-cols-[1.35fr_1fr] lg:items-center">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </span>
                  <h3 className="font-display text-2xl font-bold text-primary sm:text-3xl">Želiš dodatnu podršku profesora?</h3>
                </div>
                <p className="font-medium text-foreground">Uči samostalno, a profesora uključi kada ti zatreba.</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Uz aktivnu Norskly pretplatu možeš da izabereš profesora i zakažeš individualni čas ili paket časova, u zavisnosti od njegove ponude i dostupnosti.
                </p>
              </div>
              <div>
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  {TEACHER_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground">
                      <Check className="h-4 w-4 shrink-0 text-primary" /> {option}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                  Cena, trajanje časa i dostupni paketi zavise od izabranog profesora.
                </p>
                <Button variant="outline" className="mt-5 w-full rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" onClick={onTeacherSelect} disabled={teacherDisabled}>
                  Pronađi profesora <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}