import type { QuizQuestion } from "../context/AppContext";
import type { SupabaseClient } from "@supabase/supabase-js";

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

export type SubmitLessonQuizResult = {
  error: string | null;
  alreadySubmitted: boolean;
  score: number;
  correctCount: number;
  totalQuestions: number;
  coinsAwarded: number;
  alreadyAwarded: boolean;
  newCoffeeCoins: number;
  answers: Record<string, string>;
};

function submitQuizErrorMessage(code: string): string {
  switch (code) {
    case "not_authenticated":
      return "Потрібно перелогінитись.";
    case "invalid_lesson":
    case "lesson_not_found":
      return "Урок не знайдено.";
    case "no_quiz":
      return "У цьому уроці немає тесту.";
    case "incomplete_answers":
      return "Відповідіть на всі питання перед відправкою.";
    case "invalid_answers":
      return "Некоректні відповіді.";
    default:
      return "Не вдалося зберегти результат тесту.";
  }
}

/**
 * Submit + grade + award via RPC (H1). Server trusts lesson quiz in DB, not client score.
 */
export async function submitLessonQuiz(
  supabase: SupabaseClient,
  lessonId: string,
  answers: Record<string, string>,
): Promise<SubmitLessonQuizResult> {
  const empty: SubmitLessonQuizResult = {
    error: null,
    alreadySubmitted: false,
    score: 0,
    correctCount: 0,
    totalQuestions: 0,
    coinsAwarded: 0,
    alreadyAwarded: false,
    newCoffeeCoins: 0,
    answers: {},
  };

  const { data, error } = await supabase.rpc("submit_lesson_quiz", {
    p_lesson_id: lessonId,
    p_answers: answers,
  });

  if (error) {
    console.error("submit_lesson_quiz RPC failed:", error.message);
    return { ...empty, error: error.message };
  }

  const payload = data as Record<string, unknown> | null;
  if (!payload) {
    return { ...empty, error: "empty_response" };
  }

  if (payload.error) {
    const code = String(payload.error);
    console.error("submit_lesson_quiz:", code);
    return { ...empty, error: submitQuizErrorMessage(code) };
  }

  const storedAnswers =
    payload.answers && typeof payload.answers === "object"
      ? (payload.answers as Record<string, string>)
      : answers;

  return {
    error: payload.awardError ? String(payload.awardError) : null,
    alreadySubmitted: Boolean(payload.alreadySubmitted),
    score: Number(payload.score ?? 0),
    correctCount: Number(payload.correctCount ?? 0),
    totalQuestions: Number(payload.totalQuestions ?? 0),
    coinsAwarded: Number(payload.coinsAwarded ?? 0),
    alreadyAwarded: Boolean(payload.alreadyAwarded),
    newCoffeeCoins: Number(payload.newCoffeeCoins ?? 0),
    answers: storedAnswers,
  };
}
