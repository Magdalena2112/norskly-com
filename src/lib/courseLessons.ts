import img1 from "@/assets/lessons/no-a1-1.jpg";
import img2 from "@/assets/lessons/no-a1-2.jpg";
import img3 from "@/assets/lessons/no-a1-3.jpg";
import { supabase } from "@/integrations/supabase/client";

export interface LessonSegment { speaker?: string; text: string; translation?: string }
export interface LessonWord { word: string; translation: string }
export interface LessonGrammar { title: string; explanation: string; examples?: string[] }

export interface CourseLesson {
  id: string;
  language: string;
  cefr_level: string;
  sort_order: number;
  title: string;
  title_target: string;
  summary: string;
  goals: string[];
  illustration_url: string | null;
  text_title: string;
  text_segments: LessonSegment[];
  vocabulary: LessonWord[];
  grammar: LessonGrammar[];
}

/** Bundled illustrations referenced by key; full URLs are used as-is. */
const ILLUSTRATIONS: Record<string, string> = { "no-a1-1": img1, "no-a1-2": img2, "no-a1-3": img3 };

export function lessonImage(key: string | null): string | null {
  if (!key) return null;
  return ILLUSTRATIONS[key] ?? (key.startsWith("http") ? key : null);
}

const VOICE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/talk-voice`;
const audioCache = new Map<string, string>();

/** Natural AI voice for a lesson sentence; cached per session. */
export async function speakUrl(text: string, language: string): Promise<string> {
  const key = `${language}:${text}`;
  const hit = audioCache.get(key);
  if (hit) return hit;
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const r = await fetch(VOICE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, language }),
  });
  if (!r.ok) throw new Error("tts");
  const url = URL.createObjectURL(await r.blob());
  audioCache.set(key, url);
  return url;
}
