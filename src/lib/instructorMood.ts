import type { SupabaseClient } from "@supabase/supabase-js";
import { getShopItem } from "@/lib/gamification";
import type { InstructorMood } from "@/lib/characterLayers";

const STORAGE_KEY = (userId: string) => `kava-instructor-mood:${userId}`;

export type PersistedInstructorMood = "happy" | "angry";

export function readPersistedInstructorMood(
  userId: string,
): PersistedInstructorMood | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(STORAGE_KEY(userId));
    if (value === "angry" || value === "happy") return value;
    return null;
  } catch {
    return null;
  }
}

export function writePersistedInstructorMood(
  userId: string,
  mood: PersistedInstructorMood,
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY(userId), mood);
  } catch {
    // Private mode / quota — mood still works for this page load.
  }
}

/** Like and other refreshments cheer Kava; equipment does not. */
export function itemCheersInstructor(itemId: string): boolean {
  return getShopItem(itemId)?.kind === "refreshment";
}

/**
 * True when the two latest daily-login streak awards are more than one
 * calendar day apart — i.e. this login already reset a broken streak.
 */
export async function latestLoginBrokeStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("coin_ledger")
    .select("ref_id")
    .eq("user_id", userId)
    .eq("reason", "streak")
    .eq("ref_type", "daily_login")
    .order("ref_id", { ascending: false })
    .limit(2);

  if (error || !data || data.length < 2) return false;

  const latest = Date.parse(`${String(data[0].ref_id)}T00:00:00Z`);
  const previous = Date.parse(`${String(data[1].ref_id)}T00:00:00Z`);
  if (Number.isNaN(latest) || Number.isNaN(previous)) return false;

  const diffDays = Math.round((latest - previous) / 86_400_000);
  return diffDays > 1;
}

/** Keep angry until Like / refreshment; a later same-day streak RPC must not reset it. */
export function resolveMoodAfterStreak(opts: {
  userId: string;
  wasStreakBroken: boolean;
  ledgerBrokeStreak: boolean;
}): InstructorMood {
  const { userId, wasStreakBroken, ledgerBrokeStreak } = opts;

  if (wasStreakBroken) {
    writePersistedInstructorMood(userId, "angry");
    return "angry";
  }

  const stored = readPersistedInstructorMood(userId);
  if (stored === "angry") return "angry";
  if (stored === "happy") return "happy";

  if (ledgerBrokeStreak) {
    writePersistedInstructorMood(userId, "angry");
    return "angry";
  }

  return "happy";
}
