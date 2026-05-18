import { useEffect, useRef, useState } from "react";
import StudentLayout from "@/components/student/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";
import { format } from "date-fns";
import { Mail, Calendar, Languages, CreditCard, Target, GraduationCap, Zap, Camera, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const PLAN_LABELS: Record<string, string> = {
  self: "Samostalno učenje",
  guided: "Učenje sa profesorom",
  premium: "Premium",
  free: "Besplatno",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);
  const [preferredLanguage, setPreferredLanguage] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<string | null>(null);
  const [xp, setXp] = useState<{ total_xp: number; level: number } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { code: langCode } = useSelectedLanguage();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: x }] = await Promise.all([
        supabase
          .from("profiles")
          .select("created_at, preferred_language, subscription_type, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_xp").select("total_xp, level").eq("user_id", user.id).eq("language", langCode).maybeSingle(),
      ]);
      setRegisteredAt(p?.created_at || user.created_at || null);
      setPreferredLanguage(p?.preferred_language || localStorage.getItem("norskly_selected_language"));
      setSubscription(p?.subscription_type || localStorage.getItem("norskly_selected_plan"));
      setAvatarUrl((p as any)?.avatar_url || null);
      setXp(x || { total_xp: 0, level: 1 });
    })();
  }, [user, langCode]);



  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Fajl prevelik", description: "Maksimum 5MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) {
      toast({ title: "Greška", description: upErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = pub.publicUrl;
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user.id);
    setUploading(false);
    if (dbErr) {
      toast({ title: "Greška", description: dbErr.message, variant: "destructive" });
      return;
    }
    setAvatarUrl(url);
    toast({ title: "Profilna slika ažurirana" });
  };

  const initials = (profile.name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const Row = ({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      <Icon className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <StudentLayout title="Profil">
      <div className="container max-w-3xl py-8 space-y-6">
        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-2 ring-accent">
                {avatarUrl && <AvatarImage src={avatarUrl} alt={profile.name || "avatar"} />}
                <AvatarFallback className="bg-primary text-primary-foreground font-display text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform disabled:opacity-60"
                aria-label="Promeni profilnu sliku"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-display font-bold text-foreground truncate">
                {profile.name || "Bez imena"}
              </h2>
              <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{profile.level}</Badge>
                {subscription && <Badge variant="outline">{PLAN_LABELS[subscription] || subscription}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Osnovne informacije</CardTitle>
            <CardDescription>Detalji o tvom Norskly nalogu.</CardDescription>
          </CardHeader>
          <CardContent>
            <Row icon={Mail} label="Email" value={user?.email} />
            <Row
              icon={Calendar}
              label="Datum registracije"
              value={registeredAt ? format(new Date(registeredAt), "dd.MM.yyyy") : "—"}
            />
            <Row icon={Languages} label="Jezik koji učiš" value={preferredLanguage || "norveški"} />
            <Row
              icon={CreditCard}
              label="Aktuelni plan"
              value={subscription ? PLAN_LABELS[subscription] || subscription : "—"}
            />
          </CardContent>
        </Card>

        <Card className="bg-background/90 backdrop-blur-sm border-border/30">
          <CardHeader>
            <CardTitle className="text-base">Učenje</CardTitle>
            <CardDescription>Ciljevi i napredak iz onboarding-a.</CardDescription>
          </CardHeader>
          <CardContent>
            <Row icon={Target} label="Cilj učenja" value={profile.learning_goal} />
            <Row icon={GraduationCap} label="Trenutni nivo" value={profile.level} />
            <Row
              icon={Zap}
              label="XP sažetak"
              value={xp ? `Nivo ${xp.level} · ${xp.total_xp} XP` : "—"}
            />
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
