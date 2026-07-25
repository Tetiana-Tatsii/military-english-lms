import { initialCourses } from "@/data/courses";
import { supabase } from "@/lib/supabase";
import type { Course } from "@/types";

/** One-shot seed when lms_courses is empty (dev / fresh project). */
export async function seedInitialCoursesIfEmpty(): Promise<void> {
  for (const course of initialCourses as Course[]) {
    await supabase.from("lms_courses").upsert({
      id: course.id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      status: course.status || "draft",
      modules: course.modules.map((mod) => ({
        id: mod.id,
        title: mod.title,
        icon: mod.icon,
        lessons: [],
      })),
      final_test: course.finalTest || { title: "", questions: [] },
    });

    for (const mod of course.modules) {
      for (let i = 0; i < mod.lessons.length; i++) {
        const lesson = mod.lessons[i];
        await supabase.from("lms_lessons").upsert({
          id: lesson.id,
          course_id: course.id,
          module_id: mod.id,
          order_index: i,
          content: lesson,
        });
      }
    }
  }
}
