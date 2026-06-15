"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "../../context/AppContext";
import {
  Shield,
  LogOut,
  Users,
  Edit3,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Settings,
  ExternalLink,
} from "lucide-react";

export default function TeacherDashboard() {
  const {
    user,
    courses,
    answers,
    addCourse,
    updateCourse,
    deleteCourse,
    addModule,
    updateModule,
    deleteModule,
    addLesson,
    deleteLesson,
    logout,
  } = useAppContext();
  const router = useRouter();

  const [tab, setTab] = useState<"students" | "editor">("editor");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || "",
  );

  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [courseData, setCourseData] = useState({
    title: "",
    subtitle: "",
    description: "",
  });

  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editModuleTitle, setEditModuleTitle] = useState("");

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role === "student") {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user || user.role === "student") return null;

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  const handleCreateCourse = () => {
    if (!courseData.title) return;
    addCourse(courseData.title, courseData.subtitle, courseData.description);
    setCourseData({ title: "", subtitle: "", description: "" });
    setIsAddingCourse(false);
  };

  const handleUpdateCourse = () => {
    if (!activeCourse) return;
    updateCourse(activeCourse.id, courseData);
    setIsEditingCourse(false);
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

  const handleUpdateModule = (moduleId: string) => {
    if (!editModuleTitle.trim()) return;
    updateModule(selectedCourseId, moduleId, { title: editModuleTitle });
    setEditingModuleId(null);
  };

  const handleAddLesson = (moduleId: string) => {
    if (!newLessonTitle.trim()) return;
    addLesson(selectedCourseId, moduleId, {
      title: newLessonTitle,
      section: "Новий розділ",
      content: "Введіть текст уроку тут...",
      videoLabel: "—",
      duration: "—",
      quizlet: [],
      skill: "mixed",
    });
    setNewLessonTitle("");
    setSelectedModuleId("");
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
              MILITARY LANP
            </p>
            <p style={{ fontSize: 12, margin: 0, color: "#9a8f70" }}>
              Панель Викладача
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <button
            onClick={() => setTab("students")}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 15,
              fontWeight: tab === "students" ? 600 : 400,
              color: tab === "students" ? "#8a8a45" : "#9a8f70",
              cursor: "pointer",
              borderBottom:
                tab === "students"
                  ? "2px solid #8a8a45"
                  : "2px solid transparent",
              paddingBottom: 4,
            }}
          >
            <Users size={16} style={{ display: "inline", marginRight: 6 }} />{" "}
            Відповіді студентів
          </button>
          <button
            onClick={() => setTab("editor")}
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
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{user.name}</span>
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

      <div
        style={{ padding: "32px 24px", maxWidth: "1000px", margin: "0 auto" }}
      >
        {tab === "students" && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>
              Роботи на перевірку
            </h2>
            {answers.length === 0 ? (
              <p style={{ color: "#9a8f70" }}>Немає нових відповідей.</p>
            ) : (
              answers.map((ans) => (
                <div
                  key={ans.id}
                  style={{
                    background: "#f6f1e4",
                    padding: 20,
                    borderRadius: 12,
                    border: "0.5px solid #d8cdb4",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 15 }}>
                        {ans.studentName}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: "#9a8f70",
                          marginLeft: 8,
                        }}
                      >
                        ({ans.squadId})
                      </span>
                    </div>
                  </div>
                  {ans.text && (
                    <div
                      style={{
                        background: "#fff",
                        padding: 12,
                        borderRadius: 8,
                        fontSize: 14,
                        marginBottom: 12,
                      }}
                    >
                      {ans.text}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === "editor" && (
          <div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 24,
                alignItems: "center",
              }}
            >
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCourseId(c.id)}
                  style={{
                    padding: "8px 16px",
                    background:
                      selectedCourseId === c.id ? "#8a8a45" : "#e9e1cd",
                    color: selectedCourseId === c.id ? "#f6f1e4" : "#6b6b3a",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  {c.title}
                </button>
              ))}
              <button
                onClick={() => {
                  setIsAddingCourse(true);
                  setCourseData({ title: "", subtitle: "", description: "" });
                }}
                style={{
                  padding: "8px 16px",
                  background: "#c79a3e",
                  color: "#3a3528",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Plus size={16} /> Створити курс
              </button>
            </div>

            {isAddingCourse && (
              <div
                style={{
                  background: "#eef0df",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #c79a3e",
                  marginBottom: 24,
                }}
              >
                <h3 style={{ margin: "0 0 16px" }}>Новий курс</h3>
                <input
                  placeholder="Назва курсу"
                  value={courseData.title}
                  onChange={(e) =>
                    setCourseData({ ...courseData, title: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    marginBottom: 12,
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
                    padding: 10,
                    marginBottom: 12,
                    borderRadius: 6,
                    border: "1px solid #d8cdb4",
                  }}
                />
                <textarea
                  placeholder="Короткий опис"
                  value={courseData.description}
                  onChange={(e) =>
                    setCourseData({
                      ...courseData,
                      description: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: 10,
                    marginBottom: 12,
                    borderRadius: 6,
                    border: "1px solid #d8cdb4",
                  }}
                  rows={3}
                />
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={handleCreateCourse}
                    style={{
                      background: "#8a8a45",
                      color: "#fff",
                      padding: "10px 20px",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Створити
                  </button>
                  <button
                    onClick={() => setIsAddingCourse(false)}
                    style={{
                      background: "transparent",
                      color: "#6b6b3a",
                      padding: "10px 20px",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            )}

            {activeCourse && !isAddingCourse && (
              <div
                style={{
                  background: "#f6f1e4",
                  padding: 24,
                  borderRadius: 12,
                  border: "0.5px solid #d8cdb4",
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
                  {isEditingCourse ? (
                    <div style={{ width: "100%" }}>
                      <input
                        value={courseData.title}
                        onChange={(e) =>
                          setCourseData({
                            ...courseData,
                            title: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: 10,
                          marginBottom: 8,
                          borderRadius: 6,
                          border: "1px solid #d8cdb4",
                          fontSize: 18,
                          fontWeight: 600,
                        }}
                      />
                      <input
                        value={courseData.subtitle}
                        onChange={(e) =>
                          setCourseData({
                            ...courseData,
                            subtitle: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: 8,
                          marginBottom: 8,
                          borderRadius: 6,
                          border: "1px solid #d8cdb4",
                        }}
                      />
                      <textarea
                        value={courseData.description}
                        onChange={(e) =>
                          setCourseData({
                            ...courseData,
                            description: e.target.value,
                          })
                        }
                        style={{
                          width: "100%",
                          padding: 8,
                          marginBottom: 8,
                          borderRadius: 6,
                          border: "1px solid #d8cdb4",
                        }}
                        rows={2}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleUpdateCourse}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            padding: "6px 16px",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          Зберегти
                        </button>
                        <button
                          onClick={() => setIsEditingCourse(false)}
                          style={{
                            background: "transparent",
                            color: "#6b6b3a",
                            border: "none",
                            cursor: "pointer",
                          }}
                        >
                          Скасувати
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2
                          style={{
                            fontSize: 24,
                            fontWeight: 700,
                            margin: "0 0 4px",
                          }}
                        >
                          {activeCourse.title}
                        </h2>
                        <p
                          style={{
                            fontSize: 14,
                            color: "#8a8a45",
                            margin: "0 0 8px",
                          }}
                        >
                          {activeCourse.subtitle}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setIsEditingCourse(true);
                            setCourseData({
                              title: activeCourse.title,
                              subtitle: activeCourse.subtitle,
                              description: activeCourse.description,
                            });
                          }}
                          style={{
                            background: "#e9e1cd",
                            border: "none",
                            padding: "8px",
                            borderRadius: 8,
                            cursor: "pointer",
                            color: "#6b6b3a",
                          }}
                        >
                          <Settings size={18} />
                        </button>
                        <button
                          onClick={handleDeleteCourse}
                          style={{
                            background: "#e9e1cd",
                            border: "none",
                            padding: "8px",
                            borderRadius: 8,
                            cursor: "pointer",
                            color: "#c97a4a",
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <hr
                  style={{
                    border: "none",
                    borderTop: "0.5px solid #d8cdb4",
                    margin: "24px 0",
                  }}
                />

                {activeCourse.modules.map((mod) => (
                  <div
                    key={mod.id}
                    style={{
                      marginBottom: 24,
                      background: "#fff",
                      padding: 16,
                      borderRadius: 8,
                      border: "0.5px solid #e9e1cd",
                    }}
                  >
                    {editingModuleId === mod.id ? (
                      <div
                        style={{ display: "flex", gap: 8, marginBottom: 12 }}
                      >
                        <input
                          value={editModuleTitle}
                          onChange={(e) => setEditModuleTitle(e.target.value)}
                          style={{
                            flex: 1,
                            padding: 8,
                            borderRadius: 6,
                            border: "1px solid #d8cdb4",
                            fontSize: 16,
                            fontWeight: 600,
                          }}
                        />
                        <button
                          onClick={() => setEditingModuleId(null)}
                          style={{
                            background: "#e9e1cd",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          <X size={16} />
                        </button>
                        <button
                          onClick={() => handleUpdateModule(mod.id)}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 6,
                            cursor: "pointer",
                          }}
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        <h4
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            margin: 0,
                            color: "#8a8a45",
                          }}
                        >
                          {mod.title}
                        </h4>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => {
                              setEditingModuleId(mod.id);
                              setEditModuleTitle(mod.title);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#8a8a45",
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              deleteModule(activeCourse.id, mod.id)
                            }
                            style={{
                              background: "transparent",
                              border: "none",
                              cursor: "pointer",
                              color: "#c97a4a",
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {mod.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          style={{
                            padding: "12px",
                            background: "#f0e9d8",
                            borderRadius: 8,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* ТЕПЕР ЦЕ ПРАЦЮВАТИМЕ ЯК ПОСИЛАННЯ */}
                          <div
                            onClick={() =>
                              router.push(
                                `/courses/${activeCourse.id}/lessons/${lesson.id}`,
                              )
                            }
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              cursor: "pointer",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 14,
                                fontWeight: 500,
                                color: "#3a3528",
                                textDecoration: "underline",
                                textUnderlineOffset: 4,
                              }}
                            >
                              {lesson.title}
                            </span>
                            <ExternalLink size={14} color="#8a8a45" />
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                            }}
                          >
                            <span
                              style={{
                                fontSize: 11,
                                color: "#9a8f70",
                                background: "#eef0df",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              {lesson.skill}
                            </span>
                            {/* І ЦЯ КНОПКА ТЕЖ ПЕРЕКИДАЄ НА УРОК */}
                            <button
                              onClick={() =>
                                router.push(
                                  `/courses/${activeCourse.id}/lessons/${lesson.id}`,
                                )
                              }
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#8a8a45",
                                display: "flex",
                                alignItems: "center",
                              }}
                              title="Редагувати на сторінці уроку"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                deleteLesson(activeCourse.id, mod.id, lesson.id)
                              }
                              style={{
                                background: "transparent",
                                border: "none",
                                cursor: "pointer",
                                color: "#c97a4a",
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
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
                        }}
                      />
                      <button
                        onClick={() => handleAddLesson(mod.id)}
                        style={{
                          background: "#c79a3e",
                          border: "none",
                          padding: "0 16px",
                          borderRadius: 6,
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                ))}

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 32,
                    padding: 16,
                    background: "#e9e1cd",
                    borderRadius: 8,
                  }}
                >
                  <input
                    placeholder="Назва нового модуля..."
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid #d8cdb4",
                    }}
                  />
                  <button
                    onClick={handleAddModule}
                    style={{
                      background: "#8a8a45",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                  >
                    Додати модуль
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
