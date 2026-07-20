import type { GamificationProfile } from "@/lib/gamification";

export type SkillType =
  | "listening"
  | "reading"
  | "speaking"
  | "writing"
  | "mixed";

export type UserRole = "student" | "teacher" | "admin";
export type AccountStatus = "pending" | "approved";

export interface QuizletCard {
  term: string;
  translation: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export interface LessonDocument {
  id: string;
  name: string;
  url: string;
  type: "pdf" | "doc" | "docx";
}

export type Lesson = {
  id: string;
  title: string;
  section: string;
  content: string;
  videoLabel?: string;
  duration: string;
  quizlet?: { term: string; translation: string }[];
  skill?: SkillType;
  audioUrl?: string;
  grammarContent?: string;
  imageUrl?: string;
  quiz?: QuizQuestion[];
  documents?: LessonDocument[];
  homeworkInstruction?: string;
};

export interface Module {
  id: string;
  title: string;
  icon: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: "active" | "draft";
  modules: Module[];
  finalTest: { title: string; questions: Question[] };
}

export interface Answer {
  id: string;
  lessonId: string;
  courseId: string;
  studentName: string;
  squadId: string;
  text: string;
  voiceRecorded: boolean;
  audioUrl?: string;
  attachments: string[];
  submittedAt: string;
  status: "pending" | "reviewed";
  teacherFeedbackText?: string;
  teacherFeedbackAudio?: boolean;
  score?: number;
  locked_by_teacher_id?: string | null;
  user_id?: string;
  coins_awarded?: boolean;
  coins_awarded_amount?: number;
}

export type { GamificationProfile };

export interface SupportTicket {
  id: string;
  userName: string;
  type: "bug" | "improvement";
  message: string;
  date: string;
  status: "open" | "closed";
}

export interface GrammarRule {
  id: string;
  title: string;
  category: string;
  content: string;
}

export interface Question {
  id: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  type?: "multiple-choice" | "text" | "true-false";
}

export interface UserAccount {
  id: string;
  name: string;
  role: UserRole;
  squadId?: string;
  status: AccountStatus;
}

/** Logged-in session user (no password). */
export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  squadId?: string;
}
