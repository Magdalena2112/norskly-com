import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Camera, Plus, X, Save, Loader2 } from "lucide-react";
import TeacherHeader from "@/components/teacher/TeacherHeader";
import { useTeacherSelf } from "@/hooks/useTeacherSelf";

export default function TeacherOwnProfilePage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: teacher, isLoading } = useTeacherSelf();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [newFocus, setNewFocus] = useState("");
  const [meetLink, setMeetLink] = useState("");
  const [email, setEmail] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!teacher) return;
    setName(teacher.name || "");
    setBio(teacher.bio || "");
    setFocus(teacher.focus || []);
    setMeetLink(teacher.meet_link || "");
    setEmail(teacher.email || "");
    setPhotoUrl(teacher.photo_url);
  }, [teacher]);

  const save = useMutation({
    mutationFn: async () => {
      if (!teacher) throw new Error("Profil nije pronađen");
      const { error } = await supabase.from("teachers").update({
        name: name.trim(), bio, focus, meet_link: meetLink.trim() || null, email: email.trim() || null, photo_url: photoUrl,
      }).eq("id", teacher.id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Profil sačuvan!" }); qc.invalidateQueries({ queryKey: ["teacher-self"] }); },
    onError: (e: any) => toast({ title: "Greška", description: e.message, variant: "destructive" }),
  });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const path = `${user.id}/photo-${Date.now()}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage.from("teacher-photos").upload(path, file, { upsert: true });
      if (error) throw error;
      setPhotoUrl(supabase.storage.from("teacher-photos").getPublicUrl(path).data.publicUrl);
      toast({ title: "Fotografija otpremljena", description: "Klikni „Sačuvaj“ da bi se primenila." });
    } catch (err: any) {
      toast({ title: "Greška pri otpremanju", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addFocus = () => {
    const t = newFocus.trim();
    if (t && !focus.includes(t)) { setFocus([...focus, t]); setNewFocus(""); }
  };

  const cardCls = "bg-background/85 backdrop-blur-sm border-border/30 rounded-3xl";

  return (
    <div className="min-h-screen bg-fjord-soft">
      <TeacherHeader />
      <div className="container max-w-2xl py-8 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">Moj profil</h1>
                <p className="text-sm text-muted-foreground mt-1">Ovo vide učenici kada biraju profesora.</p>
              </div>
              <Button onClick={() => save.mutate()} disabled={save.isPending || !name.trim()}>
                {save.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}Sačuvaj
              </Button>
            </div>

            <Card className={cardCls}>
              <CardHeader><CardTitle className="text-lg">Fotografija</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-border">
                    <AvatarImage src={photoUrl || undefined} alt={name} />
                    <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">{name.split(" ").map((n) => n[0]).join("").slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center cursor-pointer hover:opacity-90">
                    <Camera className="w-4 h-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={upload} disabled={uploading} />
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {uploading ? <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Otpremanje...</span> : "Klikni na ikonu kamere da promeniš fotografiju."}
                </p>
              </CardContent>
            </Card>

            <Card className={cardCls}>
              <CardHeader><CardTitle className="text-lg">Osnovni podaci</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Ime i prezime</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Biografija</label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} maxLength={2000} placeholder="Kratko predstavi sebe i svoj način rada..." />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Link za video poziv (Meet/Zoom)</label>
                  <Input value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/..." />
                  <p className="text-xs text-muted-foreground mt-1">Učenik dobija ovaj link nakon rezervacije.</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email za obaveštenja</label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <p className="text-xs text-muted-foreground mt-1">Na ovu adresu stižu potvrde o zakazanim časovima.</p>
                </div>
              </CardContent>
            </Card>

            <Card className={cardCls}>
              <CardHeader><CardTitle className="text-lg">Oblasti podučavanja</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {focus.map((f) => (
                    <Badge key={f} variant="secondary" className="gap-1 pr-1">
                      {f}
                      <button onClick={() => setFocus(focus.filter((x) => x !== f))} className="ml-1 hover:text-destructive"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={newFocus} onChange={(e) => setNewFocus(e.target.value)} placeholder="npr. Konverzacija, Norskprøve..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFocus())} />
                  <Button variant="outline" size="icon" onClick={addFocus} disabled={!newFocus.trim()}><Plus className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
