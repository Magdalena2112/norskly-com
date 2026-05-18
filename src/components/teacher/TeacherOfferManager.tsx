import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar, BookOpen, Users, GraduationCap } from "lucide-react";

type Kind = "individual" | "group" | "course";

const KIND_META: Record<Kind, { label: string; icon: typeof BookOpen }> = {
  individual: { label: "Individualni čas", icon: BookOpen },
  group: { label: "Grupni čas", icon: Users },
  course: { label: "Kurs", icon: GraduationCap },
};

interface Props {
  teacherId: string;
}

export default function TeacherOfferManager({ teacherId }: Props) {
  const qc = useQueryClient();

  // ─── Lesson types ──────────────────────────────────────────────
  const { data: types = [] } = useQuery({
    queryKey: ["teacher-lesson-types", teacherId],
    queryFn: async () => {
      const { data } = await supabase
        .from("lesson_types")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!teacherId,
  });

  const [form, setForm] = useState({
    title: "",
    description: "",
    kind: "individual" as Kind,
    duration_minutes: 60,
    price_cents: 0,
    currency: "NOK",
    capacity: 1,
    language: "no",
    is_active: true,
  });

  const reset = () =>
    setForm({
      title: "",
      description: "",
      kind: "individual",
      duration_minutes: 60,
      price_cents: 0,
      currency: "NOK",
      capacity: 1,
      language: "no",
      is_active: true,
    });

  const saveType = async () => {
    if (!form.title.trim()) {
      toast({ title: "Naziv je obavezan", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("lesson_types").insert({ ...form, teacher_id: teacherId });
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Ponuda dodata" });
    reset();
    qc.invalidateQueries({ queryKey: ["teacher-lesson-types", teacherId] });
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from("lesson_types").update({ is_active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["teacher-lesson-types", teacherId] });
  };

  const deleteType = async (id: string) => {
    await supabase.from("lesson_types").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["teacher-lesson-types", teacherId] });
  };

  // ─── Availability slots ────────────────────────────────────────
  const { data: slots = [] } = useQuery({
    queryKey: ["teacher-slots", teacherId],
    queryFn: async () => {
      const { data } = await supabase
        .from("availability_slots")
        .select("*")
        .eq("teacher_id", teacherId)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });
      return data || [];
    },
    enabled: !!teacherId,
  });

  const [slotForm, setSlotForm] = useState({ start_time: "", duration_minutes: 90 });

  const addSlot = async () => {
    if (!slotForm.start_time) {
      toast({ title: "Izaberi datum i vreme", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("availability_slots").insert({
      teacher_id: teacherId,
      start_time: new Date(slotForm.start_time).toISOString(),
      duration_minutes: slotForm.duration_minutes,
      status: "open",
    });
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Termin dodat" });
    setSlotForm({ start_time: "", duration_minutes: 90 });
    qc.invalidateQueries({ queryKey: ["teacher-slots", teacherId] });
  };

  const deleteSlot = async (id: string) => {
    await supabase.from("availability_slots").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["teacher-slots", teacherId] });
  };

  return (
    <div className="space-y-6">
      {/* Ponuda */}
      <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
        <CardContent className="py-6 space-y-5">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Moja ponuda</h2>
            <p className="text-sm text-muted-foreground">
              Definiši tipove časova koje nudiš, trajanje, cenu i kapacitet.
            </p>
          </div>

          {/* Existing types */}
          <div className="space-y-2">
            {types.length === 0 ? (
              <p className="text-sm text-muted-foreground">Još nemaš dodatih tipova časova.</p>
            ) : (
              types.map((t: any) => {
                const Meta = KIND_META[t.kind as Kind] ?? KIND_META.individual;
                const Icon = Meta.icon;
                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/40 p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {Meta.label} • {t.duration_minutes} min • {(t.price_cents / 100).toFixed(0)} {t.currency}
                          {t.kind !== "individual" && ` • do ${t.capacity}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={t.is_active ? "default" : "secondary"} className="text-xs">
                        {t.is_active ? "Aktivno" : "Pauzirano"}
                      </Badge>
                      <Switch
                        checked={t.is_active}
                        onCheckedChange={(v) => toggleActive(t.id, v)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => deleteType(t.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* New type form */}
          <div className="rounded-2xl border border-dashed border-border/60 p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Dodaj novi tip časa</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Naziv</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="npr. Konverzacija B1"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tip</Label>
                <Select value={form.kind} onValueChange={(v: Kind) => setForm({ ...form, kind: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individualni čas</SelectItem>
                    <SelectItem value="group">Grupni čas</SelectItem>
                    <SelectItem value="course">Kurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duration">Trajanje (min)</Label>
                <Input
                  id="duration"
                  type="number"
                  min={15}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="price">Cena</Label>
                <div className="flex gap-2">
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={form.price_cents / 100}
                    onChange={(e) => setForm({ ...form, price_cents: Math.round(Number(e.target.value) * 100) })}
                  />
                  <Select value={form.currency} onValueChange={(v) => setForm({ ...form, currency: v })}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOK">NOK</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="RSD">RSD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="capacity">Kapacitet</Label>
                <Input
                  id="capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Jezik</Label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no">Norveški</SelectItem>
                    <SelectItem value="en">Engleski</SelectItem>
                    <SelectItem value="de">Nemački</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="desc">Opis</Label>
              <Textarea
                id="desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Šta učenik dobija na času..."
                rows={3}
              />
            </div>
            <Button onClick={saveType} className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Sačuvaj ponudu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Availability */}
      <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl">
        <CardContent className="py-6 space-y-4">
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Dostupni termini</h2>
            <p className="text-sm text-muted-foreground">
              Dodaj slobodne termine kada učenici mogu rezervisati čas.
            </p>
          </div>

          <div className="grid sm:grid-cols-[1fr,140px,auto] gap-2 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="slot-start">Datum i vreme</Label>
              <Input
                id="slot-start"
                type="datetime-local"
                value={slotForm.start_time}
                onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="slot-dur">Trajanje (min)</Label>
              <Input
                id="slot-dur"
                type="number"
                min={15}
                value={slotForm.duration_minutes}
                onChange={(e) => setSlotForm({ ...slotForm, duration_minutes: Number(e.target.value) })}
              />
            </div>
            <Button onClick={addSlot}>
              <Plus className="w-4 h-4 mr-1" /> Dodaj
            </Button>
          </div>

          <div className="space-y-2">
            {slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nema budućih termina.</p>
            ) : (
              slots.map((s: any) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-border/40 p-3"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(s.start_time), "dd.MM.yyyy HH:mm")} • {s.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={s.status === "open" ? "default" : "secondary"} className="text-xs">
                      {s.status === "open" ? "Slobodan" : "Zauzet"}
                    </Badge>
                    {s.status === "open" && (
                      <Button variant="ghost" size="icon" onClick={() => deleteSlot(s.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
