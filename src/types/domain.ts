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
  /** File extension or kind (pdf, doc, docx, pptx, xlsx, link, …) */
  type: string;
}

export type LessonImage = {
  id: string;
  url: string;
  caption?: string;
};

export type LessonResourceLink = {
  id: string;
  label: string;
  url: string;
};

export type LessonBlockId =
  | "objectives"
  | "missionBrief"
  | "keyInformation"
  | "usefulPhrases"
  | "dialogue"
  | "video"
  | "vocabulary"
  | "reading"
  | "readingCheck"
  | "grammarFocus"
  | "visualReference"
  | "additionalResources"
  | "interactiveQuiz"
  | "speakingTask"
  | "canDoChecklist";

export type LessonBlockMeta = {
  estimatedTime?: string;
  /** If true, block is hidden from students even when filled */
  hidden?: boolean;
};

export type Lesson = {
  id: string;
  title: string;
  section: string;
  /** Key Information (legacy field name: content / Theory) */
  content: string;
  /** Lesson Objectives (rich HTML) */
  objectives?: string;
  missionBrief?: string;
  usefulPhrases?: string;
  /** Dialogue text (paired with audio in one student block) */
  dialogue?: string;
  /** Optional transcript under dialogue audio */
  listeningTranscript?: string;
  /** Optional intro text shown before the video block */
  videoIntro?: string;
  /** YouTube video id */
  videoLabel?: string;
  duration: string;
  quizlet?: { term: string; translation: string }[];
  skill?: SkillType;
  audioUrl?: string;
  /** Bilingual reading passage (EN column) */
  readingEn?: string;
  /** Bilingual reading passage (UK column) */
  readingUk?: string;
  /** Short comprehension quiz for the reading (typically up to 3 questions) */
  readingQuiz?: QuizQuestion[];
  /** Grammar Focus (legacy: Grammar Reference) */
  grammarContent?: string;
  /** Legacy single image — prefer `images` */
  imageUrl?: string;
  /** Visual Reference gallery */
  images?: LessonImage[];
  quiz?: QuizQuestion[];
  documents?: LessonDocument[];
  resourceLinks?: LessonResourceLink[];
  /** Speaking Task instructions (rich HTML; legacy homework field) */
  homeworkInstruction?: string;
  /** Self-assessment checklist items (plain text) */
  canDoItems?: string[];
  /** Per-block estimated time + visibility */
  blockMeta?: Partial<Record<LessonBlockId, LessonBlockMeta>>;
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
