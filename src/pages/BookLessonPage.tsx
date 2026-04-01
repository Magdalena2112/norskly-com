import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logActivity } from "@/lib/logActivity";

export default function BookLessonPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [note, setNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["open-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("status", "open")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedSlot) throw new Error("Missing data");
      const startTime = new Date(selectedSlot.start_time);
      const endTime = addMinutes(startTime, 90);
      const lessonId = crypto.randomUUID();

      // First, claim the slot — if someone else already booked it, this returns 0 rows
      const { data: updatedSlots, error: slotError } = await supabase
        .from("availability_slots")
        .update({ status: "booked" })
        .eq("id", selectedSlot.id)
        .eq("status", "open")
        .select("id");
      if (slotError) throw slotError;
      if (!updatedSlots || updatedSlots.length === 0) {
        throw new Error("Ovaj termin je već zauzet. Izaberi drugi.");
      }

      const { error: lessonError } = await supabase.from("lessons").insert({
        id: lessonId,
        user_id: user.id,
        slot_id: selectedSlot.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        student_note: note || null,
      });
      if (lessonError) throw lessonError;

      await logActivity(user.id, "talk", "lesson_scheduled", 5, {
        slot_id: selectedSlot.id,
      });

      // Send confirmation emails
      const dateStr = format(startTime, "dd.MM.yyyy");
      const timeStr = `${format(startTime, "HH:mm")} – ${format(endTime, "HH:mm")}`;

      // Get student profile for display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      const studentName = profile?.display_name || user.email || "Učenik";

      // Email to student
      if (user.email) {
        try {
          const { error: studentEmailError } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "lesson-booked-student",
              recipientEmail: user.email,
              idempotencyKey: `lesson-student-${lessonId}`,
              templateData: { date: dateStr, time: timeStr, note: note || undefined },
            },
          });
          if (studentEmailError) console.error("Student email failed:", studentEmailError);
        } catch (e) {
          console.error("Student email failed:", e);
        }
      }

      // Email to teacher
      const { data: teacher } = await supabase
        .from("teacher_profile")
        .select("email")
        .limit(1)
        .maybeSingle();

      if (teacher?.email) {
        try {
          const { error: teacherEmailError } = await supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "lesson-booked-teacher",
              recipientEmail: teacher.email,
              idempotencyKey: `lesson-teacher-${lessonId}`,
              templateData: { studentName, date: dateStr, time: timeStr, note: note || undefined },
            },
          });
          if (teacherEmailError) console.error("Teacher email failed:", teacherEmailError);
        } catch (e) {
          console.error("Teacher email failed:", e);
        }
      }
    },
    onSuccess: () => {
      toast({ title: "Lekcija zakazana!", description: "Vidimo se uskoro 🎉" });
      queryClient.invalidateQueries({ queryKey: ["open-slots"] });
      setDialogOpen(false);
      setSelectedSlot(null);
      setNote("");
    },
    onError: (e: any) => {
      toast({ title: "Greška", description: e.message, variant: "destructive" });
    },
  });

  const filteredSlots = selectedDate
    ? slots.filter((s: any) => {
        const d = new Date(s.start_time);
        return (
          d.getFullYear() === selectedDate.getFullYear() &&
          d.getMonth() === selectedDate.getMonth() &&
          d.getDate() === selectedDate.getDate()
        );
      })
    : slots;

  const datesWithSlots = slots.map((s: any) => new Date(s.start_time));

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Zakaži lekciju</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5 text-accent" />
                Izaberi datum
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto"
                modifiers={{ hasSlot: datesWithSlots }}
                modifiersClassNames={{ hasSlot: "bg-accent/20 font-bold" }}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-accent" />
                Slobodni termini
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Učitavanje...</p>
              ) : filteredSlots.length === 0 ? (
                <p className="text-muted-foreground">
                  {selectedDate ? "Nema slobodnih termina za ovaj datum." : "Izaberi datum da vidiš termine."}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredSlots.map((slot: any) => {
                    const start = new Date(slot.start_time);
                    const end = addMinutes(start, 90);
                    return (
                      <Button
                        key={slot.id}
                        variant="outline"
                        className="w-full justify-between"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setDialogOpen(true);
                        }}
                      >
                        <span>{format(start, "HH:mm")} – {format(end, "HH:mm")}</span>
                        <span className="text-xs text-muted-foreground">90 min</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrdi zakazivanje</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <p className="text-foreground">
                <strong>{format(new Date(selectedSlot.start_time), "dd.MM.yyyy")}</strong>{" "}
                {format(new Date(selectedSlot.start_time), "HH:mm")} –{" "}
                {format(addMinutes(new Date(selectedSlot.start_time), 90), "HH:mm")}
              </p>
              <Textarea
                placeholder="Napomena za nastavnika (opciono)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
              {bookMutation.isPending ? "Zakazujem..." : "Zakaži"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
