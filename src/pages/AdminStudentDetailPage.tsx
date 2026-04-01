import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap } from "lucide-react";
import { StudentProgressView } from "@/components/admin/StudentProgressView";
import { StudentErrorAnalysis } from "@/components/admin/StudentErrorAnalysis";
import { StudentLessonHistory } from "@/components/admin/StudentLessonHistory";
import { format } from "date-fns";

export default function AdminStudentDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ["admin-student-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: xp } = useQuery({
    queryKey: ["admin-student-xp", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["admin-student-activities", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: errors = [], isLoading: errorsLoading } = useQuery({
    queryKey: ["admin-student-errors", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_events")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: lessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ["admin-student-lessons", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("user_id", userId!)
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-display font-bold text-foreground">
            {profile?.display_name || "Student"}
          </h1>
        </div>

        {/* Overview card */}
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Nivo</p>
                <Badge variant="secondary" className="text-sm">{profile?.level || "A1"}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cilj učenja</p>
                <p className="text-sm font-medium text-foreground">{profile?.learning_goal || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Fokus</p>
                <p className="text-sm font-medium text-foreground">{profile?.focus_area || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">XP</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1">
                  <Zap className="w-3 h-3 text-accent" /> {xp?.total_xp ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Registrovan</p>
                <p className="text-sm font-medium text-foreground">
                  {profile?.created_at ? format(new Date(profile.created_at), "dd.MM.yyyy") : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="progress">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="progress">Napredak</TabsTrigger>
            <TabsTrigger value="errors">Greške</TabsTrigger>
            <TabsTrigger value="lessons">Lekcije</TabsTrigger>
            <TabsTrigger value="activity">Istorija aktivnosti</TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <StudentProgressView activities={activities} loading={activitiesLoading} />
          </TabsContent>

          <TabsContent value="errors">
            <StudentErrorAnalysis errors={errors} loading={errorsLoading} />
          </TabsContent>

          <TabsContent value="lessons">
            <StudentLessonHistory lessons={lessons} loading={lessonsLoading} />
          </TabsContent>

          <TabsContent value="activity">
            {activitiesLoading ? (
              <p className="text-muted-foreground">Učitavanje...</p>
            ) : activities.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nema zabeleženih aktivnosti.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activities.slice(0, 50).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground capitalize">{a.module} — {a.type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), "dd.MM.yyyy HH:mm")}</p>
                    </div>
                    <Badge variant="outline">+{a.points} XP</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
