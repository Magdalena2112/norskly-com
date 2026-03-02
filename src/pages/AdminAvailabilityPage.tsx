import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, addMinutes, setHours, setMinutes } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 07:00 – 20:00
const MINUTES = [0, 15, 30, 45];

export default function AdminAvailabilityPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("0");

  const { data: slots = [], isLoading } = useQuery({
    queryKey: ["admin-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("availability_slots")
        .select("*")
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate) throw new Error("Izaberi datum");
      let startTime = setHours(selectedDate, parseInt(hour));
      startTime = setMinutes(startTime, parseInt(minute));
      startTime.setSeconds(0, 0);

      const { error } = await supabase.from("availability_slots").insert({
        start_time: startTime.toISOString(),
        duration_minutes: 90,
        status: "open",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Termin dodat!" });
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
    },
    onError: (e: any) => {
      toast({ title: "Greška", description: e.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("availability_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Termin obrisan" });
      queryClient.invalidateQueries({ queryKey: ["admin-slots"] });
    },
    onError: (e: any) => {
      toast({ title: "Greška", description: e.message, variant: "destructive" });
    },
  });

  const openSlots = slots.filter((s: any) => s.status === "open");

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/lessons")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Upravljanje terminima</h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dodaj termin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
              <div className="flex gap-2 items-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Select value={hour} onValueChange={setHour}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">:</span>
                <Select value={minute} onValueChange={setMinute}>
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {String(m).padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedDate && (
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "dd.MM.yyyy")} · {hour.padStart(2, "0")}:{minute.padStart(2, "0")} – {format(addMinutes(setMinutes(setHours(selectedDate, parseInt(hour)), parseInt(minute)), 90), "HH:mm")}
                </p>
              )}
              <Button className="w-full" onClick={() => addMutation.mutate()} disabled={!selectedDate || addMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {addMutation.isPending ? "Dodajem..." : "Dodaj termin (90 min)"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Slobodni termini ({openSlots.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground">Učitavanje...</p>
              ) : openSlots.length === 0 ? (
                <p className="text-muted-foreground">Nema slobodnih termina.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {openSlots.map((s: any) => {
                    const start = new Date(s.start_time);
                    return (
                      <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div className="text-sm">
                          <p className="font-medium text-foreground">{format(start, "dd.MM.yyyy")}</p>
                          <p className="text-muted-foreground">{format(start, "HH:mm")} – {format(addMinutes(start, 90), "HH:mm")}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteMutation.mutate(s.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
