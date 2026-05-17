import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, Check, GraduationCap, Users, BookOpen, Sparkles,
  ShieldCheck, FileText, Video, Award, LayoutDashboard, Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { z } from "zod";

const STEPS = [
  { icon: GraduationCap, title: "Registruj se na platformi", desc: "Kreiraj nalog i započni proces prijave za predavanje." },
  { icon: FileText, title: "Pošalji svoj CV", desc: "Priloži profesionalni CV i kratak opis svog iskustva." },
  { icon: Video, title: "Zakazujemo video poziv", desc: "U roku od 5 radnih dana zakazujemo kratak razgovor sa administratorima." },
  { icon: ShieldCheck, title: "Verifikacija i odobrenje", desc: "Nakon provere dobijaš verifikovan pristup kao profesor." },
  { icon: LayoutDashboard, title: "Počinješ da predaješ", desc: "Koristi profesorske alate i organizuj nastavu preko platforme." },
];

const FORMATS = [
  { icon: Users, title: "Individualni časovi", desc: "Za rad jedan na jedan sa učenicima uz personalizovan pristup." },
  { icon: GraduationCap, title: "Grupni časovi", desc: "Za manje grupe učenika koje uče isti jezik ili nivo." },
  { icon: BookOpen, title: "Kursevi jezika", desc: "Kreiraj kompletne kurseve sa definisanim nivoom, trajanjem i cenom." },
];

const TEACHER_PERKS = [
  "Profil profesora na platformi",
  "Mogućnost rada sa učenicima",
  "Organizacija časova i materijala",
  "AI-generisane vežbe i sadržaj",
  "Upravljanje studentima i grupama",
  "Uvid u napredak učenika",
  "Administratorski pristup profesorskim alatima",
  "Kreiranje kurseva i časova",
  "Samostalno određivanje cena",
];

const applicationSchema = z.object({
  full_name: z.string().trim().min(2, "Unesite ime i prezime").max(120),
  email: z.string().trim().email("Neispravna email adresa").max(255),
  languages: z.string().trim().min(2, "Navedite jezike koje predajete").max(200),
  bio: z.string().trim().min(20, "Biografija mora imati bar 20 karaktera").max(2000),
});

