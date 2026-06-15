"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../context/AppContext";
import { ArrowLeft, Play, Edit2 } from "lucide-react";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { courses, user, isInitialized } = useAppContext();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  if (!isInitialized || !user) return null;

  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0e9d8",
        }}
      >
        <h2>Курс не знайдено</h2>
      </div>
    );
  }

  const isTeacher = user.role === "teacher";

  return (
    <div
      style={{
        background: "#f0e9d8",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#3a3528",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          background: "#f6f1e4",
          borderBottom: "0.5px solid #d8cdb4",
          display: "flex",
          justifyContent: "space-between",
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

        {/* СПЕЦІАЛЬНА КНОПКА ТІЛЬКИ ДЛЯ ВИКЛАДАЧА */}
        {isTeacher && (
          <button
            onClick={() => router.push("/teacher")}
            style={{
              background: "#8a8a45",
              color: "#fff",
              border: "none",
              padding: "8px 16px",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Edit2 size={16} /> Редагувати курс
          </button>
        )}
      </div>

      <div
        style={{ padding: "40px 24px", maxWidth: "800px", margin: "0 auto" }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 8px",
            color: "#3a3528",
          }}
        >
          {course.title}
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#8a8a45",
            margin: "0 0 16px",
            fontWeight: 500,
          }}
        >
          {course.subtitle}
        </p>
        <p
          style={{
            fontSize: 14,
            color: "#5a5440",
            lineHeight: 1.6,
            margin: "0 0 32px",
          }}
        >
          {course.description}
        </p>

        <h3
          style={{
            fontSize: 18,
            fontWeight: 600,
            margin: "0 0 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          📖 План навчання
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {course.modules.map((mod, mIndex) => (
            <div
              key={mod.id}
              style={{
                background: "#f6f1e4",
                borderRadius: 12,
                border: "0.5px solid #d8cdb4",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  background: "#eef0df",
                  borderBottom: "0.5px solid #d8cdb4",
                }}
              >
                <h4
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#3a3528",
                  }}
                >
                  {mIndex + 1}. {mod.title}
                </h4>
              </div>
              <div style={{ padding: "12px 20px" }}>
                {mod.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    onClick={() =>
                      router.push(`/courses/${course.id}/lessons/${lesson.id}`)
                    }
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 0",
                      borderBottom: "0.5px solid #e9e1cd",
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          border: "2px solid #a8a08c",
                          marginTop: 2,
                        }}
                      ></div>
                      <div>
                        <p
                          style={{
                            margin: "0 0 4px",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "#3a3528",
                          }}
                        >
                          {lesson.title}
                        </p>
                        <span
                          style={{
                            fontSize: 10,
                            color: "#8a8a45",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          {lesson.skill}
                        </span>
                      </div>
                    </div>
                    <Play size={16} color="#a8a08c" />
                  </div>
                ))}
                {mod.lessons.length === 0 && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#9a8f70",
                      margin: "12px 0 0",
                    }}
                  >
                    Уроки ще не додані
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
