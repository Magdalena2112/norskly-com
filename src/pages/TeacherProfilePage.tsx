import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, GraduationCap, BookOpen, Star, CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logActivity } from "@/lib/logActivity";
import { motion } from "framer-motion";
import teacherPhotoFallback from "@/assets/teacher-photo.jpg";

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [note, setNote] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_profile")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

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

      const { error: lessonError } = await supabase.from("lessons").insert({
        user_id: user.id,
        slot_id: selectedSlot.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        student_note: note || null,
      });
      if (lessonError) throw lessonError;

      const { error: slotError } = await supabase
        .from("availability_slots")
        .update({ status: "booked" })
        .eq("id", selectedSlot.id);
      if (slotError) throw slotError;

      await logActivity(user.id, "talk", "lesson_scheduled", 5, {
        slot_id: selectedSlot.id,
      });
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
    : [];

  const datesWithSlots = slots.map((s: any) => new Date(s.start_time));

  const teacherName = teacher?.name || "Ingrid Haugen";
  const teacherBio = teacher?.bio || "";
  const teacherFocus: string[] = teacher?.focus || [];
  const teacherDuration = teacher?.duration_minutes || 90;
  const teacherRating = teacher?.rating || 4.9;
  const teacherStudents = teacher?.students_count || 120;
  const teacherPhoto = teacher?.photo_url || teacherPhotoFallback;
  const initials = teacherName.split(" ").map((n: string) => n[0]).join("");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <Button variant="ghost" size="icon" onClick={() => navigate("/practice")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold text-lg text-foreground">Profil nastavnika</span>
        </div>
      </header>

      <div className="container max-w-3xl py-8 space-y-8">
        {/* Teacher Profile Card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />
            <CardContent className="relative pt-0 pb-6">
              {teacherLoading ? (
                <div className="flex flex-col sm:flex-row gap-5 -mt-12">
                  <Skeleton className="w-24 h-24 rounded-full shrink-0" />
                  <div className="pt-2 sm:pt-14 space-y-2 flex-1">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-16 w-full mt-4" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-5 -mt-12">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg shrink-0">
                      <AvatarImage src={teacherPhoto} alt={teacherName} />
                      <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="pt-2 sm:pt-14">
                      <h1 className="text-2xl font-display font-bold text-foreground">{teacherName}</h1>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Star className="w-4 h-4 text-accent fill-accent" /> {teacherRating}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <GraduationCap className="w-4 h-4" /> {teacherStudents}+ studenata
                        </span>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" /> {teacherDuration} min po času
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="mt-5 text-muted-foreground leading-relaxed">{teacherBio}</p>

                  {teacherFocus.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary" /> Oblasti podučavanja
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {teacherFocus.map((f: string) => (
                          <Badge key={f} variant="secondary" className="font-normal">
                            {f}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Booking Section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-accent" />
            Zakaži čas
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6">
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
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  Slobodni termini
                </h3>
                {!selectedDate ? (
                  <p className="text-sm text-muted-foreground">Izaberi datum na kalendaru da vidiš slobodne termine.</p>
                ) : isLoading ? (
                  <p className="text-sm text-muted-foreground">Učitavanje...</p>
                ) : filteredSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nema slobodnih termina za ovaj datum.</p>
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
        </motion.div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Potvrdi zakazivanje</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={teacherPhoto} alt={teacherName} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{teacherName}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(selectedSlot.start_time), "dd.MM.yyyy")} · {format(new Date(selectedSlot.start_time), "HH:mm")} – {format(addMinutes(new Date(selectedSlot.start_time), 90), "HH:mm")}
                  </p>
                </div>
              </div>
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
              {bookMutation.isPending ? "Zakazujem..." : "Rezerviši čas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
