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

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_xp")
      .select("total_xp, level")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setXp(data || { total_xp: 0, level: 1 }));
  }, [user]);

  return (
    <SidebarProvider defaultOpen>
      <div className="min-h-screen flex w-full bg-aurora">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-primary-foreground/10 bg-background/10 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6">
            <div className="flex items-center gap-2 min-w-0">
              <SidebarTrigger className="text-primary-foreground hover:bg-primary-foreground/10" />
              {title && (
                <h1 className="font-display font-semibold text-primary-foreground text-base sm:text-lg truncate">
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
                <span className="hidden sm:flex text-xs bg-primary/10 text-primary-foreground px-2.5 py-1 rounded-full font-semibold items-center gap-1 border border-primary-foreground/10">
                  <Zap className="w-3 h-3" /> {XP_TITLES[Math.min(xp.level, 10)] || `Lvl ${xp.level}`} · {xp.total_xp} XP
                </span>
              )}
              <span className="hidden md:inline text-xs bg-accent/20 text-primary-foreground px-3 py-1 rounded-full font-medium border border-primary-foreground/10">
                {profile.level} · {profile.learning_goal}
              </span>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
