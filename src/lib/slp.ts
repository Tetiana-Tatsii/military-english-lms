import type { SupabaseClient } from "@supabase/supabase-js";
import type { Course } from "@/context/AppContext";

/**
 * Перераховує SLP-профіль курсанта на сервері (RPC recalculate_profile_slp).
 * Клієнт більше не передає оцінки — лише тригерить перерахунок з quiz_results + answers.
 * Параметр courses збережено для сумісності викликів; у розрахунку не використовується.
 */
export async function recalculateSlp(
  supabase: SupabaseClient,
  userId: string,
  _courses: Course[],
): Promise<void> {
  const { data, error } = await supabase.rpc("recalculate_profile_slp", {
    p_user_id: userId,
  });

  if (error) {
    console.error("Помилка при перерахунку SLP:", error);
    return;
  }

  const payload = data as { error?: string } | null;
  if (payload?.error) {
    console.error("Помилка при перерахунку SLP:", payload.error);
  }
}
