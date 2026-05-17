import { motion } from "framer-motion";
import {
  MessageCircle, Sparkles, BookOpen, Target, Mic, BarChart3,
  Check, X, ArrowRight, GraduationCap, Users, CalendarCheck, Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { LANGUAGES as LANGUAGE_CONFIGS } from "@/lib/languages";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { FloatingGreetings } from "@/components/FloatingGreetings";


const FEATURES = [
  { icon: MessageCircle, title: "Realna komunikacija", desc: "Vežbaj jezik kroz realistične svakodnevne i poslovne razgovore." },
  { icon: Target, title: "Personalizovano učenje", desc: "AI prilagođava lekcije tvom nivou, ciljevima i tempu." },
  { icon: BookOpen, title: "Gramatika u kontekstu", desc: "Uči gramatiku kroz primere, dijaloge i stvarnu komunikaciju." },
  { icon: Sparkles, title: "Trenutni AI feedback", desc: "Dobij objašnjenja, ispravke i predloge u realnom vremenu." },
  { icon: Mic, title: "AI razgovori", desc: "Vežbaj govor i komunikaciju kroz razgovore sa AI-em." },
  { icon: BarChart3, title: "Pametno praćenje napretka", desc: "Prati napredak i analiziraj greške koje se ponavljaju." },
  { icon: CalendarCheck, title: "Podrška profesora", desc: "Poveži se sa profesorima i zakaži časove kada želiš dodatnu podršku u učenju." },
];

const STUDENT_BENEFITS = [
  "Personalizovano AI učenje",
  "Razgovorna praksa kroz realne situacije",
  "Pametno građenje vokabulara",
  "Jasna podrška u gramatici",
  "Praćenje napretka i grešaka",
  "Mogućnost dodatne podrške profesora jezika",
];
const TEACHER_BENEFITS = [
  "Upravljanje studentima i grupama",
  "Uvid u napredak i tipične greške",
  "Organizacija časova i materijala",
  "AI-generisane vežbe i sadržaj",
  "Analitika i personalizovani uvidi",
];

const FIT_YES = [
  "Želiš strukturisano učenje jezika",
  "Uživaš u interaktivnoj praksi",
  "Želiš podršku zasnovanu na AI-u",
  "Želiš personalizovan feedback",
];
const FIT_NO = [
  "Želiš samo pasivno učenje",
  "Ne želiš redovnu praksu",
  "Preferiraš učenje samo iz udžbenika",
];

const TRIAL_INCLUDED = [
  "Gramatičke vežbe i alati",
  "Vokabular i ordsamlinger",
  "Probna rezervacija časa",
  "Osnovno upoznavanje sa platformom",
];
const TRIAL_LOCKED = [
  "AI razgovori",
  "Kompletan AI feedback",
  "Personalizovana analitika",
  "Pametno praćenje napretka",
];

const LEARNING_OPTIONS = [
  {
    icon: Sparkles,
    title: "Samostalno AI učenje",
    desc: "Za učenike koji žele potpuno samostalno učenje uz AI podršku.",
    items: [
      "AI razgovori",
      "Personalizovane vežbe",
      "Gramatika i vokabular",
      "Praćenje napretka",
    ],
  },
  {
    icon: GraduationCap,
    title: "AI + podrška profesora",
    desc: "Kombinuj AI alate sa individualnim časovima i podrškom profesora.",
    items: [
      "Rezervacija časova",
      "Podrška profesora",
      "AI alati tokom učenja",
      "Praćenje napretka",
    ],
  },
];

const FAQ = [
  { q: "Da li mi je potrebno predznanje?", a: "Ne. Norskly počinje od tvog tačnog nivoa — od potpunog početnika do naprednog." },
  { q: "Koje jezike mogu da učim?", a: "Trenutno norveški, engleski i nemački. Uskoro dodajemo i druge jezike." },
  { q: "Kako AI prilagođava lekcije?", a: "AI analizira tvoje odgovore, greške i tempo, pa kreira sledeći zadatak baš za tebe." },
  { q: "Mogu li da rezervišem časove sa profesorom?", a: "Da. Uz Časovi + Platforma plan dobijaš 4 individualna časa mesečno." },
  { q: "Mogu li da predajem na Norskly?", a: "Da. Kreiraj profesorski nalog i počni da gradiš svoju bazu studenata." },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ============== NAV ============== */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <span className="text-2xl font-display font-black tracking-tight text-primary">Norskly</span>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
            <a href="#features" className="hover:text-primary transition-colors">Platforma</a>
            <a href="#teachers" className="hover:text-primary transition-colors">Za profesore</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Kako učiš</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>Prijava</Button>
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90" onClick={() => navigate("/auth")}>
              Započni besplatno
            </Button>
          </div>
        </div>
      </nav>

      {/* ============== HERO ============== */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-grid-soft opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute top-24 -right-20 w-96 h-96 rounded-full bg-secondary/60 blur-3xl opacity-70" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-accent/40 blur-3xl opacity-60" />
        <FloatingGreetings />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto text-center"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/70 text-primary text-xs font-semibold tracking-widest uppercase mb-6">
              AI platforma za učenje jezika
            </span>

            <h1 className="text-display text-[clamp(2.8rem,9vw,7rem)] text-primary mb-6">
              Uči jezike sigurnije, <span className="font-script text-accent-foreground/80">pametnije</span> i svojim tempom.
            </h1>

            <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Norskly povezuje učenike i profesore u jednom AI ekosistemu za učenje jezika —
              sa personalizovanom podrškom, vežbama i praćenjem napretka.
            </p>

            {/* language pills — entry to per-language onboarding */}
            <p id="languages" className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3 scroll-mt-24">
              Izaberi jezik koji želiš da učiš
            </p>
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {LANGUAGE_CONFIGS.map((l) => (
                <Link
                  key={l.slug}
                  to={`/jezici/${l.slug}`}
                  onClick={() => localStorage.setItem("norskly_selected_language", l.slug)}
                  className="group px-5 py-2.5 rounded-full text-sm font-medium border bg-background text-foreground border-border hover:border-primary hover:bg-secondary/40 hover:-translate-y-0.5 hover:shadow-card-soft transition-all inline-flex items-center gap-2"
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="rounded-full h-14 px-8 text-base bg-primary hover:bg-primary/90 shadow-soft"
                onClick={() => navigate("/auth?role=student")}>
                Učim jezik <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline"
                className="rounded-full h-14 px-8 text-base border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                onClick={() => navigate("/auth?role=teacher")}>
                Predajem jezik
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== FEATURES ============== */}
      <section id="features" className="py-20 md:py-28 bg-card/60">
        <div className="container">
          <div className="max-w-3xl mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Funkcionalnosti</p>
            <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary">
              Sve što ti je potrebno <span className="font-script text-primary/70">da</span> progovoriš.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                className="group h-full flex flex-col bg-background border border-border rounded-3xl p-6 sm:p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-soft hover:bg-card/40 [&:last-child]:sm:col-span-2 [&:last-child]:lg:col-span-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-[-4deg]">
                  <f.icon className="w-5 h-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary mb-2 transition-colors duration-300 group-hover:text-primary/90">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <span className="mt-4 h-px w-0 bg-gradient-to-r from-primary/40 to-transparent transition-all duration-500 group-hover:w-2/3" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== MARQUEE ============== */}
      <section className="py-6 bg-primary text-primary-foreground overflow-hidden border-y border-primary/20">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-10 px-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="text-display text-3xl md:text-4xl">
                  Započni danas <span className="font-script mx-3 opacity-70">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============== STUDENTS vs TEACHERS ============== */}
      <section id="teachers" className="py-20 md:py-28">
        <div className="container">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Ekosistem</p>
            <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary">
              Za studente <span className="font-script text-primary/70">i</span> profesore.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl p-10 border border-border relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Za studente</span>
              </div>
              <h3 className="text-display text-4xl text-primary mb-6">Uči pametnije. Govori sa <span className="font-script text-primary/70">samopouzdanjem</span>.</h3>
              <ul className="space-y-3 mb-8">
                {STUDENT_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/auth?role=student")}
                className="rounded-full bg-primary hover:bg-primary/90">
                Počni sa učenjem <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-secondary rounded-3xl p-10 border border-border relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-widest text-primary/70">Za profesore</span>
              </div>
              <h3 className="text-display text-4xl text-primary mb-6">Predavaj modernije. Organizuj <span className="font-script text-primary/70">jednostavnije</span>.</h3>
              <ul className="space-y-3 mb-8">
                {TEACHER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/za-profesore")}
                variant="outline"
                className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Predaj uz Norskly <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============== ROLE CHOICE ============== */}
      <section className="py-20 md:py-28 bg-card/60">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Izaberi svoju ulogu</p>
            <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary">
              Kako želiš <span className="font-script text-primary/70">da</span> kreneš?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { label: "Student", desc: "Uči, vežbaj i napreduj svaki dan.", role: "student", bg: "bg-background" },
              { label: "Profesor", desc: "Predavaj, organizuj i prati studente.", role: "teacher", bg: "bg-secondary" },
            ].map((r) => (
              <button key={r.role} onClick={() => navigate(`/auth?role=${r.role}`)}
                className={`${r.bg} group rounded-3xl p-10 text-left border border-border hover:-translate-y-1 hover:shadow-soft transition-all`}
              >
                <h3 className="text-display text-5xl text-primary mb-3">{r.label}</h3>
                <p className="text-muted-foreground mb-6">{r.desc}</p>
                <span className="inline-flex items-center gap-2 text-primary font-semibold">
                  Izaberi <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============== IS IT RIGHT FOR ME ============== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary">
              Da li je Norskly <span className="font-script text-primary/70">pravi</span> za tebe?
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-card rounded-3xl p-8 border border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Savršeno za tebe ako:</p>
              <ul className="space-y-4">
                {FIT_YES.map((t) => (
                  <li key={t} className="flex gap-3 text-foreground/85">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-secondary rounded-3xl p-8 border border-border">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Možda nije za tebe ako:</p>
              <ul className="space-y-4">
                {FIT_NO.map((t) => (
                  <li key={t} className="flex gap-3 text-foreground/85">
                    <X className="w-5 h-5 text-primary shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============== HOW IT WORKS ============== */}
      <section id="pricing" className="py-20 md:py-28 bg-card/60">
        <div className="container">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">
              Fleksibilno učenje
            </p>
            <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary mb-4">
              Uči svojim <span className="font-script text-primary/70">tempom</span>.
            </h2>
            <p className="text-muted-foreground">
              Istraži kako Norskly funkcioniše i koje opcije učenja te čekaju.
            </p>
          </div>

          {/* Free trial / onboarding intro card */}
          <div className="max-w-4xl mx-auto mb-10">
            <div className="relative rounded-3xl p-8 md:p-10 bg-background border border-border shadow-card-soft">
              <div className="mb-7">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-widest uppercase mb-4">
                  <Sparkles className="w-3.5 h-3.5" /> 7 dana besplatno
                </span>
                <h3 className="text-display text-3xl md:text-4xl text-primary mb-2">
                  Započni <span className="font-script text-primary/70">besplatno</span>.
                </h3>
                <p className="text-muted-foreground text-sm md:text-base max-w-xl">
                  Istraži platformu i upoznaj način učenja pre izbora pretplate.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Uključeno odmah</p>
                  <ul className="space-y-2.5">
                    {TRIAL_INCLUDED.map((t) => (
                      <li key={t} className="flex gap-2.5 text-sm text-foreground/85">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Otključava se uz pretplatu</p>
                  <ul className="space-y-2.5">
                    {TRIAL_LOCKED.map((t) => (
                      <li key={t} className="flex gap-2.5 text-sm text-muted-foreground">
                        <Lock className="w-4 h-4 shrink-0 mt-0.5 opacity-70" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Learning options (informational, no pricing) */}
          <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {LEARNING_OPTIONS.map((opt, i) => (
              <motion.div
                key={opt.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className="rounded-3xl p-8 md:p-10 bg-background border border-border hover:border-primary/30 hover:shadow-card-soft transition-all flex flex-col"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/40 flex items-center justify-center mb-5">
                  <opt.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-primary mb-2">{opt.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{opt.desc}</p>
                <ul className="space-y-2.5">
                  {opt.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-sm text-foreground/85">
                      <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {it}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Soft onboarding CTA */}
          <div className="mt-14 text-center max-w-xl mx-auto">
            <p className="text-muted-foreground mb-5 text-sm md:text-base">
              Izaberi jezik da vidiš dostupne profesore i opcije učenja.
            </p>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full h-12 px-7 border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() =>
                document.getElementById("languages")?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              Izaberi jezik <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ============== FAQ ============== */}
      <section id="faq" className="py-20 md:py-28">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">FAQ</p>
              <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary mb-6">
                Pitanja? <span className="font-script text-primary/70">Odgovori.</span>
              </h2>
              <p className="text-muted-foreground mb-8">
                Sve što treba da znaš pre nego što kreneš.
              </p>
              <div className="relative rounded-3xl overflow-hidden bg-secondary aspect-square max-w-md border border-border">
                <div className="absolute inset-0 p-8 md:p-10 flex items-center">
                  <p className="font-marker uppercase text-[clamp(2rem,5.5vw,3.5rem)] text-primary/70 leading-[1.05]">
                    Confidence comes with practice. <span className="text-primary/80">♥</span>
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Accordion type="single" collapsible className="bg-card rounded-3xl p-2 border border-border">
                {FAQ.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0 px-4">
                    <AccordionTrigger className="text-left font-display text-lg text-primary hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </div>
      </section>

      {/* ============== FINAL CTA ============== */}
      <section className="py-20 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-[2.5rem] bg-primary text-primary-foreground p-10 md:p-20 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-dots-soft opacity-20" />
            <div className="relative">
              <h2 className="text-display text-[clamp(2.2rem,6vw,5rem)] mb-6">
                Spreman <span className="font-script opacity-80">da</span> progovoriš?
              </h2>
              <p className="opacity-80 max-w-md mx-auto mb-8">
                Kreiraj profil za 2 minuta i počni da učiš na način koji odgovara tebi.
              </p>
              <Button size="lg" onClick={() => navigate("/auth")}
                className="rounded-full h-14 px-10 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Započni besplatno <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="text-display text-2xl font-black text-primary">Norskly</span>
          <p>© 2026 Norskly. Sva prava zadržana.</p>
        </div>
      </footer>
    </div>
  );
}
