import { supabase } from "@/lib/supabase";
import { mapDbRowToAnswer } from "@/lib/mappers";
import type { Answer } from "@/types";

/** Loads all answers visible under RLS. Returns [] on error. */
export async function fetchAnswers(): Promise<Answer[]> {
  try {
    const { data, error } = await supabase
      .from("answers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(
        "Помилка завантаження відповідей з Supabase:",
        error.message || error.code || error,
      );
      return [];
    }

    return (data ?? []).map(mapDbRowToAnswer);
  } catch (error) {
    console.error("Помилка при завантаженні відповідей:", error);
    return [];
  }
}
