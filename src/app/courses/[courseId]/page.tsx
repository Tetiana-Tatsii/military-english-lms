"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../context/AppContext";
import {
  ArrowLeft,
  BookOpen,
  PlayCircle,
  FileText,
  Circle,
} from "lucide-react";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { user, courses } = useAppContext();

  // Перевірка авторизації
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div
        style={{
          background: "#f0e9d8",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3a3528",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Курс не знайдено</h2>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "#c79a3e",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Повернутися на головну
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#f0e9d8",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#3a3528",
      }}
    >
      {/* НАВІГАЦІЯ: КНОПКА НАЗАД */}
      <div
        style={{
          padding: "16px 24px",
          background: "#f6f1e4",
          borderBottom: "0.5px solid #d8cdb4",
          display: "flex",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "transparent",
            border: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            color: "#6b6b3a",
            fontWeight: 500,
            fontSize: 14,
          }}
        >
          <ArrowLeft size={18} /> Назад до списку курсів
        </button>
      </div>

      <div
        style={{ padding: "32px 24px", maxWidth: "900px", margin: "0 auto" }}
      >
        {/* ШАПКА КУРСУ */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              margin: "0 0 12px",
              color: "#3a3528",
            }}
          >
            {course.title}
          </h1>
          <p
            style={{
              fontSize: 16,
              fontWeight: 500,
              color: "#8a8a45",
              margin: "0 0 16px",
            }}
          >
            {course.subtitle}
          </p>
          <p style={{ fontSize: 15, color: "#5a5440", lineHeight: 1.6 }}>
            {course.description}
          </p>
        </div>

        {/* ПЛАН КУРСУ (СИЛАБУС) */}
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#3a3528",
            }}
          >
            <BookOpen size={22} color="#c79a3e" /> План навчання
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {course.modules.map((mod, index) => (
              <div
                key={mod.id}
                style={{
                  background: "#f6f1e4",
                  borderRadius: 12,
                  border: "0.5px solid #d8cdb4",
                  overflow: "hidden",
                }}
              >
                {/* ЗАГОЛОВОК МОДУЛЯ */}
                <div
                  style={{
                    background: "#e9e1cd",
                    padding: "16px 20px",
                    borderBottom: "0.5px solid #d8cdb4",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      margin: 0,
                      color: "#3a3528",
                    }}
                  >
                    {index + 1}. {mod.title}
                  </h3>
                </div>

                {/* СПИСОК УРОКІВ */}
                <div
                  style={{
                    padding: "12px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {mod.lessons.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      onClick={() =>
                        router.push(
                          `/courses/${course.id}/lessons/${lesson.id}`,
                        )
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#eef0df")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <Circle size={18} color="#aaa18a" />
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 500,
                            margin: "0 0 4px",
                            color: "#3a3528",
                          }}
                        >
                          1.{lessonIndex + 1} {lesson.title}
                        </p>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#8a8a45",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            background: "#eef0df",
                            padding: "2px 6px",
                            borderRadius: 4,
                          }}
                        >
                          {lesson.skill}
                        </span>
                      </div>
                      <PlayCircle size={18} color="#8a8a45" />
                    </div>
                  ))}

                  {mod.lessons.length === 0 && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#9a8f70",
                        margin: "8px 0",
                      }}
                    >
                      Уроки ще не додані.
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* ПІДСУМКОВИЙ ТЕСТ */}
            <div
              style={{
                background: "#f6f1e4",
                borderRadius: 12,
                border: "0.5px solid #d8cdb4",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  background: "#8a8a45",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FileText size={20} color="#f6f1e4" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: "0 0 4px",
                    color: "#3a3528",
                  }}
                >
                  {course.finalTest.title}
                </h3>
                <p style={{ fontSize: 13, color: "#5a5440", margin: 0 }}>
                  Відкриється після завершення всіх модулів
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
