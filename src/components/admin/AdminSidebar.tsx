import { LayoutDashboard, Users, CalendarDays, Clock, UserCog, LogOut, GraduationCap, UserCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const groups = [
  {
    label: "Pregled",
    items: [{ title: "Kontrolna tabla", url: "/admin/dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Ljudi",
    items: [
      { title: "Prijave profesora", url: "/admin/teacher-applications", icon: GraduationCap, badge: true },
      { title: "Profesori", url: "/admin/teachers", icon: UserCheck },
      { title: "Učenici", url: "/admin/students", icon: Users },
    ],
  },
  {
    label: "Nastava",
    items: [
      { title: "Časovi", url: "/admin/lessons", icon: CalendarDays },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const { data: pendingCount = 0 } = useQuery({
    queryKey: ["admin-pending-applications-count"],
    queryFn: async () => {
      const { count } = await supabase
        .from("teacher_applications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      return count ?? 0;
    },
    staleTime: 60_000,
  });

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item: any) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <NavLink to={item.url} end={item.url === "/admin/dashboard"} className="hover:bg-sidebar-accent/50" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {!collapsed && item.badge && pendingCount > 0 && (
                          <span className="ml-auto rounded-full bg-accent text-accent-foreground text-xs px-2 py-0.5">
                            {pendingCount}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button
                onClick={async () => { await signOut(); navigate("/auth"); }}
                className="flex items-center w-full hover:bg-sidebar-accent/50 text-sidebar-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {!collapsed && <span>Odjavi se</span>}
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
