"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppContext } from "../../../context/AppContext";
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

  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [homeworkText, setHomeworkText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isInitialized) {
      if (!user) router.push("/login");
    }
  }, [user, router, isInitialized]);

  if (!isInitialized || !user || !course) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf9f6",
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

  const handleSendHomework = () => {
    if (!homeworkText.trim() || !activeLesson) return;
    submitAnswer({
      lessonId: activeLesson.id,
      courseId: course.id,
      text: homeworkText,
      voiceRecorded: false,
      attachments: [],
    });
    setHomeworkText("");
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: "#faf9f6",
        color: "#4a4a4a",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .rich-text-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0; }
        .rich-text-content ul, .rich-text-content ol { padding-left: 20px; }
      `,
        }}
      />

      {/* ЛІВА ПАНЕЛЬ: НАВІГАЦІЯ */}
      <div
        style={{
          width: "320px",
          background: "#f0ede5",
          borderRight: "1px solid #e0dcd0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "24px", borderBottom: "1px solid #e0dcd0" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              background: "transparent",
              border: "none",
              color: "#8a8a45",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: 0,
              marginBottom: 16,
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            <ArrowLeft size={18} /> Назад до кабінету
          </button>
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.4,
              color: "#3a3528",
            }}
          >
            {course.title}
          </h2>
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
                      }}
                      style={{
                        padding: "12px 24px 12px 32px",
                        cursor: "pointer",
                        background: isActive ? "#fff" : "transparent",
                        borderLeft: isActive
                          ? "4px solid #8a8a45"
                          : "4px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        transition: "background 0.2s",
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} color="#8a8a45" />
                      ) : (
                        <PlayCircle
                          size={16}
                          color={isActive ? "#c97a4a" : "#a39f93"}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? 700 : 500,
                          color: isActive ? "#3a3528" : "#5c574a",
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
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "40px",
          background: "#fff",
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
                padding: "6px 12px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                marginBottom: 16,
                display: "inline-block",
              }}
            >
              Skill: {activeLesson.skill}
            </span>
            <h1
              style={{
                fontSize: 32,
                margin: "0 0 32px",
                color: "#3a3528",
                fontWeight: 800,
              }}
            >
              {activeLesson.title}
            </h1>

            {/* 2. ТЕОРІЯ / ТЕКСТ УРОКУ */}
            {activeLesson.content && activeLesson.content !== "<p><br></p>" && (
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
                  <FileText size={22} /> Теоретичний матеріал
                </div>
                <div
                  className="rich-text-content"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                  style={{ fontSize: 16, lineHeight: 1.8, color: "#4a4a4a" }}
                />
              </div>
            )}

            {/* 3. ГРАМАТИЧНИЙ ДОВІДНИК */}
            {activeLesson.grammarContent &&
              activeLesson.grammarContent !== "<p><br></p>" && (
                <div
                  style={{
                    background: "#fdf8f5",
                    padding: 32,
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
              <div
                style={{
                  marginBottom: 40,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #e0dcd0",
                }}
              >
                <img
                  src={activeLesson.imageUrl}
                  alt="Матеріал до уроку"
                  style={{ width: "100%", height: "auto", display: "block" }}
                />
              </div>
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

            {/* 7. СЛОВНИК (КАРТКИ QUIZLET) */}
            {activeLesson.quizlet && activeLesson.quizlet.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h3
                  style={{
                    fontSize: 20,
                    color: "#3a3528",
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
                        background: flippedCards[index] ? "#e0dcd0" : "#fff",
                        color: "#3a3528",
                        border: "1px solid #e0dcd0",
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

            {/* БЛОК ВІДПРАВКИ ЗАВДАННЯ */}
            <div
              style={{
                background: "#f0ede5",
                padding: 32,
                borderRadius: 12,
                border: "1px solid #e0dcd0",
                marginBottom: 60,
              }}
            >
              <h3
                style={{
                  margin: "0 0 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#3a3528",
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
                  border: "1px solid #d8cdb4",
                  marginBottom: 16,
                  fontFamily: "inherit",
                  fontSize: 15,
                  background: "#fff",
                  color: "#3a3528",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <input
                    type="file"
                    multiple
                    style={{ fontSize: 13, color: "#5c574a" }}
                  />
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: "#9a8f70",
                    }}
                  >
                    *Ви можете прикріпити фото документа або аудіо-відповідь
                  </p>
                </div>

                <button
                  onClick={handleSendHomework}
                  disabled={isSubmitted}
                  style={{
                    background: isSubmitted ? "#8a8a45" : "#3a3528",
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
                  {isSubmitted ? "Відправлено!" : "Надіслати на перевірку"}
                </button>
              </div>

              {/* ІСТОРІЯ ВІДПОВІДЕЙ */}
              {existingAnswer && (
                <div
                  style={{
                    background: "#fff",
                    padding: 20,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                    marginTop: 24,
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px",
                      color:
                        existingAnswer.status === "reviewed"
                          ? "#8a8a45"
                          : "#c97a4a",
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
              )}
            </div>
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
