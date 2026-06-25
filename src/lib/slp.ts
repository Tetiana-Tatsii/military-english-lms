import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/context/AppContext";

const SLP_SKILLS = ["listening", "speaking", "reading", "writing"] as const;
type SlpSkill = (typeof SLP_SKILLS)[number];

/**
 * Будує словник: навичка → масив lesson_id, які її розвивають.
 * mixed урок потрапляє до всіх 4 навичок.
 */
function getLessonIdsBySkill(courses: Course[]): Record<SlpSkill, string[]> {
  const map: Record<SlpSkill, string[]> = {
    listening: [],
    speaking: [],
    reading: [],
    writing: [],
  };
  for (const course of courses) {
    for (const module of course.modules) {
      for (const lesson of module.lessons) {
        if (lesson.skill === "mixed") {
          SLP_SKILLS.forEach((s) => map[s].push(lesson.id));
        } else if (lesson.skill && lesson.skill in map) {
          map[lesson.skill as SlpSkill].push(lesson.id);
        }
      }
    }
  }
  return map;
}

/**
 * Перераховує SLP-профіль курсанта як середнє арифметичне
 * всіх результатів quiz_results та перевірених answers.
 * Викликати після кожного нового результату тесту або оцінки ДЗ.
 */
export async function recalculateSlp(
  supabase: SupabaseClient,
  userId: string,
  courses: Course[],
): Promise<void> {
  const lessonsBySkill = getLessonIdsBySkill(courses);
  const slpUpdate: Record<string, number> = {};

  await Promise.all(
    SLP_SKILLS.map(async (skill) => {
      const lessonIds = lessonsBySkill[skill];
      if (lessonIds.length === 0) return;

      const [{ data: quizData }, { data: hwData }] = await Promise.all([
        supabase
          .from("quiz_results")
          .select("score")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds),
        supabase
          .from("answers")
          .select("score")
          .eq("user_id", userId)
          .eq("status", "reviewed")
          .in("lesson_id", lessonIds)
          .not("score", "is", null),
      ]);

      const allScores = [
        ...(quizData?.map((r) => r.score) ?? []),
        ...(hwData?.map((r) => r.score) ?? []),
      ].filter((s): s is number => typeof s === "number");

      if (allScores.length > 0) {
        slpUpdate[`slp_${skill}`] = Math.round(
          allScores.reduce((a, b) => a + b, 0) / allScores.length,
        );
      }
    }),
  );

  if (Object.keys(slpUpdate).length === 0) return;

  const { error } = await supabase
    .from("profiles")
    .update(slpUpdate)
    .eq("id", userId);

  if (error) {
    console.error("Помилка при перерахунку SLP:", error);
  }
}
