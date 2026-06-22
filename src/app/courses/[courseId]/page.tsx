"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../context/AppContext";
import { supabase } from "../../../lib/supabase";
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
  StopCircle,
  Paperclip,
  X,
  Menu,
} from "lucide-react";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { courses, user, submitAnswer, answers, isInitialized } =
    useAppContext();

  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  // Визначаємо перший модуль та урок одразу з безпечними перевірками
  const initialModuleId = course?.modules?.[0]?.id || "";
  const initialLessonId = course?.modules?.[0]?.lessons?.[0]?.id || "";

  const [activeModuleId, setActiveModuleId] = useState<string>(initialModuleId);
  const [activeLessonId, setActiveLessonId] = useState<string>(initialLessonId);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("darkMode");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  // Зберігаємо стан темної теми в localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [homeworkText, setHomeworkText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<{ [key: string]: string }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push("/login");
    }
  }, [user, router, isInitialized]);

  // Відлік часу під час аудіозапису
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Форматування часу у форматі MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

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

  // Перевірка чи тест вже був зданий при завантаженні уроку
  useEffect(() => {
    if (user && activeLesson) {
      const loadQuizResult = async () => {
        const { data, error } = await supabase
          .from("quiz_results")
          .select("*")
          .eq("user_id", user.id)
          .eq("lesson_id", activeLesson.id)
          .single();

        if (!error && data) {
          setQuizSubmitted(true);
          setQuizScore(data.score);
          setQuizAnswers(data.answers);
        }
      };
      loadQuizResult();
    }
  }, [user, activeLesson]);

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
    if (!activeLesson?.quiz || !user) return;
    
    let correctCount = 0;
    activeLesson.quiz.forEach((question) => {
      if (quizAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    
    const score = Math.round((correctCount / activeLesson.quiz.length) * 100);
    setQuizScore(score);
    setQuizSubmitted(true);
    
    // Зберігаємо результат тесту в Supabase
    const { error } = await supabase
      .from("quiz_results")
      .insert({
        user_id: user.id,
        lesson_id: activeLesson.id,
        score: score,
        answers: quizAnswers,
      });

    if (error) {
      console.error("Помилка при збереженні результату тесту:", error);
      alert("Сталася помилка при збереженні результату тесту");
    }

    // Update SLP metrics in profiles table based on lesson skill type
    const skillUpdate: { [key: string]: number } = {};
    if (activeLesson.skill === "listening") {
      skillUpdate.slp_listening = score;
    } else if (activeLesson.skill === "speaking") {
      skillUpdate.slp_speaking = score;
    } else if (activeLesson.skill === "reading") {
      skillUpdate.slp_reading = score;
    } else if (activeLesson.skill === "writing") {
      skillUpdate.slp_writing = score;
    }

    if (Object.keys(skillUpdate).length > 0) {
      const { error: slpError } = await supabase
        .from("profiles")
        .update(skillUpdate)
        .eq("id", user.id);

      if (slpError) {
        console.error("Помилка при оновленні SLP метрик:", slpError);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error("Помилка доступу до мікрофона:", error);
      alert("Не вдалося отримати доступ до мікрофона. Перевірте налаштування браузера.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleRerecord = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setMediaRecorder(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachedFiles(files);
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSendHomework = async () => {
    console.log("handleSendHomework викликано:", {
      homeworkText,
      homeworkTextTrimmed: homeworkText.trim(),
      activeLesson,
      activeLessonId: activeLesson?.id,
      audioBlob: !!audioBlob,
      files: attachedFiles.length,
    });
    
    // Валідація: потрібен або текст, або аудіо, або файли
    const hasContent = homeworkText.trim() || audioBlob || attachedFiles.length > 0;
    
    if (!hasContent || !activeLesson) {
      console.error("Валідація не пройдена:", {
        hasContent,
        hasText: !!homeworkText.trim(),
        hasAudio: !!audioBlob,
        hasFiles: attachedFiles.length > 0,
        hasLesson: !!activeLesson,
      });
      alert("Будь ласка, додайте текст, аудіо або файли перед відправкою.");
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
        voiceRecorded: false,
        attachments: [],
        audioBlob,
        files: attachedFiles,
      } as any);
      setHomeworkText("");
      setAudioBlob(null);
      setAudioUrl(null);
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
      className="flex flex-col xl:flex-row"
      style={{
        display: "flex",
        height: "100vh",
        background: isDarkMode ? "#2d2f2a" : "#faf9f6",
        color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rich-text-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
        .rich-text-content ul, .rich-text-content ol { padding-left: 20px; }
        .rich-text-content { break-words; whitespace-pre-wrap; word-wrap: break-word; overflow-wrap: break-word; }
        @media (min-width: 1280px) {
          .sidebar-desktop { position: static !important; transform: none !important; z-index: auto !important; }
        }
        @media (max-width: 1279px) {
          .main-content { margin-left: 0 !important; width: 100% !important; }
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

      {/* Mobile header */}
      <div
        className="flex justify-between items-center w-full px-4 py-2 bg-[#f0e9d8] xl:hidden"
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
        className="main-content flex-1 w-full"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          background: isDarkMode ? "#2d2f2a" : "#fff",
          width: "100%",
        }}
      >
        {activeLesson ? (
          <div
            style={{
              maxWidth: "800px",
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
                style={{
                  background: "#faf9f6",
                  padding: 20,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                  marginBottom: 24,
                }}
                className="md:padding-[32px] md:marginBottom-[40px]"
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
                  className="rich-text-content md:fontSize-[16px] md:lineHeight-[1.8]"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                  style={{ fontSize: 14, lineHeight: 1.6, color: "#4a4a4a" }}
                />
              </div>
            )}

            {/* 3. ГРАМАТИЧНИЙ ДОВІДНИК */}
            {activeLesson.grammarContent &&
              activeLesson.grammarContent !== "<p><br></p>" && (
                <div
                  style={{
                    background: "#fdf8f5",
                    padding: 20,
                    borderRadius: 12,
                    border: "1px solid #facbce",
                    marginBottom: 40,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 20,
                      color: "#c97a4a",
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    <BookOpen size={22} /> Граматичний довідник
                  </div>
                  <div
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{
                      __html: activeLesson.grammarContent,
                    }}
                    style={{ fontSize: 16, lineHeight: 1.8, color: "#4a4a4a" }}
                  />
                </div>
              )}

            {/* 4. ФОТО УРОКУ */}
            {activeLesson.imageUrl && (
              <img
                src={activeLesson.imageUrl}
                alt="Матеріал до уроку"
                className="w-full max-w-2xl h-auto rounded-lg mb-6"
              />
            )}

            {/* 5. АУДІО ПЛЕЄР */}
            {activeLesson.audioUrl && (
              <div
                style={{
                  background: "#f0ede5",
                  padding: 24,
                  borderRadius: 12,
                  marginBottom: 40,
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
                <div style={{ flex: 1 }}>
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
              <div
                style={{
                  background: "#faf9f6",
                  padding: 32,
                  borderRadius: 12,
                  border: "1px solid #e0dcd0",
                  marginBottom: 40,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 20,
                    color: "#8a8a45",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  <FileText size={22} /> Навчальні документи
                </div>
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
              </div>
            )}

            {/* 8. СЛОВНИК (КАРТКИ QUIZLET) */}
            {activeLesson.quizlet && activeLesson.quizlet.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h3
                  style={{
                    fontSize: 20,
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#3a3528",
                    marginBottom: 20,
                    fontWeight: 700,
                  }}
                >
                  Словник уроку (Клікніть, щоб перегорнути)
                </h3>
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
              </div>
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
                    const isCorrect = userAnswer === question.correctAnswer;
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
                            const isSelected = userAnswer === option;
                            const isOptionCorrect = option === question.correctAnswer;
                            
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
                                  value={option}
                                  checked={quizAnswers[question.id] === option}
                                  onChange={(e) => handleQuizAnswerChange(question.id, e.target.value)}
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
              <div
                style={{
                  background: isDarkMode ? "#2d2f2a" : "#fdf8f5",
                  padding: 32,
                  borderRadius: 12,
                  border: isDarkMode ? "1px solid #3e403a" : "1px solid #facbce",
                  marginBottom: 40,
                }}
              >
                <h3
                  style={{
                    fontSize: 20,
                    color: isDarkMode ? "#dcfce7" : "#c97a4a",
                    marginBottom: 20,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <ClipboardList size={22} /> Інструкція до домашнього завдання
                </h3>
                <div
                  style={{
                    fontSize: 16,
                    lineHeight: 1.8,
                    color: isDarkMode ? "rgb(250, 249, 246)" : "#4a4a4a",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {activeLesson.homeworkInstruction}
                </div>
              </div>
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
                      <audio
                        controls
                        style={{ width: "100%", height: 40 }}
                        src={existingAnswer.audioUrl}
                      >
                        Ваш браузер не підтримує аудіо.
                      </audio>
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

                {/* АУДІОЗАПИС */}
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
                    <Headphones size={16} style={{ display: "inline", marginRight: 6 }} />
                    Голосова відповідь
                  </p>
                  {!audioUrl ? (
                    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      {!isRecording ? (
                        <button
                          onClick={startRecording}
                          style={{
                            background: "#8a8a45",
                            color: "#fff",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: 6,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Volume2 size={16} /> Почати запис
                        </button>
                      ) : (
                        <button
                          onClick={stopRecording}
                          style={{
                            background: "#c97a4a",
                            color: "#fff",
                            border: "none",
                            padding: "10px 20px",
                            borderRadius: 6,
                            fontWeight: 600,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <StopCircle size={16} /> Зупинити запис ({formatTime(recordingTime)})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <audio
                        controls
                        style={{ width: "100%", height: "40px" }}
                        src={audioUrl}
                      >
                        Ваш браузер не підтримує аудіо елемент.
                      </audio>
                      <button
                        onClick={handleRerecord}
                        style={{
                          background: "#f0ede5",
                          color: "#8a8a45",
                          border: "1px solid #8a8a45",
                          padding: "8px 16px",
                          borderRadius: 6,
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Volume2 size={14} /> Перезаписати
                      </button>
                    </div>
                  )}
                </div>

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
  );
}