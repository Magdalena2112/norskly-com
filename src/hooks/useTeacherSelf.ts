import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/** The signed-in teacher's own row. */
export function useTeacherSelf() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["teacher-self", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("teachers").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });
}
