import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Target, Sparkles, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
{
  icon: MessageCircle,
  title: "Realne situacije",
  desc: "Vežbaj norveški kroz svakodnevne situacije – od neformalnih razgovora do poslovne komunikacije."
},
{
  icon: Target,
  title: "Personalizovano učenje",
  desc: "AI prilagođava lekcije tvom nivou, ciljevima i tempu učenja."
},
{
  icon: BookOpen,
  title: "Gramatika u kontekstu",
  desc: "Uči gramatiku kroz primere i realne rečenice, ne samo kroz pravila."
},
{
  icon: Sparkles,
  title: "Trenutni feedback",
  desc: "Dobij ispravke i objašnjenja u realnom vremenu dok vežbaš norveški."
},
{
  icon: GraduationCap,
  title: "Individualni časovi",
  desc: "Rezerviši individualni čas sa profesorom norveškog jezika i vežbaj konverzaciju uz personalizovan feedback."
}];


const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } }
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      {/* Full-page background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})`, backgroundAttachment: 'fixed' }}
      >
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <span className="text-xl font-display font-bold text-foreground tracking-tight">
            Norskly
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
              Prijava
            </Button>
            <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>
              Započni besplatno
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="min-h-[90vh] flex items-center">
        <div className="container relative z-10 pt-24">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl">
            
            <p className="text-accent font-semibold tracking-wide uppercase text-sm mb-4">
              Adaptivno učenje norveškog
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight mb-6 text-foreground">
              Govori norveški
              <span className="text-gradient-nordic block"> sa samopouzdanjem</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Din vei til flytende norsk starter her
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
                Započni besplatno
              </Button>
              <Button variant="hero-outline" size="xl" onClick={() => navigate("/auth")}>
                Saznaj više
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gradient transition: Hero → Features */}
      <div className="h-32 bg-gradient-to-b from-transparent via-background/30 to-background/70" />

      {/* Features */}
      <section className="pb-24 bg-background/60 backdrop-blur-sm">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Zašto učiti norveški uz Norskly?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Platforma koja ti pomaže da brže i sigurnije progovoriš norveški.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            
            {features.map((f) =>
            <motion.div
              key={f.title}
              variants={item}
              className="bg-background/80 backdrop-blur-sm rounded-xl p-6 shadow-nordic hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border border-border/30">
              
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-sans">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-14">
            <p className="text-muted-foreground mb-5">Počni da učiš norveški već danas.</p>
            <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
              Započni besplatno
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Gradient transition: Features → CTA */}
      <div className="h-32 bg-gradient-to-b from-background/70 via-background/30 to-transparent" />

      {/* CTA */}
      <section className="pb-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-nordic-gradient rounded-2xl p-12 md:p-16 text-center">
            
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4">
              Klar til å lære norsk?
            </h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">
              Kreiraj profil za 2 minuta i počni da učiš na način koji odgovara tvom tempu.
            </p>
            <Button
              variant="hero"
              size="xl"
              onClick={() => navigate("/auth")}>
              
              Kreiraj profil
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Gradient transition: CTA → Footer */}
      <div className="h-20 bg-gradient-to-b from-transparent via-background/40 to-background/70" />

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 bg-background/60 backdrop-blur-sm">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">Norskly</span>
          <p>© 2026 Norskly. Sva prava zadržana.</p>
        </div>
      </footer>
    </div>);

}
