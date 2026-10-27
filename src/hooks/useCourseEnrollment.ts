import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { CourseType } from "@/lib/courseAccess";
export function useCourseEnrollment(language: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["course-enrollment", user?.id, language],
    enabled: !!user,
    queryFn: async (): Promise<CourseType | null> => {
      if (!user) return null;
      const { data, error } = await supabase.from("language_profiles").select("course_type").eq("user_id", user.id).eq("language", language).maybeSingle();
      if (error) throw error;
      return data?.course_type === "health" ? "health" : data?.course_type === "general" ? "general" : null;
    },
  });
}