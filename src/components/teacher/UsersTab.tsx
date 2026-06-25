"use client";

import React, { useState } from "react";
import { Users, Key, Trash2, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import {
  Answer,
  Course,
  UserAccount,
  UserRole,
} from "@/context/AppContext";

interface UsersTabProps {
  visibleUsers: UserAccount[];
  answers: Answer[];
  courses: Course[];
  currentUserRole: UserRole;
  isDarkMode: boolean;
  approveUser: (userId: string) => Promise<void>;
  rejectUser: (userId: string) => Promise<void>;
  changeUserPassword: (userId: string, newPassword: string) => Promise<void>;
}

export default function UsersTab({
  visibleUsers,
  answers,
  courses,
  currentUserRole,
  isDarkMode,
  approveUser,
  rejectUser,
  changeUserPassword,
}: UsersTabProps) {
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const getProgress = (u: UserAccount) => {
    if (u.role !== "student") return null;
    const userAnswers = answers.filter(
      (a) => a.studentName === u.name && a.status === "reviewed",
    );
    const uniqueLessonIds = new Set(userAnswers.map((a) => a.lessonId));
    const totalLessons = courses.reduce(
      (sum, c) =>
        sum + c.modules.reduce((modSum, m) => modSum + m.lessons.length, 0),
      0,
    );
    const progress =
      totalLessons > 0
        ? Math.round((uniqueLessonIds.size / totalLessons) * 100)
        : 0;
    return { done: uniqueLessonIds.size, total: totalLessons, progress };
  };

  const roleLabel = (role: UserRole) =>
    role === "admin" ? "Адмін" : role === "teacher" ? "Викладач" : "Курсант";

  const roleBadgeStyle = (role: UserRole) => ({
    padding: "3px 8px",
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 600,
    background:
      role === "admin" ? "#4a4231" : role === "teacher" ? "#8a8a45" : "#e0dcd0",
    color:
      role === "admin" ? "#f6f1e4" : role === "teacher" ? "#fff" : "#5c574a",
  });

  const ProgressBar = ({ u }: { u: UserAccount }) => {
    const prog = getProgress(u);
    if (!prog)
      return (
        <span style={{ color: isDarkMode ? "#a3a198" : "#9a8f70", fontSize: 13 }}>
          —
        </span>
      );
    return (
      <div className="min-w-[100px]">
        <div className="mb-1 flex justify-between text-xs">
          <span>
            {prog.done}/{prog.total} уроків
          </span>
          <span>{prog.progress}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: 6,
            background: "#e0dcd0",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${prog.progress}%`,
              height: "100%",
              background: "#8a8a45",
              borderRadius: 3,
            }}
          />
        </div>
      </div>
    );
  };

  const handleApprove = async (userId: string) => {
    setLoadingId(userId + "-approve");
    await approveUser(userId);
    setLoadingId(null);
  };

  const handleDelete = async (userId: string) => {
    setLoadingId(userId + "-delete");
    await rejectUser(userId);
    setLoadingId(null);
    setConfirmDeleteId(null);
  };

  const renderActionButtons = (u: UserAccount) => (
    <div className="flex flex-wrap gap-2">
      {u.status === "pending" && (
        <button
          disabled={loadingId === u.id + "-approve"}
          onClick={() => handleApprove(u.id)}
          style={{
            background: loadingId === u.id + "-approve" ? "#b5b87a" : "#8a8a45",
            color: "#fff",
            border: "none",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: loadingId === u.id + "-approve" ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            opacity: loadingId === u.id + "-approve" ? 0.7 : 1,
          }}
        >
          {loadingId === u.id + "-approve" ? "..." : "✓ Підтвердити"}
        </button>
      )}
      {currentUserRole === "admin" && (
        <button
          onClick={() => {
            setEditingPasswordId(u.id);
            setNewPasswordValue("");
          }}
          style={{
            background: "transparent",
            border: "1px solid #8a8a45",
            color: "#8a8a45",
            padding: "6px 12px",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Key size={14} style={{ display: "inline", marginRight: 4 }} />
          Пароль
        </button>
      )}
      <button
        onClick={() => setConfirmDeleteId(u.id)}
        style={{
          background: "transparent",
          border: "1px solid #c97a4a",
          color: "#c97a4a",
          padding: "6px 12px",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <Trash2 size={14} style={{ display: "inline", marginRight: 4 }} />
        Видалити
      </button>
    </div>
  );

  const renderPasswordForm = (u: UserAccount) =>
    editingPasswordId === u.id ? (
      <div
        className="mt-3 rounded-md p-3"
        style={{
          background: isDarkMode ? "#2a2c27" : "#faf9f6",
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
        }}
      >
        <input
          autoFocus
          type="password"
          placeholder="Новий пароль"
          value={newPasswordValue}
          onChange={(e) => setNewPasswordValue(e.target.value)}
          className="mb-2 w-full rounded border border-[#d8cdb4] p-2 text-sm"
          style={{
            background: isDarkMode ? "#2d2f2a" : "#fff",
            color: isDarkMode ? "#e6e4dc" : "#3a3528",
          }}
        />
        <div className="flex gap-2">
          <button
            onClick={async () => {
              if (newPasswordValue.trim()) {
                await changeUserPassword(u.id, newPasswordValue);
                setEditingPasswordId(null);
                setNewPasswordValue("");
              }
            }}
            style={{
              background: "#8a8a45",
              color: "#fff",
              border: "none",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            Зберегти
          </button>
          <button
            onClick={() => {
              setEditingPasswordId(null);
              setNewPasswordValue("");
            }}
            style={{
              background: "transparent",
              border: "1px solid #c97a4a",
              color: "#c97a4a",
              padding: "6px 12px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Скасувати
          </button>
        </div>
      </div>
    ) : null;

  const confirmDeleteUser = visibleUsers.find((u) => u.id === confirmDeleteId);
  const dm = isDarkMode;

  return (
    <div style={{ animation: "fadeIn 0.3s ease" }}>
      {/* ───── ДІАЛОГ ПІДТВЕРДЖЕННЯ ВИДАЛЕННЯ ───── */}
      {confirmDeleteId && confirmDeleteUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: dm ? "#2d2f2a" : "#fff",
              border: dm ? "1px solid #3e403a" : "1px solid #e0dcd0",
              borderRadius: 12,
              padding: "28px 32px",
              maxWidth: 380,
              width: "90%",
              textAlign: "center",
            }}
          >
            <AlertTriangle size={36} color="#c97a4a" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: dm ? "#e6e4dc" : "#3a3528", marginBottom: 8 }}>
              Видалити користувача?
            </p>
            <p style={{ fontSize: 14, color: dm ? "#a3a198" : "#9a8f70", marginBottom: 24 }}>
              <strong>{confirmDeleteUser.name}</strong> буде видалено назавжди.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: dm ? "1px solid #3e403a" : "1px solid #d8cdb4",
                  background: "transparent",
                  color: dm ? "#e6e4dc" : "#5c574a",
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Скасувати
              </button>
              <button
                disabled={loadingId === confirmDeleteId + "-delete"}
                onClick={() => handleDelete(confirmDeleteId)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "none",
                  background: loadingId === confirmDeleteId + "-delete" ? "#e0a07a" : "#c97a4a",
                  color: "#fff",
                  cursor: loadingId === confirmDeleteId + "-delete" ? "not-allowed" : "pointer",
                  fontWeight: 600,
                  fontSize: 14,
                  opacity: loadingId === confirmDeleteId + "-delete" ? 0.7 : 1,
                }}
              >
                {loadingId === confirmDeleteId + "-delete" ? "Видалення..." : "Так, видалити"}
              </button>
            </div>
          </div>
        </div>
      )}
      <h2
        className="mb-6 flex items-center gap-2 text-2xl font-bold"
        style={{ color: dm ? "#e6e4dc" : "#3a3528" }}
      >
        <Users size={24} />
        Керування доступом
      </h2>

      {/* ───── МОБІЛЬНІ КАРТКИ (< md) ───── */}
      <div
        className="flex flex-col gap-4 md:hidden"
        style={{ animation: "fadeIn 0.3s ease" }}
      >
        {visibleUsers.map((u) => (
          <div
            key={u.id}
            className="rounded-xl border p-4"
            style={{
              background: dm ? "#2d2f2a" : "#fff",
              borderColor: dm ? "#3e403a" : "#e0dcd0",
            }}
          >
            {/* Рядок: Ім'я + бейджі */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span
                className="text-base font-bold"
                style={{ color: dm ? "#e6e4dc" : "#3a3528" }}
              >
                {u.name}
              </span>
              <div className="flex items-center gap-2">
                <span style={roleBadgeStyle(u.role)}>{roleLabel(u.role)}</span>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    background: u.status === "approved" ? "#eef0df" : "#fdeced",
                    color: u.status === "approved" ? "#8a8a45" : "#c97a4a",
                  }}
                >
                  {u.status === "approved" ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle size={11} /> Активний
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Clock size={11} /> Очікує
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Прогрес */}
            {u.role === "student" && (
              <div className="mb-3">
                <p
                  className="mb-1 text-xs font-semibold uppercase"
                  style={{ color: dm ? "#a3a198" : "#9a8f70" }}
                >
                  Прогрес
                </p>
                <ProgressBar u={u} />
              </div>
            )}

            {/* Дії */}
            <div
              className="border-t pt-3"
              style={{ borderColor: dm ? "#3e403a" : "#e0dcd0" }}
            >
              {renderActionButtons(u)}
              {renderPasswordForm(u)}
            </div>
          </div>
        ))}
      </div>

      {/* ───── ДЕСКТОПНА ТАБЛИЦЯ (≥ md) ───── */}
      <div
        className="hidden md:block rounded-xl border overflow-hidden"
        style={{
          background: dm ? "#2d2f2a" : "#fff",
          borderColor: dm ? "#3e403a" : "#e0dcd0",
        }}
      >
        <div className="w-full overflow-x-auto">
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
            <thead>
              <tr
                style={{
                  background: dm ? "#2a2c27" : "#f0ede5",
                  borderBottom: dm ? "2px solid #3e403a" : "2px solid #e0dcd0",
                }}
              >
                {["Ім'я", "Роль", "Статус", "Прогрес", "Дії"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: 16,
                      textAlign: "left",
                      fontSize: 13,
                      fontWeight: 700,
                      color: dm ? "#e6e4dc" : "#5c574a",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((u) => (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: dm ? "1px solid #3e403a" : "1px solid #e0dcd0",
                  }}
                >
                  <td style={{ padding: 16, fontSize: 14, color: dm ? "#e6e4dc" : "#4a4a4a" }}>
                    {u.name}
                  </td>
                  <td style={{ padding: 16 }}>
                    <span style={roleBadgeStyle(u.role)}>{roleLabel(u.role)}</span>
                  </td>
                  <td style={{ padding: 16 }}>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: u.status === "approved" ? "#eef0df" : "#fdeced",
                        color: u.status === "approved" ? "#8a8a45" : "#c97a4a",
                      }}
                    >
                      {u.status === "approved" ? "Активний" : "Очікує"}
                    </span>
                  </td>
                  <td style={{ padding: 16, fontSize: 14 }}>
                    <ProgressBar u={u} />
                  </td>
                  <td style={{ padding: 16 }}>
                    {renderActionButtons(u)}
                    {renderPasswordForm(u)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
