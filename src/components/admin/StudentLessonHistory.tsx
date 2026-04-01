import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarDays } from "lucide-react";

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

interface Lesson {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  student_note: string | null;
}

export function StudentLessonHistory({ lessons, loading }: { lessons: Lesson[]; loading: boolean }) {
  if (loading) return <p className="text-muted-foreground">Učitavanje...</p>;

  if (lessons.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Nema zakazanih lekcija.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Datum</TableHead>
            <TableHead>Vreme</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Beleška</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lessons.map((l) => (
            <TableRow key={l.id}>
              <TableCell>{format(new Date(l.start_time), "dd.MM.yyyy")}</TableCell>
              <TableCell>
                {format(new Date(l.start_time), "HH:mm")} – {format(new Date(l.end_time), "HH:mm")}
              </TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[l.status] || "secondary"}>
                  {STATUS_LABELS[l.status] || l.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {l.student_note || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
