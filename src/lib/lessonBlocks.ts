import type { Lesson, LessonBlockId, LessonImage } from "@/types";

export type LessonBlockDefinition = {
  id: LessonBlockId;
  title: string;
  titleUk: string;
  accent: string;
  /** Hint shown in teacher editor */
  editorHint?: string;
};

/** Canonical lesson order (student + teacher). */
export const LESSON_BLOCK_ORDER: readonly LessonBlockId[] = [
  "objectives",
  "missionBrief",
  "keyInformation",
  "usefulPhrases",
  "dialogue",
  "video",
  "vocabulary",
  "reading",
  "readingCheck",
  "grammarFocus",
  "visualReference",
  "additionalResources",
  "interactiveQuiz",
  "speakingTask",
  "canDoChecklist",
] as const;

export const LESSON_BLOCKS: Record<LessonBlockId, LessonBlockDefinition> = {
  objectives: {
    id: "objectives",
    title: "Lesson Objectives",
    titleUk: "Цілі уроку",
    accent: "#8a8a45",
    editorHint: "Структура: Know / Can do / Vocabulary focus / Grammar focus",
  },
  missionBrief: {
    id: "missionBrief",
    title: "Mission Brief",
    titleUk: "Mission Brief",
    accent: "#3d5a80",
    editorHint: "Сценарій / контекст уроку",
  },
  keyInformation: {
    id: "keyInformation",
    title: "Key Information",
    titleUk: "Key Information",
    accent: "#5c6b7a",
    editorHint: "Ключові пояснення (замість Theory)",
  },
  usefulPhrases: {
    id: "usefulPhrases",
    title: "Useful Phrases",
    titleUk: "Useful Phrases",
    accent: "#4a5d3a",
  },
  dialogue: {
    id: "dialogue",
    title: "Dialogue",
    titleUk: "Dialogue",
    accent: "#2a6f6f",
    editorHint: "Текст діалогу + аудіо (+ опційний транскрипт) — одне завдання",
  },
  video: {
    id: "video",
    title: "Video",
    titleUk: "Video",
    accent: "#6b8cae",
    editorHint: "YouTube + опційний текст перед відео",
  },
  vocabulary: {
    id: "vocabulary",
    title: "Vocabulary",
    titleUk: "Vocabulary",
    accent: "#9a8f70",
  },
  reading: {
    id: "reading",
    title: "Reading",
    titleUk: "Reading",
    accent: "#3d6b4f",
  },
  readingCheck: {
    id: "readingCheck",
    title: "Reading Check",
    titleUk: "Reading Check",
    accent: "#7a9e7a",
  },
  grammarFocus: {
    id: "grammarFocus",
    title: "Grammar Focus",
    titleUk: "Grammar Focus",
    accent: "#c97a4a",
  },
  visualReference: {
    id: "visualReference",
    title: "Visual Reference",
    titleUk: "Visual Reference",
    accent: "#5a7a8a",
  },
  additionalResources: {
    id: "additionalResources",
    title: "Additional Resources",
    titleUk: "Additional Resources",
    accent: "#7a7568",
  },
  interactiveQuiz: {
    id: "interactiveQuiz",
    title: "Interactive Quiz",
    titleUk: "Interactive Quiz",
    accent: "#8a8a45",
  },
  speakingTask: {
    id: "speakingTask",
    title: "Speaking Task",
    titleUk: "Speaking Task",
    accent: "#b86b3c",
    editorHint: "Scenario, instructions, criteria, examples",
  },
  canDoChecklist: {
    id: "canDoChecklist",
    title: "Can Do Checklist",
    titleUk: "Can Do Checklist",
    accent: "#a3a86a",
    editorHint: "Самооцінка курсанта (не оцінюється викладачем)",
  },
};

export function isEmptyRichText(value?: string | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "<p><br></p>" || trimmed === "<p></p>") {
    return true;
  }
  const text = trimmed
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0;
}

export function getLessonImages(lesson: Lesson): LessonImage[] {
  if (lesson.images && lesson.images.length > 0) return lesson.images;
  if (lesson.imageUrl) {
    return [{ id: "legacy-image", url: lesson.imageUrl }];
  }
  return [];
}

export function getBlockMeta(lesson: Lesson, blockId: LessonBlockId) {
  return lesson.blockMeta?.[blockId];
}

export function getBlockEstimatedTime(
  lesson: Lesson,
  blockId: LessonBlockId,
): string | undefined {
  const value = getBlockMeta(lesson, blockId)?.estimatedTime?.trim();
  return value || undefined;
}

export function isBlockHidden(lesson: Lesson, blockId: LessonBlockId): boolean {
  return Boolean(getBlockMeta(lesson, blockId)?.hidden);
}

export function isBlockFilled(lesson: Lesson, blockId: LessonBlockId): boolean {
  switch (blockId) {
    case "objectives":
      return !isEmptyRichText(lesson.objectives);
    case "missionBrief":
      return !isEmptyRichText(lesson.missionBrief);
    case "keyInformation":
      return !isEmptyRichText(lesson.content);
    case "usefulPhrases":
      return !isEmptyRichText(lesson.usefulPhrases);
    case "dialogue":
      return Boolean(
        !isEmptyRichText(lesson.dialogue) ||
          lesson.audioUrl ||
          !isEmptyRichText(lesson.listeningTranscript),
      );
    case "video":
      return Boolean(
        lesson.videoLabel || !isEmptyRichText(lesson.videoIntro),
      );
    case "vocabulary":
      return Boolean(lesson.quizlet && lesson.quizlet.length > 0);
    case "reading":
      return Boolean(lesson.readingEn?.trim() || lesson.readingUk?.trim());
    case "readingCheck":
      return Boolean(lesson.readingQuiz && lesson.readingQuiz.length > 0);
    case "grammarFocus":
      return !isEmptyRichText(lesson.grammarContent);
    case "visualReference":
      return getLessonImages(lesson).length > 0;
    case "additionalResources":
      return Boolean(
        (lesson.documents && lesson.documents.length > 0) ||
          (lesson.resourceLinks && lesson.resourceLinks.length > 0),
      );
    case "interactiveQuiz":
      return Boolean(lesson.quiz && lesson.quiz.length > 0);
    case "speakingTask":
      return !isEmptyRichText(lesson.homeworkInstruction);
    case "canDoChecklist":
      return Boolean(
        lesson.canDoItems &&
          lesson.canDoItems.some((item) => item.trim().length > 0),
      );
    default:
      return false;
  }
}

/** Student visibility: filled and not marked hidden. */
export function isBlockVisibleOnStudent(
  lesson: Lesson,
  blockId: LessonBlockId,
): boolean {
  if (isBlockHidden(lesson, blockId)) return false;
  return isBlockFilled(lesson, blockId);
}

export function getVisibleStudentBlocks(lesson: Lesson): LessonBlockId[] {
  return LESSON_BLOCK_ORDER.filter((id) => isBlockVisibleOnStudent(lesson, id));
}

/** Emphasize suggested objective labels when instructor uses them. */
export function emphasizeObjectiveLabels(html: string): string {
  return html.replace(
    /\b(Vocabulary focus|Grammar focus|Can do|Know)\b/gi,
    (match, _g1, offset: number, full: string) => {
      const before = full.slice(Math.max(0, offset - 10), offset).toLowerCase();
      if (before.includes("<strong")) return match;
      return `<strong>${match}</strong>`;
    },
  );
}
