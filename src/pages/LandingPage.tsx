import { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Sparkles, BookOpen, Target, Mic, BarChart3,
  Check, X, ArrowRight, GraduationCap, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

const LANGUAGES = [
  { code: "no", label: "Norveški", flag: "🇳🇴" },
  { code: "en", label: "Engleski", flag: "🇬🇧" },
  { code: "de", label: "Nemački", flag: "🇩🇪" },
];

const FEATURES = [
  { icon: MessageCircle, title: "Realna komunikacija", desc: "Vežbaj jezik kroz realistične svakodnevne i poslovne razgovore." },
  { icon: Target, title: "Personalizovano učenje", desc: "AI prilagođava lekcije tvom nivou, ciljevima i tempu." },
  { icon: BookOpen, title: "Gramatika u kontekstu", desc: "Uči gramatiku kroz primere, dijaloge i stvarnu komunikaciju." },
  { icon: Sparkles, title: "Trenutni AI feedback", desc: "Dobij objašnjenja, ispravke i predloge u realnom vremenu." },
  { icon: Mic, title: "AI razgovori", desc: "Vežbaj govor i komunikaciju kroz razgovore sa AI-em." },
  { icon: BarChart3, title: "Pametno praćenje napretka", desc: "Prati napredak i analiziraj greške koje se ponavljaju." },
];

const STUDENT_BENEFITS = [
  "Personalizovano učenje", "AI razgovorna praksa", "Izgradnja vokabulara",
  "Podrška u gramatici", "Praćenje napretka",
];
const TEACHER_BENEFITS = [
  "Upravljanje studentima", "Praćenje napretka studenata", "Organizacija časova",
  "AI-generisane vežbe", "Analitika i uvid u studente",
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

const PRICING = [
  { tier: "Samostalno", price: "€9", per: "/mesec", desc: "Pristup AI platformi", items: ["Sve AI lekcije", "Vežbe vokabulara", "Praćenje napretka"], variant: "dark" as const },
  { tier: "Časovi + Platforma", price: "€39", per: "/mesec", desc: "Najpopularnije", items: ["Sve sa Samostalnog", "4 individualna časa", "Direktan kontakt sa profesorom", "Prioritetna podrška"], variant: "pink" as const, featured: true },
  { tier: "Za profesore", price: "€19", per: "/mesec", desc: "Alati za predavače", items: ["Upravljanje studentima", "AI-generisane vežbe", "Analitika i izveštaji", "Organizacija časova"], variant: "beige" as const },
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
  const [lang, setLang] = useState("no");

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ============== NAV ============== */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container flex items-center justify-between h-16">
          <span className="text-2xl font-display font-black tracking-tight text-primary">Norskly</span>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
            <a href="#features" className="hover:text-primary transition-colors">Platforma</a>
            <a href="#teachers" className="hover:text-primary transition-colors">Za profesore</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Cene</a>
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

            {/* language pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-10">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                    lang === l.code
                      ? "bg-primary text-primary-foreground border-primary shadow-card-soft"
                      : "bg-background text-foreground border-border hover:border-primary/40 hover:bg-secondary/40"
                  }`}
                >
                  <span className="mr-2">{l.flag}</span>{l.label}
                </button>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group bg-background border border-border rounded-3xl p-8 hover:-translate-y-1 hover:shadow-soft transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <f.icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
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
              <h3 className="text-display text-4xl text-primary mb-6">Uči pametnije, govori brže.</h3>
              <ul className="space-y-3 mb-8">
                {STUDENT_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/auth?role=student")}
                className="rounded-full bg-primary hover:bg-primary/90">
                Započni kao student <ArrowRight className="ml-1 h-4 w-4" />
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
              <h3 className="text-display text-4xl text-primary mb-6">Predavaj uz moderne alate.</h3>
              <ul className="space-y-3 mb-8">
                {TEACHER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Button onClick={() => navigate("/auth?role=teacher")}
                variant="outline"
                className="rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                Predaj na Norskly <ArrowRight className="ml-1 h-4 w-4" />
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

      {/* ============== PRICING ============== */}
      <section id="pricing" className="py-20 md:py-28 bg-card/60">
        <div className="container">
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Cene</p>
            <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary">
              Izaberi svoj <span className="font-script text-primary/70">plan</span>.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PRICING.map((p) => {
              const isDark = p.variant === "dark";
              const isPink = p.variant === "pink";
              return (
                <div key={p.tier}
                  className={`relative rounded-3xl p-8 border flex flex-col ${
                    isDark ? "bg-primary text-primary-foreground border-primary"
                    : isPink ? "bg-secondary text-foreground border-border md:scale-105 shadow-soft"
                    : "bg-card text-foreground border-border"
                  }`}
                >
                  {p.featured && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      Najpopularnije
                    </span>
                  )}
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${isDark ? "opacity-80" : "text-primary/70"}`}>{p.tier}</p>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-display text-5xl">{p.price}</span>
                    <span className={`text-sm ${isDark ? "opacity-70" : "text-muted-foreground"}`}>{p.per}</span>
                  </div>
                  <p className={`text-sm mb-6 ${isDark ? "opacity-80" : "text-muted-foreground"}`}>{p.desc}</p>
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {p.items.map((it) => (
                      <li key={it} className="flex gap-2.5 text-sm">
                        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? "opacity-80" : "text-primary"}`} /> {it}
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => navigate("/auth")}
                    className={`rounded-full w-full ${
                      isDark ? "bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    Započni
                  </Button>
                </div>
              );
            })}
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
              <div className="relative rounded-3xl overflow-hidden bg-secondary aspect-square max-w-md bg-dots-soft border border-border">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-script text-primary text-7xl md:text-9xl">norsk.</span>
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
