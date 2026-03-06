import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Plus, X, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import teacherPhotoFallback from "@/assets/teacher-photo.jpg";

export default function AdminTeacherProfilePage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [newFocus, setNewFocus] = useState("");
  const [rating, setRating] = useState("4.9");
  const [studentsCount, setStudentsCount] = useState("120");
  const [meetLink, setMeetLink] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teacher_profile")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setBio(profile.bio);
      setFocus(profile.focus || []);
      setRating(String(profile.rating));
      setStudentsCount(String(profile.students_count));
      setMeetLink((profile as any).meet_link || "");
      setPhotoUrl(profile.photo_url);
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile found");
      const { error } = await supabase
        .from("teacher_profile")
        .update({
          name,
          bio,
          focus,
          rating: parseFloat(rating),
          students_count: parseInt(studentsCount),
          photo_url: photoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Profil sačuvan!" });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile"] });
    },
    onError: (e: any) => {
      toast({ title: "Greška", description: e.message, variant: "destructive" });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `teacher-photo-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("teacher-photos")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("teacher-photos")
        .getPublicUrl(fileName);

      setPhotoUrl(urlData.publicUrl);
      toast({ title: "Fotografija otpremljena!" });
    } catch (err: any) {
      toast({ title: "Greška pri otpremanju", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const addFocusItem = () => {
    const trimmed = newFocus.trim();
    if (trimmed && !focus.includes(trimmed)) {
      setFocus([...focus, trimmed]);
      setNewFocus("");
    }
  };

  const removeFocusItem = (item: string) => {
    setFocus(focus.filter((f) => f !== item));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayPhoto = photoUrl || teacherPhotoFallback;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/lessons")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-display font-bold text-lg text-foreground">Uredi profil nastavnika</span>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Sačuvaj
          </Button>
        </div>
      </header>

      <div className="container max-w-2xl py-8 space-y-6">
        {/* Photo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Fotografija</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-border">
                <AvatarImage src={displayPhoto} alt={name} />
                <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
                  {name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
              </label>
            </div>
            <div className="text-sm text-muted-foreground">
              {uploading ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Otpremanje...</span>
              ) : (
                "Klikni na ikonu kamere da promeniš fotografiju."
              )}
            </div>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Osnovni podaci</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Ime i prezime</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ime nastavnika" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Biografija</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Kratka biografija..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Ocena</label>
                <Input type="number" step="0.1" min="0" max="5" value={rating} onChange={(e) => setRating(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Broj studenata</label>
                <Input type="number" min="0" value={studentsCount} onChange={(e) => setStudentsCount(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Focus */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Oblasti podučavanja</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {focus.map((f) => (
                <Badge key={f} variant="secondary" className="gap-1 pr-1">
                  {f}
                  <button onClick={() => removeFocusItem(f)} className="ml-1 hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newFocus}
                onChange={(e) => setNewFocus(e.target.value)}
                placeholder="Nova oblast..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addFocusItem())}
              />
              <Button variant="outline" size="icon" onClick={addFocusItem} disabled={!newFocus.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
