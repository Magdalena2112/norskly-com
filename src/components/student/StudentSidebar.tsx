import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, User, TrendingUp, Settings, LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/context/AuthContext";

const mainItems = [
  { title: "Dashboard", url: "/practice", icon: LayoutDashboard },
];

const accountItems = [
  { title: "Profil", url: "/profile", icon: User },
  { title: "Napredak", url: "/progress", icon: TrendingUp },
  { title: "Podešavanja", url: "/settings", icon: Settings },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const { pathname } = useLocation();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");

  const linkBase =
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200";
  const linkInactive = "text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground";
  const linkActive = "bg-accent text-accent-foreground shadow-sm";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center font-display font-bold text-accent-foreground shrink-0">
            N
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-lg text-primary-foreground">
              Norskly
            </span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-primary-foreground/50">Učenje</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={`${linkBase} ${isActive(item.url) ? linkActive : linkInactive}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-primary-foreground/50">Nalog</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      className={`${linkBase} ${isActive(item.url) ? linkActive : linkInactive}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Odjavi se"
              onClick={async () => {
                await signOut();
                navigate("/auth");
              }}
              className={`${linkBase} ${linkInactive}`}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Odjavi se</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
