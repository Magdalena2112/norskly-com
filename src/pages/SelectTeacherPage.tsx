import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import BackButton from "@/components/BackButton";
import { Star, Languages, GraduationCap, Sparkles } from "lucide-react";
import teacherPhotoFallback from "@/assets/teacher-photo.jpg";

type Teacher = {
  id: string;
  name: string;
  bio: string;
  photo_url: string | null;
  spoken_languages: string[];
  focus: string[];
  rating: number;
  students_count: number;
  is_verified: boolean;
};

type PriceInfo = { min: number; currency: string } | null;

export default function SelectTeacherPage() {
  const navigate = useNavigate();

  const { data: teachers = [], isLoading } = useQuery({
    queryKey: ["teachers-list"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_teachers");
      if (error) throw error;
      return (data || []) as Teacher[];
    },
  });

  const { data: prices = {} } = useQuery({
    queryKey: ["teachers-min-prices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_types")
        .select("teacher_id,price_cents,currency")
        .eq("is_active", true);
      if (error) throw error;
      const map: Record<string, PriceInfo> = {};
      for (const lt of data || []) {
        const current = map[lt.teacher_id];
        if (!current || lt.price_cents < current.min) {
          map[lt.teacher_id] = { min: lt.price_cents, currency: lt.currency };
        }
      }
      return map;
    },
  });

  return (
    <div className="min-h-screen bg-aurora">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/practice" />
          <span className="font-display font-bold text-lg text-primary-foreground">Izaberi nastavnika</span>
        </div>
      </header>

      <div className="container max-w-5xl py-8 sm:py-12 space-y-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-xs font-semibold text-accent">
            <Sparkles className="w-3.5 h-3.5" /> AI + ljudska podrška
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-primary-foreground">
            Odaberi svog nastavnika
          </h1>
          <p className="text-primary-foreground/80 max-w-xl mx-auto">
            Verifikovani profesori norveškog jezika. Izaberi tip časa, termin i odluči da li želiš da deliš svoj napredak za personalizovanije vođenje.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 gap-5">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-72 rounded-3xl" />
            ))}
          </div>
        ) : teachers.length === 0 ? (
          <Card className="bg-background/80 backdrop-blur-sm border-border/30">
            <CardContent className="py-12 text-center text-muted-foreground">
              Trenutno nema dostupnih nastavnika.
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {teachers.map((t, i) => {
              const initials = t.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
              const price = prices[t.id];
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Card className="overflow-hidden bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl hover:shadow-nordic transition-shadow h-full flex flex-col">
                    <div className="h-20 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />
                    <CardContent className="relative pt-0 pb-5 flex-1 flex flex-col">
                      <div className="flex items-start gap-4 -mt-10">
                        <Avatar className="w-20 h-20 border-4 border-background shadow-lg shrink-0">
                          <AvatarImage src={t.photo_url || teacherPhotoFallback} alt={t.name} />
                          <AvatarFallback className="text-xl font-bold bg-primary text-primary-foreground">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="pt-11 min-w-0">
                          <h3 className="font-display font-bold text-lg text-foreground truncate">
                            {t.name}
                            {t.is_verified && <span className="ml-1 text-accent">✓</span>}
                          </h3>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                              {t.rating}
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="w-3.5 h-3.5" />
                              {t.students_count}+ studenata
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="mt-4 text-sm text-muted-foreground line-clamp-3">{t.bio || "Iskusan nastavnik norveškog jezika."}</p>

                      {t.spoken_languages?.length > 0 && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Languages className="w-3.5 h-3.5" />
                          <span className="truncate">{t.spoken_languages.join(" · ")}</span>
                        </div>
                      )}

                      {t.focus?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {t.focus.slice(0, 3).map((f) => (
                            <Badge key={f} variant="secondary" className="font-normal text-xs">
                              {f}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="mt-auto pt-5 flex items-center justify-between gap-3">
                        {price && (
                          <span className="text-sm text-foreground">
                            <span className="text-muted-foreground text-xs">od </span>
                            <span className="font-bold">{Math.round(price.min / 100)}</span>{" "}
                            <span className="text-muted-foreground text-xs">{price.currency}</span>
                          </span>
                        )}
                        <Button
                          onClick={() => navigate(`/book-lesson/${t.id}`)}
                          className="ml-auto"
                        >
                          Pogledaj profil
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
