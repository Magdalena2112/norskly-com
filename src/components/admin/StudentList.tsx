import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StudentRow {
  user_id: string;
  display_name: string;
  level: string;
  learning_goal: string;
  total_xp: number;
  email?: string;
}

interface Props {
  students: StudentRow[];
  loading?: boolean;
}

export function StudentList({ students, loading }: Props) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const navigate = useNavigate();

  const filtered = students.filter((s) => {
    const matchesSearch =
      s.display_name.toLowerCase().includes(search.toLowerCase()) ||
      (s.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === "all" || s.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži po imenu ili emailu..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Nivo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Svi nivoi</SelectItem>
            {["A1", "A2", "B1", "B2", "C1"].map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {search || levelFilter !== "all" ? "Nema rezultata pretrage." : "Nema registrovanih studenata."}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ime</TableHead>
                <TableHead>Nivo</TableHead>
                <TableHead>Cilj</TableHead>
                <TableHead className="text-right">XP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow
                  key={s.user_id}
                  className="cursor-pointer hover:bg-accent/5"
                  onClick={() => navigate(`/admin/students/${s.user_id}`)}
                >
                  <TableCell className="font-medium">{s.display_name || "Bez imena"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{s.level}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{s.learning_goal || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{s.total_xp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
