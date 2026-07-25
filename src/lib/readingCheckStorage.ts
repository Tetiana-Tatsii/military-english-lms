const STORAGE_PREFIX = "mel-reading-check:";

export type ReadingCheckStored = {
  answers: Record<string, string>;
  submitted: true;
  score: number;
  total: number;
  savedAt: string;
};

export function readingCheckStorageKey(userId: string, lessonId: string) {
  return `${STORAGE_PREFIX}${userId}:${lessonId}`;
}

export function loadReadingCheck(
  userId: string,
  lessonId: string,
): ReadingCheckStored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(
      readingCheckStorageKey(userId, lessonId),
    );
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReadingCheckStored;
    if (!parsed?.submitted || !parsed.answers) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Passed only when every question is correct. */
export function isReadingCheckPassed(
  userId: string,
  lessonId: string,
): boolean {
  const stored = loadReadingCheck(userId, lessonId);
  if (!stored || stored.total <= 0) return false;
  return stored.score === stored.total;
}

export function saveReadingCheck(
  userId: string,
  lessonId: string,
  data: Omit<ReadingCheckStored, "savedAt" | "submitted">,
) {
  if (typeof window === "undefined") return;
  const payload: ReadingCheckStored = {
    ...data,
    submitted: true,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(
    readingCheckStorageKey(userId, lessonId),
    JSON.stringify(payload),
  );
}

export function clearReadingCheck(userId: string, lessonId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(readingCheckStorageKey(userId, lessonId));
}
