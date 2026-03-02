import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, XCircle } from "lucide-react";
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

export default function MyLessonsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["my-lessons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("*")
        .eq("user_id", user!.id)
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: async (lesson: any) => {
      const { error: lessonErr } = await supabase
        .from("lessons")
        .update({ status: "cancelled" })
        .eq("id", lesson.id);
      if (lessonErr) throw lessonErr;

      const { error: slotErr } = await supabase
        .from("availability_slots")
        .update({ status: "open" })
        .eq("id", lesson.slot_id);
      if (slotErr) throw slotErr;
    },
    onSuccess: () => {
      toast({ title: "Lekcija otkazana", description: "Termin je ponovo slobodan." });
      queryClient.invalidateQueries({ queryKey: ["my-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["open-slots"] });
    },
    onError: (e: any) => {
      toast({ title: "Greška", description: e.message, variant: "destructive" });
    },
  });

  const upcoming = lessons.filter((l: any) => l.status === "scheduled" && new Date(l.start_time) >= new Date());
  const past = lessons.filter((l: any) => l.status !== "scheduled" || new Date(l.start_time) < new Date());

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Moje lekcije</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              Predstojeće
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Učitavanje...</p>
            ) : upcoming.length === 0 ? (
              <p className="text-muted-foreground">Nemaš zakazanih lekcija.</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {format(new Date(l.start_time), "dd.MM.yyyy")} · {format(new Date(l.start_time), "HH:mm")} – {format(new Date(l.end_time), "HH:mm")}
                      </p>
                      {l.student_note && <p className="text-sm text-muted-foreground mt-1">{l.student_note}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => cancelMutation.mutate(l)}
                      disabled={cancelMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-1" /> Otkaži
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {past.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Istorija</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {past.map((l: any) => (
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
