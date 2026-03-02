import { supabase } from "@/integrations/supabase/client";

export interface ErrorEvent {
  category: string;
  topic: string;
  severity: number;
  example_wrong: string;
  example_correct: string;
}

export async function logErrors(
  userId: string,
  module: "grammar" | "vocabulary" | "talk",
  sourceType: string,
  errors: ErrorEvent[],
  context?: string,
  attemptNo?: number
) {
  if (!errors || errors.length === 0) return;

  const rows = errors.map((e) => ({
    user_id: userId,
    module,
    source_type: sourceType,
    category: e.category,
    topic: e.topic,
    severity: e.severity,
    example_wrong: e.example_wrong,
    example_correct: e.example_correct,
    context: context || null,
    attempt_no: attemptNo || null,
  }));

  const { error } = await supabase.from("error_events").insert(rows);
  if (error) {
    console.error("Failed to log errors:", error.message);
  }
}
