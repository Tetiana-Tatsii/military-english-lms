const STORAGE_PREFIX = "mel-can-do:";

export function canDoStorageKey(userId: string, lessonId: string) {
  return `${STORAGE_PREFIX}${userId}:${lessonId}`;
}

export function loadCanDoChecks(
  userId: string,
  lessonId: string,
): Record<number, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(canDoStorageKey(userId, lessonId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    const result: Record<number, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      const idx = Number(key);
      if (!Number.isNaN(idx) && value) result[idx] = true;
    }
    return result;
  } catch {
    return {};
  }
}

export function saveCanDoChecks(
  userId: string,
  lessonId: string,
  checks: Record<number, boolean>,
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    canDoStorageKey(userId, lessonId),
    JSON.stringify(checks),
  );
}
