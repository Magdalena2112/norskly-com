import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, FileText, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Status = "all" | "pending" | "approved" | "rejected";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

const statusLabel: Record<string, string> = {
  pending: "Na čekanju",
  approved: "Odobreno",
  rejected: "Odbijeno",
};

export default function AdminTeacherApplicationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-teacher-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = applications.filter((a) => {
    if (status !== "all" && a.status !== status) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.full_name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.languages.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Prijave profesora</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pregledaj, odobri ili odbij prijave kandidata za predavanje na platformi.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "approved", "rejected"] as Status[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                status === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {s === "all" ? "Sve" : statusLabel[s]}{" "}
              <span className="opacity-70 ml-1">({counts[s]})</span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži po imenu, emailu ili jeziku..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nema prijava za prikaz.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((app) => (
              <div
                key={app.id}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:shadow-soft transition-all"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-foreground truncate">{app.full_name}</h3>
                      <Badge variant="outline" className={statusStyles[app.status]}>
                        {statusLabel[app.status] ?? app.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{app.email}</p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>📚 {app.languages}</span>
                      <span>📅 {format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}</span>
                      {app.cv_path && <span>📎 CV priložen</span>}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate(`/admin/teacher-applications/${app.id}`)}
                    size="sm"
                    className="rounded-full"
                  >
                    Pregledaj <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
