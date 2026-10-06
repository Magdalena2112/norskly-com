import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Loader2 } from "lucide-react";

/** Separate teacher entry: /profesori/prijava (login) and /profesori/aktivacija (set password). */
export default function TeacherAuthPage({ mode }: { mode: "login" | "activate" }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [email, setEmail] = useState(params.get("email") || "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [hasAccount, setHasAccount] = useState(mode === "login");

  const claimAndEnter = async () => {
    const { data, error } = await supabase.rpc("claim_teacher_account");
    await qc.invalidateQueries({ queryKey: ["user-role"] });
    if (error || !data) {
      // maybe admin, or already linked teacher
      const { data: t } = await supabase.from("teachers").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle();
      if (t) return navigate("/teacher/dashboard", { replace: true });
      toast({
        title: "Nalog nije profesorski",
        description: "Za ovaj email ne postoji odobrena prijava za profesora.",
        variant: "destructive",
      });
      return;
    }
    navigate("/teacher/dashboard", { replace: true });
  };

  // Already signed in (e.g. returned from confirmation link) → link account and enter
  useEffect(() => {
    if (user) claimAndEnter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (hasAccount) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (password.length < 8) throw new Error("Lozinka mora imati najmanje 8 karaktera.");
        if (password !== password2) throw new Error("Lozinke se ne poklapaju.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/profesori/aktivacija` },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      }
    } catch (err: any) {
      toast({ title: "Greška", description: err.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-fjord-soft flex items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md bg-background/90 backdrop-blur-sm border-border/30 rounded-3xl">
        <CardContent className="py-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {mode === "activate" ? "Dobrodošao u Norskly profesorski tim" : "Prijava za profesore"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {mode === "activate"
                ? "Postavi lozinku i pristupi svom profesorskom radnom prostoru."
                : "Ulaz u radni prostor za časove, učenike i domaće zadatke."}
            </p>
          </div>

          {sent ? (
            <div className="rounded-2xl bg-accent/10 border border-accent/30 p-4 text-sm text-foreground text-center">
              Poslali smo ti email za potvrdu adrese. Klikni na link u poruci i automatski ćeš ući u profesorski panel.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {mode === "activate" && (
                <div className="grid grid-cols-2 gap-2 rounded-full bg-muted/50 p-1 text-sm">
                  <button type="button" onClick={() => setHasAccount(false)} className={`rounded-full py-2 ${!hasAccount ? "bg-background shadow font-medium" : "text-muted-foreground"}`}>
                    Novi nalog
                  </button>
                  <button type="button" onClick={() => setHasAccount(true)} className={`rounded-full py-2 ${hasAccount ? "bg-background shadow font-medium" : "text-muted-foreground"}`}>
                    Već imam nalog
                  </button>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="t-email">Email</Label>
                <Input id="t-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="t-pass">Lozinka</Label>
                <Input id="t-pass" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {!hasAccount && (
                <div className="space-y-1.5">
                  <Label htmlFor="t-pass2">Potvrdi lozinku</Label>
                  <Input id="t-pass2" type="password" required value={password2} onChange={(e) => setPassword2(e.target.value)} />
                </div>
              )}
              <Button type="submit" className="w-full rounded-full" disabled={busy}>
                {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {hasAccount ? "Prijavi se" : "Aktiviraj nalog"}
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-muted-foreground space-y-1">
            {mode === "login" ? (
              <p>Tvoja prijava je odobrena? <Link to="/profesori/aktivacija" className="text-primary underline">Aktiviraj nalog</Link></p>
            ) : (
              <p>Već si aktivirao nalog? <Link to="/profesori/prijava" className="text-primary underline">Prijava</Link></p>
            )}
            <p>Želiš da predaješ? <Link to="/za-profesore" className="text-primary underline">Pošalji prijavu</Link></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