export default function ForTeachersPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", languages: "", bio: "" });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const scrollToForm = () => {
    document.getElementById("prijava")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = applicationSchema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Proveri unos", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    if (cvFile && cvFile.size > 10 * 1024 * 1024) {
      toast({ title: "CV je prevelik", description: "Maksimalna veličina je 10 MB.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      let cv_path: string | null = null;
      if (cvFile) {
        const ext = cvFile.name.split(".").pop() || "pdf";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("teacher-cvs")
          .upload(path, cvFile, { contentType: cvFile.type || "application/pdf" });
        if (upErr) throw upErr;
        cv_path = path;
      }

      const { error } = await supabase
        .from("teacher_applications")
        .insert([{ ...parsed.data, cv_path }]);
      if (error) throw error;

      setSubmitted(true);
      setForm({ full_name: "", email: "", languages: "", bio: "" });
      setCvFile(null);
      toast({ title: "Prijava poslata", description: "Hvala! Javljamo se u roku od 5 radnih dana." });
    } catch (err: any) {
      toast({ title: "Greška pri slanju", description: err.message ?? "Pokušajte ponovo.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-secondary/60 via-background to-background" />
        <div className="absolute -top-32 -right-32 w-[36rem] h-[36rem] rounded-full bg-primary/10 blur-3xl -z-10" />
        <div className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl -z-10" />

        <div className="container max-w-5xl py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center"
          >
            <button
              onClick={() => navigate("/")}
              className="text-xs font-semibold uppercase tracking-widest text-primary/70 hover:text-primary transition-colors mb-6"
            >
              ← Norskly za profesore
            </button>
            <h1 className="text-display text-[clamp(2.25rem,6vw,5rem)] leading-[1.05] text-primary">
              Postani predavač na <span className="font-script text-primary/80">Norskly</span> platformi.
            </h1>
            <p className="mt-6 text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto leading-relaxed">
              Pridruži se platformi koja povezuje profesore jezika sa učenicima i pruža moderne AI alate
              za organizaciju nastave, praćenje napretka i kreiranje vežbi.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={scrollToForm}
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-7 text-base"
              >
                Apliciraj za predavanje <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <div className="inline-flex items-center gap-2 text-xs text-foreground/60">
                <ShieldCheck className="w-4 h-4 text-primary/70" />
                Manuelna verifikacija od strane administratora
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 md:py-28">
        <div className="container max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Proces prijave</p>
            <h2 className="text-display text-[clamp(2rem,5vw,3.5rem)] text-primary">Kako funkcioniše prijava?</h2>
            <p className="mt-4 text-foreground/70 max-w-2xl mx-auto">
              Svaki profesor prolazi kroz proces verifikacije. Pristup profesorskim alatima dobijaš tek nakon odobrenja administratora.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                className="group relative rounded-3xl border border-border/60 bg-card/40 hover:bg-card/60 hover:border-primary/30 transition-all duration-300 p-6"
              >
                <div className="absolute -top-3 left-6 text-xs font-semibold tracking-widest text-primary/60 bg-background px-2">
                  KORAK {i + 1}
                </div>
                <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-[-4deg] transition-transform duration-300">
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-primary mb-1.5">{s.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* OFFER FORMATS */}
      <section className="py-20 md:py-28 bg-card/40 border-y border-border/50">
        <div className="container max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Tvoja ponuda</p>
            <h2 className="text-display text-[clamp(2rem,5vw,3.5rem)] text-primary">
              Kreiraj svoju <span className="font-script text-primary/80">ponudu predavanja</span>.
            </h2>
            <p className="mt-4 text-foreground/70 max-w-2xl mx-auto">
              Na Norskly platformi profesori samostalno definišu cenu časova i biraju format rada koji im najviše odgovara —
              individualne časove, grupne časove ili kompletne kurseve jezika.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {FORMATS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="group rounded-3xl bg-background border border-border/60 p-8 hover:-translate-y-1 hover:shadow-soft hover:border-primary/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{f.desc}</p>
                <div className="mt-5 h-px w-0 group-hover:w-2/3 bg-gradient-to-r from-primary/40 to-transparent transition-all duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TEACHER PERKS */}
      <section className="py-20 md:py-28">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Tvoji alati</p>
            <h2 className="text-display text-[clamp(2rem,5vw,3.5rem)] text-primary">Šta dobijaš kao profesor?</h2>
          </div>

          <div className="rounded-3xl bg-secondary/60 border border-border/60 p-8 md:p-12">
            <ul className="grid gap-x-10 gap-y-4 md:grid-cols-2">
              {TEACHER_PERKS.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  className="flex items-start gap-3 text-foreground/85"
                >
                  <span className="mt-1 w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{p}</span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="prijava" className="py-20 md:py-28 bg-card/40 border-y border-border/50">
        <div className="container max-w-2xl">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-3">Prijava</p>
            <h2 className="text-display text-[clamp(2rem,5vw,3.5rem)] text-primary">Prijavi se za predavanje</h2>
            <p className="mt-4 text-foreground/70">
              Popuni formu — administratori će pregledati tvoju prijavu i javiti se u roku od 5 radnih dana.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-3xl bg-background border border-primary/30 p-10 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-semibold text-primary mb-2">Prijava je uspešno poslata</h3>
              <p className="text-foreground/70">
                Hvala što želiš da budeš deo Norskly zajednice. Naš tim će pregledati tvoju aplikaciju i kontaktirati te uskoro.
              </p>
              <Button
                onClick={() => navigate("/")}
                variant="outline"
                className="mt-6 rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Nazad na početnu
              </Button>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-background border border-border/60 p-6 md:p-10 space-y-5 shadow-sm"
            >
              <div className="space-y-2">
                <Label htmlFor="full_name">Ime i prezime</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Ana Anić"
                  required
                  maxLength={120}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="ana@email.com"
                  required
                  maxLength={255}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="languages">Jezici koje predaješ</Label>
                <Input
                  id="languages"
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="Norveški, Engleski"
                  required
                  maxLength={200}
                  className="rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Kratka biografija</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Iskustvo, obrazovanje, pristup u radu..."
                  required
                  maxLength={2000}
                  rows={5}
                  className="rounded-xl resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cv">CV (PDF, DOC, DOCX — do 10MB)</Label>
                <label
                  htmlFor="cv"
                  className="flex items-center gap-3 rounded-xl border border-dashed border-border/80 hover:border-primary/50 transition-colors px-4 py-4 cursor-pointer bg-card/30"
                >
                  <Upload className="w-4 h-4 text-primary/70" />
                  <span className="text-sm text-foreground/75 truncate">
                    {cvFile ? cvFile.name : "Klikni da izabereš fajl"}
                  </span>
                </label>
                <input
                  id="cv"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf"
                  className="hidden"
                  onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
              >
                {submitting ? "Slanje..." : (<>Pošalji prijavu <ArrowRight className="ml-1 h-4 w-4" /></>)}
              </Button>
              <p className="text-xs text-foreground/55 text-center">
                Slanjem prijave ne dobijaš automatski pristup. Verifikaciju vrše administratori platforme.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl text-center">
          <Sparkles className="w-6 h-6 text-primary/70 mx-auto mb-5" />
          <h2 className="text-display text-[clamp(2rem,5vw,4rem)] text-primary leading-tight">
            Počni da predaješ <span className="font-script text-primary/80">uz Norskly</span>.
          </h2>
          <p className="mt-5 text-lg text-foreground/70 max-w-2xl mx-auto">
            Kombinuj svoje znanje jezika sa modernim AI alatima i organizuj nastavu na jednostavniji način.
          </p>
          <Button
            onClick={scrollToForm}
            className="mt-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base"
          >
            Apliciraj odmah <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
