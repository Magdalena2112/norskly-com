import { motion } from "framer-motion";
import { BookOpen, MessageCircle, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
{
  icon: MessageCircle,
  title: "Realne situacije",
  desc: "Vežbaj norveški kroz svakodnevne razgovore — od kafića do poslovnih mejlova."
},
{
  icon: Target,
  title: "Personalizovano učenje",
  desc: "AI se prilagođava tvom nivou, ciljevima i stilu komunikacije."
},
{
  icon: BookOpen,
  title: "Gramatika u kontekstu",
  desc: "Nauči gramatiku kroz primere, ne pravila. Svaka lekcija je primenljiva."
},
{
  icon: Sparkles,
  title: "Trenutni feedback",
  desc: "Dobij ispravke i predloge u realnom vremenu sa detaljnim objašnjenjima."
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
    <div className="min-h-screen bg-background">
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
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/40" />
        </div>

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
              <span className="text-gradient-nordic block"> sa samopouzdanjem

</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mb-8 leading-relaxed">
              Norskly ti pomaže da savladaš norveški kroz realne situacije, personalizovan
              AI feedback i praktične lekcije prilagođene tvom nivou.
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

      {/* Features */}
      <section className="py-24 bg-nordic-warm">
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16">
            
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
              Zašto Norskly?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Platforma dizajnirana da te osposobi za stvarnu komunikaciju na norveškom jeziku.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {features.map((f) =>
            <motion.div
              key={f.title}
              variants={item}
              className="bg-background rounded-xl p-6 shadow-nordic hover:shadow-lg transition-shadow">
              
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <f.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-2 font-sans">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
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

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <span className="font-display font-bold text-foreground">Norskly</span>
          <p>© 2026 Norskly. Sva prava zadržana.</p>
        </div>
      </footer>
    </div>);

}