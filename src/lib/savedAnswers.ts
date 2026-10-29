import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

/**
 * Persisted exercise answers: a drop-in replacement for useState that keeps a learner's
 * answers (and correct/incorrect status) on the device instantly and in the database,
 * scoped per user + lesson/page, so they survive reloads, tab switches and other devices.
 */
const mem = new Map<string, unknown>();
const listeners = new Map<string, Set<() => void>>();
const loaded = new Map<string, Promise<void>>();
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const lsKey = (uid: string, key: string) => `ans:${uid}:${key}`;
const notify = (k: string) => listeners.get(k)?.forEach((f) => f());

function readLocal(uid: string, key: string): unknown {
  const k = lsKey(uid, key);
  if (mem.has(k)) return mem.get(k);
  try { const raw = localStorage.getItem(k); if (raw != null) { const v = JSON.parse(raw); mem.set(k, v); return v; } } catch { /* ignore */ }
  return undefined;
}

function loadScope(uid: string, scope: string) {
  const id = `${uid}|${scope}`;
  if (!loaded.has(id)) {
    loaded.set(id, (async () => {
      const { data } = await supabase.from("exercise_answers").select("answer_key,state").eq("user_id", uid).eq("scope", scope);
      for (const row of data ?? []) {
        const k = lsKey(uid, row.answer_key);
        if (mem.has(k) && timers.has(k)) continue; // local unsaved edit wins
        const v = (row.state as { v?: unknown })?.v;
        if (v === undefined) continue;
        mem.set(k, v);
        try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* quota */ }
        notify(k);
      }
    })().catch(() => { loaded.delete(id); }));
  }
  return loaded.get(id)!;
}

function save(uid: string, scope: string, key: string, value: unknown) {
  const k = lsKey(uid, key);
  mem.set(k, value);
  try { localStorage.setItem(k, JSON.stringify(value)); } catch { /* quota */ }
  clearTimeout(timers.get(k));
  timers.set(k, setTimeout(async () => {
    timers.delete(k);
    await supabase.from("exercise_answers").upsert(
      { user_id: uid, answer_key: key, scope, state: { v: value } as never, updated_at: new Date().toISOString() },
      { onConflict: "user_id,answer_key" },
    );
  }, 600));
}

/** Current lesson/page scope: lesson id from the route or ?lesson=, else the path. */
export function useAnswerScope() {
  const { lessonId } = useParams<{ lessonId?: string }>();
  const loc = useLocation();
  const q = new URLSearchParams(loc.search).get("lesson");
  return lessonId || q || loc.pathname;
}

export function useSavedState<T>(name: string, initial: T | (() => T)): [T, (v: T | ((p: T) => T)) => void] {
  const { user } = useAuth();
  const scope = useAnswerScope();
  const uid = user?.id;
  const key = `${scope}:${name}`;
  const init = useRef(initial);
  init.current = initial;
  const [value, setValue] = useState<T>(() => {
    const saved = uid ? readLocal(uid, key) : undefined;
    if (saved !== undefined) return saved as T;
    const i = init.current;
    return typeof i === "function" ? (i as () => T)() : i;
  });
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!uid) return;
    const k = lsKey(uid, key);
    const sync = () => { if (mem.has(k)) setValue(mem.get(k) as T); };
    const local = readLocal(uid, key);
    if (local !== undefined) setValue(local as T);
    else { const i = init.current; setValue(typeof i === "function" ? (i as () => T)() : i); }
    if (!listeners.has(k)) listeners.set(k, new Set());
    listeners.get(k)!.add(sync);
    loadScope(uid, scope);
    return () => { listeners.get(k)?.delete(sync); };
  }, [uid, key, scope]);

  const set = useCallback((v: T | ((p: T) => T)) => {
    const next = typeof v === "function" ? (v as (p: T) => T)(valueRef.current) : v;
    valueRef.current = next;
    setValue(next);
    if (uid) save(uid, scope, key, next);
  }, [uid, scope, key]);

  return [value, set];
}
