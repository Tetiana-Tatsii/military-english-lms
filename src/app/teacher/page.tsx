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
  Image as ImageIcon,
  FileText,
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
    isInitialized,
  } = useAppContext();
  const router = useRouter();

  const [tab, setTab] = useState<"answers" | "users" | "editor">("editor");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || "",
  );

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Для створення нового курсу
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  // Для редагування існуючого курсу
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    title: "",
    subtitle: "",
    description: "",
  });

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

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

  // ВИПРАВЛЕНО: Проблема з кнопкою "Назад"
  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push("/login");
      else if (user.role === "student") router.push("/dashboard");
    }
  }, [user, router, isInitialized]);

  if (!isInitialized || !user || user.role === "student") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f6",
          color: "#8a8a45",
          fontWeight: 600,
        }}
      >
        Завантаження кабінету...
      </div>
    );
  }

  const visibleUsers = usersDb.filter((u) =>
    user.role === "admin" ? true : u.role === "student",
  );
  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  // --- РОБОТА З КУРСАМИ ---
  const handleCreateCourse = () => {
    if (!courseData.title) return;
    addCourse(courseData.title, courseData.subtitle, courseData.description);
    setCourseData({ title: "", subtitle: "", description: "" });
    setIsAddingCourse(false);
  };

  const openEditCourseModal = () => {
    if (!activeCourse) return;
    setCourseData({
      title: activeCourse.title,
      subtitle: activeCourse.subtitle || "",
      description: "",
    });
    setIsEditingCourse(true);
  };

  const handleUpdateCourse = () => {
    if (!activeCourse) return;
    updateCourse(activeCourse.id, courseData);
    setIsEditingCourse(false);
  };

  const handleDeleteCourse = () => {
    if (
      window.confirm(
        `Ви дійсно хочете видалити курс "${activeCourse?.title}"? Усі модулі та уроки будуть втрачені!`,
      )
    ) {
      deleteCourse(selectedCourseId);
      const remaining = courses.filter((c) => c.id !== selectedCourseId);
      setSelectedCourseId(remaining.length > 0 ? remaining[0].id : "");
    }
  };

  // --- РОБОТА З МОДУЛЯМИ ТА УРОКАМИ ---
  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    addModule(selectedCourseId, newModuleTitle, "book");
    setNewModuleTitle("");
  };

  const handleDeleteModule = (moduleId: string) => {
    if (
      window.confirm(
        "Ви дійсно хочете видалити цей модуль? Усі уроки в ньому будуть видалені!",
      )
    ) {
      deleteModule(selectedCourseId, moduleId);
    }
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

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    if (window.confirm("Ви впевнені, що хочете видалити цей урок?")) {
      deleteLesson(selectedCourseId, moduleId, lessonId);
    }
  };

  const handleSaveDeepLesson = () => {
    if (!editingLesson) return;
    updateLesson(
      selectedCourseId,
      editingLesson.moduleId,
      editingLesson.lesson.id,
      editingLesson.lesson,
    );
    setEditingLesson(null);
  };

  // РОЗУМНИЙ YOUTUBE: автоматично дістає ID з посилання
  const handleYouTubeChange = (val: string) => {
    if (!editingLesson) return;
    let videoId = val;
    const match = val.match(
      /(?:youtu\.be\/|youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    );
    if (match && match[1]) {
      videoId = match[1];
    }
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, videoLabel: videoId },
    });
  };

  const handleAddQuizletCard = () => {
    if (!editingLesson) return;
    const currentQuizlet = editingLesson.lesson.quizlet || [];
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        quizlet: [...currentQuizlet, { term: "", translation: "" }],
      },
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
        background: "#faf9f6",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        color: "#4a4a4a",
      }}
    >
      {/* ВЕРХНЯ ПАНЕЛЬ (СВІТЛА) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: "1px solid #e0dcd0",
          background: "#f0ede5",
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
            <Shield size={20} color="#fff" />
          </div>
          <div>
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                margin: 0,
                color: "#4a4a4a",
              }}
            >
              MILITARY LMS
            </p>
            <p style={{ fontSize: 12, margin: 0, color: "#8a8a45" }}>
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
              fontWeight: tab === "answers" ? 700 : 500,
              color: tab === "answers" ? "#8a8a45" : "#7a7568",
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
              fontWeight: tab === "users" ? 700 : 500,
              color: tab === "users" ? "#8a8a45" : "#7a7568",
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
              fontWeight: tab === "editor" ? 700 : 500,
              color: tab === "editor" ? "#8a8a45" : "#7a7568",
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
              background: isProfileOpen ? "#e0dcd0" : "transparent",
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
                background: "#fff",
                borderRadius: 12,
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                border: "1px solid #e0dcd0",
                padding: "8px",
                zIndex: 100,
              }}
            >
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
                  background: "#fdeced",
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
        {/* --- ВКЛАДКА 3: РЕДАКТОР КУРСІВ --- */}
        {tab === "editor" && !editingLesson && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
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
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid #d8cdb4",
                  fontSize: 16,
                  minWidth: 300,
                  fontWeight: 600,
                  background: "#fff",
                  color: "#4a4a4a",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
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
                  background: "#fff",
                  padding: 32,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 32,
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <h3
                        style={{
                          fontSize: 28,
                          margin: "0 0 8px",
                          color: "#3a3528",
                        }}
                      >
                        {activeCourse.title}
                      </h3>
                      {/* КНОПКА РЕДАГУВАННЯ ІНФО КУРСУ */}
                      <button
                        onClick={openEditCourseModal}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#8a8a45",
                          cursor: "pointer",
                        }}
                        title="Редагувати назву курсу"
                      >
                        <Edit3 size={20} />
                      </button>
                    </div>
                    <p
                      style={{
                        color: "#7a7568",
                        margin: 0,
                        fontWeight: 500,
                        fontSize: 15,
                      }}
                    >
                      {activeCourse.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteCourse}
                    style={{
                      background: "#fdeced",
                      color: "#c97a4a",
                      border: "1px solid #facbce",
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
                    borderBottom: "2px solid #f0ede5",
                    paddingBottom: 12,
                    marginBottom: 24,
                    color: "#3a3528",
                  }}
                >
                  Структура курсу
                </h4>

                {activeCourse.modules.map((mod, modIndex) => (
                  <div
                    key={mod.id}
                    style={{
                      background: "#faf9f6",
                      padding: 20,
                      borderRadius: 12,
                      marginBottom: 20,
                      border: "1px solid #e0dcd0",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontWeight: 700,
                        fontSize: 17,
                        marginBottom: 16,
                        color: "#3a3528",
                      }}
                    >
                      {/* НУМЕРАЦІЯ МОДУЛІВ */}
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <BookOpen size={20} color="#8a8a45" /> Модуль{" "}
                        {modIndex + 1}: {mod.title}
                      </span>
                      <button
                        onClick={() => handleDeleteModule(mod.id)}
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
                        marginLeft: 28,
                        borderLeft: "2px solid #e0dcd0",
                        paddingLeft: 24,
                      }}
                    >
                      {mod.lessons.map((les, lesIndex) => (
                        <div
                          key={les.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 0",
                            borderBottom: "1px dashed #e0dcd0",
                            fontSize: 15,
                            fontWeight: 500,
                          }}
                        >
                          <span
                            onClick={() =>
                              setEditingLesson({
                                moduleId: mod.id,
                                lesson: les,
                              })
                            }
                            style={{
                              cursor: "pointer",
                              color: "#5c574a",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              transition: "color 0.2s",
                            }}
                            title="Редагувати вміст уроку"
                          >
                            <Edit2 size={16} color="#8a8a45" />
                            {/* НУМЕРАЦІЯ УРОКІВ */}
                            <span style={{ fontWeight: 700 }}>
                              Урок {modIndex + 1}.{lesIndex + 1}
                            </span>{" "}
                            {les.title}
                          </span>

                          <button
                            onClick={() => handleDeleteLesson(mod.id, les.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#c97a4a",
                              cursor: "pointer",
                              opacity: 0.7,
                            }}
                          >
                            <X size={18} />
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
                            padding: "10px 14px",
                            borderRadius: 6,
                            border: "1px solid #d8cdb4",
                            background: "#fff",
                          }}
                        />
                        <button
                          onClick={() => handleAddLesson(mod.id)}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                          }}
                        >
                          + Додати урок
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginTop: 32,
                    padding: "24px",
                    background: "#f0ede5",
                    borderRadius: 12,
                  }}
                >
                  <input
                    placeholder="Назва нового модулю..."
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      background: "#fff",
                      fontSize: 16,
                    }}
                  />
                  <button
                    onClick={handleAddModule}
                    style={{
                      background: "#3a3528",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    + Створити модуль
                  </button>
                </div>
              </div>
            ) : (
              <p
                style={{
                  color: "#7a7568",
                  textAlign: "center",
                  padding: "60px 0",
                  fontSize: 16,
                }}
              >
                Оберіть курс зі списку або створіть новий.
              </p>
            )}

            {/* МОДАЛЬНІ ВІКНА ДЛЯ СТВОРЕННЯ / РЕДАГУВАННЯ КУРСУ */}
            {(isAddingCourse || isEditingCourse) && (
              <div
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: "rgba(0,0,0,0.5)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000,
                }}
              >
                <div
                  style={{
                    background: "#fff",
                    padding: 32,
                    borderRadius: 12,
                    width: "100%",
                    maxWidth: 500,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                  }}
                >
                  <h3
                    style={{ marginTop: 0, marginBottom: 24, color: "#3a3528" }}
                  >
                    {isEditingCourse
                      ? "Редагування курсу"
                      : "Створення нового курсу"}
                  </h3>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7a7568",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Головна назва
                  </label>
                  <input
                    placeholder="напр. STANAG 6001 Level 2"
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
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7a7568",
                      marginBottom: 6,
                      display: "block",
                    }}
                  >
                    Підзаголовок
                  </label>
                  <input
                    placeholder="напр. Інтенсивний курс"
                    value={courseData.subtitle}
                    onChange={(e) =>
                      setCourseData({ ...courseData, subtitle: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: 12,
                      marginBottom: 32,
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
                      onClick={() => {
                        setIsAddingCourse(false);
                        setIsEditingCourse(false);
                      }}
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
                      onClick={
                        isEditingCourse
                          ? handleUpdateCourse
                          : handleCreateCourse
                      }
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
                      Зберегти
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- ПОВНОЦІННИЙ РЕДАКТОР УРОКУ --- */}
        {tab === "editor" && editingLesson && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
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
              <ArrowLeft size={18} /> Повернутися до структури
            </button>

            <div
              style={{
                background: "#fff",
                padding: "40px",
                borderRadius: 12,
                border: "1px solid #e0dcd0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              }}
            >
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
                    fontWeight: 700,
                    background: "#faf9f6",
                    color: "#3a3528",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 24,
                  marginBottom: 32,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7a7568",
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
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      background: "#fff",
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
                      color: "#7a7568",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Video size={16} /> YouTube (Просто вставте посилання)
                  </label>
                  <input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={editingLesson.lesson.videoLabel}
                    onChange={(e) => handleYouTubeChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      background: "#fff",
                    }}
                  />
                </div>
              </div>

              {/* МЕДІА ФАЙЛИ З КОМП'ЮТЕРА (КАРКАС) */}
              <div
                style={{
                  background: "#f0ede5",
                  padding: 20,
                  borderRadius: 8,
                  marginBottom: 32,
                  display: "flex",
                  gap: 24,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7a7568",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ImageIcon size={16} /> Завантажити фото (В розробці)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    disabled
                    style={{ fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7a7568",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Headphones size={16} /> Завантажити аудіо (В розробці)
                  </label>
                  <input
                    type="file"
                    accept="audio/mp3, audio/wav"
                    disabled
                    style={{ fontSize: 13 }}
                  />
                </div>
              </div>

              {/* ТЕОРІЯ */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
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
                    <FileText size={18} /> Основний текст / Reading
                  </label>
                  <span style={{ fontSize: 12, color: "#9a8f70" }}>
                    *Панель шрифтів буде додана пізніше
                  </span>
                </div>
                <textarea
                  placeholder="Вставте текст для читання тут..."
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
                  rows={8}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    fontFamily: "inherit",
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* ГРАМАТИКА */}
              <div style={{ marginBottom: 32 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#c97a4a",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <BookOpen size={18} /> Граматичний довідник
                </label>
                <textarea
                  placeholder="Впишіть граматичне правило (наприклад: Present Simple використовується для...)"
                  value={(editingLesson.lesson as any).grammarContent || ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: {
                        ...editingLesson.lesson,
                        grammarContent: e.target.value,
                      } as any,
                    })
                  }
                  rows={5}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 8,
                    border: "1px solid #facbce",
                    background: "#fdf8f5",
                    fontFamily: "inherit",
                    fontSize: 15,
                    lineHeight: 1.6,
                  }}
                />
              </div>

              {/* КАРТКИ QUIZLET */}
              <div
                style={{
                  marginBottom: 32,
                  background: "#faf9f6",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
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
                    <Layers size={18} /> Словник (Картки)
                  </label>
                  <button
                    onClick={handleAddQuizletCard}
                    style={{
                      background: "#8a8a45",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
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
                    Ще немає слів.
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
                          background: "#fff",
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
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  borderTop: "1px solid #e0dcd0",
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
