import type { Lesson, LessonBlockId } from "@/types";
import { isBlockVisibleOnStudent } from "@/lib/lessonBlocks";

export type LessonStepId =
  | "start"
  | "input"
  | "dialogue"
  | "video"
  | "language"
  | "support"
  | "practice"
  | "finish";

export type LessonStep = {
  id: LessonStepId;
  title: string;
  blocks: LessonBlockId[];
};

export type ProgressTheme = "coffee" | "cat" | "dog" | "drone" | "victory";

const STEP_DEFS: readonly {
  id: LessonStepId;
  title: string;
  blocks: readonly LessonBlockId[];
}[] = [
  {
    id: "start",
    title: "Start",
    blocks: ["objectives", "missionBrief"],
  },
  {
    id: "input",
    title: "Key content",
    blocks: ["keyInformation", "usefulPhrases"],
  },
  {
    id: "dialogue",
    title: "Dialogue",
    blocks: ["dialogue"],
  },
  {
    id: "video",
    title: "Video",
    blocks: ["video"],
  },
  {
    id: "language",
    title: "Language work",
    blocks: ["vocabulary", "reading", "readingCheck"],
  },
  {
    id: "support",
    title: "Support materials",
    blocks: ["grammarFocus", "visualReference", "additionalResources"],
  },
  {
    id: "practice",
    title: "Practice",
    blocks: ["interactiveQuiz"],
  },
  {
    id: "finish",
    title: "Finish",
    blocks: ["speakingTask", "canDoChecklist"],
  },
] as const;

/** Build ordered steps from blocks that are visible for this lesson. */
export function getLessonSteps(
  lesson: Lesson,
  options?: { forceSpeaking?: boolean },
): LessonStep[] {
  return STEP_DEFS.map((def) => {
    const blocks = def.blocks.filter((blockId) => {
      if (blockId === "speakingTask" && options?.forceSpeaking) return true;
      return isBlockVisibleOnStudent(lesson, blockId);
    });
    return { id: def.id, title: def.title, blocks };
  }).filter((step) => step.blocks.length > 0);
}

export function stepHasReadingCheck(step: LessonStep): boolean {
  return step.blocks.includes("readingCheck");
}

export function stepHasInteractiveQuiz(step: LessonStep): boolean {
  return step.blocks.includes("interactiveQuiz");
}

export type NextStepGate =
  | { type: "ok" }
  /** Soft: confirm before leaving language work without Reading Check */
  | { type: "soft-reading-check" }
  /** Hard: cannot open Speaking / finish until quiz submitted */
  | { type: "hard-quiz" };

/** Evaluate soft/hard gates before advancing from currentStepIndex. */
export function getNextStepGate(params: {
  steps: LessonStep[];
  currentStepIndex: number;
  unlockedStepIndex: number;
  readingCheckDone: boolean;
  quizSubmitted: boolean;
  lessonHasQuiz: boolean;
}): NextStepGate {
  const {
    steps,
    currentStepIndex,
    unlockedStepIndex,
    readingCheckDone,
    quizSubmitted,
    lessonHasQuiz,
  } = params;
  const current = steps[currentStepIndex];
  if (!current) return { type: "ok" };

  // Free move inside already unlocked steps — no gates
  if (currentStepIndex < unlockedStepIndex) {
    return { type: "ok" };
  }

  if (stepHasReadingCheck(current) && !readingCheckDone) {
    return { type: "soft-reading-check" };
  }

  const next = steps[currentStepIndex + 1];
  if (next?.id === "finish" && lessonHasQuiz && !quizSubmitted) {
    return { type: "hard-quiz" };
  }

  return { type: "ok" };
}

/**
 * Theme for progress icons by module index (0-based).
 * 1st module → coffee coins, 2nd → cat, 3rd → dog, 4th → drone, 5th+ → victory.
 */
export function getModuleProgressTheme(moduleIndex: number): ProgressTheme {
  if (moduleIndex <= 0) return "coffee";
  if (moduleIndex === 1) return "cat";
  if (moduleIndex === 2) return "dog";
  if (moduleIndex === 3) return "drone";
  return "victory";
}

export function getProgressThemeLabel(theme: ProgressTheme): string {
  switch (theme) {
    case "coffee":
      return "Кава-коїни";
    case "cat":
      return "Котики";
    case "dog":
      return "Песики";
    case "drone":
      return "Дрони";
    case "victory":
      return "Кубки";
  }
}
