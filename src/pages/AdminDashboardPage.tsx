import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StudentSummaryCards } from "@/components/admin/StudentSummaryCards";
import { StudentList } from "@/components/admin/StudentList";
import { subDays } from "date-fns";

export default function AdminDashboardPage() {
  // Fetch profiles
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  // Fetch XP for all users
  const { data: xpData = [], isLoading: xpLoading } = useQuery({
    queryKey: ["admin-all-xp"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_xp").select("user_id, total_xp, level");
      if (error) throw error;
      return data;
    },
  });

  // Fetch recent activities (last 7 days)
  const { data: recentActivities = [] } = useQuery({
    queryKey: ["admin-recent-activities"],
    queryFn: async () => {
      const weekAgo = subDays(new Date(), 7).toISOString();
      const { data, error } = await supabase
        .from("activities")
        .select("user_id")
        .gte("created_at", weekAgo);
      if (error) throw error;
      return data;
    },
  });

  // Fetch all lessons count
  const { data: lessons = [] } = useQuery({
    queryKey: ["admin-all-lessons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("lessons").select("id");
      if (error) throw error;
      return data;
    },
  });

  // Filter out admin profiles — show only students
  const { data: roles = [] } = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return data;
    },
  });

  const adminUserIds = new Set(
    roles.filter((r) => r.role === "admin" || r.role === "admin_teacher").map((r) => r.user_id)
  );

  const xpMap = new Map(xpData.map((x) => [x.user_id, x.total_xp]));

  const studentProfiles = profiles
    .filter((p) => !adminUserIds.has(p.user_id))
    .map((p) => ({
      user_id: p.user_id,
      display_name: p.display_name || "",
      level: p.level || "A1",
      learning_goal: p.learning_goal || "",
      total_xp: xpMap.get(p.user_id) ?? 0,
    }));

  const activeThisWeek = new Set(recentActivities.map((a) => a.user_id)).size;
  const avgXp = studentProfiles.length > 0
    ? Math.round(studentProfiles.reduce((sum, s) => sum + s.total_xp, 0) / studentProfiles.length)
    : 0;

  const loading = profilesLoading || xpLoading;

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Kontrolna tabla</h1>

        <StudentSummaryCards
          totalStudents={studentProfiles.length}
          activeThisWeek={activeThisWeek}
          totalLessons={lessons.length}
          avgXp={avgXp}
          loading={loading}
        />

        <div>
          <h2 className="text-lg font-semibold text-foreground mb-3">Studenti</h2>
          <StudentList students={studentProfiles} loading={loading} />
        </div>
      </div>
    </AdminLayout>
  );
}
