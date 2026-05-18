import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Shield, Lock, BookOpen, AlertCircle, Award } from "lucide-react";

export default function TeacherStudentDetailPage() {
  const { user } = useAuth();
  const { studentId } = useParams();

  const { data: teacher } = useQuery({
    queryKey: ["teacher-self", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: consent } = useQuery({
    queryKey: ["consent", teacher?.id, studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("student_teacher_consents")
        .select("*")
        .eq("teacher_id", teacher!.id)
        .eq("student_id", studentId!)
        .maybeSingle();
      return data;
    },
    enabled: !!teacher && !!studentId,
  });

  const hasConsent = !!consent?.consent_granted;

  const { data: profile } = useQuery({
    queryKey: ["student-profile", studentId, hasConsent],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", studentId!).maybeSingle();
      return data;
    },
    enabled: !!studentId && hasConsent,
  });

  const { data: errors = [] } = useQuery({
    queryKey: ["student-errors", studentId],
    queryFn: async () => {
      const { data } = await supabase
        .from("error_events")
        .select("topic, category, severity")
        .eq("user_id", studentId!)
        .order("created_at", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!studentId && hasConsent,
  });

  const { data: xp } = useQuery({
    queryKey: ["student-xp", studentId],
    queryFn: async () => {
      const { data } = await supabase.from("user_xp").select("*").eq("user_id", studentId!).maybeSingle();
      return data;
    },
    enabled: !!studentId && hasConsent,
  });

  const { data: vocabCount = 0 } = useQuery({
    queryKey: ["student-vocab-count", studentId],
    queryFn: async () => {
      const { count } = await supabase
        .from("vocabulary_words")
        .select("*", { count: "exact", head: true })
        .eq("user_id", studentId!);
      return count || 0;
    },
    enabled: !!studentId && hasConsent,
  });

  return (
    <div className="min-h-screen bg-aurora">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/teacher/students" />
          <span className="font-display font-bold text-lg text-primary-foreground">Profil učenika</span>
        </div>
      </header>

      <div className="container max-w-3xl py-8 space-y-4">
        {!hasConsent ? (
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardContent className="py-12 text-center">
              <Lock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h2 className="font-display font-bold text-lg text-foreground">Privatna analitika</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Ovaj učenik nije podelio svoj napredak sa tobom. Možeš ga zamoliti da uključi deljenje
                u podešavanjima profila kako bi dobio personalizovanije časove.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-background/85 backdrop-blur-sm border-accent/30 rounded-3xl">
              <CardContent className="py-5 flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent" />
                <span className="text-sm text-foreground">Učenik je odobrio pristup analitici.</span>
                <Badge className="ml-auto text-xs">Aktivno</Badge>
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-3 gap-3">
              <Card className="bg-background/85 border-border/30 rounded-2xl">
                <CardContent className="py-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Nivo</div>
                  <div className="text-2xl font-bold text-foreground">{profile?.level || "—"}</div>
                </CardContent>
              </Card>
              <Card className="bg-background/85 border-border/30 rounded-2xl">
                <CardContent className="py-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Award className="w-3 h-3" /> XP
                  </div>
                  <div className="text-2xl font-bold text-foreground">{xp?.total_xp || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-background/85 border-border/30 rounded-2xl">
                <CardContent className="py-4">
                  <div className="text-xs text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Reči
                  </div>
                  <div className="text-2xl font-bold text-foreground">{vocabCount}</div>
                </CardContent>
              </Card>
            </div>

            {profile && (
              <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
                <CardContent className="py-5 space-y-2 text-sm">
                  <h3 className="font-display font-bold text-foreground">Profil učenja</h3>
                  {profile.learning_goal && <p><span className="text-muted-foreground">Cilj:</span> {profile.learning_goal}</p>}
                  {profile.focus_area && <p><span className="text-muted-foreground">Fokus:</span> {profile.focus_area}</p>}
                  {profile.preferred_tone && <p><span className="text-muted-foreground">Ton:</span> {profile.preferred_tone}</p>}
                </CardContent>
              </Card>
            )}

            <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
              <CardContent className="py-5">
                <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" /> Najnovije greške
                </h3>
                {errors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nema zabeleženih grešaka.</p>
                ) : (
                  <div className="space-y-2">
                    {errors.map((e: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm border-b border-border/30 pb-2 last:border-0">
                        <span className="text-foreground">{e.topic}</span>
                        <Badge variant="secondary" className="text-xs">{e.category}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
