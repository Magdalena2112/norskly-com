import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "@/components/student/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { LogOut, CreditCard, Shield } from "lucide-react";

export default function SettingsPage() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const [uiLang, setUiLang] = useState<string>(() => localStorage.getItem("norskly_ui_language") || "sr");
  const [emailNotif, setEmailNotif] = useState<boolean>(() => localStorage.getItem("norskly_email_notifications") !== "false");
  const [reminders, setReminders] = useState<boolean>(() => localStorage.getItem("norskly_reminders") !== "false");
  const [shareWithTeacher, setShareWithTeacher] = useState<boolean>(() => localStorage.getItem("norskly_share_with_teacher") === "true");
  const [password, setPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [subscription, setSubscription] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_type")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setSubscription(data?.subscription_type || null));
  }, [user]);

  const persist = (key: string, value: string) => {
    localStorage.setItem(key, value);
    toast({ title: "Sačuvano", description: "Tvoja podešavanja su ažurirana." });
  };

  const changePassword = async () => {
    if (password.length < 8) {
      toast({ title: "Lozinka prekratka", description: "Minimum 8 karaktera.", variant: "destructive" });
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      toast({ title: "Greška", description: error.message, variant: "destructive" });
    } else {
      setPassword("");
      toast({ title: "Lozinka promenjena", description: "Tvoja lozinka je uspešno ažurirana." });
    }
  };

  return (
    <StudentLayout title="Podešavanja">
      <div className="container max-w-3xl py-8 space-y-6">
        {/* Interface */}
        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Interfejs</CardTitle>
            <CardDescription>Jezik aplikacije i prikaza.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Label>Jezik interfejsa</Label>
              <Select
                value={uiLang}
                onValueChange={(v) => {
                  setUiLang(v);
                  persist("norskly_ui_language", v);
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sr">Srpski</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="no">Norsk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Obaveštenja</CardTitle>
            <CardDescription>Kontroliši mejlove i podsetnike.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email obaveštenja</Label>
                <p className="text-xs text-muted-foreground">Novosti, nove lekcije, najave.</p>
              </div>
              <Switch
                checked={emailNotif}
                onCheckedChange={(v) => {
                  setEmailNotif(v);
                  persist("norskly_email_notifications", String(v));
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Podsetnici za učenje</Label>
                <p className="text-xs text-muted-foreground">Dnevni podsetnik da nastaviš sa vežbom.</p>
              </div>
              <Switch
                checked={reminders}
                onCheckedChange={(v) => {
                  setReminders(v);
                  persist("norskly_reminders", String(v));
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" /> Privatnost
            </CardTitle>
            <CardDescription>Šta deliš sa profesorima.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Podeli napredak sa profesorom</Label>
                <p className="text-xs text-muted-foreground">Profesori sa kojima imaš čas vide tvoju analitiku.</p>
              </div>
              <Switch
                checked={shareWithTeacher}
                onCheckedChange={(v) => {
                  setShareWithTeacher(v);
                  persist("norskly_share_with_teacher", String(v));
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Password */}
        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Promena lozinke</CardTitle>
            <CardDescription>Unesi novu lozinku (min 8 karaktera).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nova lozinka"
            />
            <Button onClick={changePassword} disabled={savingPassword || !password}>
              {savingPassword ? "Čuvam..." : "Sačuvaj lozinku"}
            </Button>
          </CardContent>
        </Card>

        {/* Subscription */}
        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Pretplata i naplata
            </CardTitle>
            <CardDescription>Tvoj trenutni plan.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="text-sm text-foreground">
              Aktuelni plan: <span className="font-semibold">{subscription || "—"}</span>
            </p>
            <Button variant="outline" onClick={() => navigate("/onboarding")}>
              Promeni plan
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-background/90 backdrop-blur-sm border-destructive/20">
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">Odjavi se</p>
              <p className="text-xs text-muted-foreground">Završi trenutnu sesiju.</p>
            </div>
            <Button
              variant="destructive"
              onClick={async () => {
                await signOut();
                navigate("/auth");
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Odjavi se
            </Button>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
