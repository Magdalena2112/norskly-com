import { supabase } from "@/integrations/supabase/client";
import { getCurrentLanguageCode } from "@/lib/currentLanguage";

type ActivityModule = "grammar" | "vocabulary" | "talk" | "quiz";

interface LogActivityOptions {
  /** Unique key to prevent duplicate XP awards (e.g. "quiz_abc123") */
  dedupKey?: string;
  /** Whether to check and award daily first-activity bonus (+5 XP) */
  checkDailyBonus?: boolean;
  /** Override the active learning language (defaults to localStorage). */
  language?: "no" | "en" | "de";
}

/**
 * Log an activity and award XP, scoped to the current learning language.
 * Norwegian and English XP/progress are tracked completely independently.
 */
export async function logActivity(
  userId: string,
  module: ActivityModule,
  type: string,
  points: number,
  payload: Record<string, unknown> = {},
  options: LogActivityOptions = {}
): Promise<{ total_xp: number; level: number; daily_bonus: number; points_awarded: number } | null> {
  const { dedupKey, checkDailyBonus = false, language } = options;
  const langCode = language || getCurrentLanguageCode();

  const insertData = {
    user_id: userId,
    module,
    type,
    points,
    payload: payload as any,
    dedup_key: dedupKey || null,
    language: langCode,
  };

  const { error: actError } = await supabase.from("activities").insert([insertData] as any);

  if (actError) {
    if (actError.code === "23505") {
      console.log("Activity already logged (dedup):", dedupKey);
      return null;
    }
    console.error("Failed to log activity:", actError.message);
    return null;
  }

  const { data, error: xpError } = await supabase.rpc("award_xp", {
    _user_id: userId,
    _points: points,
    _check_daily_bonus: checkDailyBonus,
    _language: langCode,
  } as any);

  if (xpError) {
    console.error("Failed to award XP:", xpError.message);
    return null;
  }

  return data as any;
}
