import type { Dispatch, SetStateAction } from "react";
import type { Course, Lesson } from "@/types";

export interface EditorTabProps {
  courses: Course[];
  isDarkMode: boolean;
  addCourse: (title: string, subtitle: string, description: string) => Promise<void>;
  updateCourse: (
    courseId: string,
    data: { title: string; subtitle: string; description: string },
  ) => Promise<void>;
  deleteCourse: (courseId: string) => void;
  addModule: (courseId: string, title: string, icon: string) => void;
  updateModule: (
    courseId: string,
    moduleId: string,
    data: { title: string },
  ) => void;
  deleteModule: (courseId: string, moduleId: string) => void;
  addLesson: (courseId: string, moduleId: string, lesson: Omit<Lesson, "id">) => void;
  updateLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updatedData: Partial<Lesson>,
  ) => void;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;
}

export interface CourseFormData {
  title: string;
  subtitle: string;
  description: string;
}

export interface EditingLessonState {
  moduleId: string;
  lesson: Lesson;
}

export interface LessonEditorSectionProps {
  editingLesson: EditingLessonState;
  setEditingLesson: Dispatch<SetStateAction<EditingLessonState | null>>;
  isDarkMode: boolean;
}
