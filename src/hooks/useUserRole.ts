import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AppRole = "admin" | "admin_teacher" | "teacher" | "student" | "moderator" | "user";

export function useUserRole() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const roles = data?.map((r) => r.role as AppRole) ?? [];
  const isAdmin = roles.includes("admin") || roles.includes("admin_teacher");
  const isTeacher = roles.includes("teacher");
  const isStudent = !isAdmin && !isTeacher;

  return {
    roles,
    isAdmin,
    isTeacher,
    isStudent,
    loading: isLoading,
  };
}
