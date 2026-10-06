import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import LanguageFilter, { LangBadge, type LangFilter } from "@/components/teacher/LanguageFilter";
import { Shield, ArrowRight, Users } from "lucide-react";

export default function TeacherStudentsPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [lang, setLang] = useState<LangFilter>((params.get("lang") as LangFilter) || "all");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["teacher-my-students"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_my_students");
      return data || [];
    },
  });

  const list = students.filter((s: any) => lang === "all" || (s.languages || []).includes(lang));

  return (
    <div className="min-h-screen bg-fjord-soft">
      <header className="border-b border-border/50 bg-cream/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/teacher/dashboard" />
          <span className="font-display font-bold text-lg text-primary">Moji učenici</span>
        </div>
      </header>

      <div className="container max-w-3xl py-8 space-y-4">
        <LanguageFilter value={lang} onChange={setLang} />
        {!isLoading && list.length === 0 ? (
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Još uvek nemaš učenika za ovaj izbor.
            </CardContent>
          </Card>
        ) : (
          list.map((s: any) => (
            <Card
              key={s.student_id}
              onClick={() => navigate(`/teacher/students/${s.student_id}${lang !== "all" ? `?lang=${lang}` : ""}`)}
              className="bg-background/85 backdrop-blur-sm border-border/30 rounded-2xl cursor-pointer hover:border-accent/40 transition"
            >
              <CardContent className="py-4 flex items-center justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-foreground">{s.display_name}</span>
                    {(s.languages || []).map((c: string) => <LangBadge key={c} code={c} />)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {s.lessons_count} čas(ova)
                    {s.next_lesson && ` · sledeći ${format(new Date(s.next_lesson), "dd.MM. HH:mm")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={s.consent_granted ? "default" : "secondary"} className="text-xs hidden sm:inline-flex">
                    <Shield className="w-3 h-3 mr-1" />
                    {s.consent_granted ? "Analitika" : "Privatna"}
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
