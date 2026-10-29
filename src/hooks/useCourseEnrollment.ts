import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { CourseType } from "@/lib/courseAccess";
import { useSelectedCourse } from "./useSelectedCourse";
export function useCourseEnrollment(language: string) {
  const { user } = useAuth();
  const selected = useSelectedCourse(language);
  return useQuery({
    queryKey: ["course-enrollment", user?.id, language, selected],
    enabled: !!user,
    queryFn: async (): Promise<CourseType | null> => {
      if (!user) return null;
      const { data, error } = await supabase.from("course_enrollments").select("course_type").eq("user_id", user.id).eq("language", language).eq("course_type", selected).eq("onboarding_completed", true).maybeSingle();
      if (error) throw error;
      return data?.course_type === "health" ? "health" : data?.course_type === "general" ? "general" : null;
    },
  });
}