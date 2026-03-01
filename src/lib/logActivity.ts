import { supabase } from "@/integrations/supabase/client";

type ActivityModule = "grammar" | "vocabulary" | "talk" | "quiz";

export async function logActivity(
  userId: string,
  module: ActivityModule,
  type: string,
  points: number,
  payload: Record<string, unknown> = {}
) {
  const { error } = await supabase.from("activities").insert({
    user_id: userId,
    module,
    type,
    points,
    payload,
  });

  if (error) {
    console.error("Failed to log activity:", error.message);
  }
}
