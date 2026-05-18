import { ReactNode, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "./StudentSidebar";
import { Button } from "@/components/ui/button";
import { Shield, Zap } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { supabase } from "@/integrations/supabase/client";
import { useSelectedLanguage } from "@/hooks/useSelectedLanguage";


const XP_TITLES: Record<number, string> = {
  1: "Utforsker", 2: "Lærling", 3: "Kommunikatør", 4: "Taler", 5: "Trygg taler",
  6: "Avansert kommunikatør", 7: "Flytende", 8: "Dyktig", 9: "Ekspert", 10: "Norskly-mester",
};

interface StudentLayoutProps {
  children: ReactNode;
  title?: string;
}

export default function StudentLayout({ children, title }: StudentLayoutProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const [xp, setXp] = useState<{ total_xp: number; level: number } | null>(null);
  const { code: langCode } = useSelectedLanguage();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", user.id)
      .eq("language", langCode)
      .maybeSingle()
      .then(({ data }) => setXp(data || { total_xp: 0, level: 1 }));
  }, [user, langCode]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-fjord-soft relative">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0 relative">
          <header className="h-14 border-b border-border/40 bg-cream/70 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="text-primary hover:bg-primary/10" />
              {title && (
                <h1 className="font-display font-semibold text-primary text-base sm:text-lg truncate">
                  {title}
                </h1>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button variant="outline" size="sm" onClick={() => navigate("/admin/dashboard")} className="gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Admin</span>
                </Button>
              )}
              {xp && (
                <span className="hidden sm:flex text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold items-center gap-1 border border-primary/15">
                  <Zap className="w-3 h-3" /> {XP_TITLES[Math.min(xp.level, 10)] || `Lvl ${xp.level}`} · {xp.total_xp} XP
                </span>
              )}
              <span className="hidden md:inline text-xs bg-accent/30 text-primary px-3 py-1 rounded-full font-medium border border-accent/30">
                {profile.level} · {profile.learning_goal}
              </span>
            </div>
          </header>
          <main className="flex-1 relative">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
