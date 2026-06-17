"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAppContext, Lesson } from "../../context/AppContext";
import { supabase } from "../../lib/supabase"; // Імпортуємо клієнт бази для завантаження файлів
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
  Loader2,
  ClipboardList,
} from "lucide-react";

// Динамічний імпорт текстового редактора
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });
import "react-quill-new/dist/quill.snow.css";

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
    addSupportTicket,
    updateTicketStatus,
    isInitialized,
  } = useAppContext();
  const router = useRouter();

  console.log("TeacherDashboard - supportTickets:", supportTickets);

  const [tab, setTab] = useState<"answers" | "users" | "editor" | "support">("editor");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || "",
  );

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  const [editingLesson, setEditingLesson] = useState<{
    moduleId: string;
    lesson: Lesson;
  } | null>(null);

  // Стейти для відстеження процесу завантаження файлів
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  const [feedbackTexts, setFeedbackTexts] = useState<{ [key: string]: string }>(
    {},
  );
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(
    null,
  );
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [answerFilter, setAnswerFilter] = useState<"pending" | "reviewed">("pending");

  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleName, setEditingModuleName] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonName, setEditingLessonName] = useState("");

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

  const handleEditModuleName = (moduleId: string, currentName: string) => {
    setEditingModuleId(moduleId);
    setEditingModuleName(currentName);
  };

  const handleSaveModuleName = () => {
    if (!editingModuleId || !editingModuleName.trim()) return;
    updateModule(selectedCourseId, editingModuleId, { title: editingModuleName });
    setEditingModuleId(null);
    setEditingModuleName("");
  };

  const handleCancelEditModuleName = () => {
    setEditingModuleId(null);
    setEditingModuleName("");
  };

  const handleEditLessonName = (lessonId: string, currentName: string) => {
    setEditingLessonId(lessonId);
    setEditingLessonName(currentName);
  };

  const handleSaveLessonName = (moduleId: string) => {
    if (!editingLessonId || !editingLessonName.trim()) return;
    updateLesson(selectedCourseId, moduleId, editingLessonId, {
      title: editingLessonName,
    });
    setEditingLessonId(null);
    setEditingLessonName("");
  };

  const handleCancelEditLessonName = () => {
    setEditingLessonId(null);
    setEditingLessonName("");
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

  // --- ФУНКЦІЯ ДЛЯ ЗАВАНТАЖЕННЯ ФАЙЛІВ НА СЕРВЕР SUPABASE ---
  const uploadFileToStorage = async (
    file: File,
    folder: "photos" | "audio" | "documents",
  ) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Відправляємо файл у бакет
      const { error: uploadError } = await supabase.storage
        .from("lesson-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Отримуємо пряме публічне посилання на файл
      const { data } = supabase.storage
        .from("lesson-media")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error("Помилка завантаження файлу:", error);
      alert("Не вдалося завантажити файл на сервер.");
      return null;
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;

    setIsUploadingPhoto(true);
    const publicUrl = await uploadFileToStorage(file, "photos");
    setIsUploadingPhoto(false);

    if (publicUrl) {
      // Зберігаємо посилання як окремий елемент уроку (не в текст)
      setEditingLesson({
        ...editingLesson,
        lesson: { ...editingLesson.lesson, imageUrl: publicUrl } as any,
      });
    }
  };

  const handleRemovePhoto = () => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, imageUrl: undefined } as any,
    });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;

    setIsUploadingAudio(true);
    const publicUrl = await uploadFileToStorage(file, "audio");
    setIsUploadingAudio(false);

    if (publicUrl) {
      // Зберігаємо посилання на аудіо в структуру уроку
      setEditingLesson({
        ...editingLesson,
        lesson: { ...editingLesson.lesson, audioUrl: publicUrl } as any,
      });
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;

    setIsUploadingDocument(true);
    const publicUrl = await uploadFileToStorage(file, "documents");
    setIsUploadingDocument(false);

    if (publicUrl) {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "";
      const docType = fileExt === "pdf" ? "pdf" : fileExt === "doc" ? "doc" : "docx";
      
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        url: publicUrl,
        type: docType as "pdf" | "doc" | "docx",
      };

      const currentDocs = (editingLesson.lesson as any).documents || [];
      setEditingLesson({
        ...editingLesson,
        lesson: {
          ...editingLesson.lesson,
          documents: [...currentDocs, newDoc],
        } as any,
      });
    }
  };

  const handleRemoveDocument = (docId: string) => {
    if (!editingLesson) return;
    const currentDocs = (editingLesson.lesson as any).documents || [];
    const updatedDocs = currentDocs.filter((doc: any) => doc.id !== docId);
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        documents: updatedDocs,
      } as any,
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
    // Додаємо ( || [] ), щоб уникнути помилки з undefined
    const updatedQuizlet = [...(editingLesson.lesson.quizlet || [])];
    updatedQuizlet[index] = { ...updatedQuizlet[index], [field]: value };
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, quizlet: updatedQuizlet },
    });
  };

  const handleRemoveQuizletCard = (index: number) => {
    if (!editingLesson) return;
    // Тут теж додаємо ( || [] )
    const updatedQuizlet = (editingLesson.lesson.quizlet || []).filter(
      (_, i) => i !== index,
    );
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, quizlet: updatedQuizlet },
    });
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["clean"],
    ],
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
      {/* ВЕРХНЯ ПАНЕЛЬ */}
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
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
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
          {user.role === "admin" && (
            <button
              onClick={() => {
                setTab("support");
                setEditingLesson(null);
              }}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 15,
                fontWeight: tab === "support" ? 700 : 500,
                color: tab === "support" ? "#8a8a45" : "#7a7568",
                cursor: "pointer",
                borderBottom:
                  tab === "support" ? "2px solid #8a8a45" : "2px solid transparent",
                paddingBottom: 4,
              }}
            >
              <LifeBuoy size={16} style={{ display: "inline", marginRight: 6 }} />{" "}
              Служба підтримки
            </button>
          )}
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
        {/* ВКЛАДКА КУРСІВ */}
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
                      <button
                        onClick={openEditCourseModal}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#8a8a45",
                          cursor: "pointer",
                        }}
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
                      }}
                    >
                      {editingModuleId === mod.id ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                          <input
                            value={editingModuleName}
                            onChange={(e) => setEditingModuleName(e.target.value)}
                            style={{
                              flex: 1,
                              padding: "8px 12px",
                              borderRadius: 6,
                              border: "1px solid #8a8a45",
                              fontSize: 16,
                            }}
                          />
                          <button
                            onClick={handleSaveModuleName}
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
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEditModuleName}
                            style={{
                              background: "transparent",
                              border: "1px solid #c97a4a",
                              color: "#c97a4a",
                              padding: "8px 16px",
                              borderRadius: 6,
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <BookOpen size={20} color="#8a8a45" /> Модуль{" "}
                          {modIndex + 1}: {mod.title}
                          <button
                            onClick={() => handleEditModuleName(mod.id, mod.title)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#8a8a45",
                              cursor: "pointer",
                              marginLeft: 8,
                            }}
                          >
                            <Edit2 size={16} />
                          </button>
                        </span>
                      )}
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
                          {editingLessonId === les.id ? (
                            <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1 }}>
                              <input
                                value={editingLessonName}
                                onChange={(e) => setEditingLessonName(e.target.value)}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: 6,
                                  border: "1px solid #8a8a45",
                                  fontSize: 14,
                                }}
                              />
                              <button
                                onClick={() => handleSaveLessonName(mod.id)}
                                style={{
                                  background: "#8a8a45",
                                  color: "#fff",
                                  border: "none",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelEditLessonName}
                                style={{
                                  background: "transparent",
                                  border: "1px solid #c97a4a",
                                  color: "#c97a4a",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
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
                              }}
                            >
                              <Edit2 size={16} color="#8a8a45" />
                              <span style={{ fontWeight: 700 }}>
                                Урок {modIndex + 1}.{lesIndex + 1}
                              </span>{" "}
                              {les.title}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditLessonName(les.id, les.title);
                                }}
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "#8a8a45",
                                  cursor: "pointer",
                                  marginLeft: 4,
                                }}
                              >
                                <Edit2 size={14} />
                              </button>
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteLesson(mod.id, les.id)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#c97a4a",
                              cursor: "pointer",
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
                          }}
                        >
                          + Додати урок
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: "center", padding: "60px 0" }}>
                Оберіть або створіть курс.
              </p>
            )}
          </div>
        )}

        {/* --- ПОВНОЦІННИЙ РЕДАКТОР УРОКУ З ЗАВАНТАЖЕННЯМ МЕДІА --- */}
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
                      display: "block",
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
                    }}
                  >
                    <option value="listening">Listening</option>
                    <option value="reading">Reading</option>
                    <option value="speaking">Speaking</option>
                    <option value="writing">Writing</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "#7a7568",
                      marginBottom: 8,
                      display: "block",
                    }}
                  >
                    <Video size={16} /> YouTube Посилання
                  </label>
                  <input
                    placeholder="Вставте повне посилання з YouTube..."
                    value={editingLesson.lesson.videoLabel}
                    onChange={(e) => handleYouTubeChange(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                    }}
                  />
                </div>
              </div>

              {/* АКТИВОВАНЕ ЗАВАНТАЖЕННЯ ФАЙЛІВ З КОМП'ЮТЕРА */}
              <div
                style={{
                  background: "#f0ede5",
                  padding: 24,
                  borderRadius: 12,
                  marginBottom: 32,
                  display: "flex",
                  gap: 24,
                }}
              >
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#5c574a",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ImageIcon size={16} /> 1. Додати головне фото уроку
                  </label>

                  {/* Якщо фото вже є, показуємо його і кнопку видалення */}
                  {(editingLesson.lesson as any).imageUrl ? (
                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <img
                        src={(editingLesson.lesson as any).imageUrl}
                        alt="preview"
                        style={{ height: "40px", borderRadius: "4px" }}
                      />
                      <button
                        onClick={handleRemovePhoto}
                        style={{
                          background: "#fdeced",
                          color: "#c97a4a",
                          border: "1px solid #facbce",
                          padding: "6px 12px",
                          borderRadius: 6,
                          cursor: "pointer",
                          fontSize: 13,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <Trash2 size={14} /> Видалити фото
                      </button>
                    </div>
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={isUploadingPhoto}
                      style={{ display: "block", marginTop: 8 }}
                    />
                  )}

                  {isUploadingPhoto && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#8a8a45",
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Завантаження...
                    </p>
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#5c574a",
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Headphones size={16} /> 2. Завантажити аудіо (mp3)
                  </label>
                  <input
                    type="file"
                    accept="audio/mp3"
                    onChange={handleAudioUpload}
                    disabled={isUploadingAudio}
                    style={{ display: "block", marginTop: 8 }}
                  />
                  {isUploadingAudio && (
                    <p
                      style={{
                        fontSize: 13,
                        color: "#8a8a45",
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Loader2 size={14} className="animate-spin" />{" "}
                      Завантаження аудіо на сервер...
                    </p>
                  )}
                  {(editingLesson.lesson as any).audioUrl && (
                    <p style={{ fontSize: 12, color: "#8a8a45", marginTop: 6 }}>
                      ✓ Аудіофайл успішно прикріплено
                    </p>
                  )}
                </div>
              </div>

              {/* ЗАВАНТАЖЕННЯ ДОКУМЕНТІВ */}
              <div
                style={{
                  background: "#f0ede5",
                  padding: 24,
                  borderRadius: 12,
                  marginBottom: 32,
                }}
              >
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#5c574a",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <FileText size={16} /> Навчальні документи (PDF, Word)
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleDocumentUpload}
                  disabled={isUploadingDocument}
                  style={{ display: "block", marginTop: 8 }}
                />
                {isUploadingDocument && (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#8a8a45",
                      marginTop: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Loader2 size={14} className="animate-spin" /> Завантаження...
                  </p>
                )}
                {(editingLesson.lesson as any).documents &&
                  (editingLesson.lesson as any).documents.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#7a7568",
                          marginBottom: 8,
                        }}
                      >
                        Прикріплені документи:
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        {(editingLesson.lesson as any).documents.map(
                          (doc: any) => (
                            <div
                              key={doc.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                background: "#fff",
                                padding: 10,
                                borderRadius: 6,
                                border: "1px solid #d8cdb4",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <FileText size={16} color="#8a8a45" />
                                <span style={{ fontSize: 13, color: "#5c574a" }}>
                                  {doc.name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveDocument(doc.id)}
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
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* ТЕКСТ / READING */}
              <div style={{ marginBottom: 32 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#8a8a45",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  <FileText size={18} /> Основний текст / Reading
                </label>
                <div
                  style={{
                    background: "#fff",
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    overflow: "hidden",
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={editingLesson.lesson.content}
                    onChange={(val: string) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: { ...editingLesson.lesson, content: val },
                      })
                    }
                    style={{ height: "220px" }}
                  />
                </div>
              </div>

              {/* ГРАМАТИКА */}
              <div style={{ marginBottom: 32, marginTop: 40 }}>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#c97a4a",
                    marginBottom: 8,
                    display: "block",
                  }}
                >
                  <BookOpen size={18} /> Граматичний довідник
                </label>
                <div
                  style={{
                    background: "#fdf8f5",
                    borderRadius: 8,
                    border: "1px solid #facbce",
                    overflow: "hidden",
                  }}
                >
                  <ReactQuill
                    theme="snow"
                    modules={quillModules}
                    value={(editingLesson.lesson as any).grammarContent || ""}
                    onChange={(val: string) =>
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          grammarContent: val,
                        } as any,
                      })
                    }
                    style={{ height: "160px" }}
                  />
                </div>
              </div>

              {/* ІНСТРУКЦІЯ ДО ДОМАШНЬОГО ЗАВДАННЯ */}
              <div
                style={{
                  marginBottom: 32,
                  background: "#faf9f6",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                }}
              >
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
                  <ClipboardList size={18} /> Інструкція до домашнього завдання
                </label>
                <textarea
                  value={(editingLesson.lesson as any).homeworkInstruction || ""}
                  onChange={(e) =>
                    setEditingLesson({
                      ...editingLesson,
                      lesson: {
                        ...editingLesson.lesson,
                        homeworkInstruction: e.target.value,
                      } as any,
                    })
                  }
                  placeholder="Опишіть детально, що курсант має зробити в рамках домашнього завдання..."
                  style={{
                    width: "100%",
                    minHeight: 120,
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    fontSize: 14,
                    lineHeight: 1.6,
                    resize: "vertical",
                    background: "#fff",
                  }}
                />
              </div>

              {/* СЛОВНИК (КАРТКИ) */}
              <div
                style={{
                  marginBottom: 32,
                  marginTop: 40,
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
                    <Layers size={18} /> Словник уроку (Картки)
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
                        <span style={{ color: "#9a8f70", fontWeight: 700 }}>
                          {index + 1}.
                        </span>
                        <input
                          placeholder="Слово"
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
                          placeholder="Переклад"
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
                          }}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ІНТЕРАКТИВНИЙ ТЕСТ (QUIZ) */}
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
                    <Target size={18} /> Інтерактивний тест (Quiz)
                  </label>
                  <button
                    onClick={() => {
                      if (!editingLesson) return;
                      const currentQuiz = (editingLesson.lesson as any).quiz || [];
                      setEditingLesson({
                        ...editingLesson,
                        lesson: {
                          ...editingLesson.lesson,
                          quiz: [
                            ...currentQuiz,
                            {
                              id: `q-${Date.now()}`,
                              text: "",
                              options: ["", "", "", ""],
                              correctAnswer: "",
                            },
                          ],
                        } as any,
                      });
                    }}
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
                    + Додати питання
                  </button>
                </div>
                {!(editingLesson.lesson as any).quiz ||
                (editingLesson.lesson as any).quiz.length === 0 ? (
                  <p
                    style={{
                      color: "#9a8f70",
                      fontSize: 14,
                      fontStyle: "italic",
                    }}
                  >
                    Ще немає питань тесту.
                  </p>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {(editingLesson.lesson as any).quiz.map(
                      (question: any, index: number) => (
                        <div
                          key={question.id}
                          style={{
                            background: "#fff",
                            padding: 16,
                            borderRadius: 8,
                            border: "1px solid #d8cdb4",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 12,
                            }}
                          >
                            <span
                              style={{
                                color: "#9a8f70",
                                fontWeight: 700,
                                fontSize: 13,
                              }}
                            >
                              Питання {index + 1}
                            </span>
                            <button
                              onClick={() => {
                                if (!editingLesson) return;
                                const updatedQuiz = (editingLesson.lesson as any).quiz.filter(
                                  (_: any, i: number) => i !== index,
                                );
                                setEditingLesson({
                                  ...editingLesson,
                                  lesson: {
                                    ...editingLesson.lesson,
                                    quiz: updatedQuiz,
                                  } as any,
                                });
                              }}
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
                          <input
                            placeholder="Текст питання"
                            value={question.text}
                            onChange={(e) => {
                              if (!editingLesson) return;
                              const updatedQuiz = [...(editingLesson.lesson as any).quiz];
                              updatedQuiz[index] = {
                                ...updatedQuiz[index],
                                text: e.target.value,
                              };
                              setEditingLesson({
                                ...editingLesson,
                                lesson: {
                                  ...editingLesson.lesson,
                                  quiz: updatedQuiz,
                                } as any,
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: 10,
                              borderRadius: 6,
                              border: "1px solid #e9e1cd",
                              marginBottom: 12,
                              fontSize: 14,
                            }}
                          />
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 8,
                              marginBottom: 12,
                            }}
                          >
                            {question.options.map((option: string, optIndex: number) => (
                              <div key={optIndex}>
                                <input
                                  placeholder={`Варіант ${optIndex + 1}`}
                                  value={option}
                                  onChange={(e) => {
                                    if (!editingLesson) return;
                                    const updatedQuiz = [...(editingLesson.lesson as any).quiz];
                                    updatedQuiz[index].options[optIndex] = e.target.value;
                                    setEditingLesson({
                                      ...editingLesson,
                                      lesson: {
                                        ...editingLesson.lesson,
                                        quiz: updatedQuiz,
                                      } as any,
                                    });
                                  }}
                                  style={{
                                    width: "100%",
                                    padding: 8,
                                    borderRadius: 6,
                                    border: "1px solid #e9e1cd",
                                    fontSize: 13,
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                          <div>
                            <label
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: "#7a7568",
                                marginBottom: 4,
                                display: "block",
                              }}
                            >
                              Правильна відповідь:
                            </label>
                            <select
                              value={question.correctAnswer}
                              onChange={(e) => {
                                if (!editingLesson) return;
                                const updatedQuiz = [...(editingLesson.lesson as any).quiz];
                                updatedQuiz[index].correctAnswer = e.target.value;
                                setEditingLesson({
                                  ...editingLesson,
                                  lesson: {
                                    ...editingLesson.lesson,
                                    quiz: updatedQuiz,
                                  } as any,
                                });
                              }}
                              style={{
                                width: "100%",
                                padding: 8,
                                borderRadius: 6,
                                border: "1px solid #d8cdb4",
                                fontSize: 13,
                              }}
                            >
                              <option value="">Оберіть правильну відповідь</option>
                              {question.options.map((opt: string, optIndex: number) => (
                                <option key={optIndex} value={opt}>
                                  Варіант {optIndex + 1}: {opt || "(пусто)"}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ),
                    )}
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
                  }}
                >
                  <Save
                    size={20}
                    style={{ display: "inline", marginRight: 6 }}
                  />{" "}
                  Зберегти урок
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ВКЛАДКА РОБОТИ НА ПЕРЕВІРКУ */}
        {tab === "answers" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  margin: 0,
                  color: "#3a3528",
                }}
              >
                <Inbox size={24} style={{ display: "inline", marginRight: 8 }} />
                Роботи на перевірку
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setAnswerFilter("pending")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #e0dcd0",
                    background: answerFilter === "pending" ? "#8a8a45" : "#fff",
                    color: answerFilter === "pending" ? "#fff" : "#3a3528",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Очікують перевірки ({answers.filter((a) => a.status === "pending").length})
                </button>
                <button
                  onClick={() => setAnswerFilter("reviewed")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: "1px solid #e0dcd0",
                    background: answerFilter === "reviewed" ? "#8a8a45" : "#fff",
                    color: answerFilter === "reviewed" ? "#fff" : "#3a3528",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Перевірені ({answers.filter((a) => a.status === "reviewed").length})
                </button>
              </div>
            </div>
            {answers.filter((a) => a.status === answerFilter).length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  padding: 40,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#9a8f70", fontSize: 16 }}>
                  {answerFilter === "pending"
                    ? "Немає робіт на перевірку."
                    : "Немає перевірених робіт."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {answers
                  .filter((a) => a.status === answerFilter)
                  .map((ans) => (
                    <div
                      key={ans.id}
                      style={{
                        background: "#fff",
                        padding: 24,
                        borderRadius: 12,
                        border: "1px solid #e0dcd0",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 16,
                          paddingBottom: 16,
                          borderBottom: "1px solid #e0dcd0",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9a8f70",
                              textTransform: "uppercase",
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            Курсант
                          </p>
                          <p
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "#3a3528",
                              margin: 0,
                            }}
                          >
                            {ans.studentName}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#7a7568",
                              margin: "4px 0 0",
                            }}
                          >
                            {ans.squadId}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9a8f70",
                              textTransform: "uppercase",
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            Курс та урок
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#5c574a",
                              margin: 0,
                              fontWeight: 600,
                            }}
                          >
                            {courses.find((c) => c.id === ans.courseId)?.title || "Невідомий курс"}
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#7a7568",
                              margin: "4px 0 0",
                            }}
                          >
                            {(() => {
                              const course = courses.find((c) => c.id === ans.courseId);
                              if (!course) return "Невідомий урок";
                              for (const mod of course.modules) {
                                const lesson = mod.lessons.find((l) => l.id === ans.lessonId);
                                if (lesson) return lesson.title;
                              }
                              return "Невідомий урок";
                            })()}
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p
                            style={{
                              fontSize: 12,
                              color: "#9a8f70",
                              textTransform: "uppercase",
                              fontWeight: 600,
                              marginBottom: 4,
                            }}
                          >
                            Відправлено
                          </p>
                          <p
                            style={{
                              fontSize: 13,
                              color: "#5c574a",
                              margin: 0,
                            }}
                          >
                            {new Date(ans.submittedAt).toLocaleString("uk-UA")}
                          </p>
                        </div>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9a8f70",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Відповідь на урок
                        </p>
                        <p
                          style={{
                            fontSize: 15,
                            color: "#4a4a4a",
                            lineHeight: 1.6,
                            margin: 0,
                          }}
                        >
                          {ans.text}
                        </p>
                      </div>

                      {/* Аудіо та документи */}
                      {(ans.voiceRecorded || ans.attachments.length > 0) && (
                        <div
                          style={{
                            background: "#faf9f6",
                            padding: 16,
                            borderRadius: 8,
                            marginBottom: 16,
                          }}
                        >
                          {ans.voiceRecorded && (
                            <div style={{ marginBottom: 12 }}>
                              <p
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
                                <Headphones size={16} /> Голосова відповідь
                              </p>
                              <audio
                                controls
                                style={{ width: "100%", height: 40 }}
                                src={ans.audioUrl}
                              >
                                Ваш браузер не підтримує аудіо.
                              </audio>
                            </div>
                          )}
                          {ans.attachments.length > 0 && (
                            <div>
                              <p
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
                                <FileText size={16} /> Прикріплені документи
                              </p>
                              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                                {ans.attachments
                                  .filter((a) => !a.endsWith(".webm"))
                                  .map((att, idx) => (
                                  <a
                                    key={idx}
                                    href={att}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#8a8a45",
                                      textDecoration: "underline",
                                      fontSize: 14,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 8,
                                      padding: 8,
                                      background: "#fff",
                                      borderRadius: 6,
                                      border: "1px solid #e0dcd0",
                                    }}
                                  >
                                    <FileText size={16} />
                                    {att.split("/").pop()}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Форма оцінювання */}
                      <div
                        style={{
                          background: "#f0ede5",
                          padding: 20,
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 16,
                            marginBottom: 16,
                          }}
                        >
                          <div>
                            <label
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#7a7568",
                                marginBottom: 8,
                                display: "block",
                              }}
                            >
                              Оцінка (0-100)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={scores[ans.id] || ""}
                              onChange={(e) =>
                                setScores({
                                  ...scores,
                                  [ans.id]: parseInt(e.target.value) || 0,
                                })
                              }
                              style={{
                                width: "100%",
                                padding: 10,
                                borderRadius: 6,
                                border: "1px solid #d8cdb4",
                                fontSize: 14,
                              }}
                            />
                          </div>
                        </div>
                        <div style={{ marginBottom: 16 }}>
                          <label
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#7a7568",
                              marginBottom: 8,
                              display: "block",
                            }}
                          >
                            Фідбек
                          </label>
                          <textarea
                            value={feedbackTexts[ans.id] || ""}
                            onChange={(e) =>
                              setFeedbackTexts({
                                ...feedbackTexts,
                                [ans.id]: e.target.value,
                              })
                            }
                            placeholder="Введіть коментар до роботи..."
                            style={{
                              width: "100%",
                              padding: 10,
                              borderRadius: 6,
                              border: "1px solid #d8cdb4",
                              fontSize: 14,
                              minHeight: 80,
                              resize: "vertical",
                            }}
                          />
                        </div>
                        <button
                          onClick={() => {
                            provideFeedback(
                              ans.id,
                              feedbackTexts[ans.id] || "",
                              false,
                              scores[ans.id],
                            );
                            setFeedbackTexts({ ...feedbackTexts, [ans.id]: "" });
                            setScores({ ...scores, [ans.id]: 0 });
                          }}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <CheckCircle size={18} /> Зберегти оцінку
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА СЛУЖБА ПІДТРИМКИ */}
        {tab === "support" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
                color: "#3a3528",
              }}
            >
              <LifeBuoy size={24} style={{ display: "inline", marginRight: 8 }} />
              Служба підтримки
            </h2>
            {supportTickets.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  padding: 40,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#9a8f70", fontSize: 16 }}>
                  Немає звернень до служби підтримки.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {supportTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    style={{
                      background: "#fff",
                      padding: 24,
                      borderRadius: 12,
                      border: "1px solid #e0dcd0",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 16,
                        paddingBottom: 16,
                        borderBottom: "1px solid #e0dcd0",
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9a8f70",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Курсант
                        </p>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#3a3528",
                            margin: 0,
                          }}
                        >
                          {ticket.userName}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9a8f70",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Тип звернення
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: ticket.type === "bug" ? "#c97a4a" : "#8a8a45",
                            margin: 0,
                            fontWeight: 600,
                          }}
                        >
                          {ticket.type === "bug" ? "Помилка (Bug)" : "Пропозиція покращення"}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#9a8f70",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            marginBottom: 4,
                          }}
                        >
                          Дата
                        </p>
                        <p
                          style={{
                            fontSize: 13,
                            color: "#5c574a",
                            margin: 0,
                          }}
                        >
                          {new Date(ticket.date).toLocaleString("uk-UA")}
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: 16 }}>
                      <p
                        style={{
                          fontSize: 12,
                          color: "#9a8f70",
                          textTransform: "uppercase",
                          fontWeight: 600,
                          marginBottom: 4,
                        }}
                      >
                        Опис
                      </p>
                      <p
                        style={{
                          fontSize: 15,
                          color: "#4a4a4a",
                          lineHeight: 1.6,
                          margin: 0,
                        }}
                      >
                        {ticket.message}
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          padding: "4px 12px",
                          borderRadius: 12,
                          background:
                            ticket.status === "open" ? "#eef0df" : "#f0ede5",
                          color: ticket.status === "open" ? "#8a8a45" : "#5c574a",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {ticket.status === "open" ? "Відкрито" : "Вирішено"}
                      </div>
                      {ticket.status === "open" && (
                        <button
                          onClick={() => updateTicketStatus(ticket.id, "closed")}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "8px 16px",
                            borderRadius: 6,
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                          }}
                        >
                          Позначити як вирішене
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ВКЛАДКА КЕРУВАННЯ ДОСТУПОМ */}
        {tab === "users" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                marginBottom: 24,
                color: "#3a3528",
              }}
            >
              <Users size={24} style={{ display: "inline", marginRight: 8 }} />
              Керування доступом
            </h2>
            <div
              style={{
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e0dcd0",
                overflow: "hidden",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      background: "#f0ede5",
                      borderBottom: "2px solid #e0dcd0",
                    }}
                  >
                    <th
                      style={{
                        padding: 16,
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#5c574a",
                      }}
                    >
                      Ім'я
                    </th>
                    <th
                      style={{
                        padding: 16,
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#5c574a",
                      }}
                    >
                      Роль
                    </th>
                    <th
                      style={{
                        padding: 16,
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#5c574a",
                      }}
                    >
                      Статус
                    </th>
                    <th
                      style={{
                        padding: 16,
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#5c574a",
                      }}
                    >
                      Прогрес
                    </th>
                    <th
                      style={{
                        padding: 16,
                        textAlign: "right",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#5c574a",
                      }}
                    >
                      Дії
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => (
                    <tr
                      key={u.id}
                      style={{
                        borderBottom: "1px solid #e0dcd0",
                      }}
                    >
                      <td style={{ padding: 16, fontSize: 14, color: "#4a4a4a" }}>
                        {u.name}
                      </td>
                      <td style={{ padding: 16, fontSize: 14, color: "#4a4a4a" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              u.role === "admin"
                                ? "#4a4231"
                                : u.role === "teacher"
                                ? "#8a8a45"
                                : "#e0dcd0",
                            color:
                              u.role === "admin"
                                ? "#f6f1e4"
                                : u.role === "teacher"
                                ? "#fff"
                                : "#5c574a",
                          }}
                        >
                          {u.role === "admin"
                            ? "Адмін"
                            : u.role === "teacher"
                            ? "Викладач"
                            : "Курсант"}
                        </span>
                      </td>
                      <td style={{ padding: 16, fontSize: 14, color: "#4a4a4a" }}>
                        <span
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              u.status === "approved"
                                ? "#eef0df"
                                : "#fdeced",
                            color:
                              u.status === "approved"
                                ? "#8a8a45"
                                : "#c97a4a",
                          }}
                        >
                          {u.status === "approved" ? "Активний" : "Очікує"}
                        </span>
                      </td>
                      <td style={{ padding: 16, fontSize: 14, color: "#4a4a4a" }}>
                        {u.role === "student" ? (
                          (() => {
                            const userAnswers = answers.filter(
                              (a) => a.studentName === u.name && a.status === "reviewed"
                            );
                            const totalLessons = courses.reduce(
                              (sum, c) =>
                                sum +
                                c.modules.reduce((modSum, m) => modSum + m.lessons.length, 0),
                              0
                            );
                            const progress = totalLessons > 0
                              ? Math.round((userAnswers.length / totalLessons) * 100)
                              : 0;
                            return (
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 12,
                                    marginBottom: 4,
                                  }}
                                >
                                  <span>{userAnswers.length}/{totalLessons} уроків</span>
                                  <span>{progress}%</span>
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
                                      width: `${progress}%`,
                                      height: "100%",
                                      background: "#8a8a45",
                                      borderRadius: 3,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <span style={{ color: "#9a8f70", fontSize: 13 }}>-</span>
                        )}
                      </td>
                      <td style={{ padding: 16, textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          {u.status === "pending" && (
                            <button
                              onClick={() => approveUser(u.id)}
                              style={{
                                background: "#8a8a45",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: 6,
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: 600,
                              }}
                            >
                              ✓
                            </button>
                          )}
                          {user.role === "admin" && (
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
                            onClick={() => rejectUser(u.id)}
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
                        {editingPasswordId === u.id && (
                          <div
                            style={{
                              marginTop: 12,
                              padding: 12,
                              background: "#faf9f6",
                              borderRadius: 6,
                              border: "1px solid #d8cdb4",
                            }}
                          >
                            <input
                              type="password"
                              placeholder="Новий пароль"
                              value={newPasswordValue}
                              onChange={(e) => setNewPasswordValue(e.target.value)}
                              style={{
                                width: "100%",
                                padding: 8,
                                borderRadius: 4,
                                border: "1px solid #d8cdb4",
                                marginBottom: 8,
                                fontSize: 13,
                              }}
                            />
                            <div style={{ display: "flex", gap: 8 }}>
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
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
