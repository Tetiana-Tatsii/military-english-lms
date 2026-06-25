"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { initialCourses } from "../data/courses"; // використовується лише для seeding
import { supabase } from "../lib/supabase";
import { hashPassword, verifyPassword } from "../lib/password";
import { mapDbRowToAnswer } from "../lib/mappers";
import { recalculateSlp } from "../lib/slp";
import {
  GamificationProfile,
  fetchGamificationProfile,
  processDailyStreak,
  awardCoins,
  buyShopItemInDb,
  checkAndCompleteCourse,
} from "../lib/gamification";

/**
 * Перетворює будь-яке ім'я (кирилиця, пробіли, спецсимволи) на
 * валідну синтетичну email-адресу для Supabase Auth.
 * Детермінована: одне і те ж ім'я → завжди той самий email.
 */
function nameToEmail(name: string): string {
  const bytes = new TextEncoder().encode(name.trim().toLowerCase());
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `u${hex}@lanp.local`;
}

export type SkillType = "listening" | "reading" | "speaking" | "writing" | "mixed";
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
  password: string;
  role: UserRole;
  squadId?: string;
  status: AccountStatus;
}

interface AppState {
  user: { id: string; name: string; role: UserRole; squadId?: string } | null;
  courses: Course[];
  answers: Answer[];
  grammarBase: GrammarRule[];
  usersDb: UserAccount[];
  supportTickets: SupportTicket[];

  registerUser: (
    name: string,
    password: string,
    role: UserRole,
  ) => Promise<string | null>;
  login: (name: string, password: string) => Promise<string | null>;
  logout: () => void;

  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>;

  submitAnswer: (
    answerData: Omit<
      Answer,
      "id" | "submittedAt" | "status" | "studentName" | "squadId"
    >,
  ) => void;
  provideFeedback: (
    answerId: string,
    feedbackText: string,
    feedbackAudio: boolean,
    score?: number,
    coinsToAward?: number,
  ) => void;

  gamification: GamificationProfile | null;
  instructorMood: "happy" | "angry" | "proud";
  refreshGamification: () => Promise<void>;
  buyShopItem: (itemId: string, price: number) => Promise<string | null>;

  addSupportTicket: (type: "bug" | "improvement", message: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: "open" | "closed") => Promise<void>;
  fetchSupportTickets: () => Promise<void>;

  addCourse: (title: string, subtitle: string, description: string) => void;
  updateCourse: (courseId: string, updatedData: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
  addModule: (courseId: string, title: string, icon: string) => void;
  updateModule: (
    courseId: string,
    moduleId: string,
    updatedData: Partial<Module>,
  ) => void;
  deleteModule: (courseId: string, moduleId: string) => void;
  addLesson: (
    courseId: string,
    moduleId: string,
    lessonData: Omit<Lesson, "id">,
  ) => void;
  updateLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updatedData: Partial<Lesson>,
  ) => void;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;
  isInitialized: boolean;
}

