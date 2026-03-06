import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CheckCircle, Calendar, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const STATUS_LABELS: Record<string, string> = {
  scheduled: "Zakazano",
  completed: "Završeno",
  cancelled: "Otkazano",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  scheduled: "default",
  completed: "secondary",
  cancelled: "destructive",
};

export default function AdminLessonsPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["admin-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .order("start_time", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const { error } = await supabase
        .from("lessons")
        .update({ status: "completed" })
        .eq("id", lessonId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Lekcija označena kao završena ✓" });
      queryClient.invalidateQueries({ queryKey: ["admin-lessons"] });
    },
    onError: (e: any) => {
      toast({ title: "Greška", description: e.message, variant: "destructive" });
    },
  });

  const scheduled = lessons.filter((l: any) => l.status === "scheduled");
  const others = lessons.filter((l: any) => l.status !== "scheduled");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Upravljanje lekcijama</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/teacher-profile")}>
              Profil nastavnika
            </Button>
            <Button variant="outline" onClick={() => navigate("/admin/availability")}>
              <Settings className="h-4 w-4 mr-2" /> Termini
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Zakazane lekcije ({scheduled.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Učitavanje...</p>
            ) : scheduled.length === 0 ? (
              <p className="text-muted-foreground">Nema zakazanih lekcija.</p>
            ) : (
              <div className="space-y-3">
                {scheduled.map((l: any) => (
                  <div key={l.id} className="rounded-lg border border-border p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-foreground">
                        {format(new Date(l.start_time), "dd.MM.yyyy")} · {format(new Date(l.start_time), "HH:mm")} – {format(new Date(l.end_time), "HH:mm")}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-accent hover:text-accent"
                        onClick={() => completeMutation.mutate(l.id)}
                        disabled={completeMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" /> Završeno
                      </Button>
                    </div>
                    {l.student_note && (
                      <p className="text-sm text-muted-foreground">📝 {l.student_note}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Student ID: {l.user_id.slice(0, 8)}…</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {others.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Istorija</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {others.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <p className="text-sm text-foreground">
                    {format(new Date(l.start_time), "dd.MM.yyyy HH:mm")}
                  </p>
                  <Badge variant={STATUS_VARIANTS[l.status] || "secondary"}>
                    {STATUS_LABELS[l.status] || l.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
