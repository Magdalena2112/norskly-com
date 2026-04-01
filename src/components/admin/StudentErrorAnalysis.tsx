import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface ErrorEvent {
  id: string;
  module: string;
  category: string;
  topic: string;
  example_wrong: string;
  example_correct: string;
  severity: number;
  created_at: string;
}

export function StudentErrorAnalysis({ errors, loading }: { errors: ErrorEvent[]; loading: boolean }) {
  if (loading) return <p className="text-muted-foreground">Učitavanje...</p>;

  if (errors.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">Nema zabeleženih grešaka.</p>
      </div>
    );
  }

  // Group by category for frequency analysis
  const categoryCount = errors.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      {/* Frequent mistake categories */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Najčešće kategorije grešaka</h3>
        <div className="flex flex-wrap gap-2">
          {sortedCategories.slice(0, 8).map(([cat, count]) => (
            <Badge key={cat} variant="secondary" className="gap-1">
              {cat} <span className="text-muted-foreground">({count})</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Recent errors table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Modul</TableHead>
              <TableHead>Kategorija</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Pogrešno</TableHead>
              <TableHead>Tačno</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {errors.slice(0, 20).map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <Badge variant="outline">{e.module}</Badge>
                </TableCell>
                <TableCell className="text-sm">{e.category}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{e.topic}</TableCell>
                <TableCell className="text-sm text-destructive">{e.example_wrong}</TableCell>
                <TableCell className="text-sm text-accent">{e.example_correct}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
