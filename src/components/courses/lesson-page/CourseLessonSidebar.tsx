"use client";

import { ArrowLeft, CheckCircle, PlayCircle, X } from "lucide-react";
import type { Answer, Course } from "@/types";
import type { SessionUser } from "@/types";

interface CourseLessonSidebarProps {
  course: Course;
  user: SessionUser;
  answers: Answer[];
  activeLessonId: string;
  isDarkMode: boolean;
  isSidebarOpen: boolean;
  onCloseSidebar: () => void;
  onBackToDashboard: () => void;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
}

export default function CourseLessonSidebar({
  course,
  user,
  answers,
  activeLessonId,
  isDarkMode,
  isSidebarOpen,
  onCloseSidebar,
  onBackToDashboard,
  onSelectLesson,
}: CourseLessonSidebarProps) {
  return (
    <div
      className="sidebar-desktop xl:static xl:transform-none xl:z-auto"
      style={{
        width: "320px",
        background: isDarkMode ? "#2d2f2a" : "#f0ede5",
        borderRight: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        zIndex: 50,
        transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.3s ease-in-out",
      }}
    >
      <button
        onClick={onBackToDashboard}
        className="hidden xl:flex items-center gap-2 px-4 py-2 mb-6 pb-4 border-b border-[#d8cdb4]"
        style={{
          background: isDarkMode ? "#2d2f2a" : "#f0ede5",
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          color: isDarkMode ? "#d8cdb4" : "#8a8a45",
          cursor: "pointer",
          fontWeight: 600,
          fontSize: 14,
          width: "100%",
        }}
      >
        <ArrowLeft size={18} /> Повернутись до кабінету
      </button>

      <div
        style={{
          padding: "16px 24px",
          borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.4,
            color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
          }}
        >
          {course.title}
        </h2>
        <button
          onClick={onCloseSidebar}
          style={{
            background: "transparent",
            border: "none",
            color: isDarkMode ? "#d8cdb4" : "#8a8a45",
            cursor: "pointer",
            padding: 4,
          }}
          className="xl:hidden"
        >
          <X size={20} />
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
        {course.modules.map((mod, modIndex) => (
          <div key={mod.id} style={{ marginBottom: 24 }}>
            <h4
              style={{
                padding: "0 24px",
                margin: "0 0 12px",
                fontSize: 12,
                textTransform: "uppercase",
                color: "#8a8a45",
                letterSpacing: "0.5px",
                fontWeight: 700,
              }}
            >
              Модуль {modIndex + 1}: {mod.title}
            </h4>
            <div>
              {mod.lessons.map((les, lesIndex) => {
                const isActive = activeLessonId === les.id;
                const isCompleted = answers.some(
                  (a) => a.lessonId === les.id && a.studentName === user.name,
                );

                return (
                  <div
                    key={les.id}
                    onClick={() => onSelectLesson(mod.id, les.id)}
                    style={{
                      padding: "12px 24px 12px 32px",
                      cursor: "pointer",
                      background: isActive
                        ? isDarkMode
                          ? "#2d2f2a"
                          : "#fff"
                        : "transparent",
                      borderLeft: isActive
                        ? "4px solid #8a8a45"
                        : "4px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.02)";
                      e.currentTarget.style.transition = "transform 0.2s";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    {isCompleted ? (
                      <div style={{ flexShrink: 0, minWidth: "18px" }}>
                        <CheckCircle size={18} color="#8a8a45" />
                      </div>
                    ) : (
                      <div style={{ flexShrink: 0, minWidth: "18px" }}>
                        <PlayCircle
                          size={18}
                          color={isActive ? "#c97a4a" : "#a39f93"}
                        />
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive
                          ? isDarkMode
                            ? "rgb(250, 249, 246)"
                            : "#3a3528"
                          : isDarkMode
                            ? "#d8cdb4"
                            : "#5c574a",
                      }}
                    >
                      <span style={{ opacity: 0.6, marginRight: 4 }}>
                        {modIndex + 1}.{lesIndex + 1}
                      </span>{" "}
                      {les.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
