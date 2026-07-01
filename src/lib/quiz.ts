import type { QuizQuestion } from "../context/AppContext";

/** Індекс обраного варіанта (новий формат — "0", "1", …; старий — текст опції). */
export function getSelectedOptionIndex(
  question: QuizQuestion,
  answer: string | undefined,
): number | null {
  if (answer === undefined || answer === null || answer === "") return null;

  if (/^\d+$/.test(answer)) {
    const idx = Number(answer);
    if (idx >= 0 && idx < question.options.length) return idx;
  }

  const idx = question.options.findIndex((opt) => opt === answer);
  return idx >= 0 ? idx : null;
}

/** Індекс правильного варіанта (correctAnswer — індекс або текст опції). */
export function getCorrectOptionIndex(question: QuizQuestion): number {
  const ca = question.correctAnswer;
  if (!ca && ca !== "0") return -1;

  if (/^\d+$/.test(ca)) {
    const idx = Number(ca);
    if (idx >= 0 && idx < question.options.length) return idx;
  }

  return question.options.findIndex((opt) => opt === ca);
}

export function isQuizAnswerCorrect(
  question: QuizQuestion,
  answer: string | undefined,
): boolean {
  const selectedIdx = getSelectedOptionIndex(question, answer);
  const correctIdx = getCorrectOptionIndex(question);
  if (selectedIdx === null || correctIdx < 0) return false;
  return selectedIdx === correctIdx;
}
