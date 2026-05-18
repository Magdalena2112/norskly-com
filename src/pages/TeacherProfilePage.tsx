import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Clock, GraduationCap, BookOpen, Star, CalendarIcon, Users, Shield, Languages } from "lucide-react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import { logActivity } from "@/lib/logActivity";
import { motion } from "framer-motion";
import BackButton from "@/components/BackButton";
import teacherPhotoFallback from "@/assets/teacher-photo.jpg";
import { getLanguageBySlug } from "@/lib/languages";

const KIND_LABELS: Record<string, { label: string; icon: any }> = {
  individual: { label: "Individualni", icon: GraduationCap },
  group: { label: "Grupni", icon: Users },
  course: { label: "Kurs", icon: BookOpen },
};

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const queryClient = useQueryClient();
  const teacherId = params.teacherId;

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [note, setNote] = useState("");
  const [shareAnalytics, setShareAnalytics] = useState(false);

  if (!teacherId) return <Navigate to="/select-teacher" replace />;

  const { data: teacher, isLoading: teacherLoading } = useQuery({
    queryKey: ["teacher", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_teacher_public_by_id", {
        p_teacher_id: teacherId,
      });
      if (error) throw error;
      return (data && data[0]) || null;
    },
  });

  const { data: lessonTypes = [] } = useQuery({
    queryKey: ["lesson-types", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lesson_types")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("is_active", true)
        .order("price_cents", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const selectedType = useMemo(
    () => lessonTypes.find((lt: any) => lt.id === selectedTypeId) || lessonTypes[0],
    [lessonTypes, selectedTypeId],
  );

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["open-slots", teacherId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("status", "open")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!teacherId,
  });

  // Real-time: osluškuj promene termina za ovog nastavnika i automatski osvežavaj listu.
  // Ako je trenutno selektovani slot zauzet od strane drugog korisnika, deselektuj ga i obavesti.
  useEffect(() => {
    if (!teacherId) return;
    const channel = supabase
      .channel(`availability-${teacherId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "availability_slots", filter: `teacher_id=eq.${teacherId}` },
        (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ["open-slots", teacherId] });
          const changed = payload.new ?? payload.old;
          if (
            selectedSlot &&
            changed?.id === selectedSlot.id &&
            payload.new?.status &&
            payload.new.status !== "open"
          ) {
            setSelectedSlot(null);
            toast({
              title: "Termin više nije dostupan",
              description: "Neko drugi je upravo rezervisao ovaj termin. Izaberi drugi.",
              variant: "destructive",
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teacherId, selectedSlot, queryClient, toast]);

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!user || !selectedSlot || !selectedType) throw new Error("Nedostaju podaci");
      const startTime = new Date(selectedSlot.start_time);
      const endTime = addMinutes(startTime, selectedType.duration_minutes || 90);

      // Preflight: provera dostupnosti u realnom vremenu pre RPC poziva.
      // Atomski guard u book_lesson_v2 RPC-u svakako sprečava duple booking-e,
      // ali ovo daje brži i prijateljskiji UX kad je termin već zauzet.
      const { data: liveSlot, error: liveErr } = await supabase
        .from("availability_slots")
        .select("id, status")
        .eq("id", selectedSlot.id)
        .maybeSingle();
      if (liveErr) throw liveErr;
      if (!liveSlot || liveSlot.status !== "open") {
        queryClient.invalidateQueries({ queryKey: ["open-slots", teacherId] });
        setSelectedSlot(null);
        throw new Error("Ovaj termin je upravo rezervisan. Izaberi drugi slobodan termin.");
      }

      const { data: lessonId, error } = await supabase.rpc("book_lesson_v2", {
        p_slot_id: selectedSlot.id,
        p_teacher_id: teacherId,
        p_lesson_type_id: selectedType.id,
        p_start: startTime.toISOString(),
        p_end: endTime.toISOString(),
        p_share_analytics: shareAnalytics,
        p_note: note || null,
      });
      if (error) throw error;

      await logActivity(user.id, "talk", "lesson_scheduled", 5, { slot_id: selectedSlot.id });

      const dateStr = format(startTime, "dd.MM.yyyy");
      const timeStr = `${format(startTime, "HH:mm")} – ${format(endTime, "HH:mm")}`;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, preferred_language")
        .eq("user_id", user.id)
        .maybeSingle();
      const studentName = profile?.display_name || user.email || "Učenik";
      const lang = profile?.preferred_language ? getLanguageBySlug(profile.preferred_language) : null;
      const studentLanguage = lang?.label || profile?.preferred_language || undefined;

      // Email to student (reuse existing template)
      if (user.email) {
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "lesson-booked-student",
            recipientEmail: user.email,
            idempotencyKey: `lesson-student-${lessonId}`,
            templateData: { date: dateStr, time: timeStr, note: note || undefined },
          },
        }).catch((e) => console.error("Student email failed:", e));
      }

      // Email to teacher — recipient is resolved server-side, no client email needed
      supabase.functions.invoke("send-transactional-email", {
        body: {
          templateName: "lesson-booked-teacher",
          idempotencyKey: `lesson-teacher-${lessonId}`,
          templateData: {
            studentName,
            studentLanguage,
            lessonType: `${selectedType.title} (${selectedType.duration_minutes} min)`,
            date: dateStr,
            time: timeStr,
            note: note || undefined,
            analyticsShared: shareAnalytics,
          },
        },
      }).catch((e) => console.error("Teacher email failed:", e));

      return lessonId as string;
    },
    onSuccess: (lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["open-slots", teacherId] });
      navigate(`/booking/success/${lessonId}`);
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

  const initials = (teacher?.name || "??").split(" ").map((n: string) => n[0]).join("").slice(0, 2);

  return (
    <div className="min-h-screen bg-aurora">
      <header className="border-b border-border/20 bg-background/10 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center gap-3 h-14">
          <BackButton to="/select-teacher" />
          <span className="font-display font-bold text-lg text-primary-foreground">Profil nastavnika</span>
        </div>
      </header>

      <div className="container max-w-3xl py-6 sm:py-10 space-y-6">
        {/* Teacher card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <div className="h-24 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/10" />
            <CardContent className="relative pt-0 pb-6">
              {teacherLoading || !teacher ? (
                <div className="flex flex-col sm:flex-row gap-5 -mt-12">
                  <Skeleton className="w-24 h-24 rounded-full shrink-0" />
                  <div className="pt-2 sm:pt-14 space-y-2 flex-1">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row gap-5 -mt-12">
                    <Avatar className="w-24 h-24 border-4 border-background shadow-lg shrink-0">
                      <AvatarImage src={teacher.photo_url || teacherPhotoFallback} alt={teacher.name} />
                      <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="pt-2 sm:pt-14">
                      <h1 className="text-2xl font-display font-bold text-foreground">
                        {teacher.name}
                        {teacher.is_verified && <span className="ml-2 text-accent text-base">✓ Verifikovan</span>}
                      </h1>
                      <div className="flex items-center gap-3 mt-1 flex-wrap text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" /> {teacher.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" /> {teacher.students_count}+ studenata
                        </span>
                      </div>
                    </div>
                  </div>

                  {teacher.bio && <p className="mt-5 text-muted-foreground leading-relaxed">{teacher.bio}</p>}

                  {teacher.spoken_languages?.length > 0 && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                      <Languages className="w-4 h-4 text-primary" />
                      {teacher.spoken_languages.join(" · ")}
                    </div>
                  )}

                  {teacher.focus?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-primary" /> Oblasti
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {teacher.focus.map((f: string) => (
                          <Badge key={f} variant="secondary" className="font-normal">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Lesson types */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-3">1. Izaberi tip časa</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {lessonTypes.map((lt: any) => {
              const meta = KIND_LABELS[lt.kind] || KIND_LABELS.individual;
              const Icon = meta.icon;
              const isActive = (selectedType?.id) === lt.id;
              return (
                <button
                  key={lt.id}
                  onClick={() => setSelectedTypeId(lt.id)}
                  className={`text-left rounded-2xl border-2 p-4 transition-all ${
                    isActive
                      ? "border-accent bg-accent/10 shadow-accent-glow"
                      : "border-border bg-background/85 backdrop-blur-sm hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground mb-1">
                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                  </div>
                  <div className="font-display font-bold text-foreground">{lt.title}</div>
                  <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{lt.description}</div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" /> {lt.duration_minutes} min
                    </span>
                    <span className="font-bold text-foreground">
                      {Math.round(lt.price_cents / 100)} {lt.currency}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Calendar + slots */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-3 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> 2. Izaberi termin
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
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

            <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" /> Slobodni termini
                </h3>
                {!selectedDate ? (
                  <p className="text-sm text-muted-foreground">Izaberi datum na kalendaru.</p>
                ) : slotsLoading ? (
                  <p className="text-sm text-muted-foreground">Učitavanje...</p>
                ) : filteredSlots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nema slobodnih termina za ovaj datum.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredSlots.map((slot: any) => {
                      const start = new Date(slot.start_time);
                      const dur = selectedType?.duration_minutes || 90;
                      const end = addMinutes(start, dur);
                      const isSel = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 border-2 transition-all text-sm ${
                            isSel
                              ? "border-accent bg-accent/10 text-foreground font-semibold"
                              : "border-border hover:border-accent/40 text-foreground"
                          }`}
                        >
                          <span>{format(start, "HH:mm")} – {format(end, "HH:mm")}</span>
                          <span className="text-xs text-muted-foreground">{dur} min</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Note */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-3">3. Napomena (opciono)</h2>
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardContent className="pt-6">
              <Textarea
                placeholder="Šta želiš da uradiš na času? Npr. vežbati razgovor, pripremiti se za Norskprøven..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Consent */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-display font-bold text-primary-foreground mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5" /> 4. Privatnost
          </h2>
          <Card className="bg-background/85 backdrop-blur-sm border-accent/30 rounded-3xl">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1">
                  <label htmlFor="share-analytics" className="block font-semibold text-foreground cursor-pointer">
                    Dozvoli pristup mom napretku
                  </label>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Dozvoljavam ovom profesoru pristup mom napretku, greškama i istoriji učenja radi personalizovanije nastave.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Možeš opozvati saglasnost u svakom trenutku u podešavanjima profila.
                  </p>
                </div>
                <Switch
                  id="share-analytics"
                  checked={shareAnalytics}
                  onCheckedChange={setShareAnalytics}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="sticky bottom-4 z-10">
          <Card className="bg-background/95 backdrop-blur-md border-border/30 rounded-2xl shadow-nordic">
            <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                {selectedSlot && selectedType ? (
                  <>
                    <span className="font-semibold text-foreground">{selectedType.title}</span> ·{" "}
                    {format(new Date(selectedSlot.start_time), "dd.MM.yyyy HH:mm")} ·{" "}
                    <span className="font-semibold text-foreground">
                      {Math.round(selectedType.price_cents / 100)} {selectedType.currency}
                    </span>
                  </>
                ) : (
                  <>Izaberi tip časa i termin</>
                )}
              </div>
              <Button
                size="lg"
                disabled={!selectedSlot || !selectedType || bookMutation.isPending}
                onClick={() => bookMutation.mutate()}
              >
                {bookMutation.isPending ? "Potvrđujem..." : "Potvrdi rezervaciju"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
