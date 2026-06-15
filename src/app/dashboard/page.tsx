"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";
import {
  Shield,
  LogOut,
  BookOpen,
  CheckCircle,
  Clock,
  MessageSquare,
  Award,
} from "lucide-react";

export default function DashboardPage() {
  const { user, courses, answers, logout, isInitialized } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    } else if (user?.role === "teacher") {
      router.push("/teacher");
    }
  }, [user, router, isInitialized]);

  if (!isInitialized || !user) return null;

  // Фільтруємо відповіді, щоб показати тільки роботи цього конкретного курсанта
  const myAnswers = answers.filter((a) => a.studentName === user.name);

  // Функція для розрахунку прогресу курсу (%)
  const getCourseProgress = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return 0;

    let totalLessons = 0;
    course.modules.forEach((m) => {
      totalLessons += m.lessons.length;
    });
    if (totalLessons === 0) return 0;

    // Рахуємо унікальні уроки, на які курсант дав хоча б одну відповідь
    const submittedLessonIds = new Set(
      myAnswers.filter((a) => a.courseId === courseId).map((a) => a.lessonId),
    );
    return Math.round((submittedLessonIds.size / totalLessons) * 100);
  };

  // Функція для отримання назви уроку за ID (щоб гарно виводити у фідбеку)
  const getLessonTitle = (courseId: string, lessonId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return "Невідомий урок";
    for (const mod of course.modules) {
      const lesson = mod.lessons.find((l) => l.id === lessonId);
      if (lesson) return lesson.title;
    }
    return "Невідомий урок";
  };

  return (
    <div
      style={{
        background: "#f0e9d8",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#3a3528",
      }}
    >
      {/* ВЕРХНЯ ПАНЕЛЬ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "0.5px solid #d8cdb4",
          background: "#f6f1e4",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: "#8a8a45",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} color="#f6f1e4" />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
              MILITARY LMS
            </p>
            <p style={{ fontSize: 12, margin: 0, color: "#9a8f70" }}>
              Навчальний центр
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: 14, fontWeight: 600, display: "block" }}>
              {user.name}
            </span>
            <span style={{ fontSize: 12, color: "#8a8a45", fontWeight: 500 }}>
              Курсант ({user.squadId || "STANAG 6001"})
            </span>
          </div>
          <button
            onClick={() => {
              logout();
              router.push("/login");
            }}
            style={{
              border: "none",
              background: "#e9e1cd",
              padding: "8px",
              borderRadius: "50%",
              cursor: "pointer",
              color: "#6b6b3a",
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <div
        style={{
          padding: "32px 24px",
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "32px",
          alignItems: "start",
        }}
      >
        {/* ЛІВА КОЛОНКА (Курси та Фідбек) */}
        <div>
          {/* СЕКЦІЯ КУРСІВ */}
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BookOpen size={20} color="#8a8a45" /> Доступні курси
          </h2>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
              marginBottom: 40,
            }}
          >
            {courses.map((course) => {
              const progress = getCourseProgress(course.id);
              return (
                <div
                  key={course.id}
                  style={{
                    background: "#f6f1e4",
                    borderRadius: 12,
                    border: "0.5px solid #d8cdb4",
                    padding: 24,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: 18,
                          fontWeight: 700,
                          margin: "0 0 4px",
                          color: "#3a3528",
                        }}
                      >
                        {course.title}
                      </h3>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#8a8a45",
                          margin: 0,
                          fontWeight: 500,
                        }}
                      >
                        {course.subtitle}
                      </p>
                    </div>
                    {course.status === "active" ? (
                      <button
                        onClick={() => router.push(`/courses/${course.id}`)}
                        style={{
                          background: "#8a8a45",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        Продовжити
                      </button>
                    ) : (
                      <span
                        style={{
                          background: "#e9e1cd",
                          color: "#9a8f70",
                          padding: "6px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        У РОЗРОБЦІ
                      </span>
                    )}
                  </div>

                  {/* Прогрес-бар */}
                  {course.status === "active" && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                          fontSize: 13,
                          fontWeight: 500,
                          color: "#6b6b3a",
                        }}
                      >
                        <span>Прогрес курсу</span>
                        <span>{progress}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 6,
                          background: "#e9e1cd",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "#8a8a45",
                            borderRadius: 3,
                            transition: "width 0.5s ease",
                          }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* СЕКЦІЯ ФІДБЕКУ */}
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: "0 0 16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <MessageSquare size={20} color="#8a8a45" /> Мої результати та фідбек
          </h2>
          {myAnswers.length === 0 ? (
            <div
              style={{
                background: "#f6f1e4",
                padding: 24,
                borderRadius: 12,
                border: "0.5px solid #d8cdb4",
                textAlign: "center",
              }}
            >
              <p style={{ color: "#9a8f70", margin: 0, fontSize: 14 }}>
                Ви ще не відправили жодного завдання на перевірку.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[...myAnswers].reverse().map((ans) => (
                <div
                  key={ans.id}
                  style={{
                    background: "#f6f1e4",
                    borderRadius: 12,
                    border: "0.5px solid #d8cdb4",
                    padding: 20,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9a8f70",
                          margin: "0 0 4px",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Відповідь на урок
                      </p>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>
                        {getLessonTitle(ans.courseId, ans.lessonId)}
                      </h4>
                    </div>
                    {ans.status === "reviewed" ? (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#eef0df",
                          color: "#8a8a45",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={14} /> Перевірено
                      </span>
                    ) : (
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#fdeced",
                          color: "#c97a4a",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={14} /> Очікує перевірки
                      </span>
                    )}
                  </div>

                  {ans.status === "reviewed" && (
                    <div
                      style={{
                        background: "#e9e1cd",
                        padding: 16,
                        borderRadius: 8,
                        marginTop: 12,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 14,
                          margin: "0 0 8px",
                          color: "#4a4435",
                        }}
                      >
                        <strong>Коментар викладача:</strong>{" "}
                        {ans.teacherFeedbackText || "Без коментарів"}
                      </p>
                      {ans.score && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            color: "#8a8a45",
                            fontWeight: 700,
                            fontSize: 15,
                          }}
                        >
                          <Award size={18} /> Оцінка: {ans.score}/100
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ПРАВА КОЛОНКА (SLP Профіль) */}
        <div>
          <div
            style={{
              background: "#f6f1e4",
              padding: 24,
              borderRadius: 12,
              border: "0.5px solid #d8cdb4",
            }}
          >
            <h3
              style={{
                fontSize: 14,
                fontWeight: 600,
                margin: "0 0 20px",
                color: "#3a3528",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              📈 Профіль SLP (STANAG 6001)
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Listening", val: 40 },
                { label: "Speaking", val: 15 },
                { label: "Reading", val: 65 },
                { label: "Writing", val: 10 },
              ].map((skill) => (
                <div key={skill.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#5a5440",
                      marginBottom: 6,
                    }}
                  >
                    <span>{skill.label}</span>
                    <span>{skill.val}%</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 6,
                      background: "#e9e1cd",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${skill.val}%`,
                        height: "100%",
                        background: "#8a8a45",
                        borderRadius: 3,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
            <p
              style={{
                fontSize: 11,
                color: "#9a8f70",
                marginTop: 20,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              *Дані профілю генеруються на основі результатів виконаних модулів
              та фінальних тестів.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
