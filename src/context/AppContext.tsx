"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { supabase } from "@/lib/supabase";
import { AuthProvider, useAuth } from "./auth";
import { GamificationProvider, useGamification } from "./gamification";
import { CoursesProvider, useCourses } from "./courses";
import type {
  SkillType,
  UserRole,
  AccountStatus,
  QuizletCard,
  QuizQuestion,
  LessonDocument,
  Lesson,
  Module,
  Course,
  Answer,
  SupportTicket,
  GrammarRule,
  Question,
  UserAccount,
} from "@/types";
import type { GamificationProfile, BuyShopResult } from "@/lib/gamification";

// Re-export domain types (backward compatible imports from AppContext)
export type {
  SkillType,
  UserRole,
  AccountStatus,
  QuizletCard,
  QuizQuestion,
  LessonDocument,
  Lesson,
  Module,
  Course,
  Answer,
  GamificationProfile,
  SupportTicket,
  GrammarRule,
  Question,
  UserAccount,
} from "@/types";

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
  buyShopItem: (itemId: string, price: number) => Promise<BuyShopResult>;

  addSupportTicket: (type: "bug" | "improvement", message: string) => Promise<void>;
  updateTicketStatus: (ticketId: string, status: "open" | "closed") => Promise<void>;
  fetchSupportTickets: () => Promise<void>;

  addCourse: (title: string, subtitle: string, description: string) => Promise<void>;
  updateCourse: (courseId: string, updatedData: Partial<Course>) => Promise<void>;
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
  return (
    <AuthProvider>
      <GamificationProvider>
        <CoursesProvider>
          <AppProviderInner>{children}</AppProviderInner>
        </CoursesProvider>
      </GamificationProvider>
    </AuthProvider>
  );
}

function AppProviderInner({ children }: { children: ReactNode }) {
  const {
    user,
    usersDb,
    registerUser,
    login,
    logout,
    approveUser,
    rejectUser,
    changeUserPassword,
    fetchUsersFromSupabase,
  } = useAuth();

  const {
    gamification,
    instructorMood,
    refreshGamification,
    buyShopItem,
  } = useGamification();

  const {
    courses,
    answers,
    isInitialized,
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
  } = useCourses();

  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    const savedSupportTickets = localStorage.getItem("lanp_support_tickets");
    if (!savedSupportTickets) return;
    try {
      setSupportTickets(JSON.parse(savedSupportTickets));
    } catch (e) {
      console.error("Помилка парсингу тікетів підтримки:", e);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized || !user) return;
    if (user.role !== "teacher" && user.role !== "admin") return;

    const channel = supabase
      .channel("profiles-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchUsersFromSupabase();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isInitialized, user, fetchUsersFromSupabase]);

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
