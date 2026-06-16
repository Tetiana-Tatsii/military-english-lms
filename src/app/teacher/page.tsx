"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, Lesson } from "../../context/AppContext";
import {
  Shield,
  LogOut,
  Users,
  Edit3,
  Plus,
  Trash2,
  Edit2,
  X,
  Inbox,
  CheckCircle,
  Key,
  ChevronDown,
  Sun,
  Moon,
  LifeBuoy,
  BookOpen,
  Save,
  Video,
  AlignLeft,
  Target,
  ArrowLeft,
  Headphones,
  Layers,
} from "lucide-react";

export default function TeacherDashboard() {
  const {
    user,
    courses,
    answers,
    usersDb,
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
  } = useAppContext();
  const router = useRouter();

  const [tab, setTab] = useState<"answers" | "users" | "editor">("editor");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || "",
  );

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    title: "",
    subtitle: "",
    description: "",
  });

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  // СТАН ДЛЯ ПОВНОЕКРАННОГО РЕДАГУВАННЯ УРОКУ
  const [editingLesson, setEditingLesson] = useState<{
    moduleId: string;
    lesson: Lesson;
  } | null>(null);

  const [feedbackTexts, setFeedbackTexts] = useState<{ [key: string]: string }>(
    {},
  );
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(
    null,
  );
  const [newPasswordValue, setNewPasswordValue] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role === "student") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role === "student") return null;

  const visibleUsers = usersDb.filter((u) =>
    user.role === "admin" ? true : u.role === "student",
  );
  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  const handleCreateCourse = () => {
    if (!courseData.title) return;
    addCourse(courseData.title, courseData.subtitle, courseData.description);
    setCourseData({ title: "", subtitle: "", description: "" });
    setIsAddingCourse(false);
  };

  const handleDeleteCourse = () => {
    if (confirm("Ви впевнені, що хочете видалити цей курс?")) {
      deleteCourse(selectedCourseId);
      const remaining = courses.filter((c) => c.id !== selectedCourseId);
      setSelectedCourseId(remaining.length > 0 ? remaining[0].id : "");
    }
  };

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    addModule(selectedCourseId, newModuleTitle, "book");
    setNewModuleTitle("");
  };

  const handleAddLesson = (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    addLesson(selectedCourseId, moduleId, {
      title: newLessonTitle,
      section: "Новий розділ",
      content: "",
      videoLabel: "",
      duration: "15 хв",
      quizlet: [],
      skill: "mixed",
    });
    setNewLessonTitle("");
    setSelectedModuleId("");
  };

  const handleSaveDeepLesson = () => {
    if (!editingLesson) return;
    updateLesson(
      selectedCourseId,
      editingLesson.moduleId,
      editingLesson.lesson.id,
      editingLesson.lesson,
    );
    setEditingLesson(null); // Повертаємося до структури курсу після збереження
  };

  // --- Функції для управління картками (Quizlet) ---
  const handleAddQuizletCard = () => {
    if (!editingLesson) return;
    const currentQuizlet = editingLesson.lesson.quizlet || [];
    const updatedQuizlet = [...currentQuizlet, { term: "", translation: "" }];
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, quizlet: updatedQuizlet },
    });
  };

  const handleUpdateQuizletCard = (
    index: number,
    field: "term" | "translation",
    value: string,
  ) => {
    if (!editingLesson) return;
    const updatedQuizlet = [...editingLesson.lesson.quizlet];
    updatedQuizlet[index] = { ...updatedQuizlet[index], [field]: value };
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, quizlet: updatedQuizlet },
    });
  };

  const handleRemoveQuizletCard = (index: number) => {
    if (!editingLesson) return;
    const updatedQuizlet = editingLesson.lesson.quizlet.filter(
      (_, i) => i !== index,
    );
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, quizlet: updatedQuizlet },
    });
  };

  return (
    <div
      style={{
        background: isDarkMode ? "#2b261d" : "#f0e9d8",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: isDarkMode ? "#f6f1e4" : "#3a3528",
        transition: "all 0.3s ease",
      }}
    >
      {/* ВЕРХНЯ ПАНЕЛЬ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: isDarkMode
            ? "0.5px solid #4a4231"
            : "0.5px solid #d8cdb4",
          background: isDarkMode ? "#3a3326" : "#f6f1e4",
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
              {user.role === "admin"
                ? "Панель Адміністратора"
                : "Панель Викладача"}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 24 }}>
          <button
            onClick={() => {
              setTab("answers");
              setEditingLesson(null);
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 15,
              fontWeight: tab === "answers" ? 600 : 400,
              color: tab === "answers" ? "#8a8a45" : "#9a8f70",
              cursor: "pointer",
              borderBottom:
                tab === "answers"
                  ? "2px solid #8a8a45"
                  : "2px solid transparent",
              paddingBottom: 4,
            }}
          >
            <Inbox size={16} style={{ display: "inline", marginRight: 6 }} />{" "}
            Роботи на перевірку
          </button>
          <button
            onClick={() => {
              setTab("users");
              setEditingLesson(null);
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 15,
              fontWeight: tab === "users" ? 600 : 400,
              color: tab === "users" ? "#8a8a45" : "#9a8f70",
              cursor: "pointer",
              borderBottom:
                tab === "users" ? "2px solid #8a8a45" : "2px solid transparent",
              paddingBottom: 4,
            }}
          >
            <Users size={16} style={{ display: "inline", marginRight: 6 }} />{" "}
            Керування доступом
          </button>
          <button
            onClick={() => {
              setTab("editor");
              setEditingLesson(null);
            }}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 15,
              fontWeight: tab === "editor" ? 600 : 400,
              color: tab === "editor" ? "#8a8a45" : "#9a8f70",
              cursor: "pointer",
              borderBottom:
                tab === "editor"
                  ? "2px solid #8a8a45"
                  : "2px solid transparent",
              paddingBottom: 4,
            }}
          >
            <Edit3 size={16} style={{ display: "inline", marginRight: 6 }} />{" "}
            Редактор курсів
          </button>
        </div>

        <div style={{ position: "relative" }}>
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "6px 12px",
              borderRadius: 8,
              background: isProfileOpen
                ? isDarkMode
                  ? "#4a4231"
                  : "#e9e1cd"
                : "transparent",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</span>
            <ChevronDown
              size={16}
              color="#8a8a45"
              style={{
                transform: isProfileOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </div>
          {isProfileOpen && (
            <div
              style={{
                position: "absolute",
                top: "110%",
                right: 0,
                width: 220,
                background: isDarkMode ? "#3a3326" : "#fff",
                borderRadius: 12,
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                border: isDarkMode ? "1px solid #4a4231" : "1px solid #d8cdb4",
                padding: "8px",
                zIndex: 100,
              }}
            >
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: "transparent",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: isDarkMode ? "#d8cdb4" : "#5a5440",
                  fontSize: 14,
                  textAlign: "left",
                }}
              >
                {isDarkMode ? (
                  <Sun size={16} color="#c79a3e" />
                ) : (
                  <Moon size={16} color="#8a8a45" />
                )}{" "}
                <span>{isDarkMode ? "Світла тема" : "Темна тема"}</span>
              </button>
              <hr
                style={{
                  border: "none",
                  borderTop: isDarkMode
                    ? "1px solid #4a4231"
                    : "1px solid #e9e1cd",
                  margin: "6px 0",
                }}
              />
              <button
                onClick={() => {
                  logout();
                  router.push("/login");
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  background: isDarkMode ? "#4e2d2d" : "#fdeced",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "#c97a4a",
                  fontSize: 14,
                  fontWeight: 600,
                  textAlign: "left",
                }}
              >
                <LogOut size={16} /> <span>Розлогінитись</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        style={{ padding: "32px 24px", maxWidth: "1000px", margin: "0 auto" }}
      >
        {/* ВКЛАДКА 1: РОБОТИ */}
        {tab === "answers" && (
          <div>
            {answers.length === 0 ? (
              <p style={{ color: "#9a8f70" }}>Немає нових відповідей.</p>
            ) : (
              [...answers]
                .sort((a, b) => (a.status === "pending" ? -1 : 1))
                .map((ans) => (
                  <div
                    key={ans.id}
                    style={{
                      background: isDarkMode ? "#3a3326" : "#f6f1e4",
                      padding: 24,
                      borderRadius: 12,
                      border: isDarkMode
                        ? "1px solid #4a4231"
                        : "0.5px solid #d8cdb4",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom: isDarkMode
                          ? "1px solid #4a4231"
                          : "1px solid #e9e1cd",
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 700, fontSize: 16 }}>
                          {ans.studentName}
                        </span>{" "}
                        <span style={{ fontSize: 13, color: "#9a8f70" }}>
                          ({ans.squadId})
                        </span>
                      </div>
                      {ans.status === "reviewed" ? (
                        <span
                          style={{
                            color: "#8a8a45",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          <CheckCircle
                            size={16}
                            style={{
                              display: "inline",
                              verticalAlign: "middle",
                            }}
                          />{" "}
                          Перевірено (Оцінка: {ans.score || 0})
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "#c97a4a",
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          Очікує перевірки
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        background: isDarkMode ? "#2b261d" : "#fff",
                        padding: 16,
                        borderRadius: 8,
                        fontSize: 15,
                        marginBottom: 16,
                        color: isDarkMode ? "#d8cdb4" : "#4a4435",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#8a8a45",
                          textTransform: "uppercase",
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Відповідь:
                      </span>
                      {ans.text ? (
                        ans.text
                      ) : (
                        <span style={{ fontStyle: "italic", color: "#9a8f70" }}>
                          Курсант не додав тексту.
                        </span>
                      )}
                    </div>
                    {ans.status === "pending" && (
                      <div
                        style={{
                          background: isDarkMode ? "#2b261d" : "#e9e1cd",
                          padding: 16,
                          borderRadius: 8,
                        }}
                      >
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="Оцінка (0-100)"
                          value={scores[ans.id] || ""}
                          onChange={(e) =>
                            setScores({
                              ...scores,
                              [ans.id]: Number(e.target.value),
                            })
                          }
                          style={{
                            width: "140px",
                            padding: "10px",
                            borderRadius: 6,
                            border: "1px solid #d8cdb4",
                            marginBottom: 12,
                            display: "block",
                          }}
                        />
                        <textarea
                          placeholder="Коментар..."
                          style={{
                            width: "100%",
                            padding: 10,
                            borderRadius: 6,
                            border: "1px solid #d8cdb4",
                            marginBottom: 12,
                          }}
                          rows={3}
                          onChange={(e) =>
                            setFeedbackTexts({
                              ...feedbackTexts,
                              [ans.id]: e.target.value,
                            })
                          }
                        />
                        <button
                          onClick={() =>
                            provideFeedback(
                              ans.id,
                              feedbackTexts[ans.id] || "",
                              false,
                              scores[ans.id],
                            )
                          }
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          Зберегти
                        </button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

        {/* ВКЛАДКА 2: ДОСТУПИ */}
        {tab === "users" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {visibleUsers.map((u) => (
              <div
                key={u.id}
                style={{
                  background: isDarkMode ? "#3a3326" : "#f6f1e4",
                  padding: 20,
                  borderRadius: 12,
                  border: isDarkMode
                    ? "1px solid #4a4231"
                    : "0.5px solid #d8cdb4",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      {u.name}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        background: isDarkMode ? "#4a4231" : "#e9e1cd",
                        padding: "2px 6px",
                        borderRadius: 4,
                        color: isDarkMode ? "#d8cdb4" : "#6b6b3a",
                        textTransform: "uppercase",
                        fontWeight: 700,
                      }}
                    >
                      {u.role}
                    </span>
                  </div>
                  {user.role === "admin" && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "#8a8a45",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Key size={12} /> Пароль:
                      {editingPasswordId === u.id ? (
                        <>
                          <input
                            value={newPasswordValue}
                            onChange={(e) =>
                              setNewPasswordValue(e.target.value)
                            }
                            style={{ padding: "2px 6px", width: "80px" }}
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              changeUserPassword(u.id, newPasswordValue);
                              setEditingPasswordId(null);
                            }}
                            style={{
                              background: "#8a8a45",
                              color: "#fff",
                              border: "none",
                              borderRadius: 4,
                              padding: "2px 6px",
                              cursor: "pointer",
                            }}
                          >
                            ✓
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              fontFamily: "monospace",
                              background: isDarkMode ? "#2b261d" : "#fff",
                              padding: "2px 6px",
                              borderRadius: 4,
                            }}
                          >
                            {u.password}
                          </span>
                          <button
                            onClick={() => {
                              setEditingPasswordId(u.id);
                              setNewPasswordValue(u.password);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#8a8a45",
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  {u.status === "pending" ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => approveUser(u.id)}
                        style={{
                          background: "#8a8a45",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Схвалити
                      </button>
                      <button
                        onClick={() => rejectUser(u.id)}
                        style={{
                          background: "#c97a4a",
                          color: "#fff",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        Відхилити
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <span style={{ color: "#8a8a45", fontWeight: 600 }}>
                        <CheckCircle
                          size={16}
                          style={{ display: "inline", verticalAlign: "middle" }}
                        />{" "}
                        Активовано
                      </span>
                      <button
                        onClick={() => rejectUser(u.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#c97a4a",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ВКЛАДКА 3: РЕДАКТОР КУРСІВ */}
        {tab === "editor" && !editingLesson && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  fontSize: 16,
                  minWidth: 250,
                  fontWeight: 600,
                  background: isDarkMode ? "#3a3326" : "#fff",
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                {courses.length === 0 && <option value="">Немає курсів</option>}
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsAddingCourse(true)}
                style={{
                  background: "#8a8a45",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Plus size={18} /> Створити новий курс
              </button>
            </div>

            {activeCourse ? (
              <div
                style={{
                  background: isDarkMode ? "#3a3326" : "#f6f1e4",
                  padding: 24,
                  borderRadius: 12,
                  border: isDarkMode
                    ? "1px solid #4a4231"
                    : "0.5px solid #d8cdb4",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: 24, margin: "0 0 8px" }}>
                      {activeCourse.title}
                    </h3>
                    <p style={{ color: "#8a8a45", margin: 0, fontWeight: 500 }}>
                      {activeCourse.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteCourse}
                    style={{
                      background: "transparent",
                      color: "#c97a4a",
                      border: "1px solid #c97a4a",
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Видалити курс
                  </button>
                </div>

                <h4
                  style={{
                    fontSize: 18,
                    borderBottom: isDarkMode
                      ? "1px solid #4a4231"
                      : "1px solid #d8cdb4",
                    paddingBottom: 12,
                    marginBottom: 20,
                  }}
                >
                  Структура (Модулі та Уроки)
                </h4>

                {activeCourse.modules.map((mod) => (
                  <div
                    key={mod.id}
                    style={{
                      background: isDarkMode ? "#2b261d" : "#fff",
                      padding: 20,
                      borderRadius: 8,
                      marginBottom: 16,
                      border: "1px solid #d8cdb4",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 700,
                        fontSize: 16,
                        marginBottom: 16,
                      }}
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <BookOpen size={18} color="#8a8a45" /> {mod.title}
                      </span>
                      <button
                        onClick={() => deleteModule(activeCourse.id, mod.id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#c97a4a",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <div
                      style={{
                        marginLeft: 26,
                        borderLeft: "2px solid #e9e1cd",
                        paddingLeft: 20,
                      }}
                    >
                      {mod.lessons.map((les) => (
                        <div
                          key={les.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            padding: "10px 0",
                            borderBottom: "1px dashed #e9e1cd",
                            fontSize: 15,
                            fontWeight: 500,
                          }}
                        >
                          {/* КНОПКА ПЕРЕХОДУ В ПОВНОЕКРАННИЙ РЕДАКТОР УРОКУ */}
                          <span
                            onClick={() =>
                              setEditingLesson({
                                moduleId: mod.id,
                                lesson: les,
                              })
                            }
                            style={{
                              cursor: "pointer",
                              color: "#8a8a45",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            title="Редагувати вміст уроку"
                          >
                            <Edit2 size={16} /> {les.title}
                          </span>

                          <button
                            onClick={() =>
                              deleteLesson(activeCourse.id, mod.id, les.id)
                            }
                            style={{
                              background: "none",
                              border: "none",
                              color: "#c97a4a",
                              cursor: "pointer",
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                        <input
                          placeholder="Назва нового уроку..."
                          value={
                            selectedModuleId === mod.id ? newLessonTitle : ""
                          }
                          onChange={(e) => {
                            setSelectedModuleId(mod.id);
                            setNewLessonTitle(e.target.value);
                          }}
                          style={{
                            flex: 1,
                            padding: "8px 12px",
                            borderRadius: 6,
                            border: "1px solid #d8cdb4",
                            background: isDarkMode ? "#3a3326" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                          }}
                        />
                        <button
                          onClick={() => handleAddLesson(mod.id)}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          + Урок
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 32,
                    padding: "20px",
                    background: isDarkMode ? "#2b261d" : "#e9e1cd",
                    borderRadius: 8,
                  }}
                >
                  <input
                    placeholder="Назва нового модулю..."
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: 6,
                      border: "1px solid #d8cdb4",
                      background: isDarkMode ? "#3a3326" : "#fff",
                      color: isDarkMode ? "#fff" : "#000",
                      fontSize: 15,
                    }}
                  />
                  <button
                    onClick={handleAddModule}
                    style={{
                      background: "#3a3528",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    + Додати модуль
                  </button>
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "#9a8f70",
                  textAlign: "center",
                  padding: "40px 0",
                }}
              >
                Оберіть курс зі списку або створіть новий.
              </p>
            )}

            {/* ВІКНО СТВОРЕННЯ НОВОГО КУРСУ */}
            {isAddingCourse && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    background: isDarkMode ? "#3a3326" : "#f6f1e4",
                    padding: 32,
                    borderRadius: 12,
                    width: "100%",
                    maxWidth: 500,
                  }}
                >
                  <h3 style={{ marginTop: 0, marginBottom: 20 }}>
                    Створення нового курсу
                  </h3>
                  <input
                    placeholder="Назва курсу (напр., STANAG 6001 Level 2)"
                    value={courseData.title}
                    onChange={(e) =>
                      setCourseData({ ...courseData, title: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      marginBottom: 16,
                      borderRadius: 6,
                      border: "1px solid #d8cdb4",
                    }}
                  />
                  <input
                    placeholder="Підзаголовок"
                    value={courseData.subtitle}
                    onChange={(e) =>
                      setCourseData({ ...courseData, subtitle: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      marginBottom: 24,
                      borderRadius: 6,
                      border: "1px solid #d8cdb4",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 12,
                    }}
                  >
                    <button
                      onClick={() => setIsAddingCourse(false)}
                      style={{
                        padding: "10px 20px",
                        borderRadius: 6,
                        border: "1px solid #c97a4a",
                        background: "transparent",
                        color: "#c97a4a",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={handleCreateCourse}
                      style={{
                        background: "#8a8a45",
                        color: "#fff",
                        padding: "10px 24px",
                        borderRadius: 6,
                        border: "none",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Створити
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ПОВНОЦІННИЙ РЕДАКТОР УРОКУ (ВІДКРИВАЄТЬСЯ НА ВСЮ СТОРІНКУ ЗАМІСТЬ КУРСУ) --- */}
        {tab === "editor" && editingLesson && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            {/* Кнопка повернення */}
            <button
              onClick={() => setEditingLesson(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "none",
                color: "#8a8a45",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: 15,
                marginBottom: 24,
                padding: 0,
              }}
            >
              <ArrowLeft size={18} /> Повернутися до структури курсу
            </button>

            <div
              style={{
                background: isDarkMode ? "#3a3326" : "#fff",
                padding: "32px",
                borderRadius: 12,
                border: isDarkMode ? "1px solid #4a4231" : "1px solid #d8cdb4",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              }}
            >
              {/* НАЗВА УРОКУ */}
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#8a8a45",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  Назва уроку
                </label>
                <input
                  value={editingLesson.lesson.title}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: {
                        ...editingLesson.lesson,
                        title: e.target.value,
                      },
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    fontSize: 18,
                    fontWeight: 600,
                    background: isDarkMode ? "#2b261d" : "#f6f1e4",
                    color: isDarkMode ? "#fff" : "#3a3528",
                  }}
                />
              </div>

              {/* МЕДІА НАЛАШТУВАННЯ (ВІДЕО, АУДІО, НАВИЧКА) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#8a8a45",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Target size={16} /> Навичка (Skill)
                  </label>
                  <select
                    value={editingLesson.lesson.skill}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          skill: e.target.value as any,
                        },
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      background: isDarkMode ? "#2b261d" : "#fff",
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  >
                    <option value="listening">Listening</option>
                    <option value="reading">Reading</option>
                    <option value="speaking">Speaking</option>
                    <option value="writing">Writing</option>
                    <option value="mixed">Mixed (Граматика/Словник)</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#8a8a45",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Video size={16} /> ID Відео YouTube
                  </label>
                  <input
                    placeholder="Напр. dQw4w9WgXcQ"
                    value={editingLesson.lesson.videoLabel}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          videoLabel: e.target.value,
                        },
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      background: isDarkMode ? "#2b261d" : "#fff",
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#8a8a45",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Headphones size={16} /> URL Аудіофайлу (mp3)
                  </label>
                  <input
                    placeholder="Посилання на аудіо..."
                    value={(editingLesson.lesson as any).audioUrl || ""}
                    onChange={(e) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          audioUrl: e.target.value,
                        } as any,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      background: isDarkMode ? "#2b261d" : "#fff",
                      color: isDarkMode ? "#fff" : "#000",
                    }}
                  />
                </div>
              </div>

              {/* ТЕКСТ / ТЕОРІЯ */}
              <div style={{ marginBottom: 32 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#8a8a45",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <AlignLeft size={18} /> Текст уроку / Теорія
                </label>
                <textarea
                  placeholder="Вставте текст для читання, граматичне правило або пояснення тут..."
                  value={editingLesson.lesson.content}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: {
                        ...editingLesson.lesson,
                        content: e.target.value,
                      },
                    })
                  }
                  rows={12}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    background: isDarkMode ? "#2b261d" : "#fff",
                    color: isDarkMode ? "#fff" : "#000",
                    fontFamily: "inherit",
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* РОБОТА З КАРТКАМИ (QUIZLET) */}
              <div
                style={{
                  marginBottom: 32,
                  background: isDarkMode ? "#2b261d" : "#f6f1e4",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #d8cdb4",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 16,
                  }}
                >
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#8a8a45",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Layers size={18} /> Картки для вивчення слів (Quizlet)
                  </label>
                  <button
                    onClick={handleAddQuizletCard}
                    style={{
                      background: "#8a8a45",
                      color: "#fff",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    + Додати слово
                  </button>
                </div>

                {!editingLesson.lesson.quizlet ||
                editingLesson.lesson.quizlet.length === 0 ? (
                  <p
                    style={{
                      color: "#9a8f70",
                      fontSize: 14,
                      margin: 0,
                      fontStyle: "italic",
                    }}
                  >
                    В цьому уроці ще немає слів для вивчення.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {editingLesson.lesson.quizlet.map((card, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          gap: 12,
                          alignItems: "center",
                          background: isDarkMode ? "#3a3326" : "#fff",
                          padding: 12,
                          borderRadius: 8,
                          border: "1px solid #d8cdb4",
                        }}
                      >
                        <span
                          style={{
                            color: "#9a8f70",
                            fontWeight: 700,
                            width: 24,
                          }}
                        >
                          {index + 1}.
                        </span>
                        <input
                          placeholder="Слово (напр. Platoon)"
                          value={card.term}
                          onChange={(e) =>
                            handleUpdateQuizletCard(
                              index,
                              "term",
                              e.target.value,
                            )
                          }
                          style={{
                            flex: 1,
                            padding: 10,
                            borderRadius: 6,
                            border: "1px solid #e9e1cd",
                            background: isDarkMode ? "#2b261d" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                          }}
                        />
                        <input
                          placeholder="Переклад (напр. Взвод)"
                          value={card.translation}
                          onChange={(e) =>
                            handleUpdateQuizletCard(
                              index,
                              "translation",
                              e.target.value,
                            )
                          }
                          style={{
                            flex: 1,
                            padding: 10,
                            borderRadius: 6,
                            border: "1px solid #e9e1cd",
                            background: isDarkMode ? "#2b261d" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                          }}
                        />
                        <button
                          onClick={() => handleRemoveQuizletCard(index)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#c97a4a",
                            cursor: "pointer",
                            padding: 8,
                          }}
                          title="Видалити картку"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ЗБЕРЕЖЕННЯ */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: isDarkMode
                    ? "1px solid #4a4231"
                    : "1px solid #d8cdb4",
                  paddingTop: 24,
                }}
              >
                <button
                  onClick={handleSaveDeepLesson}
                  style={{
                    background: "#8a8a45",
                    color: "#fff",
                    padding: "14px 32px",
                    borderRadius: 8,
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <Save size={20} /> Зберегти урок
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
