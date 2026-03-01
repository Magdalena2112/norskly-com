import { motion } from "framer-motion";
import { useProfile } from "@/context/ProfileContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, BookOpen, MessageSquare, Brain, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const levelProgress: Record<string, number> = {
  A1: 10,
  A2: 30,
  B1: 50,
  B2: 70,
  C1: 90,
};

export default function ProgressPage() {
  const { profile } = useProfile();
  const navigate = useNavigate();

  const stats = [
    { label: "Nivo", value: profile.level, icon: TrendingUp, color: "text-accent" },
    { label: "Cilj učenja", value: profile.learning_goal, icon: Brain, color: "text-primary" },
    { label: "Fokus", value: profile.focus_area, icon: BookOpen, color: "text-accent" },
    { label: "Samopouzdanje", value: `${profile.confidence_level}/5`, icon: MessageSquare, color: "text-primary" },
  ];

  const milestones = [
    { level: "A1", label: "Početnik", desc: "Osnovni pozdravi i fraze" },
    { level: "A2", label: "Elementarni", desc: "Svakodnevne situacije" },
    { level: "B1", label: "Srednji", desc: "Samostalna komunikacija" },
    { level: "B2", label: "Viši srednji", desc: "Složene teme" },
    { level: "C1", label: "Napredni", desc: "Tečna komunikacija" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-display font-bold text-lg text-foreground">Moj napredak</span>
        </div>
      </header>

      <div className="flex-1 container max-w-2xl py-8 space-y-8">
        {/* Overall progress */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-nordic">
            <CardHeader>
              <CardTitle className="text-lg">Ukupni napredak</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>A1</span>
                <span>C1</span>
              </div>
              <Progress value={levelProgress[profile.level] || 10} className="h-3" />
              <p className="text-sm text-muted-foreground text-center">
                Trenutni nivo: <span className="font-semibold text-accent">{profile.level}</span>
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="pt-5 pb-5 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="font-semibold text-foreground capitalize text-sm">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="shadow-nordic">
            <CardHeader>
              <CardTitle className="text-lg">Miljokazi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((m) => {
                  const reached = milestones.findIndex((x) => x.level === profile.level) >= milestones.findIndex((x) => x.level === m.level);
                  return (
                    <div key={m.level} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${reached ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                        {m.level}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${reached ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.desc}</p>
                      </div>
                      {reached && <span className="text-accent text-xs">✓</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tips */}
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="pt-5 pb-5">
            <p className="text-sm text-foreground font-medium mb-1">💡 Savet za {profile.level}</p>
            <p className="text-sm text-muted-foreground">
              {profile.level === "A1" && "Fokusiraj se na učenje najčešćih 100 reči. One pokrivaju ~50% svakodnevnog govora!"}
              {profile.level === "A2" && "Počni da čitaš kratke norveške tekstove i pokušaj da prepoznaješ obrasce."}
              {profile.level === "B1" && "Gledaj norveške serije sa titlovima. NRK ima odličan besplatan sadržaj!"}
              {profile.level === "B2" && "Počni da pišeš kraće tekstove na norveškom — blogove, dnevnike, mejlove."}
              {profile.level === "C1" && "Uključi se u norveške diskusione grupe i forume za autentičnu praksu."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
