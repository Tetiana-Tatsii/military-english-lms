"use client";

import { useState, useEffect, useCallback } from "react";
import type { Lesson, LessonBlockId, LessonBlockMeta, LessonImage } from "@/types";
import { getLessonImages } from "@/lib/lessonBlocks";
import type { CourseFormData, EditingLessonState, EditorTabProps } from "./types";
import { parseYouTubeVideoId, uploadLessonMedia } from "./utils";

const emptyCourseForm: CourseFormData = {
  title: "",
  subtitle: "",
  description: "",
};

export function useEditorTab({
  courses,
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
  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isSavingCourse, setIsSavingCourse] = useState(false);
  const [courseData, setCourseData] = useState<CourseFormData>(emptyCourseForm);
  const [newModuleTitle, setNewModuleTitle] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [editingLesson, setEditingLesson] = useState<EditingLessonState | null>(null);
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

  useEffect(() => {
    if (courses.length === 0) return;
    const selectedStillExists = courses.some((c) => c.id === selectedCourseId);
    if (!selectedCourseId || !selectedStillExists) {
      setSelectedCourseId(courses[0].id);
    }
  }, [courses, selectedCourseId]);

  const activeCourse = courses.find((c) => c.id === selectedCourseId);

  const closeCourseForm = useCallback(() => {
    setIsAddingCourse(false);
    setIsEditingCourse(false);
    setCourseData(emptyCourseForm);
  }, []);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseData.title || isSavingCourse) return;
    setIsSavingCourse(true);
    try {
      await addCourse(courseData.title, courseData.subtitle, courseData.description);
      setCourseData(emptyCourseForm);
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
      setCourseData(emptyCourseForm);
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
      !window.confirm(
        `Ви дійсно хочете видалити курс "${activeCourse?.title}"? Усі модулі та уроки будуть втрачені!`,
      )
    ) {
      return;
    }
    deleteCourse(selectedCourseId);
    const remaining = courses.filter((c) => c.id !== selectedCourseId);
    setSelectedCourseId(remaining.length > 0 ? remaining[0].id : "");
  };

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    addModule(selectedCourseId, newModuleTitle, "book");
    setNewModuleTitle("");
  };

  const handleDeleteModule = (moduleId: string) => {
    if (
      !window.confirm(
        "Ви дійсно хочете видалити цей модуль? Усі уроки в ньому будуть видалені!",
      )
    ) {
      return;
    }
    deleteModule(selectedCourseId, moduleId);
  };

  const handleEditModuleName = (moduleId: string, currentName: string) => {
    setEditingModuleId(moduleId);
    setEditingModuleName(currentName);
  };

  const handleSaveModuleName = async () => {
    if (!editingModuleId || !editingModuleName.trim()) return;
    try {
      await updateModule(selectedCourseId, editingModuleId, {
        title: editingModuleName,
      });
      setEditingModuleId(null);
      setEditingModuleName("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Невідома помилка";
      alert(`Не вдалося зберегти модуль: ${msg}`);
    }
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
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        videoLabel: parseYouTubeVideoId(val),
      },
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await handleAddImage(e);
  };

  const handleAddImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;
    setIsUploadingPhoto(true);
    const publicUrl = await uploadLessonMedia(file, "photos");
    setIsUploadingPhoto(false);
    e.target.value = "";
    if (!publicUrl) return;

    const current = getLessonImages(editingLesson.lesson);
    const next: LessonImage[] = [
      ...current.filter((img) => img.id !== "legacy-image"),
      ...(editingLesson.lesson.imageUrl &&
      !current.some((img) => img.url === editingLesson.lesson.imageUrl)
        ? [
            {
              id: `img-legacy-${Date.now()}`,
              url: editingLesson.lesson.imageUrl,
            },
          ]
        : []),
      { id: `img-${Date.now()}`, url: publicUrl },
    ];

    // Deduplicate by url
    const seen = new Set<string>();
    const unique = next.filter((img) => {
      if (seen.has(img.url)) return false;
      seen.add(img.url);
      return true;
    });

    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        images: unique,
        imageUrl: unique[0]?.url,
      },
    });
  };

  const handleRemoveImage = (imageId: string) => {
    if (!editingLesson) return;
    const current = getLessonImages(editingLesson.lesson);
    const next = current.filter((img) => img.id !== imageId);
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        images: next,
        imageUrl: next[0]?.url,
      },
    });
  };

  const handleUpdateImageCaption = (imageId: string, caption: string) => {
    if (!editingLesson) return;
    const current = getLessonImages(editingLesson.lesson).map((img) =>
      img.id === imageId ||
      (imageId === "legacy-image" && img.url === editingLesson.lesson.imageUrl)
        ? { ...img, id: img.id === "legacy-image" ? `img-${Date.now()}` : img.id, caption }
        : img,
    );
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        images: current,
        imageUrl: current[0]?.url,
      },
    });
  };

  const handleRemovePhoto = () => {
    if (!editingLesson) return;
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        imageUrl: undefined,
        images: [],
      },
    });
  };

  const patchBlockMeta = (
    blockId: LessonBlockId,
    partial: Partial<LessonBlockMeta>,
  ) => {
    if (!editingLesson) return;
    const prev = editingLesson.lesson.blockMeta?.[blockId] ?? {};
    setEditingLesson({
      ...editingLesson,
      lesson: {
        ...editingLesson.lesson,
        blockMeta: {
          ...editingLesson.lesson.blockMeta,
          [blockId]: { ...prev, ...partial },
        },
      },
    });
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingLesson) return;
    setIsUploadingAudio(true);
    const publicUrl = await uploadLessonMedia(file, "audio");
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
    const publicUrl = await uploadLessonMedia(file, "documents");
    setIsUploadingDocument(false);
    if (publicUrl) {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "file";
      const newDoc = {
        id: `doc-${Date.now()}`,
        name: file.name,
        url: publicUrl,
        type: fileExt,
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
    const updatedDocs = (editingLesson.lesson.documents || []).filter(
      (doc) => doc.id !== docId,
    );
    setEditingLesson({
      ...editingLesson,
      lesson: { ...editingLesson.lesson, documents: updatedDocs },
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

  return {
    isMobile,
    courses,
    selectedCourseId,
    setSelectedCourseId,
    activeCourse,
    editingLesson,
    setEditingLesson,
    isAddingCourse,
    setIsAddingCourse,
    isEditingCourse,
    isSavingCourse,
    courseData,
    setCourseData,
    newLessonTitle,
    setNewLessonTitle,
    selectedModuleId,
    setSelectedModuleId,
    isUploadingPhoto,
    isUploadingAudio,
    isUploadingDocument,
    editingModuleId,
    editingModuleName,
    setEditingModuleName,
    editingLessonId,
    editingLessonName,
    setEditingLessonName,
    openEditCourseModal,
    handleDeleteCourse,
    handleEditModuleName,
    handleSaveModuleName,
    handleCancelEditModuleName,
    handleEditLessonName,
    handleSaveLessonName,
    handleCancelEditLessonName,
    handleAddLesson,
    handleDeleteLesson,
    handleDeleteModule,
    handleSaveDeepLesson,
    handleYouTubeChange,
    handlePhotoUpload,
    handleAddImage,
    handleRemoveImage,
    handleUpdateImageCaption,
    handleRemovePhoto,
    handleAudioUpload,
    handleRemoveAudio,
    handleDocumentUpload,
    handleRemoveDocument,
    patchBlockMeta,
    handleAddQuizletCard,
    handleUpdateQuizletCard,
    handleRemoveQuizletCard,
    closeCourseForm,
    handleCourseFormSubmit,
  };
}

export type EditorTabState = ReturnType<typeof useEditorTab>;
