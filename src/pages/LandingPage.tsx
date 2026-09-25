import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import norsklyLogo from "@/assets/norskly-logo.webp.asset.json";
import {
  MessageCircle, Sparkles, BookOpen, Target, Mic, BarChart3,
  Check, X, ArrowRight, GraduationCap, Users, CalendarCheck,
  Stethoscope, Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { LANGUAGES as LANGUAGE_CONFIGS } from "@/lib/languages";
import { FAQ } from "@/lib/faqData";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { FloatingGreetings } from "@/components/FloatingGreetings";
import { FloatingQuestionMarks } from "@/components/FloatingQuestionMarks";
import PricingSection from "@/components/PricingSection";
import ecosystemCollageAsset from "@/assets/ecosystem-collage.webp.asset.json";
const ecosystemCollage = ecosystemCollageAsset.url;


const GOALS = [
  { icon: Stethoscope, title: "Jezik za zdravstvo", desc: "Za rad i komunikaciju u zdravstvenom okruženju." },
  { icon: Briefcase, title: "Jezik za posao i preseljenje", desc: "Za posao, svakodnevni život i pripremu za preseljenje." },
  { icon: GraduationCap, title: "Jezik za obrazovanje", desc: "Za studiranje, stručno obrazovanje i život tokom školovanja." },
];

const RELOCATION_COUNTRIES = [
  { flag: "🇳🇴", name: "Norveška", topics: "Posao · dokumenta · studije · život" },
  { flag: "🇩🇪", name: "Nemačka", topics: "Posao · Ausbildung · dokumenta · život" },
];

const FEATURES = [
  { icon: MessageCircle, title: "Praktična komunikacija", desc: "Vežbaj jezik kroz realistične svakodnevne i poslovne razgovore." },
  { icon: Target, title: "Vežbe prilagođene tebi", desc: "Vežbe i sadržaj prilagođavaju se tvom nivou, ciljevima i tempu učenja." },
  { icon: BookOpen, title: "Gramatika u kontekstu", desc: "Uči gramatiku kroz primere, dijaloge i stvarnu komunikaciju." },
  { icon: Sparkles, title: "Povratna informacija odmah", desc: "Dobij jasna objašnjenja, ispravke i predloge dok vežbaš." },
  { icon: Mic, title: "Vežbanje razgovora", desc: "Vežbaj razgovore koji te stvarno čekaju — na poslu, fakultetu, kod lekara ili u svakodnevnom životu." },
  { icon: BarChart3, title: "Praćenje napretka", desc: "Prati šta si savladao, na čemu još treba da radiš i kako napreduješ kroz vreme." },
  { icon: CalendarCheck, title: "Podrška profesora", desc: "Poveži se sa profesorima i zakaži časove kada želiš dodatnu podršku u učenju." },
];

const STUDENT_BENEFITS = [
  "Personalizovano učenje",
  "Razgovorna praksa kroz realne situacije",
  "Građenje vokabulara",
  "Jasna podrška u gramatici",
  "Praćenje napretka i grešaka",
  "Mogućnost dodatne podrške profesora jezika",
];
const TEACHER_BENEFITS = [
  "Upravljanje učenicima i grupama",
  "Uvid u napredak i tipične greške",
  "Organizacija časova i materijala",
  "Vežbe i sadržaj prilagođeni učenicima",
  "Pregled napretka učenika",
];

const FIT_YES = [
  "Planiraš posao ili preseljenje u Norvešku ili Nemačku",
  "Potreban ti je jezik za posao, zdravstvo ili studije",
  "Želiš da vežbaš realne situacije, a ne samo lekcije iz udžbenika",
  "Želiš da kombinuješ samostalno učenje i podršku profesora",
  "Želiš pouzdane informacije o narednim koracima za život u novoj zemlji",
];
const FIT_NO = [
  "Tražiš samo pasivno učenje",
  "Ne želiš redovnu praksu",
  "Želiš da učiš isključivo iz klasičnog udžbenika",
];

// Fine-tune the decorative FAQ quote card's responsive typography here.
// fontMin/fontMax use rem; fluid scales with viewport width (vw).
const QUOTE_CARD_TYPO = {
  fontMin: "2rem",       // smallest size (mobile)
  fontFluid: "5.5vw",    // grows with viewport width
  fontMax: "3.5rem",     // largest size (desktop)
  lineHeight: "1.05",    // tighter = more poster-like
  letterSpacing: "0.01em", // negative = condensed, positive = airy
};

export default function LandingPage() {
  const navigate = useNavigate();

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Helmet>
        <title>Norskly - Uči jezike na svoj način</title>
        <meta
          name="description"
          content="Uči norveški, engleski i nemački svojim tempom na Norskly platformi. Personalizovane vežbe, praktičan razgovor i podrška profesora kad ti zatreba."
        />
        <link rel="canonical" href="https://norskly.com/" />
        <meta property="og:title" content="Norskly - Uči jezike na svoj način" />
        <meta property="og:description" content="Uči norveški, engleski i nemački svojim tempom na Norskly platformi. Personalizovane vežbe, praktičan razgovor i podrška profesora kad ti zatreba." />
        <meta property="og:url" content="https://norskly.com/" />
        <meta name="twitter:title" content="Norskly - Uči jezike na svoj način" />
        <meta name="twitter:description" content="Uči norveški, engleski i nemački svojim tempom na Norskly platformi. Personalizovane vežbe, praktičan razgovor i podršku profesora kad ti zatreba." />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      {/* ============== NAV ============== */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/60">
        <div className="container flex items-center justify-between h-14 sm:h-16">
          <img src={norsklyLogo.url} alt="Norskly" width={370} height={144} fetchPriority="high" decoding="async" className="h-10 sm:h-12 w-auto select-none" draggable={false} />
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-foreground/80">
            <a href="#features" className="hover:text-primary transition-colors">Platforma</a>
            <a href="#teachers" className="hover:text-primary transition-colors">Za učenike</a>
            <a href="#teachers" className="hover:text-primary transition-colors">Za profesore</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Kako učiš</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => navigate("/auth")}>Prijava</Button>
            <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 px-3 sm:px-4 text-xs sm:text-sm" onClick={() => document.getElementById("languages")?.scrollIntoView({ behavior: "smooth" })}>
              Započni besplatno
            </Button>
          </div>
        </div>
      </nav>

      {/* ============== HERO ============== */}
      <section className="relative pt-24 pb-12 md:pt-40 md:pb-28">
        <div className="absolute inset-0 bg-grid-soft opacity-60 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <div className="absolute top-24 -right-20 w-56 h-56 md:w-96 md:h-96 rounded-full bg-secondary/60 blur-3xl opacity-70" />
        <div className="absolute bottom-0 -left-20 w-48 h-48 md:w-80 md:h-80 rounded-full bg-accent/40 blur-3xl opacity-60" />
        <FloatingGreetings />

        <div className="container relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto text-center"
          >
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-secondary/70 text-primary text-[10px] sm:text-xs font-semibold tracking-widest uppercase mb-5 sm:mb-6">
              Posao · Preseljenje · Zdravstvo · Studije
            </span>

            <h1 className="text-display text-[clamp(2.25rem,9vw,7rem)] text-primary mb-5 sm:mb-6">
              Uči jezik za život koji <span className="font-script text-primary/70">planiraš</span>.
            </h1>

            <p className="text-sm sm:text-base md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
              Pripremi se za posao, preseljenje ili studije u Norveškoj i Nemačkoj uz praktično učenje, personalizovane vežbe i podršku profesora.
            </p>

            {/* language pills — entry to per-language onboarding */}
            <p id="languages" className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3 scroll-mt-24">
              Izaberi jezik koji želiš da učiš
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
              {LANGUAGE_CONFIGS.map((l) => (
                <Link
                  key={l.slug}
                  to={`/jezici/${l.slug}`}
                  onClick={() => {
                    localStorage.setItem("norskly_selected_language", l.slug);
                    try { sessionStorage.setItem("norskly_language_intent", l.slug); } catch { /* ignore */ }
                  }}
                  className="group px-5 py-3 sm:px-7 sm:py-4 rounded-full text-sm sm:text-base md:text-lg font-semibold border bg-background text-foreground border-border hover:border-primary hover:bg-secondary/40 hover:-translate-y-0.5 hover:shadow-card-soft transition-all inline-flex items-center gap-2"
                >
                  <span className="text-lg sm:text-xl">{l.flag}</span>
                  <span>{l.label}</span>
                  <ArrowRight className="w-4 h-4 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                </Link>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ============== GOALS ============== */}
      <section id="ciljevi" className="pb-14 md:pb-24">
        <div className="container max-w-5xl">
          <div className="text-center mb-8 sm:mb-10 max-w-2xl mx-auto">
            <h2 className="text-display text-[clamp(1.75rem,4.5vw,3.25rem)] text-primary mb-3">
              Uči prema svom <span className="font-script text-primary/70">cilju</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Nije svima jezik potreban iz istog razloga. Izaberi putanju koja odgovara onome što želiš da postigneš.
            </p>
          </div>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {GOALS.map((g, i) => (
              <motion.div
                key={g.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                className={`${i === 1 ? "bg-secondary/50" : "bg-card"} group h-full rounded-3xl border border-border p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-card-soft`}
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-background border border-border transition-colors group-hover:bg-primary">
                  <g.icon className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl font-bold text-primary mb-1.5">{g.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ============== FEATURES ============== */}
      <section id="features" className="py-14 md:py-28 bg-card/60">
        <div className="container">
          <div className="max-w-3xl mb-10 sm:mb-16">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Funkcionalnosti</p>
            <h2 className="text-display text-[clamp(1.75rem,5vw,4rem)] text-primary">
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
                className="group h-full flex flex-col bg-background border border-border rounded-3xl p-5 sm:p-8 transition-all duration-300 hover:border-primary/30 hover:shadow-soft hover:bg-card/40 [&:last-child]:sm:col-span-2 [&:last-child]:lg:col-span-3"
              >
                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-secondary flex items-center justify-center mb-4 sm:mb-5 transition-all duration-300 group-hover:bg-primary group-hover:scale-110 group-hover:rotate-[-4deg]">
                  <f.icon className="w-5 h-5 text-primary transition-colors duration-300 group-hover:text-primary-foreground" />
                </div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-primary mb-2 transition-colors duration-300 group-hover:text-primary/90">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                <span className="mt-4 h-px w-0 bg-gradient-to-r from-primary/40 to-transparent transition-all duration-500 group-hover:w-2/3" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============== MARQUEE ============== */}
      <section className="py-4 sm:py-6 bg-primary text-primary-foreground overflow-hidden border-y border-primary/20">
        <div className="flex whitespace-nowrap animate-marquee">
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="flex items-center gap-6 sm:gap-10 px-4 sm:px-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="text-display text-2xl md:text-4xl">
                  Započni danas <span className="font-script mx-2 sm:mx-3 opacity-70">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ============== STUDENTS vs TEACHERS ============== */}
      <section id="teachers" className="relative py-14 md:py-28 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-center bg-cover [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_85%)]"
          style={{ backgroundImage: `url(${ecosystemCollage})`, opacity: 0.45, filter: "blur(3px) saturate(0.8)" }}
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/85 md:from-background/60 md:via-background/40 md:to-background/70 md:opacity-20" />
        <div className="container relative z-10">
          <div className="text-center mb-10 sm:mb-16 max-w-2xl mx-auto">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Jedna platforma, dva načina učenja</p>
            <h2 className="text-display text-[clamp(1.75rem,5vw,4rem)] text-primary">
              Za učenike <span className="font-script text-primary/70">i</span> profesore.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-3xl p-6 sm:p-10 border border-border relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70">Za učenike</span>
              </div>
              <h3 className="text-display text-3xl md:text-4xl text-primary mb-5 sm:mb-6">Učenje prilagođeno tvom cilju — poslu, studijama ili <span className="font-script text-primary/70">preseljenju</span>.</h3>
              <ul className="space-y-3 mb-7 sm:mb-8">
                {STUDENT_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm sm:text-base text-foreground/80">
                    <Check className="w-4 h-4 text-primary shrink-0" /> {b}
                  </li>
                ))}
              </ul>
              <Button onClick={() => document.getElementById("languages")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full bg-primary hover:bg-primary/90">
                Počni sa učenjem <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-secondary rounded-3xl p-6 sm:p-10 border border-border relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70">Za profesore</span>
              </div>
              <h3 className="text-display text-3xl md:text-4xl text-primary mb-5 sm:mb-6">Više vremena za predavanje. Manje za <span className="font-script text-primary/70">organizaciju</span>.</h3>
              <ul className="space-y-3 mb-7 sm:mb-8">
                {TEACHER_BENEFITS.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm sm:text-base text-foreground/80">
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
      <section className="py-14 md:py-28 bg-card/60">
        <div className="container max-w-5xl">
          <div className="text-center mb-10 sm:mb-12">
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Izaberi svoju ulogu</p>
            <h2 className="text-display text-[clamp(1.75rem,5vw,4rem)] text-primary">
              Kako želiš <span className="font-script text-primary/70">da</span> koristiš Norskly?
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
            {[
              { label: "Učenik", desc: "Uči, vežbaj i pripremi se za svoj cilj.", role: "student", bg: "bg-background" },
              { label: "Profesor", desc: "Predaj, organizuj i prati učenike.", role: "teacher", bg: "bg-secondary" },
            ].map((r) => (
              <button key={r.role} onClick={() => navigate(`/auth?role=${r.role}`)}
                className={`${r.bg} group rounded-3xl p-6 sm:p-10 text-left border border-border hover:-translate-y-1 hover:shadow-soft transition-all`}
              >
                <h3 className="text-display text-4xl sm:text-5xl text-primary mb-2 sm:mb-3">{r.label}</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6">{r.desc}</p>
                <span className="inline-flex items-center gap-2 text-primary font-semibold">
                  Izaberi <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ============== IS IT RIGHT FOR ME ============== */}
      <section className="relative overflow-hidden py-14 md:py-28">
        <FloatingQuestionMarks />
        <div className="container max-w-5xl relative z-10">
          <div className="text-center mb-10 sm:mb-12">
            <h2 className="text-display text-[clamp(1.75rem,5vw,4rem)] text-primary">
              Da li je Norskly <span className="font-script text-primary/70">pravi</span> za tebe?
            </h2>
          </div>
          <div className="grid md:grid-cols-5 gap-4 sm:gap-5 md:items-start">
            <div className="md:col-span-3 bg-card rounded-3xl p-6 md:p-8 border-2 border-primary/20 shadow-card-soft">
              <h3 className="text-[11px] sm:text-xs font-sans font-semibold uppercase tracking-widest text-primary mb-4">Norskly je za tebe ako:</h3>
              <ul className="space-y-3 sm:space-y-4">
                {FIT_YES.map((t) => (
                  <li key={t} className="flex gap-3 text-sm sm:text-base text-foreground/85">
                    <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 bg-secondary/60 rounded-3xl p-6 md:p-8 border border-border">
              <h3 className="text-[11px] sm:text-xs font-sans font-semibold uppercase tracking-widest text-primary/80 mb-4">Možda nije za tebe ako:</h3>
              <ul className="space-y-3 sm:space-y-4">
                {FIT_NO.map((t) => (
                  <li key={t} className="flex gap-3 text-sm sm:text-base text-foreground/85">
                    <X className="w-5 h-5 text-primary shrink-0 mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <PricingSection
        className="bg-card/60 md:py-28"
        onFreeSelect={() => {
          localStorage.setItem("norskly_selected_plan", "trial");
          document.getElementById("languages")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onPaidSelect={() => {
          localStorage.setItem("norskly_selected_plan", "subscription");
          document.getElementById("languages")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        onTeacherSelect={() => document.getElementById("languages")?.scrollIntoView({ behavior: "smooth", block: "start" })}
      />

      {/* ============== FAQ ============== */}
      <section id="faq" className="py-14 md:py-28">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            <div>
              <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">FAQ</p>
              <h2 className="text-display text-[clamp(1.75rem,5vw,4rem)] text-primary mb-5 sm:mb-6">
                Pitanja? <span className="font-script text-primary/70">Odgovori.</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-8">
                Sve što treba da znaš pre nego što kreneš.
              </p>
              <div className="relative rounded-3xl overflow-hidden bg-secondary aspect-[4/3] sm:aspect-square max-w-md border border-border">
                <div className="absolute inset-0 p-6 sm:p-8 md:p-10 flex items-center">
                  <p
                    className="font-marker uppercase text-primary/70"
                    style={{
                      fontSize: `clamp(${QUOTE_CARD_TYPO.fontMin}, ${QUOTE_CARD_TYPO.fontFluid}, ${QUOTE_CARD_TYPO.fontMax})`,
                      lineHeight: QUOTE_CARD_TYPO.lineHeight,
                      letterSpacing: QUOTE_CARD_TYPO.letterSpacing,
                    }}
                  >
                    Confidence comes with practice. <span className="text-primary/80">♥</span>
                  </p>
                </div>
              </div>
            </div>
            <div>
              <Accordion type="single" collapsible className="bg-card rounded-3xl p-2 border border-border">
                {FAQ.map((item, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-border last:border-0 px-3 sm:px-4">
                    <AccordionTrigger className="text-left font-display text-base sm:text-lg text-primary hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed">
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
      <section className="py-14 md:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl md:rounded-[2.5rem] bg-primary text-primary-foreground p-8 sm:p-10 md:p-20 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-dots-soft opacity-20" />
            <div className="relative">
              <h2 className="text-display text-[clamp(1.8rem,6vw,5rem)] mb-5 sm:mb-6">
                Spreman <span className="font-script opacity-80">da</span> progovoriš?
              </h2>
              <p className="opacity-80 max-w-md mx-auto mb-7 sm:mb-8 text-sm sm:text-base">
                Kreiraj profil za 2 minuta i počni da učiš na način koji odgovara tebi.
              </p>
              <Button size="lg" onClick={() => document.getElementById("languages")?.scrollIntoView({ behavior: "smooth" })}
                className="rounded-full h-12 sm:h-14 px-7 sm:px-10 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                Započni besplatno <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============== FOOTER ============== */}
      <footer className="border-t border-border/60 py-8 md:py-10">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 text-xs sm:text-sm text-muted-foreground text-center md:text-left">
          <img src={norsklyLogo.url} alt="Norskly" width={370} height={144} loading="lazy" decoding="async" className="h-12 w-auto select-none" draggable={false} />
          <p>© 2026 Norskly. Sva prava zadržana.</p>
        </div>
      </footer>
    </div>
  );
}
