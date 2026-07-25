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
