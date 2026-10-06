import { NavLink, useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/teacher/dashboard", label: "Pregled" },
  { to: "/teacher/students", label: "Učenici" },
  { to: "/teacher/availability", label: "Termini" },
  { to: "/teacher/profile", label: "Moj profil" },
];

export default function TeacherHeader() {
  const { signOut } = useAuth() as any;
  const navigate = useNavigate();
  return (
    <header className="border-b border-border/50 bg-cream/80 backdrop-blur-md sticky top-0 z-50">
      <div className="container flex items-center justify-between gap-3 h-14">
        <span className="font-display font-bold text-lg text-primary shrink-0 hidden sm:inline">Profesorski panel</span>
        <nav className="flex gap-1 overflow-x-auto no-scrollbar">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${isActive ? "bg-accent/15 text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Button variant="ghost" size="sm" className="shrink-0" onClick={async () => { await (signOut ? signOut() : supabase.auth.signOut()); navigate("/profesori/prijava"); }}>
          <LogOut className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Odjavi se</span>
        </Button>
      </div>
    </header>
  );
}
