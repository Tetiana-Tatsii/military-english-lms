"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import {
  Shield,
  LogOut,
  Users,
  Edit3,
  Inbox,
  ChevronDown,
  Sun,
  Moon,
  LifeBuoy,
} from "lucide-react";
import AnswersTab from "@/components/teacher/AnswersTab";
import UsersTab from "@/components/teacher/UsersTab";
import EditorTab from "@/components/teacher/EditorTab";
import SupportTab from "@/components/teacher/SupportTab";

export default function TeacherDashboard() {
  const {
    user,
    courses,
    answers,
    usersDb,
    supportTickets,
    approveUser,
    rejectUser,
    changeUserPassword,
    addCourse,
    updateCourse,
    deleteCourse,
    addModule,
    updateModule,
    deleteModule,
    addLesson,
    updateLesson,
    deleteLesson,
    logout,
    provideFeedback,
    updateTicketStatus,
    fetchSupportTickets,
    isInitialized,
  } = useAppContext();
  const router = useRouter();

  const [tab, setTab] = useState<"answers" | "users" | "editor" | "support">(
    "editor",
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useDarkMode();

  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push("/login");
      else if (user.role === "student") router.push("/dashboard");
      else if (user.role === "admin") {
        fetchSupportTickets();
      }
    }
  }, [user, router, isInitialized, fetchSupportTickets]);

  if (!isInitialized || !user || user.role === "student") {
    return (
      <div
        className={`flex min-h-screen items-center justify-center font-semibold ${
          isDarkMode ? "bg-[#1c1d1a] text-[#8a8a45]" : "bg-[#faf9f6] text-[#8a8a45]"
        }`}
      >
        Завантаження кабінету...
      </div>
    );
  }

  const visibleUsers = usersDb.filter((u) =>
    user.role === "admin" ? true : u.role === "student",
  );

  // Виносимо меню профілю в окрему змінну, щоб зручно показувати його на мобільних і десктопах
  const profileMenu = (
    <div className="relative">
      <div
        onClick={() => setIsProfileOpen(!isProfileOpen)}
        className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 transition-colors ${
          isProfileOpen ? (isDarkMode ? "bg-[#3e403a]" : "bg-[#e0dcd0]") : "bg-transparent"
        }`}
      >
        <span className="text-sm font-semibold">{user.name}</span>
        <ChevronDown
          size={16}
          color="#8a8a45"
          className={`transition-transform duration-200 ${
            isProfileOpen ? "rotate-180" : ""
          }`}
        />
      </div>
      {isProfileOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-56 rounded-xl border p-2 shadow-xl z-50 ${
            isDarkMode
              ? "border-[#3e403a] bg-[#2d2f2a]"
              : "border-[#e0dcd0] bg-white"
          }`}
        >
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`mb-2 flex w-full items-center gap-2.5 rounded-lg border-none px-3 py-2.5 text-sm font-semibold text-left cursor-pointer ${
              isDarkMode
                ? "bg-[#2a2c27] text-[#e6e4dc]"
                : "bg-[#faf9f6] text-[#3a3528]"
            }`}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            {isDarkMode ? "Світла тема" : "Темна тема"}
          </button>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            className={`flex w-full items-center gap-2.5 rounded-lg border-none px-3 py-2.5 text-sm font-semibold text-left cursor-pointer ${
              isDarkMode
                ? "bg-[#3a1a1a] text-[#ff6b6b]"
                : "bg-[#fdeced] text-[#c97a4a]"
            }`}
          >
            <LogOut size={16} /> <span>Розлогінитись</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`flex min-h-screen flex-col font-sans transition-colors ${
        isDarkMode ? "bg-[#1c1d1a] text-[#e6e4dc]" : "bg-[#faf9f6] text-[#4a4a4a]"
      }`}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .dark-quill .ql-toolbar.ql-snow { background: #252622; border-color: #3e403a; }
        .dark-quill .ql-container.ql-snow { background: #2d2f2a; border-color: #3e403a; }
        .dark-quill .ql-editor { color: rgb(250, 249, 246); }
        .dark-quill .ql-editor::before { color: #9a8f70; }
        .dark-quill .ql-snow .ql-stroke { stroke: #d8cdb4; }
        .dark-quill .ql-snow .ql-fill, .dark-quill .ql-snow .ql-stroke.ql-fill { fill: #d8cdb4; }
        .dark-quill .ql-snow .ql-picker { color: #d8cdb4; }
        .dark-quill .ql-snow .ql-picker-options { background-color: #2d2f2a; border-color: #3e403a; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />

      {/* Адаптивний Header */}
      <header
        className={`flex flex-col gap-4 border-b px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-8 ${
          isDarkMode
            ? "border-[#3e403a] bg-[#2a2c27]"
            : "border-[#e0dcd0] bg-[#f0ede5]"
        }`}
      >
        {/* Верхній рядок: Лого + Профіль (на мобільних) */}
        <div className="flex w-full items-center justify-between md:w-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#8a8a45]">
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <p
                className={`m-0 text-sm font-bold ${
                  isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
                }`}
              >
                MILITARY LMS
              </p>
              <p
                className={`m-0 text-[11px] ${
                  isDarkMode ? "text-[#a3a198]" : "text-[#8a8a45]"
                }`}
              >
                {user.role === "admin"
                  ? "Панель Адміністратора"
                  : "Панель Викладача"}
              </p>
            </div>
          </div>

          {/* Профіль для мобільних екранів */}
          <div className="block md:hidden">{profileMenu}</div>
        </div>

        {/* Навігаційні вкладки з горизонтальним скролом */}
        <nav className="hide-scrollbar flex w-full items-center gap-2 overflow-x-auto pb-1 md:w-auto md:gap-6 md:pb-0">
          <button
            onClick={() => setTab("answers")}
            className={`flex items-center whitespace-nowrap border-b-2 bg-transparent pb-1 text-[13px] transition-colors cursor-pointer ${
              tab === "answers"
                ? "border-[#8a8a45] font-bold text-[#8a8a45]"
                : `border-transparent font-medium ${isDarkMode ? "text-[#a3a198] hover:text-[#e6e4dc]" : "text-[#7a7568] hover:text-[#3a3528]"}`
            }`}
          >
            <Inbox size={14} className="mr-1 inline" />
            <span className="hidden sm:inline">Роботи на перевірку</span>
            <span className="sm:hidden">Роботи</span>
          </button>

          {user.role === "admin" && (
            <button
              onClick={() => setTab("support")}
              className={`flex items-center whitespace-nowrap border-b-2 bg-transparent pb-1 text-[13px] transition-colors cursor-pointer ${
                tab === "support"
                  ? "border-[#8a8a45] font-bold text-[#8a8a45]"
                  : `border-transparent font-medium ${isDarkMode ? "text-[#a3a198] hover:text-[#e6e4dc]" : "text-[#7a7568] hover:text-[#3a3528]"}`
              }`}
            >
              <LifeBuoy size={14} className="mr-1 inline" />
              <span className="hidden sm:inline">Служба підтримки</span>
              <span className="sm:hidden">Тікети</span>
            </button>
          )}

          <button
            onClick={() => setTab("users")}
            className={`flex items-center whitespace-nowrap border-b-2 bg-transparent pb-1 text-[13px] transition-colors cursor-pointer ${
              tab === "users"
                ? "border-[#8a8a45] font-bold text-[#8a8a45]"
                : `border-transparent font-medium ${isDarkMode ? "text-[#a3a198] hover:text-[#e6e4dc]" : "text-[#7a7568] hover:text-[#3a3528]"}`
            }`}
          >
            <Users size={14} className="mr-1 inline" />
            <span className="hidden sm:inline">Керування доступом</span>
            <span className="sm:hidden">Користувачі</span>
          </button>

          <button
            onClick={() => setTab("editor")}
            className={`flex items-center whitespace-nowrap border-b-2 bg-transparent pb-1 text-[13px] transition-colors cursor-pointer ${
              tab === "editor"
                ? "border-[#8a8a45] font-bold text-[#8a8a45]"
                : `border-transparent font-medium ${isDarkMode ? "text-[#a3a198] hover:text-[#e6e4dc]" : "text-[#7a7568] hover:text-[#3a3528]"}`
            }`}
          >
            <Edit3 size={14} className="mr-1 inline" />
            <span className="hidden sm:inline">Редактор курсів</span>
            <span className="sm:hidden">Редактор</span>
          </button>
        </nav>

        {/* Профіль для десктопних екранів */}
        <div className="hidden md:block">{profileMenu}</div>
      </header>

      {/* Основний контент */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-10 md:py-8">
        {tab === "editor" && (
          <EditorTab
            courses={courses}
            isDarkMode={isDarkMode}
            addCourse={addCourse}
            updateCourse={updateCourse}
            deleteCourse={deleteCourse}
            addModule={addModule}
            updateModule={updateModule}
            deleteModule={deleteModule}
            addLesson={addLesson}
            updateLesson={updateLesson}
            deleteLesson={deleteLesson}
          />
        )}

        {tab === "answers" && (
          <AnswersTab
            answers={answers}
            courses={courses}
            userId={user.id}
            isDarkMode={isDarkMode}
            provideFeedback={provideFeedback}
          />
        )}

        {tab === "support" && user.role === "admin" && (
          <SupportTab
            supportTickets={supportTickets}
            isDarkMode={isDarkMode}
            updateTicketStatus={updateTicketStatus}
          />
        )}

        {tab === "users" && (
          <UsersTab
            visibleUsers={visibleUsers}
            answers={answers}
            courses={courses}
            currentUserRole={user.role}
            isDarkMode={isDarkMode}
            approveUser={approveUser}
            rejectUser={rejectUser}
            changeUserPassword={changeUserPassword}
          />
        )}
      </main>
    </div>
  );
}