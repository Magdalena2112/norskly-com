import { supabase } from "@/integrations/supabase/client";

type ActivityModule = "grammar" | "vocabulary" | "talk" | "quiz";

interface LogActivityOptions {
  /** Unique key to prevent duplicate XP awards (e.g. "quiz_abc123") */
  dedupKey?: string;
  /** Whether to check and award daily first-activity bonus (+5 XP) */
  checkDailyBonus?: boolean;
}

/**
 * Log an activity and award XP.
 * - dedupKey prevents duplicate rewards for the same action
 * - checkDailyBonus awards +5 XP for first activity of the day
 * Returns the XP result or null on failure.
 */
export async function logActivity(
  userId: string,
  module: ActivityModule,
  type: string,
  points: number,
  payload: Record<string, unknown> = {},
  options: LogActivityOptions = {}
): Promise<{ total_xp: number; level: number; daily_bonus: number; points_awarded: number } | null> {
  const { dedupKey, checkDailyBonus = false } = options;

  // Insert activity with optional dedup key
  const insertData = {
    user_id: userId,
    module,
    type,
    points,
    payload: payload as any,
    dedup_key: dedupKey || null,
  };

  const { error: actError } = await supabase.from("activities").insert([insertData] as any);

  if (actError) {
    // Duplicate key = already rewarded, skip silently
    if (actError.code === "23505") {
      console.log("Activity already logged (dedup):", dedupKey);
      return null;
    }
    console.error("Failed to log activity:", actError.message);
    return null;
  }

  // Award XP via DB function
  const { data, error: xpError } = await supabase.rpc("award_xp", {
    _user_id: userId,
    _points: points,
    _check_daily_bonus: checkDailyBonus,
  });

  if (xpError) {
    console.error("Failed to award XP:", xpError.message);
    return null;
  }

  return data as any;
}
