"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { useDarkMode } from "@/hooks/useDarkMode";
import { recalculateSlp } from "@/lib/slp";
import { awardQuizCoins } from "@/lib/gamification";
import { isQuizAnswerCorrect } from "@/lib/quiz";
import type { Answer, Course, Lesson, Module } from "@/types";

export function useCourseLessonPage() {
  const params = useParams();
  const router = useRouter();
  const {
    courses,
    user,
    submitAnswer,
    answers,
    isInitialized,
    logout,
    refreshGamification,
  } = useAppContext();

  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  const initialModuleId = course?.modules?.[0]?.id || "";
  const initialLessonId = course?.modules?.[0]?.lessons?.[0]?.id || "";

  const [activeModuleId, setActiveModuleId] = useState<string>(initialModuleId);
  const [activeLessonId, setActiveLessonId] = useState<string>(initialLessonId);
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Record<number, boolean>>({});
  const [homeworkText, setHomeworkText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioResetKey, setAudioResetKey] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  useEffect(() => {
    setQuizSubmitted(false);
    setQuizScore(null);
    setQuizAnswers({});

    if (!user || !course) return;

    const mod = course.modules.find((m) => m.id === activeModuleId);
    const lesson = mod?.lessons.find((l) => l.id === activeLessonId);
    if (!lesson?.quiz?.length) return;

    const loadQuizResult = async () => {
      const { data, error } = await supabase
        .from("quiz_results")
        .select("id, score, answers")
        .eq("user_id", user.id)
        .eq("lesson_id", lesson.id)
        .maybeSingle();

      if (!error && data) {
        setQuizSubmitted(true);
        setQuizScore(data.score);
        setQuizAnswers(data.answers ?? {});
      }
    };
    loadQuizResult();
  }, [user, course, activeModuleId, activeLessonId]);

  const isReady = Boolean(isInitialized && user && course);

  const activeModule: Module | undefined = course?.modules.find(
    (m) => m.id === activeModuleId,
  );
  const activeLesson: Lesson | undefined = activeModule?.lessons.find(
    (l) => l.id === activeLessonId,
  );

  const existingAnswer: Answer | undefined = user
    ? answers.find(
        (a) => a.lessonId === activeLessonId && a.studentName === user.name,
      )
    : undefined;

  const selectLesson = useCallback((moduleId: string, lessonId: string) => {
    setActiveModuleId(moduleId);
    setActiveLessonId(lessonId);
    setFlippedCards({});
    setIsSidebarOpen(false);
  }, []);

  const playAudio = useCallback((text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("На жаль, ваш browser не підтримує функцію озвучування.");
    }
  }, []);

  const toggleCard = useCallback((index: number) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const handleQuizAnswerChange = useCallback(
    (questionId: string, answer: string) => {
      setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
    },
    [],
  );

  const handleQuizSubmit = useCallback(async () => {
    if (!activeLesson?.quiz?.length || !user) return;

    const allAnswered = activeLesson.quiz.every(
      (q) => quizAnswers[q.id] != null && String(quizAnswers[q.id]).length > 0,
    );
    if (!allAnswered) return;

    const { data: existing } = await supabase
      .from("quiz_results")
      .select("id, score")
      .eq("user_id", user.id)
      .eq("lesson_id", activeLesson.id)
      .maybeSingle();

    if (existing) {
      setQuizScore(existing.score);
      setQuizSubmitted(true);
      // Idempotent: covers insert-ok / award-failed edge case
      const retry = await awardQuizCoins(supabase, activeLesson.id);
      if (!retry.error && retry.coinsAwarded > 0) {
        await refreshGamification();
      }
      return;
    }

    const correctCount = activeLesson.quiz.filter((q) =>
      isQuizAnswerCorrect(q, quizAnswers[q.id]),
    ).length;
    const score = Math.round((correctCount / activeLesson.quiz.length) * 100);

    const { error } = await supabase.from("quiz_results").insert({
      user_id: user.id,
      lesson_id: activeLesson.id,
      score,
      correct_count: correctCount,
      answers: quizAnswers,
    });

    if (error) {
      console.error("Помилка при збереженні результату тесту:", error);
    } else {
      const award = await awardQuizCoins(supabase, activeLesson.id);
      if (award.error) {
        console.error("Помилка нарахування коїнів за тест:", award.error);
      } else if (award.coinsAwarded > 0) {
        await refreshGamification();
      }
    }

    setQuizScore(score);
    setQuizSubmitted(true);
    await recalculateSlp(supabase, user.id, courses);
  }, [activeLesson, user, quizAnswers, courses, refreshGamification]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const picked = Array.from(e.target.files || []);
      e.target.value = "";
      if (picked.length === 0) return;

      const { compressImageFile, isCompressibleImage } = await import(
        "@/lib/compressImage"
      );
      const { MAX_DOCUMENT_BYTES } = await import("@/lib/mediaLimits");

      const processed: File[] = [];
      for (const file of picked) {
        if (isCompressibleImage(file)) {
          try {
            processed.push(await compressImageFile(file));
          } catch (err) {
            console.error("Не вдалося стиснути фото:", err);
            processed.push(file);
          }
          continue;
        }

        if (file.size > MAX_DOCUMENT_BYTES) {
          alert(
            `Файл «${file.name}» занадто великий (макс. ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))} МБ).`,
          );
          continue;
        }
        processed.push(file);
      }

      setAttachedFiles(processed);
    },
    [],
  );

  const handleRemoveFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSendHomework = useCallback(async () => {
    const hasContent =
      homeworkText.trim() || audioBlob || attachedFiles.length > 0;

    if (!hasContent || !activeLesson || !course || !user) {
      alert("Будь ласка, додайте текст, аудіо або файли перед відправкою.");
      return;
    }

    if (audioBlob && audioBlob.size === 0) {
      alert("Аудіозапис порожній. Запишіть ще раз або завантажте файл.");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAnswer({
        lessonId: activeLesson.id,
        courseId: course.id,
        text: homeworkText,
        voiceRecorded: !!audioBlob,
        attachments: [],
        audioBlob,
        files: attachedFiles,
      } as Parameters<typeof submitAnswer>[0] & {
        audioBlob?: Blob | null;
        files?: File[];
      });
      setHomeworkText("");
      setAudioBlob(null);
      setAudioResetKey((key) => key + 1);
      setAttachedFiles([]);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error("Помилка при відправці домашнього завдання:", error);
      alert(
        "Сталася помилка при відправці домашнього завдання. Спробуйте ще раз.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    homeworkText,
    audioBlob,
    attachedFiles,
    activeLesson,
    course,
    user,
    submitAnswer,
  ]);

  return {
    router,
    logout,
    user: user!,
    course: course as Course,
    courseId,
    isReady,
    isDarkMode,
    setIsDarkMode,
    isProfileOpen,
    setIsProfileOpen,
    isSidebarOpen,
    setIsSidebarOpen,
    activeLesson,
    activeLessonId,
    existingAnswer,
    flippedCards,
    selectLesson,
    playAudio,
    toggleCard,
    quizAnswers,
    quizSubmitted,
    quizScore,
    handleQuizAnswerChange,
    handleQuizSubmit,
    homeworkText,
    setHomeworkText,
    isSubmitted,
    isSubmitting,
    audioResetKey,
    setAudioBlob,
    attachedFiles,
    handleFileChange,
    handleRemoveFile,
    handleSendHomework,
    answers,
  };
}

export type CourseLessonPageState = ReturnType<typeof useCourseLessonPage>;
