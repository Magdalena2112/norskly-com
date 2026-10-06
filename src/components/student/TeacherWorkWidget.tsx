import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { ClipboardList, MessageSquareQuote, ExternalLink } from "lucide-react";

const STATUS: Record<string, string> = { assigned: "Zadato", submitted: "Predato", reviewed: "Pregledano" };

/** Student view of homework and shared lesson summaries from their teacher, scoped to the active language. */
export default function TeacherWorkWidget({ language }: { language: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: assignments = [] } = useQuery({
    queryKey: ["my-assignments", user?.id, language],
    queryFn: async () => (await supabase.from("teacher_assignments").select("*").eq("student_id", user!.id).eq("language", language).order("created_at", { ascending: false }).limit(10)).data || [],
    enabled: !!user,
  });
  const { data: note } = useQuery({
    queryKey: ["my-shared-note", user?.id, language],
    queryFn: async () => (await supabase.from("teacher_lesson_notes").select("student_summary, created_at").eq("student_id", user!.id).eq("language", language).eq("shared_with_student", true).order("created_at", { ascending: false }).limit(1).maybeSingle()).data,
    enabled: !!user,
  });

  if (!assignments.length && !note?.student_summary) return null;

  return (
    <Card className="bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl mt-6">
      <CardContent className="py-5 space-y-4">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-accent" /> Od tvog profesora
        </h2>
        {note?.student_summary && (
          <div className="rounded-2xl bg-accent/10 border border-accent/25 p-3 text-sm">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <MessageSquareQuote className="w-3.5 h-3.5" /> Osvrt na čas · {format(new Date(note.created_at), "dd.MM.yyyy")}
            </p>
            <p className="text-foreground whitespace-pre-wrap">{note.student_summary}</p>
          </div>
        )}
        {assignments.map((a: any) => (
          <Item key={a.id} a={a} onDone={() => qc.invalidateQueries({ queryKey: ["my-assignments"] })} />
        ))}
      </CardContent>
    </Card>
  );
}

function Item({ a, onDone }: { a: any; onDone: () => void }) {
  const [text, setText] = useState(a.submission_text || "");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!text.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("teacher_assignments").update({ submission_text: text.trim() }).eq("id", a.id);
    setBusy(false);
    if (error) return toast({ title: "Greška", description: error.message, variant: "destructive" });
    toast({ title: "Zadatak predat" });
    onDone();
  };
  return (
    <div className="rounded-2xl border border-border/40 p-3 space-y-2 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-foreground">{a.title}</p>
          {a.due_date && <p className="text-xs text-muted-foreground">Rok: {format(new Date(a.due_date), "dd.MM.yyyy")}</p>}
        </div>
        <span className="text-[11px] px-2 py-0.5 rounded-full border border-border bg-muted/40 shrink-0">{STATUS[a.status]}</span>
      </div>
      {a.description && <p className="text-muted-foreground whitespace-pre-wrap">{a.description}</p>}
      {a.resource_url && <a href={a.resource_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline text-xs">Materijal <ExternalLink className="w-3 h-3" /></a>}
      {a.status === "reviewed" ? (
        <div className="space-y-2">
          {a.submission_text && <p className="rounded-xl bg-muted/40 p-2 whitespace-pre-wrap">{a.submission_text}</p>}
          {a.feedback && <p className="rounded-xl bg-accent/10 p-2"><b>Komentar profesora:</b> {a.feedback}</p>}
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea rows={3} placeholder="Tvoj odgovor…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button size="sm" className="rounded-full" disabled={busy} onClick={submit}>
            {a.status === "submitted" ? "Ažuriraj odgovor" : "Predaj"}
          </Button>
        </div>
      )}
    </div>
  );
}
