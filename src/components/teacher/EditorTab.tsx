"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Plus,
  Trash2,
  Edit2,
  Edit3,
  X,
  BookOpen,
  ArrowLeft,
  Image as ImageIcon,
  Headphones,
  FileText,
  ClipboardList,
  Clock,
  Award,
  Loader2,
  Save,
  Video,
  Target,
  Layers,
} from "lucide-react";
import { Course, Lesson } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface EditorTabProps {
  courses: Course[];
  isDarkMode: boolean;
  addCourse: (title: string, subtitle: string, description: string) => Promise<void>;
  updateCourse: (
    courseId: string,
    data: { title: string; subtitle: string; description: string },
  ) => Promise<void>;
  deleteCourse: (courseId: string) => void;
  addModule: (courseId: string, title: string, icon: string) => void;
  updateModule: (
    courseId: string,
    moduleId: string,
    data: { title: string },
  ) => void;
  deleteModule: (courseId: string, moduleId: string) => void;
  addLesson: (courseId: string, moduleId: string, lesson: Omit<Lesson, "id">) => void;
  updateLesson: (
    courseId: string,
    moduleId: string,
    lessonId: string,
    updatedData: Partial<Lesson>,
  ) => void;
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => void;
}

export default function EditorTab({
  courses,
  isDarkMode,
  addCourse,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  addLesson,
  updateLesson,
  deleteLesson,
}: EditorTabProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    courses[0]?.id || "",
  );
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleName, setEditingModuleName] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editingLessonName, setEditingLessonName] = useState("");

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Курси завантажуються асинхронно після входу — синхронізуємо вибір
  useEffect(() => {
    if (courses.length === 0) return;
    const selectedStillExists = courses.some((c) => c.id === selectedCourseId);
    if (!selectedCourseId || !selectedStillExists) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title || isSavingCourse) return;
    setIsSavingCourse(true);
    try {
      await addCourse(courseData.title, courseData.subtitle, courseData.description);
      setCourseData({ title: "", subtitle: "", description: "" });
      setIsAddingCourse(false);
    } catch (error) {
      console.error("Помилка створення курсу:", error);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const openEditCourseModal = () => {
    if (!activeCourse) return;
    setCourseData({
      title: activeCourse.title,
      subtitle: activeCourse.subtitle || "",
      description: activeCourse.description || "",
    });
    setIsEditingCourse(true);
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCourse || !courseData.title || isSavingCourse) return;
    setIsSavingCourse(true);
    try {
      await updateCourse(activeCourse.id, {
        title: courseData.title,
        subtitle: courseData.subtitle,
        description: courseData.description,
      });
      setIsEditingCourse(false);
      setCourseData({ title: "", subtitle: "", description: "" });
    } catch (error) {
      console.error("Помилка оновлення курсу:", error);
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleCourseFormSubmit = (e: React.FormEvent) => {
    if (isAddingCourse) {
      void handleCreateCourse(e);
    } else {
      void handleUpdateCourse(e);
    }
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

  const handleSaveDeepLesson = async () => {
    if (!editingLesson) return;
    try {
      await updateLesson(
        selectedCourseId,
        editingLesson.moduleId,
        editingLesson.lesson.id,
        editingLesson.lesson,
      );
      setEditingLesson(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Невідома помилка";
      alert(`Не вдалося зберегти урок: ${msg}`);
    }
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

  const uploadFileToStorage = async (
    file: File,
    folder: "photos" | "audio" | "documents",
  ) => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("lesson-media")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

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
      setEditingLesson({
        ...editingLesson,
        lesson: { ...editingLesson.lesson, imageUrl: publicUrl },
      });
    }
  };

  const handleRemovePhoto = () => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, imageUrl: undefined },
    });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;

    setIsUploadingAudio(true);
    const publicUrl = await uploadFileToStorage(file, "audio");
    setIsUploadingAudio(false);

    if (publicUrl) {
      setEditingLesson({
        ...editingLesson,
        lesson: { ...editingLesson.lesson, audioUrl: publicUrl },
      });
    }
  };

  const handleRemoveAudio = () => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, audioUrl: undefined },
    });
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

      const currentDocs = editingLesson.lesson.documents || [];
      setEditingLesson({
        ...editingLesson,
        lesson: {
          ...editingLesson.lesson,
          documents: [...currentDocs, newDoc],
        },
      });
    }
  };

  const handleRemoveDocument = (docId: string) => {
    if (!editingLesson) return;
    const currentDocs = editingLesson.lesson.documents || [];
    const updatedDocs = currentDocs.filter((doc) => doc.id !== docId);
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        documents: updatedDocs,
      },
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
    const updatedQuizlet = [...(editingLesson.lesson.quizlet || [])];
    updatedQuizlet[index] = { ...updatedQuizlet[index], [field]: value };
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, quizlet: updatedQuizlet },
    });
  };

  const handleRemoveQuizletCard = (index: number) => {
    if (!editingLesson) return;
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
      ["link"],
      ["clean"],
    ],
  };

  if (isMobile) {
    return (
      <div
        className={`rounded-xl border p-8 text-center ${
          isDarkMode
            ? "border-[#3e403a] bg-[#2d2f2a]"
            : "border-[#e0dcd0] bg-[#f0ede5]"
        }`}
      >
        <Edit3 size={48} className="mx-auto mb-4 text-[#8a8a45]" />
        <h3
          className={`mb-2 text-lg font-bold ${
            isDarkMode ? "text-[#e6e4dc]" : "text-[#3a3528]"
          }`}
        >
          Редагування курсів
        </h3>
        <p
          className={`text-sm leading-relaxed ${
            isDarkMode ? "text-[#a3a198]" : "text-[#7a7568]"
          }`}
        >
          Створення уроків і редагування структури курсів доступні на
          десктопі або планшеті (екран від 768px). Відкрийте цю сторінку на
          комп&apos;ютері або планшеті, щоб продовжити.
        </p>
      </div>
    );
  }

  return (
    <>
      {!editingLesson && (
<div style={{ animation: "fadeIn 0.3s ease" }}>
  <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <select
      value={selectedCourseId}
      onChange={(e) => setSelectedCourseId(e.target.value)}
      className="w-full md:w-auto md:min-w-[300px]"
      style={{
        padding: "10px 16px",
        borderRadius: 8,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
        fontSize: 16,
        fontWeight: 600,
        background: isDarkMode ? "#2d2f2a" : "#fff",
        color: isDarkMode ? "#e6e4dc" : "#4a4a4a",
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
      className="flex w-full items-center justify-center gap-2 md:w-auto"
      style={{
        background: "#8a8a45",
        color: "#fff",
        border: "none",
        padding: "10px 20px",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      <Plus size={18} /> Створити новий курс
    </button>
  </div>

  {activeCourse ? (
    <div
      className="rounded-xl border p-5 md:p-8"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#fff",
        borderColor: isDarkMode ? "#3e403a" : "#e0dcd0",
      }}
    >
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h3
              style={{
                fontSize: 28,
                margin: "0 0 8px",
                color: isDarkMode ? "#e6e4dc" : "#3a3528",
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
              color: isDarkMode ? "#a3a198" : "#7a7568",
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
          className="w-full shrink-0 md:w-auto"
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
            background: isDarkMode ? "#2a2c27" : "#faf9f6",
            padding: 20,
            borderRadius: 12,
            marginBottom: 20,
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          }}
        >
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {editingModuleId === mod.id ? (
              <div className="flex w-full flex-col gap-2 md:flex-1 md:flex-row md:items-center">
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
              <span className="flex min-w-0 flex-1 items-center gap-2 font-bold text-[17px] md:gap-3">
                <BookOpen size={20} color="#8a8a45" className="shrink-0" />
                <span className="w-full min-w-0 truncate">
                  Модуль {modIndex + 1}: {mod.title}
                </span>
                <button
                  onClick={() => handleEditModuleName(mod.id, mod.title)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#8a8a45",
                    cursor: "pointer",
                  }}
                  className="shrink-0"
                >
                  <Edit2 size={16} />
                </button>
              </span>
            )}
            <button
              onClick={() => handleDeleteModule(mod.id)}
              className="shrink-0 self-end md:self-auto"
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
          <div className="border-[#e0dcd0] pl-0 md:ml-7 md:border-l-2 md:pl-6">
            {mod.lessons.map((les, lesIndex) => (
              <div
                key={les.id}
                className="flex flex-col gap-3 border-b border-dashed border-[#e0dcd0] py-3 md:flex-row md:items-center md:justify-between"
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
                {editingLessonId === les.id ? (
                  <div className="flex w-full flex-col gap-2 md:flex-1 md:flex-row md:items-center">
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
                    className="flex min-w-0 w-full flex-1 cursor-pointer items-center gap-2 md:gap-2.5"
                    style={{
                      color: isDarkMode ? "#a3a198" : "#5c574a",
                    }}
                  >
                    <Edit2 size={16} color="#8a8a45" className="shrink-0" />
                    <span className="w-full min-w-0 truncate">
                      <span style={{ fontWeight: 700 }}>
                        Урок {modIndex + 1}.{lesIndex + 1}
                      </span>{" "}
                      {les.title}
                    </span>
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
                      }}
                      className="shrink-0"
                    >
                      <Edit2 size={14} />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => handleDeleteLesson(mod.id, les.id)}
                  className="shrink-0 self-end md:self-auto"
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
            <div className="mt-4 flex flex-col gap-2 md:flex-row">
              <input
                placeholder="Назва нового уроку..."
                value={
                  selectedModuleId === mod.id ? newLessonTitle : ""
                }
                onChange={(e) => {
                  setSelectedModuleId(mod.id);
                  setNewLessonTitle(e.target.value);
                }}
                className="w-full flex-1"
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                  background: isDarkMode ? "#2d2f2a" : "#fff",
                  color: isDarkMode ? "#e6e4dc" : "#3a3528",
                }}
              />
              <button
                onClick={() => handleAddLesson(mod.id)}
                className="w-full md:w-auto"
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

      {editingLesson && (
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
      background: isDarkMode ? "#2d2f2a" : "#fff",
      padding: "40px",
      borderRadius: 12,
      border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
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
          background: isDarkMode ? "#2d2f2a" : "#faf9f6",
          color: isDarkMode ? "#e6e4dc" : "#3a3528",
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
        background: isDarkMode ? "#2a2c27" : "#f0ede5",
        padding: 24,
        borderRadius: 12,
        marginBottom: 32,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
        display: "flex",
        gap: 24,
      }}
    >
      <div style={{ flex: 1 }}>
        <label
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isDarkMode ? "#e6e4dc" : "#5c574a",
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
          <div>
            <label
              htmlFor="photo-upload"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#8a8a45",
                color: "#fff",
                padding: "10px 20px",
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                border: "none",
              }}
            >
              <ImageIcon size={16} /> Обрати фото
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={!!isUploadingPhoto}
              style={{ display: "none" }}
            />
          </div>
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
          htmlFor="audio-upload"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "#8a8a45",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
            border: "none",
          }}
        >
          <Headphones size={16} /> Завантажити аудіо (mp3)
        </label>
        <input
          id="audio-upload"
          type="file"
          accept="audio/mp3"
          onChange={handleAudioUpload}
          disabled={!!isUploadingAudio}
          style={{ display: "none" }}
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
            <p style={{ fontSize: 12, color: "#8a8a45", margin: 0 }}>
              ✓ Аудіофайл успішно прикріплено
            </p>
            <button
              onClick={handleRemoveAudio}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#c97a4a",
                display: "flex",
                alignItems: "center",
                padding: 2,
              }}
              title="Видалити аудіофайл"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>
    </div>

    {/* ЗАВАНТАЖЕННЯ ДОКУМЕНТІВ */}
    <div
      style={{
        background: isDarkMode ? "#2a2c27" : "#f0ede5",
        padding: 24,
        borderRadius: 12,
        marginBottom: 32,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
      }}
    >
      <label
        htmlFor="document-upload"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "#8a8a45",
          color: "#fff",
          padding: "10px 20px",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: 13,
          cursor: "pointer",
          border: "none",
        }}
      >
        <FileText size={16} /> Завантажити документи (PDF, Word)
      </label>
      <input
        id="document-upload"
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleDocumentUpload}
        disabled={!!isUploadingDocument}
        style={{ display: "none" }}
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
                color: isDarkMode ? "#a3a198" : "#7a7568",
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
                      background: isDarkMode ? "#2d2f2a" : "#fff",
                      padding: 10,
                      borderRadius: 6,
                      border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileText size={16} color="#8a8a45" />
                      <span style={{ fontSize: 13, color: isDarkMode ? "#a3a198" : "#5c574a" }}>
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
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <FileText size={18} /> Основний текст / Reading
      </label>
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
          className={isDarkMode ? "dark-quill" : ""}
        />
    </div>

    {/* ГРАМАТИКА */}
    <div style={{ marginBottom: 32, marginTop: 40 }}>
      <label
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#c97a4a",
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <BookOpen size={18} /> Граматичний довідник
      </label>
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
        className={isDarkMode ? "dark-quill" : ""}
      />
    </div>

    {/* ІНСТРУКЦІЯ ДО ДОМАШНЬОГО ЗАВДАННЯ */}
    <div
      style={{
        marginBottom: 32,
        background: isDarkMode ? "#2a2c27" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
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
          border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
          fontSize: 14,
          lineHeight: 1.6,
          resize: "vertical",
          background: isDarkMode ? "#2d2f2a" : "#fff",
          color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
        }}
      />
    </div>

    {/* СЛОВНИК (КАРТКИ) */}
    <div
      style={{
        marginBottom: 32,
        marginTop: 40,
        background: isDarkMode ? "#2a2c27" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
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
            color: isDarkMode ? "#a3a198" : "#9a8f70",
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
                background: isDarkMode ? "#2d2f2a" : "#fff",
                padding: 12,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
              }}
            >
              <span style={{ color: isDarkMode ? "#a3a198" : "#9a8f70", fontWeight: 700 }}>
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
        background: isDarkMode ? "#2a2c27" : "#faf9f6",
        padding: 24,
        borderRadius: 12,
        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
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
            color: isDarkMode ? "#a3a198" : "#9a8f70",
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
                  background: isDarkMode ? "#2d2f2a" : "#fff",
                  padding: 16,
                  borderRadius: 8,
                  border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
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
                      color: isDarkMode ? "#a3a198" : "#9a8f70",
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
                      color: isDarkMode ? "#a3a198" : "#7a7568",
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
        borderTop: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
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

