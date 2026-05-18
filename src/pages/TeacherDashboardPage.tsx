import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import BackButton from "@/components/BackButton";
import { Calendar, Users, Shield, ArrowRight, Sparkles } from "lucide-react";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: teacher } = useQuery({
    queryKey: ["teacher-self", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("teachers")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: lessons = [] } = useQuery({
    queryKey: ["teacher-lessons", teacher?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("lessons")
        .select("*, profiles:user_id(display_name)")
        .eq("teacher_id", teacher!.id)
        .order("start_time", { ascending: true });
      return data || [];
    },
    enabled: !!teacher,
  });

  const { data: consents = [] } = useQuery({
    queryKey: ["teacher-consents", teacher?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_teacher_consents")
        .select("*")
        .eq("teacher_id", teacher!.id);
      return data || [];
    },
    enabled: !!teacher,
  });

  const upcoming = lessons.filter((l: any) => l.status === "scheduled" && new Date(l.start_time) >= new Date());
  const consented = consents.filter((c: any) => c.consent_granted);

  return (
    <div className="min-h-screen bg-aurora">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/practice" />
          <span className="font-display font-bold text-lg text-primary-foreground">Profesorski dashboard</span>
        </div>
      </header>

      <div className="container max-w-4xl py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardContent className="py-6 flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={teacher?.photo_url || undefined} alt={teacher?.name} />
                <AvatarFallback>{(teacher?.name || "?").slice(0, 2)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-display font-bold text-foreground">Zdravo, {teacher?.name?.split(" ")[0]}</h1>
                <p className="text-sm text-muted-foreground">Pregled tvojih časova i učenika.</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-3">
          <StatCard icon={Calendar} label="Predstojeći časovi" value={upcoming.length} />
          <StatCard icon={Users} label="Učenika ukupno" value={consents.length} />
          <StatCard icon={Sparkles} label="Sa analitikom" value={consented.length} />
        </div>

        <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
          <CardContent className="py-6 space-y-3">
            <h2 className="font-display font-bold text-lg text-foreground">Predstojeći časovi</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema zakazanih časova.</p>
            ) : (
              upcoming.slice(0, 5).map((l: any) => {
                const consent = consents.find((c: any) => c.student_id === l.user_id && c.consent_granted);
                return (
                  <div
                    key={l.id}
                    onClick={() => navigate(`/teacher/students/${l.user_id}`)}
                    className="flex items-center justify-between rounded-2xl border border-border/40 p-3 hover:border-accent/40 cursor-pointer transition"
                  >
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {l.profiles?.display_name || "Učenik"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(l.start_time), "dd.MM.yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={consent ? "default" : "secondary"} className="text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        {consent ? "Analitika" : "Privatna"}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
          <CardContent className="py-6">
            <div
              onClick={() => navigate("/teacher/students")}
              className="flex items-center justify-between cursor-pointer hover:opacity-80"
            >
              <div>
                <h2 className="font-display font-bold text-lg text-foreground">Svi učenici</h2>
                <p className="text-sm text-muted-foreground">Pregled učenika i njihovih saglasnosti.</p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: number }) {
  return (
    <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-2xl">
      <CardContent className="py-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <div className="text-2xl font-bold text-foreground leading-none">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
