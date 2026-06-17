"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { initialCourses } from "../data/courses";
import { supabase } from "../lib/supabase"; // Підключаємо наш міст до хмари
import { hashPassword, verifyPassword } from "../lib/password";

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
  skill?: "listening" | "reading" | "speaking" | "writing" | "mixed";

  // ДОДАЄМО НАШІ НОВІ ПОЛЯ:
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
}

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
  user: { name: string; role: UserRole; squadId?: string } | null;
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
  ) => void;

  addSupportTicket: (type: "bug" | "improvement", message: string) => void;
  updateTicketStatus: (ticketId: string, status: "open" | "closed") => void;

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

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppState["user"]>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses as Course[]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [usersDb, setUsersDb] = useState<UserAccount[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [grammarBase] = useState<GrammarRule[]>([
    {
      id: "g-to-be",
      title: 'Дієслово "to be" як linking verb',
      category: "Граматика А1-А2",
      content:
        'Дієслово "to be" зв’язує підмет зі станом, якістю або професією (наприклад: He is a Lieutenant / They are ready).',
    },
  ]);

  // СИНХРОНІЗАЦІЯ КОРИСТУВАЧІВ З SUPABASE
  const fetchUsersFromSupabase = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && data) {
      // Трансформуємо змійок snake_case з бази у camelCase для нашого React-коду
      const formattedUsers: UserAccount[] = data.map((u) => ({
        id: u.id,
        name: u.name,
        password: u.password,
        role: u.role as UserRole,
        status: u.status as AccountStatus,
        squadId: u.squad_id,
      }));
      setUsersDb(formattedUsers);
    }
  };

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ ПРИ ЗАПУСКУ
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedCourses = localStorage.getItem("lanp_courses");
        const savedAnswers = localStorage.getItem("lanp_answers");
        const savedUserSession = sessionStorage.getItem("lanp_user");
        const savedSupportTickets = localStorage.getItem("lanp_support_tickets");

        if (savedCourses) {
          try {
            setCourses(JSON.parse(savedCourses));
          } catch (e) {
            console.error("Помилка парсингу курсів:", e);
          }
        }
        if (savedAnswers) {
          try {
            setAnswers(JSON.parse(savedAnswers));
          } catch (e) {
            console.error("Помилка парсингу відповідей:", e);
          }
        }
        if (savedSupportTickets) {
          try {
            setSupportTickets(JSON.parse(savedSupportTickets));
          } catch (e) {
            console.error("Помилка парсингу тікетів підтримки:", e);
          }
        }
        if (savedUserSession) {
          try {
            setUser(JSON.parse(savedUserSession));
          } catch (e) {
            console.error("Помилка парсингу сесії:", e);
          }
        }

        // Обов'язково завантажуємо актуальних користувачів з хмари
        await fetchUsersFromSupabase();
      } catch (error) {
        console.error("Помилка завантаження системи:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadSavedData();
  }, []);

  // Періодично оновлюємо список користувачів, якщо викладач або адмін у системі
  useEffect(() => {
    if (
      isInitialized &&
      user &&
      (user.role === "teacher" || user.role === "admin")
    ) {
      const interval = setInterval(fetchUsersFromSupabase, 5000); // кожні 5 секунд
      return () => clearInterval(interval);
    }
  }, [isInitialized, user]);

  // 2. ЗБЕРЕЖЕННЯ КУРСІВ ТА ВІДПОВІДЕЙ (Поки що в LocalStorage, наступним кроком перенесемо теж в хмару)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("lanp_courses", JSON.stringify(courses));
      } catch (e) {
        console.error("Помилка збереження курсів:", e);
      }
    }
  }, [courses, isInitialized]);
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem("lanp_answers", JSON.stringify(answers));
      } catch (e) {
        console.error("Помилка збереження відповідей:", e);
      }
    }
  }, [answers, isInitialized]);

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

    const uid = `usr-${Date.now()}`;
    const { error } = await supabase.from("profiles").insert([
      {
        id: uid,
        name,
        password: hashedPassword,
        role,
        status: "pending", // Всі за замовчуванням чекають перевірки
        squad_id: role === "student" ? "Alpha Squad" : null,
      },
    ]);

    if (error) return "Помилка реєстрації на сервері.";
    await fetchUsersFromSupabase();
    return null;
  };

  const login = async (
    name: string,
    password: string,
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .ilike("name", name)
      .maybeSingle();

    if (error || !data) return "Користувача не знайдено.";
    
    // Перевіряємо, чи пароль вже хешований (bcrypt хеш починається з $2b$ або $2a$)
    const isHashed = data.password.startsWith("$2b$") || data.password.startsWith("$2a$");
    
    let isPasswordValid: boolean;
    
    if (isHashed) {
      // Якщо пароль вже хешований - перевіряємо з bcrypt
      isPasswordValid = await verifyPassword(password, data.password);
    } else {
      // Якщо пароль не хешований (старі дані) - порівнюємо як plain text
      isPasswordValid = password === data.password;
      
      // Якщо пароль вірний - хешуємо його і оновлюємо в базі
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
      name: data.name,
      role: data.role as UserRole,
      squadId: data.squad_id,
    };
    setUser(sessionData);
    sessionStorage.setItem("lanp_user", JSON.stringify(sessionData));
    return null;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("lanp_user");
  };

  const approveUser = async (userId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ status: "approved" })
      .eq("id", userId);
    if (!error) await fetchUsersFromSupabase();
  };

  const rejectUser = async (userId: string) => {
    if (
      confirm("Ви впевнені, що хочете відхилити заявку / видалити користувача?")
    ) {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);
      if (!error) await fetchUsersFromSupabase();
    }
  };

  const changeUserPassword = async (userId: string, newPassword: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ password: newPassword })
      .eq("id", userId);
    if (!error) await fetchUsersFromSupabase();
  };

  // --- ІНШІ ФУНКЦІЇ (ВІДПОВІДІ ТА CRUD КУРСІВ) ---
  const submitAnswer = async (
    answerData: Omit<
      Answer,
      "id" | "submittedAt" | "status" | "studentName" | "squadId"
    > & { audioBlob?: Blob | null; files?: File[] },
  ) => {
    console.log("submitAnswer викликано:", answerData);
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

    // КРИТИЧНО: Формуємо об'єкт нової відповіді
    const newAnswer: Answer = {
      id: `ans-${Date.now()}`,
      lessonId: answerData.lessonId,
      courseId: answerData.courseId,
      text: answerData.text,
      studentName: user.name,
      squadId: user.squadId || "General",
      submittedAt: new Date().toISOString(),
      status: "pending",
      voiceRecorded: !!audioUrl,
      audioUrl: audioUrl,
      attachments: [...(answerData.attachments || []), ...(fileUrls || [])],
    };

    console.log("Нова відповідь для додавання:", newAnswer);

    // КРИТИЧНО: Зберігаємо відповідь в локальному стані в будь-якому випадку
    setAnswers((prev) => {
      const updated = [...prev, newAnswer];
      console.log("Оновлений список відповідей:", updated);
      localStorage.setItem("lanp_answers", JSON.stringify(updated));
      return updated;
    });
  };

  const provideFeedback = (
    answerId: string,
    feedbackText: string,
    feedbackAudio: boolean,
    score?: number,
  ) => {
    setAnswers((prev) =>
      prev.map((ans) =>
        ans.id === answerId
          ? {
              ...ans,
              teacherFeedbackText: feedbackText,
              teacherFeedbackAudio: feedbackAudio,
              score,
              status: "reviewed",
            }
          : ans,
      ),
    );
  };

  const addCourse = (title: string, subtitle: string, description: string) => {
    setCourses((prev) => [
      ...prev,
      {
        id: `course-${Date.now()}`,
        title,
        subtitle,
        description,
        status: "draft",
        modules: [],
        finalTest: { title: `Підсумковий тест: ${title}`, questions: [] },
      },
    ]);
  };
  const updateCourse = (courseId: string, updatedData: Partial<Course>) => {
    setCourses((prev) =>
      prev.map((c) => (c.id === courseId ? { ...c, ...updatedData } : c)),
    );
  };
  const deleteCourse = (courseId: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== courseId));
  };
  const addModule = (courseId: string, title: string, icon: string) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              modules: [
                ...course.modules,
                { id: `mod-${Date.now()}`, title, icon, lessons: [] },
              ],
            }
          : course,
      ),
    );
  };
  const updateModule = (
    courseId: string,
    moduleId: string,
    updatedData: Partial<Module>,
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              modules: course.modules.map((mod) =>
                mod.id === moduleId ? { ...mod, ...updatedData } : mod,
              ),
            }
          : course,
      ),
    );
  };
  const deleteModule = (courseId: string, moduleId: string) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              modules: course.modules.filter((m) => m.id !== moduleId),
            }
          : course,
      ),
    );
  };
  const addLesson = (
    courseId: string,
    moduleId: string,
    lessonData: Omit<Lesson, "id">,
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
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
      ),
    );
  };
  const updateLesson = (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updatedData: Partial<Lesson>,
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
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
      ),
    );
  };
  const deleteLesson = (
    courseId: string,
    moduleId: string,
    lessonId: string,
  ) => {
    setCourses((prev) =>
      prev.map((course) =>
        course.id === courseId
          ? {
              ...course,
              modules: course.modules.map((mod) =>
                mod.id === moduleId
                  ? {
                      ...mod,
                      lessons: mod.lessons.filter((l) => l.id !== lessonId),
                    }
                  : mod,
              ),
            }
          : course,
      ),
    );
  };

  const addSupportTicket = (type: "bug" | "improvement", message: string) => {
    console.log("Додавання тікета підтримки:", { type, message, user });
    if (!user) {
      console.error("Користувач не авторизований для додавання тікета");
      return;
    }
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      userName: user.name,
      type,
      message,
      date: new Date().toISOString(),
      status: "open",
    };
    console.log("Новий тікет:", newTicket);
    setSupportTickets((prev) => {
      const updated = [...prev, newTicket];
      console.log("Оновлений список тікетів:", updated);
      localStorage.setItem("lanp_support_tickets", JSON.stringify(updated));
      return updated;
    });
  };

  const updateTicketStatus = (ticketId: string, status: "open" | "closed") => {
    setSupportTickets((prev) => {
      const updated = prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status } : ticket,
      );
      localStorage.setItem("lanp_support_tickets", JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AppContext.Provider
      value={{
        user,
        courses,
        answers,
        grammarBase,
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
        addCourse,
        updateCourse,
        deleteCourse,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
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
