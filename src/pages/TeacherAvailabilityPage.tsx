import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Clock } from "lucide-react";
import TeacherHeader from "@/components/teacher/TeacherHeader";
import { LangBadge } from "@/components/teacher/LanguageFilter";
import { useTeacherSelf } from "@/hooks/useTeacherSelf";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7);
const MINUTES = [0, 15, 30, 45];
const LANG_LABEL: Record<string, string> = { no: "Norveški", en: "Engleski", de: "Nemački" };

export default function TeacherAvailabilityPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: teacher } = useTeacherSelf();
  const teaching: string[] = teacher?.teaching_languages?.length ? teacher.teaching_languages : teacher?.language ? [teacher.language] : [];
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("0");
  const [lang, setLang] = useState<string>("");
  const language = lang || teaching[0] || "no";

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["teacher-slots", teacher?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacher!.id)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!teacher,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !teacher) throw new Error("Izaberi datum");
      const start = setMinutes(setHours(selectedDate, parseInt(hour)), parseInt(minute));
      start.setSeconds(0, 0);
      if (start < new Date()) throw new Error("Termin mora biti u budućnosti.");
      const { error } = await supabase.from("availability_slots").insert({
        start_time: start.toISOString(),
        duration_minutes: 90,
        status: "open",
        teacher_id: teacher.id,
        language,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Termin dodat!" }); qc.invalidateQueries({ queryKey: ["teacher-slots"] }); },
    onError: (e: any) => toast({ title: "Greška", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Termin obrisan" }); qc.invalidateQueries({ queryKey: ["teacher-slots"] }); },
    onError: (e: any) => toast({ title: "Greška", description: e.message, variant: "destructive" }),
  });

  const open = slots.filter((s: any) => s.status === "open");
  const booked = slots.filter((s: any) => s.status === "booked");

  return (
    <div className="min-h-screen bg-fjord-soft">
      <TeacherHeader />
      <div className="container max-w-4xl py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Slobodni termini</h1>
          <p className="text-sm text-muted-foreground mt-1">Otvori termine u kojima učenici mogu da zakažu čas kod tebe.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
            <CardHeader><CardTitle className="text-lg">Dodaj termin</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto"
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              />
              <div className="flex flex-wrap gap-2 items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{HOURS.map((h) => <SelectItem key={h} value={String(h)}>{String(h).padStart(2, "0")}</SelectItem>)}</SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                  <SelectContent>{MINUTES.map((m) => <SelectItem key={m} value={String(m)}>{String(m).padStart(2, "0")}</SelectItem>)}</SelectContent>
                </Select>
                {teaching.length > 1 && (
                  <Select value={language} onValueChange={setLang}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{teaching.map((c) => <SelectItem key={c} value={c}>{LANG_LABEL[c] || c}</SelectItem>)}</SelectContent>
                  </Select>
                )}
              </div>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "dd.MM.yyyy")} · {hour.padStart(2, "0")}:{minute.padStart(2, "0")} – {format(addMinutes(setMinutes(setHours(selectedDate, parseInt(hour)), parseInt(minute)), 90), "HH:mm")}
                </p>
              )}
              <Button className="w-full" onClick={() => add.mutate()} disabled={!selectedDate || !teacher || add.isPending}>
                <Plus className="h-4 w-4 mr-2" />{add.isPending ? "Dodajem..." : "Dodaj termin (90 min)"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
              <CardHeader><CardTitle className="text-lg flex items-center gap-2">Slobodni termini <Badge variant="secondary">{open.length}</Badge></CardTitle></CardHeader>
              <CardContent>
                {isLoading ? <p className="text-muted-foreground">Učitavanje...</p> : open.length === 0 ? <p className="text-muted-foreground">Nema slobodnih termina.</p> : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {open.map((s: any) => {
                      const start = new Date(s.start_time);
                      return (
                        <div key={s.id} className="flex items-center justify-between rounded-2xl border border-border/40 p-3">
                          <div className="text-sm">
                            <div className="flex items-center gap-2"><p className="font-medium text-foreground">{format(start, "dd.MM.yyyy")}</p><LangBadge code={s.language} /></div>
                            <p className="text-muted-foreground">{format(start, "HH:mm")} – {format(addMinutes(start, s.duration_minutes), "HH:mm")}</p>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => remove.mutate(s.id)} disabled={remove.isPending}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            {booked.length > 0 && (
              <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
                <CardHeader><CardTitle className="text-lg flex items-center gap-2">Rezervisani termini <Badge>{booked.length}</Badge></CardTitle></CardHeader>
                <CardContent className="space-y-2 max-h-56 overflow-y-auto">
                  {booked.map((s: any) => {
                    const start = new Date(s.start_time);
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-2xl border border-accent/20 bg-accent/5 p-3 text-sm">
                        <div>
                          <p className="font-medium text-foreground">{format(start, "dd.MM.yyyy")}</p>
                          <p className="text-muted-foreground">{format(start, "HH:mm")} – {format(addMinutes(start, s.duration_minutes), "HH:mm")}</p>
                        </div>
                        <Badge>Rezervisan</Badge>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