{(isAddingCourse || isEditingCourse) && (
        <div
style={{
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
}}
onClick={() => {
  setIsAddingCourse(false);
  setIsEditingCourse(false);
  setCourseData({ title: "", subtitle: "", description: "" });
}}
        >
<div
  style={{
    background: isDarkMode ? "#2d2f2a" : "#fff",
    borderRadius: 12,
    padding: 32,
    maxWidth: 500,
    width: "90%",
    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
  }}
  onClick={(e) => e.stopPropagation()}
>
  <h2
    style={{
      margin: "0 0 24px",
      fontSize: 20,
      fontWeight: 700,
      color: isDarkMode ? "#e6e4dc" : "#3a3528",
    }}
  >
    {isAddingCourse ? "Створити новий курс" : "Редагувати курс"}
  </h2>
  <form onSubmit={handleCourseFormSubmit}>
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
        marginBottom: 8,
        display: "block",
      }}
    >
      Назва курсу *
    </label>
    <input
      type="text"
      value={courseData.title}
      onChange={(e) => setCourseData({ ...courseData, title: e.target.value })}
      placeholder="Введіть назву курсу"
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d8cdb4",
        fontSize: 14,
        background: isDarkMode ? "#2d2f2a" : "#fff",
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
      }}
    />
  </div>
  <div style={{ marginBottom: 16 }}>
    <label
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
        marginBottom: 8,
        display: "block",
      }}
    >
      Підзаголовок
    </label>
    <input
      type="text"
      value={courseData.subtitle}
      onChange={(e) => setCourseData({ ...courseData, subtitle: e.target.value })}
      placeholder="Введіть підзаголовок курсу"
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d8cdb4",
        fontSize: 14,
        background: isDarkMode ? "#2d2f2a" : "#fff",
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
      }}
    />
  </div>
  <div style={{ marginBottom: 24 }}>
    <label
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
        marginBottom: 8,
        display: "block",
      }}
    >
      Опис курсу
    </label>
    <textarea
      value={courseData.description}
      onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
      placeholder="Введіть опис курсу"
      rows={4}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 8,
        border: "1px solid #d8cdb4",
        fontSize: 14,
        fontFamily: "inherit",
        lineHeight: 1.6,
        background: isDarkMode ? "#2d2f2a" : "#fff",
        color: isDarkMode ? "#e6e4dc" : "#3a3528",
        resize: "vertical",
      }}
    />
  </div>
  <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
    <button
      type="button"
      onClick={() => {
        setIsAddingCourse(false);
        setIsEditingCourse(false);
        setCourseData({ title: "", subtitle: "", description: "" });
      }}
      style={{
        background: isDarkMode ? "#2d2f2a" : "#fff",
        color: isDarkMode ? "#a3a198" : "#5c574a",
        border: "1px solid #d8cdb4",
        padding: "12px 24px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      Скасувати
    </button>
    <button
      type="submit"
      disabled={isSavingCourse}
      style={{
        background: "#8a8a45",
        color: "#fff",
        border: "none",
        padding: "12px 24px",
        borderRadius: 8,
        fontWeight: 600,
        fontSize: 14,
        cursor: isSavingCourse ? "not-allowed" : "pointer",
        opacity: isSavingCourse ? 0.7 : 1,
      }}
    >
      {isSavingCourse ? "Збереження..." : isAddingCourse ? "Створити" : "Зберегти"}
    </button>
  </div>
  </form>
</div>
        </div>
      )}
    </>
  );
}
