import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft, Check, X, FileText, Download, Mail, Languages,
  Calendar, ShieldCheck, ShieldX, Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

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

export default function AdminTeacherApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [acting, setActing] = useState<"approve" | "reject" | null>(null);

  const { data: app, isLoading } = useQuery({
    queryKey: ["teacher-application", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_applications")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (app?.admin_notes) setNotes(app.admin_notes);
  }, [app?.admin_notes]);

  useEffect(() => {
    if (!app?.cv_path) {
      setCvUrl(null);
      return;
    }
    supabase.storage
      .from("teacher-cvs")
      .createSignedUrl(app.cv_path, 60 * 60)
      .then(({ data }) => setCvUrl(data?.signedUrl ?? null));
  }, [app?.cv_path]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!id) return;
    setActing(action);
    try {
      const fn = action === "approve" ? "approve_teacher_application" : "reject_teacher_application";
      const { data, error } = await supabase.rpc(fn as any, {
        _application_id: id,
        _notes: notes || null,
      });
      if (error) throw error;

      if (action === "approve") {
        const result = data as { role_granted?: boolean } | null;
        toast({
          title: "Prijava odobrena",
          description: result?.role_granted
            ? "Kandidat je dobio pristup profesorskim alatima."
            : "Status ažuriran. Korisnički nalog nije pronađen — uloga će biti dodeljena kada se registruje sa istim email-om.",
        });
      } else {
        toast({ title: "Prijava odbijena", description: "Status je ažuriran." });
      }

      await qc.invalidateQueries({ queryKey: ["teacher-application", id] });
      await qc.invalidateQueries({ queryKey: ["admin-teacher-applications"] });
    } catch (err: any) {
      toast({
        title: "Greška",
        description: err.message ?? "Nije uspelo ažuriranje.",
        variant: "destructive",
      });
    } finally {
      setActing(null);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-muted-foreground">Učitavanje...</div>
      </AdminLayout>
    );
  }

  if (!app) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Prijava nije pronađena.</p>
          <Button onClick={() => navigate("/admin/teacher-applications")} className="mt-4">
            Nazad na listu
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const isPending = app.status === "pending";

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/admin/teacher-applications")}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Nazad na prijave
        </button>

        {/* Header card */}
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
                {app.full_name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> {app.email}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5" /> {app.languages}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(app.created_at), "dd.MM.yyyy HH:mm")}
                </span>
              </div>
            </div>
            <Badge variant="outline" className={`${statusStyles[app.status]} text-sm px-3 py-1`}>
              {statusLabel[app.status] ?? app.status}
            </Badge>
          </div>

          {app.reviewed_at && (
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Pregledano: {format(new Date(app.reviewed_at), "dd.MM.yyyy HH:mm")}
            </div>
          )}
        </div>

        {/* Bio */}
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-semibold text-foreground mb-3">Biografija</h2>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {app.bio}
          </p>
        </div>

        {/* Experience */}
        {app.experience && (
          <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-semibold text-foreground mb-3">Iskustvo u nastavi</h2>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
              {app.experience}
            </p>
          </div>
        )}

        {/* CV */}
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <h2 className="font-semibold text-foreground mb-3 inline-flex items-center gap-2">
            <FileText className="w-4 h-4" /> CV kandidata
          </h2>
          {app.cv_path ? (
            cvUrl ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-border overflow-hidden bg-secondary/40">
                  <iframe
                    src={cvUrl}
                    title="CV preview"
                    className="w-full h-[500px]"
                  />
                </div>
                <a
                  href={cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <Download className="w-4 h-4" /> Preuzmi CV
                </a>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Učitavanje pregleda...</p>
            )
          ) : (
            <p className="text-sm text-muted-foreground">Kandidat nije priložio CV.</p>
          )}
        </div>

        {/* Admin notes + actions */}
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="notes">Beleške administratora (opciono)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Razlog odluke, dodatne napomene..."
              rows={4}
              maxLength={2000}
              className="rounded-xl resize-none"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleAction("approve")}
              disabled={acting !== null || app.status === "approved"}
              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              {acting === "approve" ? "Odobravanje..." : "Odobri prijavu"}
            </Button>
            <Button
              onClick={() => handleAction("reject")}
              disabled={acting !== null || app.status === "rejected"}
              variant="outline"
              className="rounded-full border-rose-300 text-rose-700 hover:bg-rose-50"
            >
              <ShieldX className="w-4 h-4 mr-1.5" />
              {acting === "reject" ? "Odbijanje..." : "Odbij prijavu"}
            </Button>
          </div>

          {!isPending && (
            <p className="text-xs text-muted-foreground">
              Status je već postavljen na <strong>{statusLabel[app.status]}</strong>. Možeš ga
              promeniti klikom na drugu akciju.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
