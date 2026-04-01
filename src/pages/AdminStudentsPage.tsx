import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StudentList } from "@/components/admin/StudentList";

export default function AdminStudentsPage() {
  const { data: profiles = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: xpData = [], isLoading: xpLoading } = useQuery({
    queryKey: ["admin-all-xp"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_xp").select("user_id, total_xp, level");
      if (error) throw error;
      return data;
    },
  });

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

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Svi studenti</h1>
        <StudentList students={studentProfiles} loading={profilesLoading || xpLoading} />
      </div>
    </AdminLayout>
  );
}
