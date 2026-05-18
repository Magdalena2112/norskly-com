import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import { Shield, ArrowRight, Users } from "lucide-react";

export default function TeacherStudentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: teacher } = useQuery({
    queryKey: ["teacher-self", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("id").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: students = [] } = useQuery({
    queryKey: ["teacher-students", teacher?.id],
    queryFn: async () => {
      // Get distinct student ids from lessons
      const { data: lessons } = await supabase
        .from("lessons")
        .select("user_id")
        .eq("teacher_id", teacher!.id);
      const ids = Array.from(new Set((lessons || []).map((l: any) => l.user_id)));
      if (ids.length === 0) return [];

      const { data: consents } = await supabase
        .from("student_teacher_consents")
        .select("student_id, consent_granted")
        .eq("teacher_id", teacher!.id);
      const consentMap = new Map((consents || []).map((c: any) => [c.student_id, c.consent_granted]));

      // Profiles can only be read if consent granted (via RLS). For others, just show id.
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p.display_name]));

      return ids.map((id) => ({
        user_id: id,
        display_name: profMap.get(id) || "Učenik",
        consent_granted: !!consentMap.get(id),
      }));
    },
    enabled: !!teacher,
  });

  return (
    <div className="min-h-screen bg-aurora">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/teacher/dashboard" />
          <span className="font-display font-bold text-lg text-primary-foreground">Učenici</span>
        </div>
      </header>

      <div className="container max-w-3xl py-8 space-y-3">
        {students.length === 0 ? (
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              Još uvek nemaš učenika.
            </CardContent>
          </Card>
        ) : (
          students.map((s: any) => (
            <Card
              key={s.user_id}
              onClick={() => navigate(`/teacher/students/${s.user_id}`)}
              className="bg-background/85 backdrop-blur-sm border-border/30 rounded-2xl cursor-pointer hover:border-accent/40 transition"
            >
              <CardContent className="py-4 flex items-center justify-between">
                <div className="font-medium text-foreground">{s.display_name}</div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.consent_granted ? "default" : "secondary"} className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {s.consent_granted ? "Analitika deljena" : "Privatna"}
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