const GRAMMAR_BASE: GrammarRule[] = [
  {
    id: "g-to-be",
    title: 'Дієслово "to be" як linking verb',
    category: "Граматика А1-А2",
    content:
      "Дієслово \"to be\" зв'язує підмет зі станом, якістю або професією (наприклад: He is a Lieutenant / They are ready).",
  },
];

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppState["user"]>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [usersDb, setUsersDb] = useState<UserAccount[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [gamification, setGamification] = useState<GamificationProfile | null>(null);
  const [instructorMood, setInstructorMood] = useState<"happy" | "angry" | "proud">("happy");

  // СИНХРОНІЗАЦІЯ КОРИСТУВАЧІВ З SUPABASE
  const fetchUsersFromSupabase = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, role, status, squad_id")
      .order("created_at", { ascending: true });

    if (!error && data) {
      const formattedUsers: UserAccount[] = data.map((u) => ({
        id: u.id,
        name: u.name,
        password: "",
        role: u.role as UserRole,
        status: u.status as AccountStatus,
        squadId: u.squad_id,
      }));
      setUsersDb(formattedUsers);
    }
  };

  const refreshGamification = async (uid?: string) => {
    const id = uid ?? user?.id;
    if (!id) return;
    const profile = await fetchGamificationProfile(supabase, id);
    if (profile) setGamification(profile);
  };

  const buyShopItem = async (itemId: string, price: number): Promise<string | null> => {
    if (!user) return "Не авторизований";
    const err = await buyShopItemInDb(supabase, user.id, itemId, price);
    if (!err) await refreshGamification();
    return err;
  };

  // СИНХРОНІЗАЦІЯ КУРСІВ З SUPABASE
  const fetchCoursesFromSupabase = async (): Promise<Course[]> => {
    try {
      const { data, error } = await supabase
        .from("lms_courses")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Помилка завантаження курсів з Supabase:", error);
        return [];
      }

      if (data && data.length > 0) {
        const formattedCourses: Course[] = data.map((c) => ({
          id: c.id,
          title: c.title,
          subtitle: c.subtitle || "",
          description: c.description || "",
          status: (c.status as "active" | "draft") || "draft",
          modules: c.modules || [],
          finalTest: c.final_test || { title: "", questions: [] },
        }));
        setCourses(formattedCourses);
        return formattedCourses;
      }

      return [];
    } catch (error) {
      console.error("Помилка при завантаженні курсів:", error);
      return [];
    }
  };

  const saveCourseToSupabase = async (course: Course) => {
    try {
      const { error } = await supabase
        .from('lms_courses')
        .upsert({
          id: course.id,
          title: course.title || "",
          subtitle: course.subtitle || "",
          description: course.description || "",
          status: course.status || "draft",
          modules: course.modules || [],
          final_test: course.finalTest || { title: "", questions: [] },
        });

      if (error) {
        console.error("Помилка Supabase при збереженні курсу:", error);
        throw error;
      }
    } catch (error) {
      console.error("Помилка при збереженні курсу:", error);
      throw error;
    }
  };

  // СИНХРОНІЗАЦІЯ ВІДПОВІДЕЙ З SUPABASE
  const fetchAnswersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("answers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Помилка завантаження відповідей з Supabase:", error);
        return;
      }

      if (data) {
        setAnswers(data.map(mapDbRowToAnswer));
      }
    } catch (error) {
      console.error("Помилка при завантаженні відповідей:", error);
    }
  };

  const saveAnswerToSupabase = async (answer: Answer) => {
    try {
      const { error } = await supabase
        .from("answers")
        .upsert({
          id: answer.id,
          lesson_id: answer.lessonId,
          course_id: answer.courseId,
          student_name: answer.studentName,
          squad_id: answer.squadId,
          text: answer.text,
          audio_url: answer.audioUrl,
          attachments: answer.attachments,
          created_at: answer.submittedAt,
          status: answer.status,
          teacher_feedback: answer.teacherFeedbackText,
          teacher_feedback_audio: answer.teacherFeedbackAudio,
          score: answer.score,
          locked_by_teacher_id: answer.locked_by_teacher_id,
        });

      if (error) {
        console.error("Помилка збереження відповіді в Supabase:", error);
      }
    } catch (error) {
      console.error("Помилка при збереженні відповіді:", error);
    }
  };

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ ПРИ ЗАПУСКУ
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        // Прибираємо застарілі localStorage-ключі (курси та відповіді тепер у Supabase)
        localStorage.removeItem("lanp_courses");
        localStorage.removeItem("lanp_answers");

        // Спочатку відновлюємо сесію Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        
        const savedUserSession = sessionStorage.getItem("lanp_user");

        // Завантажуємо курси з Supabase (єдине джерело правди)
        const loadedCourses = await fetchCoursesFromSupabase();

        // Якщо в Supabase ще немає курсів — сідимо initialCourses одноразово
        if (loadedCourses.length === 0) {
          for (const course of initialCourses as Course[]) {
            await supabase.from("lms_courses").upsert({
              id: course.id,
              title: course.title,
              subtitle: course.subtitle,
              description: course.description,
              status: course.status || "draft",
              modules: course.modules,
              final_test: course.finalTest || { title: "", questions: [] },
            });
          }
          await fetchCoursesFromSupabase();
        }

        // Завантажуємо відповіді з Supabase
        await fetchAnswersFromSupabase();

        const savedSupportTickets = localStorage.getItem("lanp_support_tickets");
        if (savedSupportTickets) {
          try {
            setSupportTickets(JSON.parse(savedSupportTickets));
          } catch (e) {
            console.error("Помилка парсингу тікетів підтримки:", e);
          }
        }
        
        // Пріоритет: sessionStorage цієї вкладки (уникаємо cross-tab конфліктів)
        if (savedUserSession) {
          try {
            const savedUser = JSON.parse(savedUserSession) as UserAccount;
            // Якщо Auth-сесія належить тому самому користувачу — оновлюємо профіль з БД
            if (session?.user && session.user.id === savedUser.id) {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("id, name, role, status, squad_id")
                .eq("id", session.user.id)
                .single();
              if (profileData) {
                const refreshed = {
                  id: profileData.id,
                  name: profileData.name,
                  role: profileData.role as UserRole,
                  squadId: profileData.squad_id,
                };
                setUser(refreshed);
                sessionStorage.setItem("lanp_user", JSON.stringify(refreshed));
              } else {
                setUser(savedUser);
              }
            } else {
              // Auth-сесія належить іншій вкладці — ігноруємо її
              setUser(savedUser);
            }
          } catch (e) {
            console.error("Помилка парсингу сесії:", e);
          }
        } else if (session?.user) {
          // Нова вкладка без sessionStorage — завантажуємо профіль з Auth
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, name, role, status, squad_id")
            .eq("id", session.user.id)
            .single();

          if (!profileError && profileData) {
            const sessionData = {
              id: profileData.id,
              name: profileData.name,
              role: profileData.role as UserRole,
              squadId: profileData.squad_id,
            };
            setUser(sessionData);
            sessionStorage.setItem("lanp_user", JSON.stringify(sessionData));
          }
        }

        // Обов'язково завантажуємо актуальних користувачів з хмари
        await fetchUsersFromSupabase();

        // Завантажуємо геймфікацію якщо юзер вже залогінений
        if (session?.user) {
          await refreshGamification(session.user.id);
        }
      } catch (error) {
        console.error("Помилка завантаження системи:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadSavedData();
  }, []);

  // Realtime-підписка на зміни profiles (замість polling)
  useEffect(() => {
    if (!isInitialized || !user) return;
    if (user.role !== "teacher" && user.role !== "admin") return;

    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          // При будь-якій зміні в profiles — перезавантажуємо список
          fetchUsersFromSupabase();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInitialized, user]);

  // Курси зберігаються виключно в Supabase — localStorage для курсів більше не використовується

  // --- СЕРВЕРНА ЛОГІКА АВТОРИЗАЦІЇ (SUPABASE) ---

  const registerUser = async (
    name: string,
    password: string,
    role: UserRole,
  ): Promise<string | null> => {
    // Перевіряємо унікальність імені безпосередньо в базі
    const { data: existing } = await supabase
      .from("profiles")
      .select("name")
      .eq("name", name);
    if (existing && existing.length > 0) {
      return "Користувач з таким іменем вже існує.";
    }

    // Хешуємо пароль перед збереженням
    const hashedPassword = await hashPassword(password);

    // Створюємо користувача в Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: nameToEmail(name),
      password: password,
      options: {
        data: {
          name: name,
          role: role,
        }
      }
    });

    if (authError) {
      console.error("Supabase Auth error:", authError);
      // Якщо Supabase Auth не працює, fallback на старий метод
      const uid = `usr-${Date.now()}`;
      const { error } = await supabase.from("profiles").insert([
        {
          id: uid,
          name,
          password: hashedPassword,
          role,
          status: "pending",
          squad_id: role === "student" ? "Alpha Squad" : null,
        },
      ]);

      if (error) return "Помилка реєстрації на сервері.";
      await fetchUsersFromSupabase();
      return null;
    }

    // Якщо Supabase Auth успішний, створюємо профіль
    if (authData.user) {
      const { error } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          name,
          password: hashedPassword,
          role,
          status: "pending",
          squad_id: role === "student" ? "Alpha Squad" : null,
        },
      ]);

      if (error) return "Помилка створення профілю.";
      await fetchUsersFromSupabase();
    }

    return null;
  };

  const login = async (
    name: string,
    password: string,
  ): Promise<string | null> => {
    // Спробуємо авторизуватися через Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: nameToEmail(name),
      password: password,
    });

    // Якщо Supabase Auth не спрацював, використовуємо fallback без помилок
    if (authError) {
      // Fallback на старий метод (без викидання помилок)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, password, role, status, squad_id")
        .ilike("name", name)
        .maybeSingle();

      if (error || !data) return "Користувача не знайдено.";
      
      const isHashed = data.password.startsWith("$2b$") || data.password.startsWith("$2a$");
      let isPasswordValid: boolean;
      
      if (isHashed) {
        isPasswordValid = await verifyPassword(password, data.password);
      } else {
        isPasswordValid = password === data.password;
        if (isPasswordValid) {
          const hashedPassword = await hashPassword(password);
          await supabase
            .from("profiles")
            .update({ password: hashedPassword })
            .eq("id", data.id);
        }
      }
      
      if (!isPasswordValid) return "Невірний пароль.";
      
      if (data.status === "pending")
        return "Ваш акаунт ще не активовано адміністрацією.";

      const sessionData = {
        id: data.id,
        name: data.name,
        role: data.role as UserRole,
        squadId: data.squad_id,
      };
      setUser(sessionData);
      sessionStorage.setItem("lanp_user", JSON.stringify(sessionData));
      const streakResult = await processDailyStreak(supabase, data.id);
      if (streakResult.wasStreakBroken) setInstructorMood("angry");
      await refreshGamification(data.id);
      return null;
    }

    // Якщо Supabase Auth успішний, отримуємо дані профілю
    if (authData?.user) {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, name, role, status, squad_id")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !profileData) {
        return "Профіль не знайдено.";
      }

      if (profileData.status === "pending")
        return "Ваш акаунт ще не активовано адміністрацією.";

      const sessionData = {
        id: profileData.id,
        name: profileData.name,
        role: profileData.role as UserRole,
        squadId: profileData.squad_id,
      };
      setUser(sessionData);
      sessionStorage.setItem("lanp_user", JSON.stringify(sessionData));
      const streakResult2 = await processDailyStreak(supabase, profileData.id);
      if (streakResult2.wasStreakBroken) setInstructorMood("angry");
      await refreshGamification(profileData.id);
      return null;
    }

    return "Помилка авторизації.";
  };

  const logout = async () => {
    // Вихід з Supabase Auth
    await supabase.auth.signOut();
    setUser(null);
    sessionStorage.removeItem("lanp_user");
  };

  const approveUser = async (userId: string) => {
    // Optimistic update — instant UI response
    setUsersDb((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "approved" as const } : u)),
    );
    const { error } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", userId);
    if (error) await fetchUsersFromSupabase(); // revert on error
  };

  const rejectUser = async (userId: string) => {
    // Optimistic update — instant UI response (confirm dialog moved to UsersTab)
    setUsersDb((prev) => prev.filter((u) => u.id !== userId));
    const { error } = await supabase.from("profiles").delete().eq("id", userId);
    if (error) await fetchUsersFromSupabase(); // revert on error
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    const hashedPassword = await hashPassword(newPassword);
    const { error } = await supabase
      .from("profiles")
      .update({ password: hashedPassword })
      .eq("id", userId);
    if (error) console.error("Помилка зміни пароля:", error.message);
  };

  // --- ІНШІ ФУНКЦІЇ (ВІДПОВІДІ ТА CRUD КУРСІВ) ---
  const submitAnswer = async (
    answerData: Omit<
      Answer,
      "id" | "submittedAt" | "status" | "studentName" | "squadId"
    > & { audioBlob?: Blob | null; files?: File[] },
  ) => {
    if (!user) {
      console.error("Користувач не авторизований для відправки відповіді");
      return;
    }

    let audioUrl: string | undefined;
    let fileUrls: string[] = [];

    try {
      // Завантаження аудіо в Supabase Storage
      if (answerData.audioBlob) {
        try {
          const fileExt = "webm";
          const fileName = `audio-${Date.now()}.${fileExt}`;
          const filePath = `student-answers/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("lesson-media")
            .upload(filePath, answerData.audioBlob);

          if (!uploadError) {
            const { data } = supabase.storage
              .from("lesson-media")
              .getPublicUrl(filePath);
            audioUrl = data.publicUrl;
          } else {
            console.error("Помилка завантаження аудіо:", uploadError);
          }
        } catch (error) {
          console.error("Помилка завантаження аудіо:", error);
        }
      }

      // Завантаження файлів в Supabase Storage
      if (answerData.files && answerData.files.length > 0) {
        for (const file of answerData.files) {
          try {
            const fileExt = file.name.split(".").pop();
            const fileName = `file-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `student-answers/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from("lesson-media")
              .upload(filePath, file);

            if (!uploadError) {
              const { data } = supabase.storage
                .from("lesson-media")
                .getPublicUrl(filePath);
              fileUrls.push(data.publicUrl);
            } else {
              console.error("Помилка завантаження файлу:", uploadError);
            }
          } catch (error) {
            console.error("Помилка завантаження файлу:", error);
          }
        }
      }
    } catch (error) {
      console.error("Помилка при обробці відповіді:", error);
    }

    // Зберігаємо відповідь в Supabase (answers table)
    const { data, error } = await supabase
      .from('answers')
      .insert([{
        user_id: user?.id,
        course_id: answerData.courseId,
        lesson_id: answerData.lessonId,
        text: answerData.text || "",
        audio_url: audioUrl || null,
        attachments: [...(answerData.attachments || []), ...(fileUrls || [])],
        status: 'pending',
        student_name: user?.name || "Курсант",
        squad_id: user?.squadId || "General"
      }])
      .select()
      .single();

    if (error) {
      console.error("Помилка Supabase при збереженні:", error);
      throw error;
    }

    if (data) {
      setAnswers((prev) => [...prev, mapDbRowToAnswer(data)]);
    }
  };

  const provideFeedback = async (
    answerId: string,
    feedbackText: string,
    feedbackAudio: boolean,
    score?: number,
    coinsToAward?: number,
  ) => {
    const answer = answers.find((a) => a.id === answerId);
    const willAwardCoins = !!(coinsToAward && coinsToAward > 0 && !answer?.coins_awarded);

    // Optimistic update
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.id === answerId
          ? {
              ...ans,
              teacherFeedbackText: feedbackText,
              teacherFeedbackAudio: feedbackAudio,
              score,
              status: "reviewed",
              coins_awarded: willAwardCoins ? true : ans.coins_awarded,
            }
          : ans,
      ),
    );

    const { error } = await supabase
      .from("answers")
      .update({
        score,
        teacher_feedback: feedbackText,
        teacher_feedback_audio: feedbackAudio,
        status: "reviewed",
        ...(willAwardCoins ? { coins_awarded: true } : {}),
      })
      .eq("id", answerId);

    if (error) {
      console.error("Помилка Supabase при збереженні фідбеку:", error);
      throw error;
    }

    const studentId = answer?.user_id || usersDb.find((u) => u.name === answer?.studentName)?.id;

    if (studentId) {
      // Нараховуємо коїни (тільки якщо ще не нараховані)
      if (willAwardCoins && coinsToAward) {
        await awardCoins(supabase, studentId, coinsToAward);
      }

      // Перевіряємо завершення курсу
      if (answer?.courseId) {
        const justCompleted = await checkAndCompleteCourse(supabase, studentId, answer.courseId, courses);
        if (justCompleted) {
          setInstructorMood("proud");
          await refreshGamification(studentId);
        }
      }

      // Оновлюємо SLP
      if (score !== undefined) {
        await recalculateSlp(supabase, studentId, courses);
      }
    }
  };

  const addCourse = async (title: string, subtitle: string, description: string) => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      title,
      subtitle,
      description,
      status: "draft",
      modules: [],
      finalTest: { title: `Підсумковий тест: ${title}`, questions: [] },
    };
    setCourses((prev) => [...prev, newCourse]);
    await saveCourseToSupabase(newCourse);
  };

  const updateCourse = async (courseId: string, updatedData: Partial<Course>) => {
    const newCourses = courses.map((c) =>
      c.id === courseId ? { ...c, ...updatedData } : c,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const deleteCourse = async (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
    try {
      await supabase.from("lms_courses").delete().eq("id", courseId);
    } catch (error) {
      console.error("Помилка видалення курсу з Supabase:", error);
    }
  };

  const addModule = async (courseId: string, title: string, icon: string) => {
    const newCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            modules: [
              ...course.modules,
              { id: `mod-${Date.now()}`, title, icon, lessons: [] },
            ],
          }
        : course,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const updateModule = async (
    courseId: string,
    moduleId: string,
    updatedData: Partial<Module>,
  ) => {
    const newCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            modules: course.modules.map((mod) =>
              mod.id === moduleId ? { ...mod, ...updatedData } : mod,
            ),
          }
        : course,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const deleteModule = async (courseId: string, moduleId: string) => {
    const newCourses = courses.map((course) =>
      course.id === courseId
        ? { ...course, modules: course.modules.filter((m) => m.id !== moduleId) }
        : course,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const addLesson = async (
    courseId: string,
    moduleId: string,
    lessonData: Omit<Lesson, "id">,
  ) => {
    const newCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            modules: course.modules.map((mod) =>
              mod.id === moduleId
                ? {
                    ...mod,
                    lessons: [
                      ...mod.lessons,
                      { ...lessonData, id: `lesson-${Date.now()}` },
                    ],
                  }
                : mod,
            ),
          }
        : course,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const updateLesson = async (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updatedData: Partial<Lesson>,
  ) => {
    const newCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            modules: course.modules.map((mod) =>
              mod.id === moduleId
                ? {
                    ...mod,
                    lessons: mod.lessons.map((l) =>
                      l.id === lessonId ? { ...l, ...updatedData } : l,
                    ),
                  }
                : mod,
            ),
          }
        : course,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const deleteLesson = async (
    courseId: string,
    moduleId: string,
    lessonId: string,
  ) => {
    const newCourses = courses.map((course) =>
      course.id === courseId
        ? {
            ...course,
            modules: course.modules.map((mod) =>
              mod.id === moduleId
                ? { ...mod, lessons: mod.lessons.filter((l) => l.id !== lessonId) }
                : mod,
            ),
          }
        : course,
    );
    setCourses(newCourses);
    const updatedCourse = newCourses.find((c) => c.id === courseId);
    if (updatedCourse) await saveCourseToSupabase(updatedCourse);
  };

  const addSupportTicket = async (type: "bug" | "improvement", message: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          user_name: user.name,
          type,
          message,
          status: "open",
        })
        .select();

      if (error) {
        console.error("Помилка при додаванні тікета в Supabase:", error);
        return;
      }

      const newTicket: SupportTicket = {
        id: data[0].id,
        userName: user.name,
        type,
        message,
        date: data[0].created_at,
        status: "open",
      };
      
      setSupportTickets((prev) => {
        const updated = [...prev, newTicket];
        localStorage.setItem("lanp_support_tickets", JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Помилка при додаванні тікета:", error);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: "open" | "closed") => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({ status })
        .eq("id", ticketId);

      if (error) {
        console.error("Помилка при оновленні статусу тікета в Supabase:", error);
        return;
      }

      // Оновлюємо локальний стан
      setSupportTickets((prev) => {
        const updated = prev.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status } : ticket,
        );
        localStorage.setItem("lanp_support_tickets", JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error("Помилка при оновленні статусу тікета:", error);
    }
  };

  const fetchSupportTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Помилка при завантаженні тікетів з Supabase:", error);
        return;
      }

      const tickets: SupportTicket[] = data.map((ticket) => ({
        id: ticket.id,
        userName: ticket.user_name,
        type: ticket.type,
        message: ticket.message,
        date: ticket.created_at,
        status: ticket.status,
      }));

      setSupportTickets(tickets);
      localStorage.setItem("lanp_support_tickets", JSON.stringify(tickets));
    } catch (error) {
      console.error("Помилка при завантаженні тікетів:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        courses,
        answers,
        grammarBase: GRAMMAR_BASE,
        usersDb,
        supportTickets,
        isInitialized,
        registerUser,
        login,
        logout,
        approveUser,
        rejectUser,
        changeUserPassword,
        submitAnswer,
        provideFeedback,
        addSupportTicket,
        updateTicketStatus,
        fetchSupportTickets,
        addCourse,
        updateCourse,
        deleteCourse,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
        gamification,
        instructorMood,
        refreshGamification,
        buyShopItem,
      }}
    >
      {isInitialized ? (
        children
      ) : (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f0e9d8",
            fontFamily: "sans-serif",
            color: "#3a3528",
            fontWeight: 500,
          }}
        >
          Завантаження системи...
        </div>
      )}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context)
    throw new Error("useAppContext must be used within AppProvider");
  return context;
}
