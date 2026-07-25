import { supabase } from "@/lib/supabase";
import { recalculateSlp } from "@/lib/slp";
import {
  awardHomeworkCoins,
  checkAndCompleteCourse,
} from "@/lib/gamification";
import type { Answer, Course, UserAccount } from "@/types";

export type ProvideFeedbackInput = {
  answerId: string;
  feedbackText: string;
  feedbackAudio: boolean;
  score?: number;
  coinsToAward?: number;
};

export type ProvideFeedbackContext = {
  answers: Answer[];
  courses: Course[];
  usersDb: UserAccount[];
  refreshGamification: (userId?: string) => Promise<void>;
  setInstructorMood: (mood: "happy" | "angry" | "proud") => void;
};

export type ProvideFeedbackResult = {
  answerId: string;
  patch: Partial<Answer>;
  /** Coins actually awarded in this call (0 if skipped / already awarded). */
  coinsAwarded: number;
  /** If coin award failed after optimistic patch, restore these fields */
  coinRollback?: Pick<Answer, "coins_awarded" | "coins_awarded_amount">;
};

/**
 * Persist teacher feedback + optional coins / course completion / SLP.
 * Caller updates the answers cache from the returned patch.
 */
export async function provideHomeworkFeedback(
  input: ProvideFeedbackInput,
  ctx: ProvideFeedbackContext,
): Promise<ProvideFeedbackResult> {
  const { answerId, feedbackText, feedbackAudio, score, coinsToAward } = input;

  if (
    typeof score !== "number" ||
    Number.isNaN(score) ||
    score < 0 ||
    score > 100
  ) {
    throw new Error("Оцінка обовʼязкова: вкажіть бали від 0 до 100.");
  }

  const answer = ctx.answers.find((a) => a.id === answerId);
  const coinAmount = Math.min(20, Math.max(0, coinsToAward ?? 0));
  // Trust DB/snapshot flag only — never skip because of optimistic UI state.
  const alreadyAwarded = Boolean(answer?.coins_awarded);
  const willAwardCoins = coinAmount > 0 && !alreadyAwarded;

  const basePatch: Partial<Answer> = {
    teacherFeedbackText: feedbackText,
    teacherFeedbackAudio: feedbackAudio,
    score,
    status: "reviewed",
    coins_awarded: willAwardCoins ? true : alreadyAwarded,
    coins_awarded_amount: willAwardCoins
      ? coinAmount
      : (answer?.coins_awarded_amount ?? 0),
  };

  // Column is text in DB ("true"/"false").
  const feedbackAudioDb =
    feedbackAudio === true || String(feedbackAudio) === "true"
      ? "true"
      : "false";

  const { error } = await supabase
    .from("answers")
    .update({
      score,
      teacher_feedback: feedbackText,
      teacher_feedback_audio: feedbackAudioDb,
      status: "reviewed",
    })
    .eq("id", answerId);

  if (error) {
    console.error("Помилка Supabase при збереженні фідбеку:", error);
    throw error;
  }

  let studentId =
    answer?.user_id ||
    ctx.usersDb.find((u) => u.name === answer?.studentName)?.id;

  let patch = { ...basePatch };
  let coinsAwarded = 0;

  if (willAwardCoins) {
    const coinResult = await awardHomeworkCoins(
      supabase,
      answerId,
      coinAmount,
    );
    if (coinResult.error) {
      throw Object.assign(
        new Error(
          coinResult.error === "forbidden"
            ? "Немає прав на нарахування коїнів."
            : coinResult.error === "student_not_found"
              ? "Не знайдено профіль курсанта для нарахування коїнів."
              : `Не вдалося нарахувати коїни: ${coinResult.error}`,
        ),
        {
          coinRollback: {
            coins_awarded: answer?.coins_awarded ?? false,
            coins_awarded_amount: answer?.coins_awarded_amount ?? 0,
          } satisfies ProvideFeedbackResult["coinRollback"],
        },
      );
    }
    if (coinResult.studentId) {
      studentId = coinResult.studentId;
    }
    coinsAwarded = coinResult.coinsAwardedAmount ?? coinAmount;
    patch = {
      ...patch,
      coins_awarded: true,
      coins_awarded_amount: coinsAwarded,
    };
  }

  if (studentId) {
    if (answer?.courseId) {
      const justCompleted = await checkAndCompleteCourse(
        supabase,
        studentId,
        answer.courseId,
        ctx.courses,
      );
      if (justCompleted) {
        ctx.setInstructorMood("proud");
      }
    }

    await recalculateSlp(supabase, studentId, ctx.courses);
    // Refresh wallet only when the awardee is the current session user.
    await ctx.refreshGamification(studentId);
  }

  return { answerId, patch, coinsAwarded };
}
