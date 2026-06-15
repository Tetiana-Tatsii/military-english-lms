"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { initialCourses } from "../data/courses";

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

export interface Lesson {
  id: string;
  title: string;
  section: string;
  content: string;
  videoLabel: string;
  duration: string;
  quizlet: QuizletCard[];
  skill: SkillType;
}

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
  finalTest: { title: string; questions: any[] };
}

export interface Answer {
  id: string;
  lessonId: string;
  courseId: string;
  studentName: string;
  squadId: string;
  text: string;
  voiceRecorded: boolean;
  attachments: string[];
  submittedAt: string;
  status: "pending" | "reviewed";
  teacherFeedbackText?: string;
  teacherFeedbackAudio?: boolean;
  score?: number;
}

export interface GrammarRule {
  id: string;
  title: string;
  category: string;
  content: string;
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

  registerUser: (
    name: string,
    password: string,
    role: UserRole,
  ) => string | null;
  login: (name: string, password: string) => string | null;
  logout: () => void;

  // Керування доступом
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  changeUserPassword: (userId: string, newPassword: string) => void;

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

const defaultUsers: UserAccount[] = [
  {
    id: "usr-admin",
    name: "Викладач",
    password: "1234",
    role: "teacher",
    status: "approved",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppState["user"]>(null);
  const [courses, setCourses] = useState<Course[]>(initialCourses as Course[]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [usersDb, setUsersDb] = useState<UserAccount[]>(defaultUsers);
  const [isInitialized, setIsInitialized] = useState(false);
  const [grammarBase] = useState<GrammarRule[]>([
    {
      id: "g-to-be",
      title: 'Дієслово "to be" як linking verb',
      category: "Граматика А1-А2",
      content:
        'Дієслово "to be" зв’язує підмет зі станом, якістю або професією (наприклад: He is a Lieutenant / They are ready). Важливо не змішувати його вживання з тривалими часами (Continuous) на початкових етапах вивчення, щоб курсанти чітко розрізняли опис стану від опису процесу дії.',
    },
  ]);

  // 1. ЗАВАНТАЖЕННЯ ДАНИХ (Асинхронно)
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedCourses = localStorage.getItem("lanp_courses");
        const savedAnswers = localStorage.getItem("lanp_answers");
        const savedUsers = localStorage.getItem("lanp_users_db");
        const savedUserSession = sessionStorage.getItem("lanp_user");

        if (savedCourses) setCourses(JSON.parse(savedCourses));
        if (savedAnswers) setAnswers(JSON.parse(savedAnswers));
        if (savedUsers) setUsersDb(JSON.parse(savedUsers));
        if (savedUserSession) setUser(JSON.parse(savedUserSession));
      } catch (error) {
        console.error("Помилка читання з пам'яті:", error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadSavedData();
  }, []);

  // 2. ЗБЕРЕЖЕННЯ ДАНИХ
  useEffect(() => {
    if (isInitialized)
      localStorage.setItem("lanp_courses", JSON.stringify(courses));
  }, [courses, isInitialized]);
  useEffect(() => {
    if (isInitialized)
      localStorage.setItem("lanp_answers", JSON.stringify(answers));
  }, [answers, isInitialized]);
  useEffect(() => {
    if (isInitialized)
      localStorage.setItem("lanp_users_db", JSON.stringify(usersDb));
  }, [usersDb, isInitialized]);

  // --- ЛОГІКА БЕЗПЕКИ ТА АВТОРИЗАЦІЇ ---
  const registerUser = (
    name: string,
    password: string,
    role: UserRole,
  ): string | null => {
    if (usersDb.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      return "Користувач з таким іменем вже існує.";
    }
    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      name,
      password,
      role,
      squadId: role === "student" ? "Alpha Squad" : undefined,
      status: "pending",
    };
    setUsersDb((prev) => [...prev, newUser]);
    return null;
  };

  const login = (name: string, password: string): string | null => {
    const foundUser = usersDb.find(
      (u) => u.name.toLowerCase() === name.toLowerCase(),
    );
    if (!foundUser) return "Користувача не знайдено.";
    if (foundUser.password !== password) return "Невірний пароль.";
    if (foundUser.status === "pending")
      return "Ваш акаунт ще не активовано викладачем.";

    const sessionData = {
      name: foundUser.name,
      role: foundUser.role,
      squadId: foundUser.squadId,
    };
    setUser(sessionData);
    sessionStorage.setItem("lanp_user", JSON.stringify(sessionData));
    return null;
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("lanp_user");
  };

  const approveUser = (userId: string) => {
    setUsersDb((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: "approved" } : u)),
    );
  };

  const rejectUser = (userId: string) => {
    if (
      confirm(
        "Ви впевнені, що хочете відхилити цю заявку або видалити користувача?",
      )
    ) {
      setUsersDb((prev) => prev.filter((u) => u.id !== userId));
    }
  };

  const changeUserPassword = (userId: string, newPassword: string) => {
    setUsersDb((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
    );
  };

  const submitAnswer = (
    answerData: Omit<
      Answer,
      "id" | "submittedAt" | "status" | "studentName" | "squadId"
    >,
  ) => {
    if (!user) return;
    setAnswers((prev) => [
      ...prev,
      {
        ...answerData,
        id: `ans-${Date.now()}`,
        studentName: user.name,
        squadId: user.squadId || "General",
        submittedAt: new Date().toISOString(),
        status: "pending",
      },
    ]);
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

  // --- ЛОГІКА КУРСІВ (CRUD) ---
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

  return (
    <AppContext.Provider
      value={{
        user,
        courses,
        answers,
        grammarBase,
        usersDb,
        registerUser,
        login,
        logout,
        approveUser,
        rejectUser,
        changeUserPassword,
        submitAnswer,
        provideFeedback,
        addCourse,
        updateCourse,
        deleteCourse,
        addModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
        isInitialized,
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
