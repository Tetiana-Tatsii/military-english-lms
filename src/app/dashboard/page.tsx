"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";
import CourseCard from "../../components/dashboard/CourseCard";
import { Shield, LogOut, BookOpen, Activity, Users } from "lucide-react";

export default function DashboardPage() {
  const { user, courses, logout } = useAppContext();
  const router = useRouter();

  // ПЕРЕВІРКА АВТОРИЗАЦІЇ
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
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
      {/* ВЕРХНЯ НАВІГАЦІЯ (TOP NAV) */}
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
              background: "#6b6b3a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Shield size={20} color="#f6f1e4" />
          </div>
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 600,
                margin: 0,
                letterSpacing: "0.03em",
                color: "#3a3528",
              }}
            >
              MILITARY LANP
            </p>
            <p style={{ fontSize: 12, margin: 0, color: "#9a8f70" }}>
              Навчальний центр
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 500,
                margin: 0,
                color: "#3a3528",
              }}
            >
              {user.name}
            </p>
            <p style={{ fontSize: 12, margin: 0, color: "#9a8f70" }}>
              {user.squadId || "Викладач"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            title="Вийти"
            style={{
              border: "none",
              background: "#e9e1cd",
              padding: "8px",
              borderRadius: "50%",
              cursor: "pointer",
              color: "#6b6b3a",
              display: "flex",
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* ГОЛОВНИЙ КОНТЕНТ */}
      <div
        style={{
          padding: "24px",
          maxWidth: "1200px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* ЛІВА КОЛОНКА: СПИСОК КУРСІВ */}
        <div>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <BookOpen size={20} color="#8a8a45" /> Доступні курси
          </h2>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {/* ОХО! Замість 50 рядків коду ми тепер просто малюємо наші картки */}
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>

        {/* ПРАВА КОЛОНКА: АНАЛІТИКА ТА ПІДРОЗДІЛ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ПРОФІЛЬ SLP */}
          <div
            style={{
              background: "#f6f1e4",
              borderRadius: 12,
              padding: "20px",
              border: "0.5px solid #d8cdb4",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                margin: "0 0 16px",
                color: "#3a3528",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Activity size={16} color="#8a8a45" /> Профіль SLP (STANAG 6001)
            </h3>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                { label: "Listening", val: 40 },
                { label: "Speaking", val: 15 },
                { label: "Reading", val: 65 },
                { label: "Writing", val: 10 },
              ].map((skill, i) => (
                <div key={i}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      fontWeight: 500,
                      color: "#5a5440",
                      marginBottom: 4,
                    }}
                  >
                    <span>{skill.label}</span>
                    <span>{skill.val}%</span>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: "#e9e1cd",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${skill.val}%`,
                        background: "#8a8a45",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* РЕЙТИНГ ПІДРОЗДІЛУ */}
          {user.role === "student" && (
            <div
              style={{
                background: "#f6f1e4",
                borderRadius: 12,
                padding: "20px",
                border: "0.5px solid #d8cdb4",
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  margin: "0 0 16px",
                  color: "#3a3528",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Users size={16} color="#c79a3e" /> Підрозділ: {user.squadId}
              </h3>

              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {[
                  { name: "Олександр М.", pts: 1250, isMe: false },
                  { name: user.name, pts: 980, isMe: true }, // Тут автоматично твоє ім'я!
                  { name: "Ірина К.", pts: 840, isMe: false },
                  { name: "Віктор С.", pts: 620, isMe: false },
                ].map((member, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: member.isMe ? "#eef0df" : "transparent",
                      border: member.isMe
                        ? "1px solid #c79a3e"
                        : "1px solid transparent",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "#9a8f70",
                          width: 16,
                        }}
                      >
                        {i + 1}.
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: member.isMe ? 600 : 400,
                          color: "#3a3528",
                        }}
                      >
                        {member.name}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#8a8a45",
                      }}
                    >
                      {member.pts} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
