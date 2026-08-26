import type { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_PREFIX = "mel-lesson-steps:";

export type LessonStepStored = {
  unlockedStepIndex: number;
  completed: boolean;
  savedAt: string;
};

export function lessonStepStorageKey(userId: string, lessonId: string) {
  return `${STORAGE_PREFIX}${userId}:${lessonId}`;
}

export function loadLessonStepProgress(
  userId: string,
  lessonId: string,
): LessonStepStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(lessonStepStorageKey(userId, lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LessonStepStored;
    if (
      typeof parsed?.unlockedStepIndex !== "number" ||
      parsed.unlockedStepIndex < 0
    ) {
      return null;
    }
    return {
      unlockedStepIndex: parsed.unlockedStepIndex,
      completed: Boolean(parsed.completed),
      savedAt: parsed.savedAt || "",
    };
  } catch {
    return null;
  }
}

export function saveLessonStepProgress(
  userId: string,
  lessonId: string,
  data: Omit<LessonStepStored, "savedAt">,
) {
  if (typeof window === "undefined") return;
  const payload: LessonStepStored = {
    ...data,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    lessonStepStorageKey(userId, lessonId),
    JSON.stringify(payload),
  );
}

export function mergeLessonStepProgress(
  a: LessonStepStored | null,
  b: LessonStepStored | null,
): LessonStepStored | null {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  return {
    unlockedStepIndex: Math.max(a.unlockedStepIndex, b.unlockedStepIndex),
    completed: a.completed || b.completed,
    savedAt:
      a.savedAt && b.savedAt
        ? a.savedAt > b.savedAt
          ? a.savedAt
          : b.savedAt
        : a.savedAt || b.savedAt || new Date().toISOString(),
  };
}

export async function fetchLessonStepProgress(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
): Promise<LessonStepStored | null> {
  const { data, error } = await supabase
    .from("lesson_step_progress")
    .select("unlocked_step_index, completed, updated_at")
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  if (error) {
    console.error("lesson_step_progress fetch:", error);
    return null;
  }
  if (!data) return null;

  return {
    unlockedStepIndex: Number(data.unlocked_step_index) || 0,
    completed: Boolean(data.completed),
    savedAt: String(data.updated_at ?? ""),
  };
}

export async function upsertLessonStepProgress(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  data: Omit<LessonStepStored, "savedAt">,
): Promise<void> {
  const { error } = await supabase.from("lesson_step_progress").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      unlocked_step_index: data.unlockedStepIndex,
      completed: data.completed,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    console.error("lesson_step_progress upsert:", error);
  }
}
