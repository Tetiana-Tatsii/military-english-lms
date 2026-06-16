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
} from "lucide-react";

export default function CoursePage() {
  const params = useParams();
  const router = useRouter();
  const { courses, user, submitAnswer, answers, isInitialized } =
    useAppContext();

  const courseId = params.courseId as string;
  const course = courses.find((c) => c.id === courseId);

  // Стейт для активного уроку
  // Визначаємо перший модуль та урок ОДРАЗУ, без подвійних рендерів
  const initialModuleId = course?.modules?.[0]?.id || "";
  const initialLessonId = course?.modules?.[0]?.lessons?.[0]?.id || "";

  const [activeModuleId, setActiveModuleId] = useState<string>(initialModuleId);
  const [activeLessonId, setActiveLessonId] = useState<string>(initialLessonId);

  // Стейт для карток (які перевернуті)
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>(
    {},
  );

  // Стейт для домашнього завдання
  const [homeworkText, setHomeworkText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (isInitialized && !user) router.push("/login");
  }, [user, router, isInitialized]);

  if (!isInitialized || !user || !course)
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        Завантаження курсу...
      </div>
    );

  const activeModule = course.modules.find((m) => m.id === activeModuleId);
  const activeLesson = activeModule?.lessons.find(
    (l) => l.id === activeLessonId,
  );

  // Перевірка, чи це завдання вже було відправлено
  const existingAnswer = answers.find(
    (a) => a.lessonId === activeLessonId && a.studentName === user.name,
  );

  // МАГІЯ: ФУНКЦІЯ ОЗВУЧКИ СЛІВ (Web Speech API)
  const playAudio = (text: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Щоб картка не переверталася при кліку на динамік
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US"; // Американська англійська (можна змінити на en-GB)
      utterance.rate = 0.85; // Трохи сповільнюємо для кращого сприйняття курсантами
      window.speechSynthesis.speak(utterance);
    } else {
      alert("На жаль, ваш браузер не підтримує функцію озвучування.");
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
        background: "#f0e9d8",
        color: "#3a3528",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* ЛІВА ПАНЕЛЬ: НАВІГАЦІЯ ПО КУРСУ */}
      <div
        style={{
          width: "320px",
          background: "#3a3326",
          color: "#f6f1e4",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid #4a4231",
        }}
      >
        <div style={{ padding: "20px", borderBottom: "1px solid #4a4231" }}>
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
              fontWeight: 600,
            }}
          >
            <ArrowLeft size={18} /> Назад до кабінету
          </button>
          <h2 style={{ margin: 0, fontSize: 18, lineHeight: 1.4 }}>
            {course.title}
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 0" }}>
          {course.modules.map((mod) => (
            <div key={mod.id} style={{ marginBottom: 16 }}>
              <h4
                style={{
                  padding: "0 20px",
                  margin: "0 0 8px",
                  fontSize: 13,
                  textTransform: "uppercase",
                  color: "#8a8a45",
                  letterSpacing: "0.5px",
                }}
              >
                {mod.title}
              </h4>
              <div>
                {mod.lessons.map((les) => {
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
                        padding: "10px 20px 10px 32px",
                        cursor: "pointer",
                        background: isActive ? "#4a4231" : "transparent",
                        borderLeft: isActive
                          ? "4px solid #8a8a45"
                          : "4px solid transparent",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        transition: "background 0.2s",
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} color="#8a8a45" />
                      ) : (
                        <PlayCircle
                          size={16}
                          color={isActive ? "#d8cdb4" : "#6b6b3a"}
                        />
                      )}
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: isActive ? 600 : 400,
                          color: isActive ? "#fff" : "#d8cdb4",
                        }}
                      >
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
          background: "#f6f1e4",
        }}
      >
        {activeLesson ? (
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <span
              style={{
                background: "#e9e1cd",
                color: "#8a8a45",
                padding: "4px 10px",
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
            <h1 style={{ fontSize: 28, margin: "0 0 24px", color: "#3a3528" }}>
              {activeLesson.title}
            </h1>

            {/* ВІДЕО ПЛЕЄР */}
            {activeLesson.videoLabel && (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "#000",
                  borderRadius: 12,
                  overflow: "hidden",
                  marginBottom: 32,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                }}
              >
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${activeLesson.videoLabel}`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}

            {/* ТЕОРІЯ / ТЕКСТ УРОКУ */}
            {activeLesson.content && (
              <div
                style={{
                  background: "#fff",
                  padding: 32,
                  borderRadius: 12,
                  border: "1px solid #d8cdb4",
                  marginBottom: 32,
                  fontSize: 16,
                  lineHeight: 1.7,
                  color: "#4a4435",
                  whiteSpace: "pre-wrap",
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
                  }}
                >
                  <FileText size={20} /> Теоретичний матеріал
                </div>
                {activeLesson.content}
              </div>
            )}

            {/* КАРТКИ QUIZLET З ОЗВУЧКОЮ */}
            {activeLesson.quizlet && activeLesson.quizlet.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <h3
                  style={{ fontSize: 18, color: "#3a3528", marginBottom: 16 }}
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
                        background: flippedCards[index] ? "#3a3326" : "#fff",
                        color: flippedCards[index] ? "#fff" : "#3a3528",
                        border: flippedCards[index]
                          ? "none"
                          : "1px solid #d8cdb4",
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
                      {/* КНОПКА ОЗВУЧКИ (ВИДНО ТІЛЬКИ НА АНГЛІЙСЬКОМУ БОЦІ) */}
                      {!flippedCards[index] && (
                        <button
                          onClick={(e) => playAudio(card.term, e)}
                          style={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            background: "#e9e1cd",
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

                      <span style={{ fontSize: 16, fontWeight: 600 }}>
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
                background: "#e9e1cd",
                padding: 32,
                borderRadius: 12,
                border: "1px solid #d8cdb4",
              }}
            >
              <h3
                style={{
                  margin: "0 0 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "#3a3528",
                }}
              >
                <Send size={20} color="#8a8a45" /> Практичне завдання
              </h3>

              {existingAnswer ? (
                <div
                  style={{
                    background: "#fff",
                    padding: 20,
                    borderRadius: 8,
                    border: "1px solid #d8cdb4",
                  }}
                >
                  <p
                    style={{
                      margin: "0 0 12px",
                      color: "#8a8a45",
                      fontWeight: 600,
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
                      : "Очікує перевірки викладачем"}
                  </p>
                  <p
                    style={{ margin: 0, fontStyle: "italic", color: "#6b6b3a" }}
                  >
                    Ваша відповідь: {existingAnswer.text}
                  </p>
                  {existingAnswer.teacherFeedbackText && (
                    <div
                      style={{
                        marginTop: 16,
                        padding: 16,
                        background: "#f6f1e4",
                        borderRadius: 8,
                        borderLeft: "4px solid #8a8a45",
                      }}
                    >
                      <strong>Відгук викладача:</strong>{" "}
                      {existingAnswer.teacherFeedbackText}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <p
                    style={{ fontSize: 14, color: "#6b6b3a", marginBottom: 16 }}
                  >
                    Напишіть відповідь на запитання викладача або есе на задану
                    тему.
                  </p>
                  <textarea
                    value={homeworkText}
                    onChange={(e) => setHomeworkText(e.target.value)}
                    placeholder="Почніть писати вашу відповідь тут..."
                    rows={6}
                    style={{
                      width: "100%",
                      padding: 16,
                      borderRadius: 8,
                      border: "1px solid #d8cdb4",
                      marginBottom: 16,
                      fontFamily: "inherit",
                      fontSize: 15,
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={handleSendHomework}
                      disabled={isSubmitted}
                      style={{
                        background: isSubmitted ? "#6b6b3a" : "#8a8a45",
                        color: "#fff",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: 8,
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {isSubmitted ? "Відправлено!" : "Відправити на перевірку"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            style={{ textAlign: "center", color: "#9a8f70", marginTop: 100 }}
          >
            Оберіть урок з меню зліва.
          </div>
        )}
      </div>
    </div>
  );
}
