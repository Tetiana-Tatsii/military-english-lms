import { supabase } from "@/lib/supabase";
import type { Course, Lesson, Module } from "@/types";

/**
 * Loads courses + lessons from Supabase and joins them into Course[].
 * Returns [] when DB is empty; null on hard fetch failure.
 */
export async function fetchCourses(): Promise<Course[] | null> {
  try {
    const { data: coursesData, error: coursesError } = await supabase
      .from("lms_courses")
      .select("*")
      .order("created_at", { ascending: true });

    if (coursesError) {
      console.error("Помилка завантаження курсів:", coursesError);
      return null;
    }

    if (!coursesData || coursesData.length === 0) return [];

    const { data: lessonsData } = await supabase
      .from("lms_lessons")
      .select("id, course_id, module_id, order_index, content")
      .order("order_index", { ascending: true });

    return coursesData.map((c) => {
      const modules = (c.modules as Module[]).map((mod) => {
        const fromTable = (lessonsData || [])
          .filter((l) => l.course_id === c.id && l.module_id === mod.id)
          .sort((a, b) => a.order_index - b.order_index)
          .map((l) => ({ ...(l.content as Lesson), id: l.id }));

        const fromJson = (mod.lessons || []) as Lesson[];

        return {
          ...mod,
          lessons: fromTable.length > 0 ? fromTable : fromJson,
        };
      });

      return {
        id: c.id,
        title: c.title,
        subtitle: c.subtitle || "",
        description: c.description || "",
        status: (c.status as "active" | "draft") || "draft",
        modules,
        finalTest: c.final_test || { title: "", questions: [] },
      };
    });
  } catch (error) {
    console.error("Помилка при завантаженні курсів:", error);
    return null;
  }
}
