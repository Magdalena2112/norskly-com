import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Calendar, GraduationCap, Shield, ArrowRight } from "lucide-react";
import BackButton from "@/components/BackButton";

export default function BookingSuccessPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["booking-success", lessonId],
    queryFn: async () => {
      const { data: lesson, error } = await supabase
        .from("lessons")
        .select("*, teachers(name, photo_url), lesson_types(title, duration_minutes, price_cents, currency)")
        .eq("id", lessonId!)
        .maybeSingle();
      if (error) throw error;
      return lesson;
    },
    enabled: !!lessonId,
  });

  return (
    <div className="min-h-screen bg-aurora">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/my-lessons" />
          <span className="font-display font-bold text-lg text-primary-foreground">Potvrda rezervacije</span>
        </div>
      </header>

      <div className="container max-w-lg py-12">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="bg-background/90 backdrop-blur-sm border-border/30 shadow-nordic rounded-3xl">
            <CardContent className="pt-10 pb-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="w-20 h-20 rounded-full bg-accent/15 flex items-center justify-center mx-auto"
              >
                <CheckCircle className="w-10 h-10 text-accent" />
              </motion.div>

              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Čas je zakazan!</h1>
                <p className="text-muted-foreground mt-1">Vidimo se uskoro 🎉</p>
              </div>

              {isLoading || !data ? (
                <div className="h-32 bg-muted/40 rounded-2xl animate-pulse" />
              ) : (
                <div className="bg-muted/40 rounded-2xl p-5 text-left space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Nastavnik:</span>
                    <span className="font-semibold text-foreground ml-auto">{data.teachers?.name}</span>
                  </div>
                  {data.lesson_types && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-4 h-4 shrink-0" />
                      <span className="text-muted-foreground">Tip časa:</span>
                      <span className="font-semibold text-foreground ml-auto">{data.lesson_types.title}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-muted-foreground">Datum:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {format(new Date(data.start_time), "dd.MM.yyyy")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="w-4 h-4 shrink-0" />
                    <span className="text-muted-foreground">Vreme:</span>
                    <span className="font-semibold text-foreground ml-auto">
                      {format(new Date(data.start_time), "HH:mm")} – {format(new Date(data.end_time), "HH:mm")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-border/40">
                    <Shield className={`w-4 h-4 shrink-0 ${data.share_analytics ? "text-accent" : "text-muted-foreground"}`} />
                    <span className="text-muted-foreground">Analitika:</span>
                    <span className={`font-semibold ml-auto ${data.share_analytics ? "text-accent" : "text-muted-foreground"}`}>
                      {data.share_analytics ? "Deljena ✓" : "Privatna 🔒"}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <Button size="lg" onClick={() => navigate("/my-lessons")}>
                  Moji časovi <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/practice")}>
                  Počni vežbu
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
