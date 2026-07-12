"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
import { useDarkMode } from "../../../hooks/useDarkMode";
import { recalculateSlp } from "../../../lib/slp";
import { awardCoins } from "../../../lib/gamification";
import {
  getCorrectOptionIndex,
  getSelectedOptionIndex,
  isQuizAnswerCorrect,
} from "../../../lib/quiz";
import { normalizeLessonHtml } from "../../../lib/lessonHtml";
import DashboardHeader from "../../../components/dashboard/DashboardHeader";
import LessonCollapsibleSection from "../../../components/courses/LessonCollapsibleSection";
import VoiceHomeworkRecorder from "../../../components/courses/VoiceHomeworkRecorder";
import { isUrlUnplayableOnIOS } from "../../../lib/voiceRecording";
import {
  ArrowLeft,
  PlayCircle,
  FileText,
  Volume2,
  Send,
  CheckCircle,
  Clock,
  BookOpen,
  Headphones,
  ClipboardList,
  Paperclip,
  X,
  Menu,
} from "lucide-react";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { courses, user, submitAnswer, answers, isInitialized, logout } =
    useAppContext();

  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  // Визначаємо перший модуль та урок одразу з безпечними перевірками
  const initialModuleId = course?.modules?.[0]?.id || "";
  const initialLessonId = course?.modules?.[0]?.lessons?.[0]?.id || "";

  const [activeModuleId, setActiveModuleId] = useState<string>(initialModuleId);
  const [activeLessonId, setActiveLessonId] = useState<string>(initialLessonId);
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [homeworkText, setHomeworkText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioResetKey, setAudioResetKey] = useState(0);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Quiz state — має бути до early return (Rules of Hooks)
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

  if (!isInitialized || !user || !course) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: isDarkMode ? "#2d2f2a" : "#faf9f6",
          color: "#8a8a45",
          fontWeight: 600,
        }}
      >
        Завантаження курсу...
      </div>
    );
  }

  const activeModule = course.modules.find((m) => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons.find(
    (l) => l.id === activeLessonId,
  );

  const existingAnswer = answers.find(
    (a) => a.lessonId === activeLessonId && a.studentName === user.name,
  );

  const playAudio = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    } else {
      alert("На жаль, ваш browser не підтримує функцію озвучування.");
    }
  };

  const toggleCard = (index: number) => {
    setFlippedCards((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleQuizAnswerChange = (questionId: string, answer: string) => {
    setQuizAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson?.quiz?.length || !user) return;

    // Перевіряємо чи тест вже здавали (anti-cheat)
    const { data: existing } = await supabase
      .from("quiz_results")
      .select("id, score")
      .eq("user_id", user.id)
      .eq("lesson_id", activeLesson.id)
      .maybeSingle();

    if (existing) {
      // Вже здавали — тільки показуємо результат, коїни не нараховуємо
      setQuizScore(existing.score);
      setQuizSubmitted(true);
      return;
    }

    const correctCount = activeLesson.quiz.filter((q) =>
      isQuizAnswerCorrect(q, quizAnswers[q.id]),
    ).length;
    const score = Math.round((correctCount / activeLesson.quiz.length) * 100);

    // INSERT (не upsert) — унікальний constraint на DB рівні захищає від дублів
    const { error } = await supabase
      .from("quiz_results")
      .insert({
        user_id: user.id,
        lesson_id: activeLesson.id,
        score,
        answers: quizAnswers,
      });

    if (error) {
      console.error("Помилка при збереженні результату тесту:", error);
    } else {
      // Нараховуємо 1 коїн за кожну правильну відповідь
      if (correctCount > 0) {
        await awardCoins(supabase, user.id, correctCount);
      }
    }

    setQuizScore(score);
    setQuizSubmitted(true);
    await recalculateSlp(supabase, user.id, courses);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendHomework = async () => {
    const hasContent = homeworkText.trim() || audioBlob || attachedFiles.length > 0;

    if (!hasContent || !activeLesson) {
      alert("Будь ласка, додайте текст, аудіо або файли перед відправкою.");
      return;
    }

    if (audioBlob && audioBlob.size === 0) {
      alert("Аудіозапис порожній. Запишіть ще раз або завантажте файл.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("Відправка домашнього завдання:", {
        lessonId: activeLesson.id,
        courseId: course.id,
        text: homeworkText,
        audioBlob: !!audioBlob,
        files: attachedFiles.length,
      });
      await submitAnswer({
        lessonId: activeLesson.id,
        courseId: course.id,
        text: homeworkText,
        voiceRecorded: !!audioBlob,
        attachments: [],
        audioBlob,
        files: attachedFiles,
      } as any);
      setHomeworkText("");
      setAudioBlob(null);
      setAudioResetKey((key) => key + 1);
      setAttachedFiles([]);
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      console.error("Помилка при відправці домашнього завдання:", error);
      alert("Сталася помилка при відправці домашнього завдання. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{
        background: isDarkMode ? "#2d2f2a" : "#faf9f6",
        color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <DashboardHeader
        userName={user.name}
        isProfileOpen={isProfileOpen}
        isDarkMode={isDarkMode}
        onProfileToggle={() => setIsProfileOpen(!isProfileOpen)}
        onDarkModeToggle={() => setIsDarkMode(!isDarkMode)}
        onLogout={logout}
      />
      {/* ── МОБІЛЬНИЙ ХЕДЕР (вище flex-row щоб не стискувати контент) ── */}
      <div
        className="flex shrink-0 items-center justify-between px-4 py-2 xl:hidden"
        style={{
          borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          background: isDarkMode ? "#2a2c27" : "#f0ede5",
        }}
      >
        <button
          onClick={() => setIsSidebarOpen(true)}
          style={{
            background: "transparent",
            border: "none",
            color: isDarkMode ? "#d8cdb4" : "#8a8a45",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <Menu size={24} />
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            background: "transparent",
            border: "none",
            color: isDarkMode ? "#d8cdb4" : "#8a8a45",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: 0,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          <ArrowLeft size={16} /> Кабінет
        </button>
      </div>

      {/* ── ОСНОВНА ОБЛАСТЬ: sidebar + контент ── */}
      <div className="flex flex-1 overflow-hidden">
        <style
          dangerouslySetInnerHTML={{
            __html: `
          /* Desktop: sidebar статичний і займає 100% висоти flex-рядка */
          @media (min-width: 1280px) {
            .sidebar-desktop {
              position: static !important;
              transform: none !important;
              z-index: auto !important;
              height: 100% !important;
            }
          }
          .lesson-content-area {
            min-width: 0;
            width: 100%;
          }
        `,
          }}
        />

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 40,
          }}
          className="xl:hidden"
        />
      )}

      {/* ЛІВА ПАНЕЛЬ: НАВІГАЦІЯ */}
      <div
        className="sidebar-desktop xl:static xl:transform-none xl:z-auto"
        style={{
          width: "320px",
          background: isDarkMode ? "#2d2f2a" : "#f0ede5",
          borderRight: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: 50,
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {/* Desktop back button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="hidden xl:flex items-center gap-2 px-4 py-2 mb-6 pb-4 border-b border-[#d8cdb4]"
          style={{
            background: isDarkMode ? "#2d2f2a" : "#f0ede5",
            border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
            color: isDarkMode ? "#d8cdb4" : "#8a8a45",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 14,
            width: "100%",
          }}
        >
          <ArrowLeft size={18} /> Повернутись до кабінету
        </button>

        <div style={{ padding: "16px 24px", borderBottom: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.4,
              color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
            }}
          >
            {course.title}
          </h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{
              background: "transparent",
              border: "none",
              color: isDarkMode ? "#d8cdb4" : "#8a8a45",
              cursor: "pointer",
              padding: 4,
            }}
            className="xl:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
          {course.modules.map((mod, modIndex) => (
            <div key={mod.id} style={{ marginBottom: 24 }}>
              <h4
                style={{
                  padding: "0 24px",
                  margin: "0 0 12px",
                  fontSize: 12,
                  textTransform: "uppercase",
                  color: "#8a8a45",
                  letterSpacing: "0.5px",
                  fontWeight: 700,
                }}
              >
                Модуль {modIndex + 1}: {mod.title}
              </h4>
              <div>
                {mod.lessons.map((les, lesIndex) => {
                  const isActive = activeLessonId === les.id;
                  const isCompleted = answers.some(
                    (a) => a.lessonId === les.id && a.studentName === user.name,
                  );

                  return (
                    <div
                      key={les.id}
                      onClick={() => {
                        setActiveModuleId(mod.id);
                        setActiveLessonId(les.id);
                        setFlippedCards({});
                        setIsSidebarOpen(false);
                      }}
                      style={{
                        padding: "12px 24px 12px 32px",
                        cursor: "pointer",
                        background: isActive ? (isDarkMode ? "#2d2f2a" : "#fff") : "transparent",
                        borderLeft: isActive
                          ? "4px solid #8a8a45"
                          : "4px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.transition = "transform 0.2s";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      {isCompleted ? (
                        <div style={{ flexShrink: 0, minWidth: "18px" }}>
                          <CheckCircle size={18} color="#8a8a45" />
                        </div>
                      ) : (
                        <div style={{ flexShrink: 0, minWidth: "18px" }}>
                          <PlayCircle
                            size={18}
                            color={isActive ? "#c97a4a" : "#a39f93"}
                          />
                        </div>
                      )}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? (isDarkMode ? "rgb(250, 249, 246)" : "#3a3528") : (isDarkMode ? "#d8cdb4" : "#5c574a"),
                        }}
                      >
                        <span style={{ opacity: 0.6, marginRight: 4 }}>
                          {modIndex + 1}.{lesIndex + 1}
                        </span>{" "}
                        {les.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ПРАВА ПАНЕЛЬ: КОНТЕНТ УРОКУ */}
      <div
        className="flex-1 min-w-0 overflow-y-auto"
        style={{
          padding: "20px 16px",
          background: isDarkMode ? "#2d2f2a" : "#fff",
        }}
      >
        {activeLesson ? (
          <div
            className="lesson-content-area"
            style={{
              margin: "0 auto",
              animation: "fadeIn 0.4s ease",
            }}
          >
            {/* 1. НАЗВА ТА ОПИС */}
            <span
              style={{
                background: "#f0ede5",
                color: "#8a8a45",
                padding: "4px 8px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 12,
                display: "inline-block",
              }}
              className="md:padding-[6px_12px] md:fontSize-[12px] md:marginBottom-[16px]"
            >
              Skill: {activeLesson.skill}
            </span>
            <h1
              style={{
                fontSize: 24,
                margin: "0 0 20px",
                color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                fontWeight: 800,
              }}
              className="md:fontSize-[32px] md:margin-[0_0_32px]"
            >
              {activeLesson.title}
            </h1>

            {/* 2. ТЕОРІЯ / ТЕКСТ УРОКУ */}
            {activeLesson.content && activeLesson.content !== "<p><br></p>" && (
              <div
                className="lesson-content-card md:padding-[32px] md:marginBottom-[40px]"
                style={{
                  background: "#faf9f6",
                  padding: 24,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                    color: "#8a8a45",
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                  className="md:marginBottom-[20px] md:fontSize-[18px]"
                >
                  <FileText size={20} className="md:size-[22px]" /> Теоретичний матеріал
                </div>
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{
                    __html: normalizeLessonHtml(activeLesson.content),
                  }}
                  style={{
                    fontSize: 15,
                    lineHeight: 1.65,
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
                  }}
                />
              </div>
            )}

            {/* 3. АУДІО ПЛЕЄР — одразу після теорії */}
            {activeLesson.audioUrl && (
              <div
                style={{
                  background: "#f0ede5",
                  padding: 24,
                  borderRadius: 12,
                  marginBottom: 24,
                  border: "1px solid #e0dcd0",
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    background: "#8a8a45",
                    padding: 12,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Headphones size={24} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontWeight: 700,
                      color: "#3a3528",
                      fontSize: 15,
                    }}
                  >
                    Аудіоматеріал до уроку
                  </p>
                  <audio
                    controls
                    style={{ width: "100%", height: "40px" }}
                    src={activeLesson.audioUrl}
                  >
                    Ваш браузер не підтримує аудіо елемент.
                  </audio>
                </div>
              </div>
            )}

            {/* 4. ГРАМАТИЧНИЙ ДОВІДНИК */}
            {activeLesson.grammarContent &&
              activeLesson.grammarContent !== "<p><br></p>" && (
                <LessonCollapsibleSection
                  title="Граматичний довідник"
                  icon={<BookOpen size={22} />}
                  defaultOpen
                  headerColor="#c97a4a"
                  borderColor="#facbce"
                  background="#fdf8f5"
                  isDarkMode={isDarkMode}
                >
                  <div
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{
                      __html: normalizeLessonHtml(activeLesson.grammarContent),
                    }}
                    style={{
                      fontSize: 15,
                      lineHeight: 1.65,
                      color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
                    }}
                  />
                </LessonCollapsibleSection>
              )}

            {/* 5. ФОТО УРОКУ */}
            {activeLesson.imageUrl && (
              <img
                src={activeLesson.imageUrl}
                alt="Матеріал до уроку"
                className="lesson-lesson-image"
              />
            )}

            {/* 6. ВІДЕО ПЛЕЄР */}
            {activeLesson.videoLabel && (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "#000",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 40,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  border: "1px solid #e0dcd0",
                }}
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeLesson.videoLabel}`}
                  title="YouTube video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* 7. ДОКУМЕНТИ УРОКУ */}
            {activeLesson.documents && activeLesson.documents.length > 0 && (
              <LessonCollapsibleSection
                title="Навчальні документи"
                icon={<FileText size={22} />}
                headerColor="#8a8a45"
                background="#faf9f6"
                isDarkMode={isDarkMode}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {activeLesson.documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 16,
                        background: isDarkMode ? "#2d2f2a" : "#fff",
                        borderRadius: 8,
                        border: "1px solid #d8cdb4",
                        textDecoration: "none",
                        color: "#4a4a4a",
                        transition: "all 0.2s",
                      }}
                    >
                      <FileText size={20} color="#8a8a45" />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>
                        {doc.name}
                      </span>
                    </a>
                  ))}
                </div>
              </LessonCollapsibleSection>
            )}

            {/* 8. СЛОВНИК (КАРТКИ QUIZLET) */}
            {activeLesson.quizlet && activeLesson.quizlet.length > 0 && (
              <LessonCollapsibleSection
                title="Словник уроку (клікніть, щоб перегорнути)"
                icon={<BookOpen size={22} />}
                headerColor={isDarkMode ? "rgb(250, 249, 246)" : "#3a3528"}
                isDarkMode={isDarkMode}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 16,
                  }}
                >
                  {activeLesson.quizlet.map((card, index) => (
                    <div
                      key={index}
                      onClick={() => toggleCard(index)}
                      style={{
                        height: "120px",
                        background: flippedCards[index] ? (isDarkMode ? "#2a2c27" : "#e0dcd0") : (isDarkMode ? "#2d2f2a" : "#fff"),
                        color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                        border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px",
                        textAlign: "center",
                        cursor: "pointer",
                        position: "relative",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      {!flippedCards[index] && (
                        <button
                          onClick={(e) => playAudio(card.term, e)}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "#f0ede5",
                            border: "none",
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "#8a8a45",
                            transition: "background 0.2s",
                          }}
                          title="Прослухати вимову"
                        >
                          <Volume2 size={16} />
                        </button>
                      )}
                      <span style={{ fontSize: 16, fontWeight: 700 }}>
                        {flippedCards[index] ? card.translation : card.term}
                      </span>
                    </div>
                  ))}
                </div>
              </LessonCollapsibleSection>
            )}

            {/* 9. ПРАКТИЧНИЙ ТЕСТ (QUIZ) */}
            {activeLesson.quiz && activeLesson.quiz.length > 0 && (
              <div
                style={{
                  background: isDarkMode ? "#2d2f2a" : "#faf9f6",
                  padding: 32,
                  borderRadius: 12,
                  border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
                  marginBottom: 40,
                }}
              >
                <h3
                  style={{
                    fontSize: 20,
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                    marginBottom: 20,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <CheckCircle size={22} color="#8a8a45" /> Практичний тест
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {activeLesson.quiz.map((question, index) => {
                    const userAnswer = quizAnswers[question.id];
                    const selectedIdx = getSelectedOptionIndex(question, userAnswer);
                    const isCorrect = isQuizAnswerCorrect(question, userAnswer);
                    const showFeedback = quizSubmitted;
                    
                    return (
                      <div key={question.id}>
                        <p
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                            marginBottom: 12,
                          }}
                        >
                          {index + 1}. {question.text}
                        </p>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {question.options.map((option, optIndex) => {
                            const isSelected = selectedIdx === optIndex;
                            const isOptionCorrect =
                              getCorrectOptionIndex(question) === optIndex;
                            
                            let optionStyle = {
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: 12,
                              background: isDarkMode ? "#2d2f2a" : "#fff",
                              borderRadius: 8,
                              border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                              cursor: quizSubmitted ? "default" : "pointer",
                              transition: "all 0.2s",
                            };
                            
                            let icon = null;
                            let textColor = isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a";
                            
                            if (showFeedback) {
                              if (isSelected && isCorrect) {
                                optionStyle = {
                                  ...optionStyle,
                                  background: isDarkMode ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
                                  border: "2px solid #22c55e",
                                };
                                icon = <span style={{ color: "#22c55e", fontSize: 18 }}>✅</span>;
                                textColor = isDarkMode ? "#dcfce7" : "#14532d";
                              } else if (isSelected && !isCorrect) {
                                optionStyle = {
                                  ...optionStyle,
                                  background: isDarkMode ? "rgba(239, 68, 68, 0.15)" : "#fee2e2",
                                  border: "2px solid #ef4444",
                                };
                                icon = <span style={{ color: "#ef4444", fontSize: 18 }}>❌</span>;
                                textColor = isDarkMode ? "#fee2e2" : "#7f1d1d";
                              } else if (isOptionCorrect) {
                                optionStyle = {
                                  ...optionStyle,
                                  background: isDarkMode ? "rgba(34, 197, 94, 0.15)" : "#dcfce7",
                                  border: "2px solid #22c55e",
                                };
                                icon = <span style={{ color: "#22c55e", fontSize: 18 }}>✅</span>;
                                textColor = isDarkMode ? "#dcfce7" : "#14532d";
                              }
                            }
                            
                            return (
                              <label
                                key={optIndex}
                                style={optionStyle}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={String(optIndex)}
                                  checked={selectedIdx === optIndex}
                                  onChange={() =>
                                    handleQuizAnswerChange(
                                      question.id,
                                      String(optIndex),
                                    )
                                  }
                                  disabled={quizSubmitted}
                                  style={{ width: 18, height: 18, accentColor: "#8a8a45" }}
                                />
                                <span style={{ fontSize: 15, color: textColor, flex: 1 }}>
                                  {option}
                                </span>
                                {icon}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    style={{
                      marginTop: 24,
                      background: "#8a8a45",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    Завершити тест
                  </button>
                ) : (
                  <div
                    style={{
                      marginTop: 24,
                      padding: 16,
                      background: "#eef0df",
                      borderRadius: 8,
                      border: "1px solid #8a8a45",
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#8a8a45",
                      }}
                    >
                      Практичний тест пройдено
                    </p>
                    <p
                      style={{
                        margin: "8px 0 0",
                        fontSize: 15,
                        color: "#6b6b3a",
                      }}
                    >
                      {quizScore}% ({Math.round(((quizScore || 0) / 100) * activeLesson.quiz.length)}/{activeLesson.quiz.length} правильних відповідей)
                    </p>
                  </div>
                )}
              </div>
            )}

          {/* 10. ІНСТРУКЦІЯ ДО ДОМАШНЬОГО ЗАВДАННЯ */}
            {activeLesson.homeworkInstruction && (
              <LessonCollapsibleSection
                title="Інструкція до домашнього завдання"
                icon={<ClipboardList size={22} />}
                defaultOpen
                headerColor={isDarkMode ? "#dcfce7" : "#c97a4a"}
                borderColor="#facbce"
                background={isDarkMode ? "#2d2f2a" : "#fdf8f5"}
                isDarkMode={isDarkMode}
              >
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.8,
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
                    whiteSpace: "pre-wrap",
                    wordBreak: "normal",
                    overflowWrap: "normal",
                  }}
                >
                  {activeLesson.homeworkInstruction}
                </div>
              </LessonCollapsibleSection>
            )}

            {/* 11. БЛОК ВІДПРАВКИ ЗАВДАННЯ */}
            {existingAnswer ? (
              <div style={{ marginBottom: 60 }}>
                <div
                  style={{
                    background: isDarkMode ? "#2d2f2a" : "#f0ede5",
                    padding: 32,
                    borderRadius: 12,
                    border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
                    textAlign: "center",
                  }}
                >
                  <CheckCircle size={48} color="#8a8a45" style={{ marginBottom: 16 }} />
                  <h3
                    style={{
                      margin: "0 0 12px",
                      color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                      fontSize: 20,
                    }}
                  >
                    ДЗ здано
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      color: isDarkMode ? "#9a8f70" : "#5c574a",
                      fontSize: 15,
                    }}
                  >
                    {existingAnswer.status === "reviewed"
                      ? `Перевірено. Оцінка: ${existingAnswer.score || 0}/100`
                      : "Очікуйте на перевірку або перегляньте фідбек нижче"}
                  </p>
                </div>

                {/* ІСТОРІЯ ВІДПОВІДЕЙ */}
                <div
                  style={{
                    background: isDarkMode ? "#2d2f2a" : "#fff",
                    padding: 20,
                    borderRadius: 8,
                    border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                    marginTop: 24,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: existingAnswer.status === "reviewed" ? "#8a8a45" : "#c97a4a",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {existingAnswer.status === "reviewed" ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                    {existingAnswer.status === "reviewed"
                      ? `Перевірено. Оцінка: ${existingAnswer.score || 0}/100`
                      : "Остання відповідь очікує перевірки"}
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontStyle: "italic",
                      color: "#5c574a",
                      fontSize: 15,
                    }}
                  >
                    Ваша відповідь: {existingAnswer.text}
                  </p>
                  {existingAnswer.audioUrl && (
                    <div style={{ marginTop: 12 }}>
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
                      {isUrlUnplayableOnIOS(existingAnswer.audioUrl) ? (
                        <p
                          style={{
                            margin: 0,
                            padding: "10px 12px",
                            borderRadius: 6,
                            background: isDarkMode ? "rgba(138, 138, 69, 0.15)" : "#eef0df",
                            border: "1px solid #8a8a45",
                            color: isDarkMode ? "#d8cdb4" : "#6b6b3a",
                            fontSize: 13,
                            lineHeight: 1.5,
                          }}
                        >
                          Файл збережено. На iPhone цей формат не відтворюється — це нормально.
                          Викладач прослухає на комп&apos;ютері.
                        </p>
                      ) : (
                        <audio
                          controls
                          playsInline
                          preload="metadata"
                          style={{ width: "100%", height: 40 }}
                          src={existingAnswer.audioUrl}
                        >
                          Ваш браузер не підтримує аудіо.
                        </audio>
                      )}
                    </div>
                  )}
                  {existingAnswer.teacherFeedbackText && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        background: "#faf9f6",
                        borderRadius: 8,
                        borderLeft: "4px solid #8a8a45",
                      }}
                    >
                      <strong
                        style={{
                          color: "#3a3528",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        Відгук викладача:
                      </strong>
                      <span style={{ color: "#4a4a4a" }}>
                        {existingAnswer.teacherFeedbackText}
                      </span>
                      {(existingAnswer.coins_awarded_amount ?? 0) > 0 && (
                        <p
                          style={{
                            marginTop: 12,
                            padding: "10px 12px",
                            background: "#eef0df",
                            borderRadius: 6,
                            color: "#8a8a45",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          ☕ Вам надано {existingAnswer.coins_awarded_amount}{" "}
                          кава-коїнів за сумлінне виконання домашнього завдання!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: isDarkMode ? "#2d2f2a" : "#f0ede5",
                  padding: 32,
                  borderRadius: 12,
                  border: isDarkMode ? "1px solid #3e403a" : "1px solid #e0dcd0",
                  marginBottom: 60,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                    fontSize: 20,
                  }}
                >
                  <Send size={22} color="#8a8a45" /> Практичне завдання
                </h3>

                <textarea
                  value={homeworkText}
                  onChange={(e) => setHomeworkText(e.target.value)}
                  placeholder="Введіть вашу відповідь, есе або коментар до файлів тут..."
                  rows={5}
                  style={{
                    width: "100%",
                    padding: 16,
                    borderRadius: 8,
                    border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                    marginBottom: 16,
                    fontFamily: "inherit",
                    fontSize: 15,
                    background: isDarkMode ? "#2d2f2a" : "#fff",
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                  }}
                />

                <VoiceHomeworkRecorder
                  isDarkMode={isDarkMode}
                  onAudioChange={setAudioBlob}
                  resetKey={audioResetKey}
                />

                {/* ПРИКРІПЛЕННЯ ФАЙЛІВ */}
                <div
                  style={{
                    background: isDarkMode ? "#2d2f2a" : "#fff",
                    padding: 16,
                    borderRadius: 8,
                    border: isDarkMode ? "1px solid #3e403a" : "1px solid #d8cdb4",
                    marginBottom: 16,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: isDarkMode ? "rgb(250, 249, 246)" : "#5c574a",
                    }}
                  >
                    <FileText size={16} style={{ display: "inline", marginRight: 6 }} />
                    Прикріпити файли (PDF, Word, фото)
                  </p>
                  <input
                    type="file"
                    id="file-input"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                  <label
                    htmlFor="file-input"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "10px 20px",
                      background: "#8a8a45",
                      color: "#fff",
                      borderRadius: 8,
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#7a7a3d";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "#8a8a45";
                    }}
                  >
                    <Paperclip size={16} />
                    📎 Обрати файли
                  </label>
                  {attachedFiles.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <p style={{ fontSize: 13, color: "#8a8a45", marginBottom: 8 }}>
                        Обрано файлів: {attachedFiles.length}
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {attachedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 12,
                              color: "#5c574a",
                              padding: "4px 8px",
                              background: "#f0ede5",
                              borderRadius: 4,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 6,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <FileText size={12} />
                              {file.name}
                            </div>
                            <button
                              onClick={() => handleRemoveFile(idx)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                color: "#c97a4a",
                                padding: 2,
                                display: "flex",
                                alignItems: "center",
                              }}
                              title="Видалити файл"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color: "#9a8f70",
                    }}
                  >
                    *Ви можете прикріпити файли та/або записати голосову відповідь
                  </p>
                  <button
                    onClick={handleSendHomework}
                    disabled={isSubmitted || isSubmitting}
                    style={{
                      background: isSubmitted ? "#8a8a45" : isSubmitting ? "#c97a4a" : "#3a3528",
                      color: "#fff",
                      border: "none",
                      padding: "12px 24px",
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "background 0.3s",
                    }}
                  >
                    {isSubmitting ? "⏳ Відправлення..." : isSubmitted ? "Відправлено!" : "Надіслати на перевірку"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              color: "#9a8f70",
              marginTop: 100,
              fontSize: 16,
            }}
          >
            Оберіть урок з меню зліва.
          </div>
        )}
      </div>
      </div>
    </div>
  );
}